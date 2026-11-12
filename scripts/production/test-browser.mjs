import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium,devices} from 'playwright';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../dist-production');
const manifest=JSON.parse(await readFile(join(root,'candidate-manifest.json'),'utf8'));
const site=manifest.settings.shellOrigin,host=manifest.settings.engineOrigin;
const mime=p=>p.endsWith('.html')?'text/html':p.endsWith('.json')?'application/json':p.endsWith('.css')?'text/css':'text/javascript';
const browser=await chromium.launch();
try{
 for(const [layout,options]of [['desktop',{viewport:{width:1280,height:800}}],['portrait',devices['Pixel 7']]]){
  for(const e of manifest.engines){
   const context=await browser.newContext(options),page=await context.newPage(),errors=[],denied=[],writes=[];page.on('pageerror',e=>errors.push(e.message));
   await context.addInitScript(()=>{window.spoken=[];speechSynthesis.getVoices=()=>[];speechSynthesis.cancel=()=>{};speechSynthesis.speak=u=>{window.spoken.push([u.lang,u.text]);queueMicrotask(()=>{u.onstart?.();u.onend?.()})}});
   await context.route('**/*',async route=>{
    const u=new URL(route.request().url());
    if([manifest.settings.wordApi,manifest.settings.sentenceApi].includes(u.origin)){writes.push(u.href);return route.abort()}
    if(![site,host].includes(u.origin)){denied.push(u.href);return route.abort()}
    const file=u.pathname==='/'?'index.html':u.pathname.slice(1),dir=u.origin===site?'site':'engine-host';
    try{const body=await readFile(join(root,dir,file));let csp;
     if(dir==='site')csp=(await readFile(join(root,'site/_headers'),'utf8')).match(/Content-Security-Policy: (.+)/)[1];
     else csp=e.responsePolicy;
     return route.fulfill({body,contentType:mime(file),headers:{'Content-Security-Policy':csp,'Referrer-Policy':'strict-origin'}});
    }catch{return route.fulfill({status:404,contentType:'text/html',body:await readFile(join(root,dir,'404.html'))})}
   });
   await page.goto(site);
   const sentence=e.id.startsWith('sentence-');
   if(sentence){await page.locator('#sentence-tab').click();await page.locator('#sentence-pairs').fill('I eat bread.\tYo como pan.\nShe drinks water.\tElla bebe agua.')}
   await page.locator('[data-game="'+e.id+'"]').click();
   await page.waitForFunction(()=>document.querySelector('iframe')?.style.visibility==='visible',{},{timeout:20000}).catch(async error=>{throw Error(e.id+' '+layout+' did not start: '+(await page.locator('#notice').textContent())+'; '+errors.join('; '))});
   const frame=page.frames().find(f=>f.url().startsWith(host));assert.ok(frame,'production engine mounted');
   assert.equal(await frame.locator('textarea,select,#testStart,#play').count(),0,'no setup/test controls');
   if(sentence){await frame.locator('#pause').click();assert.equal(await frame.locator('#pause').textContent().then(s=>s.toUpperCase()),'RESUME');await frame.locator('#restart').click();await frame.locator(e.id==='sentence-cat'?'#menu':e.id==='sentence-eater'?'#menuReturn':e.id==='sentence-warehouse'?'#back':'#backMenu').click()}
   else{await page.locator('[data-action="pause"]').click();await page.getByRole('button',{name:'RESUME',exact:true}).waitFor();await page.locator('[data-action="restart"]').click();await page.locator('[data-action="menu"]').click()}
   await page.locator('[data-game="'+e.id+'"]').waitFor();assert.equal(await page.locator('iframe').count(),0);assert.deepEqual(errors,[],e.id+' runtime errors');assert.deepEqual(writes,[],'no live API calls');assert.deepEqual(denied,[],'no external/staging requests');
   await context.close();console.log(layout,e.id,'production handshake, pause, restart and menu passed');
  }
 }
 // Standalone and untrusted embeds cannot bootstrap an engine or start samples.
 for(const e of manifest.engines){
  const ctx=await browser.newContext(),page=await ctx.newPage(),loaded=[];
  await ctx.route('**/*',async route=>{const u=new URL(route.request().url());loaded.push(u.pathname);if(u.origin!==host)return route.abort();try{return route.fulfill({body:await readFile(join(root,'engine-host',u.pathname)),contentType:mime(u.pathname)})}catch{return route.fulfill({status:404,body:await readFile(join(root,'engine-host/404.html'))})}});
  await page.goto(e.entries.desktop);await page.getByRole('link',{name:'OPEN BORING TEACHER',exact:true}).waitFor();
  assert.ok(!loaded.some(p=>/(?:game-\d|bootstrap|session|engine\/.*\.js)/.test(p)),'direct visit must not load game code');
  await page.goto(host+'/'+e.id+'/'+e.artifact+'/baseline.html');await page.getByRole('link',{name:'OPEN BORING TEACHER',exact:true}).waitFor();await ctx.close();
 }
}finally{await browser.close()}
