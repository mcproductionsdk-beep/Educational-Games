import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium,devices} from 'playwright';
const root=new URL('../dist-staging/',import.meta.url),stage='https://bt-vocabulary-platform-staging.pages.dev';
const canonical=await readFile(new URL('../platform/sentence-lifecycle.js',import.meta.url),'utf8');
const browser=await chromium.launch();
try{for(const game of ['cat','eater','warehouse','invaders']){
 const lock=JSON.parse(await readFile(new URL('platform/staging/'+game+'-lock.json',root),'utf8')),assets=new Map();
 for(const path of ['/','/engine/lifecycle.js',`/engine/${game}.js`,`/engine/${game}.css`,'/engine/build-id.mjs','/version.json',...(game==='cat'?['/engine/sentence-session.mjs']:[])]){
  const response=await fetch(new URL(path,lock.url));assert.ok(response.ok,game+' '+path);
  assets.set(path,{body:await response.text(),contentType:response.headers.get('content-type'),headers:{'Content-Security-Policy':response.headers.get('content-security-policy')||''}});
 }
 assert.equal(assets.get('/engine/lifecycle.js').body,canonical,'engine helper must match reviewed canonical source');
 assert.equal(JSON.parse(assets.get('/version.json').body).buildId,lock.buildId);
 const script=`import {mountSentenceCat} from '/platform/staging/sentence.mjs';
 window.cancelCount=0;window.speechCalls=[];let pending;
 const voice={cancel(){cancelCount++;pending?.();pending=null},speak(text,lang){speechCalls.push([text,lang]);return new Promise(resolve=>pending=resolve)}};
 window.mounted=mountSentenceCat({root:document.querySelector('main'),engine:${JSON.stringify(lock)},gameId:${JSON.stringify(game)},
 set:{title:'Lifecycle',language:'es-ES',pairs:[['I eat bread.','Yo como pan.'],['She drinks water.','Ella bebe agua.']]},soundOn:true,voice,onSound(){},onMenu(){document.querySelector('main').textContent='Returned to menu'},onError(message){throw Error(message)}});`;
 for(const [device,options] of [['desktop',{viewport:{width:1280,height:800}}],['portrait',devices['Pixel 7']]]){
  const ctx=await browser.newContext(options),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await ctx.addInitScript(()=>{window.received=[];addEventListener('message',e=>received.push(e.data))});
  await ctx.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.origin===new URL(lock.url).origin){const asset=assets.get(url.pathname);return asset?route.fulfill(asset):route.abort()}
   if(url.origin!==stage)return route.abort();
   if(url.pathname==='/')return route.fulfill({contentType:'text/html',headers:{'Referrer-Policy':'strict-origin'},body:'<!doctype html><main></main><script type="module" src="/fixture.mjs"></script>'});
   if(url.pathname==='/fixture.mjs')return route.fulfill({contentType:'text/javascript',body:script});
   const body=await readFile(new URL(url.pathname.slice(1),root));return route.fulfill({contentType:'text/javascript',body});
  });
  await page.goto(stage);await page.waitForFunction(()=>document.querySelector('iframe')?.style.visibility==='visible');
  const frame=page.frames().find(f=>f.url().startsWith(lock.url));
  assert.equal(await frame.locator('body').evaluate(e=>e.classList.contains('sentence-paused')),false,'focusing engine must not pause');
  const session=await frame.evaluate(()=>received.find(d=>d.type==='INIT').sessionId),protocol='bt-sentence-'+game+'/1';
  await frame.evaluate(({session,protocol})=>window.dispatchEvent(new MessageEvent('message',{source:window.parent,origin:'https://invalid.example',data:{protocol,sessionId:session,type:'PAUSE'}})),{session,protocol});
  await page.evaluate(({protocol,lock})=>document.querySelector('iframe').contentWindow.postMessage({protocol,sessionId:'wrong-session',type:'PAUSE'},new URL(lock.url).origin),{protocol,lock});
  await page.waitForTimeout(80);assert.equal(await frame.locator('body').evaluate(e=>e.classList.contains('sentence-paused')),false,'untrusted pause ignored');
  // Request permitted shared pronunciation, then notify the parent of hidden state.
  // The child stays visible: this specifically exercises the trusted PAUSE bridge.
  await page.evaluate(({session,protocol,lock})=>window.dispatchEvent(new MessageEvent('message',{source:document.querySelector('iframe').contentWindow,origin:new URL(lock.url).origin,data:{protocol,sessionId:session,type:'SPEAK',id:999,text:'Yo'}})),{session,protocol,lock});
  assert.equal(await page.evaluate(()=>speechCalls.length),1);const cancelled=await page.evaluate(()=>cancelCount);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))});
  await frame.waitForFunction(()=>document.body.classList.contains('sentence-paused'));
  assert.ok(await page.evaluate(()=>cancelCount)>cancelled);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('focus'))});
  assert.equal(await frame.locator('body').evaluate(e=>e.classList.contains('sentence-paused')),true);
  await frame.locator('#pause').click();assert.equal(await frame.locator('body').evaluate(e=>e.classList.contains('sentence-paused')),false);
  await frame.locator(game==='cat'?'#menu':game==='eater'?'#menuReturn':game==='warehouse'?'#back':'#backMenu').click();
  await page.getByText('Returned to menu',{exact:true}).waitFor();assert.equal(await page.locator('iframe').count(),0);assert.deepEqual(errors,[]);
  console.log(game,device,'trusted session, background pause, shared voice cancellation and menu cleanup passed');await ctx.close();
 }
}}finally{await browser.close()}
