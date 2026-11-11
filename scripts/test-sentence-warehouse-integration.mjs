import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium,devices} from 'playwright';
import {validateWarehouseSet} from '../platform/staging/sentence.mjs';
const root=new URL('../dist-staging/',import.meta.url);
const lock=JSON.parse(await readFile(new URL('platform/staging/warehouse-lock.json',root),'utf8'));
const stage='https://bt-vocabulary-platform-staging.pages.dev',api='https://boringteacher-sentences-api-staging.mcproductionsdk.workers.dev';
const id='SABCDEFGH';
const headers=await readFile(new URL('_headers',root),'utf8'),csp=headers.match(/Content-Security-Policy: (.+)/)[1];
const assets=new Map();
for(const path of ['/','/engine/warehouse.js','/engine/warehouse.css','/engine/build-id.mjs','/version.json']){
 const response=await fetch(new URL(path,lock.url));assert.equal(response.ok,true);
 assets.set(path,{body:await response.text(),contentType:response.headers.get('content-type'),headers:{'Content-Security-Policy':response.headers.get('content-security-policy')||''}});
}
assert.equal(JSON.parse(assets.get('/version.json').body).buildId,lock.buildId);
for(const count of [1,20])assert.doesNotThrow(()=>validateWarehouseSet({pairs:[['Prompt',Array(count).fill('gato').join(' ')]]}));
for(const count of [0,21])assert.throws(()=>validateWarehouseSet({pairs:[['Prompt',Array(count).fill('gato').join(' ')]]}),/Line 1/);
const locales={'es-ES':'Yo como pan.','de-DE':'Ich esse Brot.','da-DK':'Jeg spiser brød.','fr-FR':'Je mange du pain.','it-IT':'Io mangio pane.'};
const browser=await chromium.launch();
try{
for(const [device,options] of [['desktop',{viewport:{width:1280,height:800}}],['portrait',devices['Pixel 7']],['landscape',{...devices['Pixel 7'],viewport:{width:844,height:390}}]]){
 for(const [language,target] of Object.entries(locales)){
  if(device!=='desktop'&&language!=='es-ES')continue;
  const set={id,title:'Warehouse integration',language,pairs:[[target,'I eat bread.'],[target,'I eat bread again.']]};
  const ctx=await browser.newContext(options),errors=[],denied=[];
  await ctx.addInitScript(()=>{window.spoken=[];window.cancelled=0;speechSynthesis.getVoices=()=>[];speechSynthesis.cancel=()=>window.cancelled++;speechSynthesis.speak=u=>{window.spoken.push([u.lang,u.text]);queueMicrotask(()=>{u.onstart?.();u.onend?.()})}});
  await ctx.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.origin===new URL(lock.url).origin){const f=assets.get(url.pathname);return f?route.fulfill(f):route.abort()}
   if(url.origin===api){assert.equal(route.request().method(),'GET');assert.equal(url.pathname,'/sentence-sets/'+id);return route.fulfill({json:{set}})}
   if(url.origin===stage){
    const path=url.pathname==='/'?'index.html':url.pathname.slice(1);
    try{const body=await readFile(new URL(path,root));const type=path.endsWith('.mjs')?'text/javascript':path.endsWith('.css')?'text/css':path.endsWith('.json')?'application/json':'text/html';
     return route.fulfill({body,contentType:type,headers:{'Content-Security-Policy':csp,'Referrer-Policy':'strict-origin'}});
    }catch{return route.abort()}
   }
   denied.push(url.href);return route.abort();
  });
  const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.goto(stage+'/#sentence-set='+id);
  await p.locator('[data-game="sentence-warehouse"]').click();
  const f=p.frameLocator('iframe[title="Sentence Warehouse"]');
  await f.locator('#game').waitFor({state:'visible'});
  await p.waitForFunction(()=>document.querySelector('iframe')?.style.visibility==='visible');
  const frame=p.frames().find(f=>f.url().startsWith(lock.url));
  assert.deepEqual(await frame.evaluate(()=>state.pairs),set.pairs.map(p=>[...p].reverse()));
  assert.equal(await frame.locator('#menu').isVisible(),false);
  assert.equal(await frame.evaluate(()=>document.documentElement.scrollHeight<=innerHeight&&document.documentElement.scrollWidth<=innerWidth),true);
  await f.getByRole('button',{name:'PAUSE',exact:true}).click();
  assert.equal(await frame.evaluate(()=>state.mode),'paused');
  await f.locator('.gamebar').getByRole('button',{name:'RESUME',exact:true}).click();
  const words=await frame.evaluate(()=>wordsOf(state.target));
  for(let i=0;i<words.length;i++){
   await frame.evaluate(([text,i])=>{const w=state.words.find(w=>!w.done&&!w.decoy&&w.text===text);state.player.x=w.x+44;state.player.y=w.y+21;action();const b=state.slots[i];state.player.x=b.x+b.w/2;state.player.y=b.y+(state.slotShift||0)+85;action()},[words[i],i]);
   await p.waitForTimeout(30);
  }
  await f.getByText('SENTENCE COMPLETE!',{exact:true}).waitFor();
  assert.ok((await p.evaluate(()=>spoken)).some(([lang,text])=>lang===language&&text===target));
  assert.ok((await p.evaluate(()=>spoken)).some(([lang,text])=>lang===language&&text===words[0]));
  assert.deepEqual(await frame.evaluate(()=>spoken),[],'Embedded engine must not invoke local TTS');
  await f.getByRole('button',{name:'RESTART',exact:true}).click();
  await p.waitForTimeout(500);
  assert.equal(await frame.evaluate(()=>state.idx),0);
  assert.equal(await frame.evaluate(()=>state.filled.some(Boolean)),false);
  await f.getByRole('button',{name:'SOUND ON',exact:true}).click();
  await f.getByRole('button',{name:'MAIN MENU',exact:true}).click();
  await p.locator('[data-game="sentence-warehouse"]').waitFor();
  assert.equal(new URL(p.url()).hash,'#sentence-set='+id);
  assert.equal(await p.locator('iframe').count(),0);
  await p.locator('[data-game="sentence-warehouse"]').click();
  await f.getByRole('button',{name:'SOUND OFF',exact:true}).waitFor();
  assert.deepEqual(errors,[]);assert.deepEqual(denied,[]);
  await ctx.close();console.log(device+' '+language+' shared lifecycle and voice passed');
 }
}
}finally{await browser.close()}
