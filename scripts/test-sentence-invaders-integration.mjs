import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium,devices} from 'playwright';
const root=new URL('../dist-staging/',import.meta.url);
const lock=JSON.parse(await readFile(new URL('platform/staging/invaders-lock.json',root),'utf8'));
const stage='https://bt-vocabulary-platform-staging.pages.dev',api='https://boringteacher-sentences-api-staging.mcproductionsdk.workers.dev';
const id='SABCDEFGH';
const headers=await readFile(new URL('_headers',root),'utf8'),csp=headers.match(/Content-Security-Policy: (.+)/)[1];
const assets=new Map();
for(const path of ['/','/engine/invaders.js','/engine/invaders.css','/engine/build-id.mjs','/version.json']){
 const response=await fetch(new URL(path,lock.url));assert.equal(response.ok,true);
 assets.set(path,{body:await response.text(),contentType:response.headers.get('content-type'),headers:{'Content-Security-Policy':response.headers.get('content-security-policy')||''}});
}
assert.equal(JSON.parse(assets.get('/version.json').body).buildId,lock.buildId);
const locales={'es-ES':'Yo como pan.','de-DE':'Ich esse Brot.','da-DK':'Jeg spiser brød.','fr-FR':'Je mange du pain.','it-IT':'Io mangio pane.'};
const browser=await chromium.launch();
try{
for(const [device,options] of [['desktop',{viewport:{width:1280,height:800}}],['portrait',devices['Pixel 7']],['landscape',{...devices['Pixel 7'],viewport:{width:844,height:390}}]]){
 for(const [language,target] of Object.entries(locales)){
  if(device!=='desktop'&&language!=='es-ES')continue;
  const set={id,title:'Invaders integration',language,pairs:[[target,'I eat bread.'],[target,'I eat bread again.']]};
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
  await p.locator('[data-game="sentence-invaders"]').click();
  const f=p.frameLocator('iframe[title="Sentence Invaders"]');
  await f.locator('#gameArea').waitFor({state:'visible'});
  await p.waitForFunction(()=>document.querySelector('iframe')?.style.visibility==='visible');
  const frame=p.frames().find(f=>f.url().startsWith(lock.url));
  assert.deepEqual(await frame.evaluate(()=>sentences.map(s=>[s.en,s.target])),set.pairs.map(p=>[...p].reverse()));
  assert.equal(await frame.locator('#preview').isVisible(),false);
  assert.equal(await frame.evaluate(()=>document.documentElement.scrollHeight<=innerHeight&&document.documentElement.scrollWidth<=innerWidth),true);
  assert.equal(await frame.evaluate(()=>paused),false);
  await f.getByRole('button',{name:'PAUSE',exact:true}).click();
  assert.equal(await frame.evaluate(()=>paused),true);
  await f.getByRole('button',{name:'RESUME',exact:true}).click();
  const words=await frame.evaluate(()=>sentences[0].words);
  const n=await p.evaluate(()=>cancelled);
  for(let i=0;i<words.length;i++){
   await frame.evaluate(()=>hit(wave.find(e=>e.word===sentences[idx].words[step])));
   await p.waitForTimeout(40);
  }
  await f.getByText(target,{exact:true}).waitFor();
  assert.ok((await p.evaluate(()=>spoken)).some(([lang,text])=>lang===language&&text===target));
  assert.ok((await p.evaluate(()=>spoken)).some(([lang,text])=>lang===language&&text===words[0]));
  assert.deepEqual(await frame.evaluate(()=>spoken),[],'Embedded engine must not invoke local TTS');
  // Restart while completed-sentence speech is active; stale advance must be cancelled.
  await f.getByRole('button',{name:'RESTART',exact:true}).click();
  await p.waitForTimeout(1200);
  assert.deepEqual(await frame.evaluate(()=>[idx,step,score,lives]),[0,0,0,3]);
  assert.ok(await p.evaluate(()=>cancelled)>n);
  const before=await frame.evaluate(()=>sentences.map(s=>s.target));
  await frame.evaluate(()=>window.dispatchEvent(new MessageEvent('message',{origin:'https://invalid.example',source:window.parent,data:{protocol:'bt-sentence-invaders/1',type:'INIT',sessionId:'a'.repeat(30),set:{language:'es-ES',pairs:[['Fake','falso'],['Fake2','falso2']]},soundOn:true}})));
  assert.deepEqual(await frame.evaluate(()=>sentences.map(s=>s.target)),before);
  await f.getByRole('button',{name:'SOUND ON',exact:true}).click();
  const count=await p.evaluate(()=>spoken.length);
  await frame.evaluate(()=>hit(wave.find(e=>e.word===sentences[idx].words[step])));
  await p.waitForTimeout(50);assert.equal(await p.evaluate(()=>spoken.length),count);
  await f.getByRole('button',{name:'MAIN MENU',exact:true}).click();
  await p.locator('[data-game="sentence-invaders"]').waitFor();
  assert.equal(new URL(p.url()).hash,'#sentence-set='+id);
  assert.equal(await p.locator('iframe').count(),0);
  await p.locator('[data-game="sentence-invaders"]').click();
  await f.getByRole('button',{name:'SOUND OFF',exact:true}).waitFor();
  assert.deepEqual(errors,[]);assert.deepEqual(denied,[]);
  await ctx.close();console.log(device+' '+language+' shared lifecycle and voice passed');
 }
}
}finally{await browser.close()}
