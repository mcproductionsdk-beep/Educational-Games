import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {chromium,devices} from 'playwright';
const module=await readFile(new URL('../platform/staging/sentence.mjs',import.meta.url));
const fixture=`import {createSentenceWorkspace} from '/sentence.mjs';
window.launched=[];window.spoken=[];window.preview=[];
const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n};
const button=(text,action)=>{const n=node('button',text);n.addEventListener('click',action);return n};
const root=document.querySelector('main'),notice=document.querySelector('#notice');
const workspace=createSentenceWorkspace({node,button,notice,voice:{speak:(...args)=>spoken.push(args),cancel(){}},
renderPairPreview:(root,rows,locales)=>{preview={rows,locales};root.replaceChildren(...rows.map(row=>node('p',row.pair?.join(' | ')||'Invalid')))},launch:(set,game)=>launched.push({set,game})});
async function render(){root.replaceChildren();await workspace.render(root,location.hash,()=>true)}
addEventListener('hashchange',render);await render();`;
const server=createServer((req,res)=>{
 const path=new URL(req.url,'http://localhost').pathname;
 if(path==='/sentence.mjs')return res.writeHead(200,{'Content-Type':'text/javascript'}).end(module);
 if(path==='/fixture.mjs')return res.writeHead(200,{'Content-Type':'text/javascript'}).end(fixture);
 if(path==='/sentence-catalog.json')return res.writeHead(200,{'Content-Type':'application/json'}).end(JSON.stringify({schemaVersion:1,languages:{'es-ES':{Example:[['I eat bread.','Como pan.'],['I drink water.','Bebo agua.']]}}}));
 res.writeHead(200,{'Content-Type':'text/html'}).end('<!doctype html><meta name="viewport" content="width=device-width"><main></main><p id="notice"></p><script type="module" src="/fixture.mjs"></script>');
});
const browser=await chromium.launch();
try{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url='http://127.0.0.1:'+server.address().port;
 for(const [device,options] of [['desktop',{viewport:{width:1280,height:800}}],['portrait',devices['Pixel 7']]]){
  const ctx=await browser.newContext(options),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  const pairs=[['I eat bread.','Como pan.'],['I drink water.','Bebo agua.']];let published;
  await ctx.route('https://boringteacher-sentences-api-staging.mcproductionsdk.workers.dev/**',async route=>{
   if(route.request().method()==='POST'){published=route.request().postDataJSON();return route.fulfill({json:{id:'SABCDEFGH'}})}
   return route.fulfill({json:{set:{...published,id:'SABCDEFGH'}}});
  });
  await p.addInitScript(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('clipboard denied')}}})});
  p.on('dialog',d=>d.accept());await p.goto(url);
  await p.locator('#sentence-title').fill('Class test');await p.locator('#sentence-pairs').fill(pairs.map(p=>p.join('\t')).join('\n'));
  await p.getByRole('button',{name:'⇄ SWAP COLUMNS',exact:true}).click();
  assert.equal(await p.locator('#sentence-column-order').inputValue(),'target-first');
  assert.deepEqual(await p.evaluate(()=>preview.rows.map(r=>r.pair)),pairs);assert.deepEqual(await p.evaluate(()=>preview.locales),['en-US','es-ES']);
  await p.getByRole('button',{name:'TEST VOICE',exact:true}).click();assert.deepEqual(await p.evaluate(()=>spoken.at(-1)),['Como pan.','es-ES']);
  for(const game of ['cat','eater','warehouse','invaders'])await p.locator('[data-game="sentence-'+game+'"]').click();
  assert.deepEqual(await p.evaluate(()=>launched.map(x=>x.set.pairs)),Array(4).fill(pairs));
  await p.getByRole('button',{name:'SAVE TO FOLDER',exact:true}).click();await p.locator('#sentence-folder').fill('Class A');
  await p.getByRole('button',{name:'SAVE LOCALLY',exact:true}).click();await p.getByText('Saved on this device.',{exact:true}).waitFor();
  await p.getByRole('button',{name:'CLOSE',exact:true}).click();await p.reload();
  await p.getByRole('button',{name:'SAVE TO FOLDER',exact:true}).click();await p.getByRole('button',{name:'LOAD · Class A / Class test',exact:true}).click();
  assert.equal(await p.locator('#sentence-title').inputValue(),'Class test');assert.equal(await p.locator('#sentence-column-order').inputValue(),'target-first');
  assert.deepEqual(await p.evaluate(()=>preview.rows.map(r=>r.pair)),pairs);
  // Copy failure preserves the visible student link and canonical API orientation.
  await p.getByRole('button',{name:'STUDENT LINK',exact:true}).click();await p.locator('#shared-link a').waitFor();
  assert.deepEqual(published.pairs,pairs.map(p=>[...p].reverse()));const link=await p.locator('#shared-link a').getAttribute('href');
  await p.goto(link);await p.locator('.student-panel').waitFor();assert.equal(await p.locator('#sentence-pairs').count(),0);
  assert.equal(await p.getByRole('button',{name:'SAVE TO FOLDER',exact:true}).count(),0);assert.equal(await p.getByRole('button',{name:'⇄ SWAP COLUMNS',exact:true}).count(),0);
  await p.locator('[data-game="sentence-cat"]').click();assert.deepEqual(await p.evaluate(()=>launched[0].set.pairs),pairs);
  // Opt-in legacy import explicitly declares which column contains English.
  await p.goto(url);const legacy={title:'Older draft',target:'es-ES',editor:pairs.map(p=>[...p].reverse().join('\t')).join('\n')};
  await p.evaluate(item=>localStorage.setItem('bt-sentence-universal-preview',JSON.stringify(item)),legacy);
  await p.getByRole('button',{name:'SAVE TO FOLDER',exact:true}).click();await p.locator('#legacy-sentence-order').selectOption('target-first');
  await p.getByRole('button',{name:'IMPORT OLDER DRAFT',exact:true}).click();assert.deepEqual(await p.evaluate(()=>preview.rows.map(r=>r.pair)),pairs);
  assert.deepEqual(await p.evaluate(()=>JSON.parse(localStorage.getItem('bt-sentence-universal-preview'))),legacy);
  // Corruption and denied writes do not erase existing data.
  await p.evaluate(()=>localStorage.setItem('bt-staging-sentence-sets-v1','broken'));
  await p.getByRole('button',{name:'SAVE TO FOLDER',exact:true}).click();await p.getByRole('button',{name:'SAVE LOCALLY',exact:true}).click();
  assert.equal(await p.evaluate(()=>localStorage.getItem('bt-staging-sentence-sets-v1')),'broken');await p.getByRole('button',{name:'CLOSE',exact:true}).click();
  await p.evaluate(()=>{localStorage.setItem('bt-staging-sentence-sets-v1','[]');Storage.prototype.setItem=()=>{throw Error('Storage unavailable')}});
  await p.getByRole('button',{name:'SAVE TO FOLDER',exact:true}).click();await p.getByRole('button',{name:'SAVE LOCALLY',exact:true}).click();
  await p.getByText('Could not save: Storage unavailable',{exact:true}).waitFor();assert.deepEqual(errors,[]);
  await ctx.close();console.log(device,'Sentence menu swap/save/reload/legacy/errors/student isolation passed');
 }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
