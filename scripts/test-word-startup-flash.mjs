import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {chromium} from 'playwright';

// Exercise the actual built launcher and its unchanged, pinned Word engines.
// Only the launcher files are fulfilled locally; no sharing API is used.
const root=resolve('dist-staging'),shell='https://word-flash-audit.bt-vocabulary-platform-staging.pages.dev';
const headers=await readFile(resolve(root,'_headers'),'utf8');
const engineOrigins=new Set([...headers.matchAll(/https:\/\/[a-f0-9]+\.bt-vocabulary-(?:snake|racer|jumper|invaders|frog|match|eater|warehouse)-preview\.pages\.dev/g)].map(m=>m[0]));
assert.equal(engineOrigins.size,8);
const mime={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json'};
const browser=await chromium.launch();
async function setup(viewport){
 const context=await browser.newContext({viewport,...(viewport.width<500?{isMobile:true,hasTouch:true}: {})});
 let release,seen;const gate=new Promise(r=>release=r),requested=new Promise(r=>seen=r),errors=[],external=[];
 await context.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.origin===shell){
   const path=resolve(root,'.'+(u.pathname==='/'?'/index.html':u.pathname));
   if(!path.startsWith(root+sep))return route.abort();
   try{return await route.fulfill({body:await readFile(path),contentType:mime[extname(path)]||'text/plain'});}catch{return route.fulfill({status:404,body:'Not found'});}
  }
  if(engineOrigins.has(u.origin)){
   if(/\/(?:staging-)?bootstrap\.mjs$/.test(u.pathname)){seen();await gate;}
   // A timed-out shell can remove the frame while its bootstrap is held.
   return route.continue().catch(()=>{});
  }
  external.push(u.origin+u.pathname);return route.abort();
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(shell+'/');await page.locator('[data-game="vocabulary-snake"]').waitFor();
 return {page,context,release,requested,errors,external};
}
try{
 for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
  for(const id of ['snake','racer','jumper','invaders','frog','match','eater','warehouse']){
   const t=await setup(viewport);
   try{
    await t.page.locator('[data-game="vocabulary-'+id+'"]').click();
    let deadline;
    try{await Promise.race([t.requested,new Promise((_,reject)=>{deadline=setTimeout(()=>reject(Error('Engine bootstrap was not requested: '+id)),15000);})]);}
    finally{clearTimeout(deadline);}
    const f=t.page.locator('.bt-engine-frame');
    assert.deepEqual(await f.evaluate(e=>({visibility:getComputedStyle(e).visibility,inert:e.inert,aria:e.getAttribute('aria-hidden')})),{visibility:'hidden',inert:true,aria:'true'});
    assert.equal(await f.isVisible(),false);
    assert.equal(await t.page.locator('.bt-game-status').textContent(),'Loading game…');
    assert.notEqual(await t.page.evaluate(()=>document.activeElement?.tagName),'IFRAME');
    t.release();
    await t.page.waitForFunction(()=>document.querySelector('.bt-game-shell')?.dataset.state==='running'&&document.querySelector('.bt-engine-frame')?.style.visibility==='visible',null,{timeout:20000});
    assert.deepEqual(await f.evaluate(e=>({inert:e.inert,aria:e.getAttribute('aria-hidden')})),{inert:false,aria:null});
    assert.equal(await t.page.evaluate(()=>document.activeElement?.tagName),'IFRAME');
    await t.page.locator('[data-action="pause"]').click();
    await t.page.waitForFunction(()=>document.querySelector('[data-action="pause"]').textContent==='RESUME');
    await t.page.locator('[data-action="restart"]').click();
    // Racer/Jumper intentionally restart paused through their existing adapters.
    // Require the acknowledged state, rather than changing engine behavior here.
    await t.page.waitForFunction(()=>!document.querySelector('[data-action="restart"]').disabled);
    const restartState=await t.page.locator('.bt-game-shell').getAttribute('data-state');
    assert.equal(restartState,['racer','jumper'].includes(id)?'paused':'running',id+': restart state changed');
    if(restartState==='paused'){
     await t.page.locator('[data-action="pause"]').click();
     await t.page.waitForFunction(()=>document.querySelector('.bt-game-shell')?.dataset.state==='running');
    }
    await t.page.locator('[data-action="menu"]').click();
    await t.page.locator('#pairs').waitFor();assert.equal(await t.page.locator('iframe').count(),0);
    assert.deepEqual(t.errors,[]);assert.deepEqual(t.external,[]);
    console.log('PASS delayed startup, focus, pause/restart and menu: '+id+' '+viewport.width+'x'+viewport.height);
   }finally{t.release();await t.context.close();}
  }
 }
 const t=await setup({width:1280,height:900});
 try{
  await t.page.locator('[data-game="vocabulary-snake"]').click();await t.requested;
  await t.page.locator('.bt-game-retry').waitFor({state:'visible',timeout:16000});
  assert.equal(await t.page.locator('iframe').count(),0);
  assert.match(await t.page.locator('.bt-game-status').textContent(),/ENGINE_HANDSHAKE_TIMEOUT/);
  assert.equal(await t.page.locator('[data-action="menu"]').isEnabled(),true);
  await t.page.locator('[data-action="menu"]').click();await t.page.locator('#pairs').waitFor();
  console.log('PASS stalled engine remains concealed, times out and returns to menu');
 }finally{t.release();await t.context.close();}
}finally{await browser.close();}
