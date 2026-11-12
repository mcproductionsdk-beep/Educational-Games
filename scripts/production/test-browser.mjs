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
  const hash=e.id.startsWith('sentence-')?'#set=SABCDEFGH':'#set=ABC234';await page.goto(e.entries.desktop+hash);await page.getByRole('link',{name:'OPEN BORING TEACHER',exact:true}).waitFor();
  assert.equal(await page.getByRole('link',{name:'OPEN BORING TEACHER',exact:true}).getAttribute('href'),site+'/'+(e.id.startsWith('sentence-')?'#sentence-set=SABCDEFGH':hash));
  assert.ok(!loaded.some(p=>/(?:game-\d|bootstrap|session|engine\/.*\.js)/.test(p)),'direct visit must not load game code');
  await page.goto(host+'/'+e.id+'/'+e.artifact+'/baseline.html');await page.getByRole('link',{name:'OPEN BORING TEACHER',exact:true}).waitFor();await ctx.close();
 }
 // Verify production API selection and same-set student return with intercepted APIs.
 for(const family of ['vocabulary','sentence']){
  const ctx=await browser.newContext(),page=await ctx.newPage(),requests=[];let saved;
  const sentence=family==='sentence',api=sentence?manifest.settings.sentenceApi:manifest.settings.wordApi,id=sentence?'SABCDEFGH':'ABC234',endpoint=sentence?'/sentence-sets':'/sets';
  await ctx.route('**/*',async route=>{
   const u=new URL(route.request().url());
   if(u.origin===api){requests.push({url:u.href,method:route.request().method()});if(route.request().method()==='POST'){assert.equal(u.pathname,endpoint);saved=route.request().postDataJSON();return route.fulfill({json:{id}})}assert.equal(u.pathname,endpoint+'/'+id);return route.fulfill({json:{set:{...saved,id}}})}
   if(u.origin!==site)throw Error('Unexpected service '+u.href);
   const file=u.pathname==='/'?'index.html':u.pathname.slice(1);return route.fulfill({body:await readFile(join(root,'site',file)),contentType:mime(file)});
  });
  await page.goto(site);
  if(sentence){await page.locator('#sentence-tab').click();await page.locator('#sentence-pairs').fill('I eat bread.\tYo como pan.\nShe drinks water.\tElla bebe agua.');await page.getByRole('button',{name:'⇄ SWAP COLUMNS',exact:true}).click()}
  await page.getByRole('button',{name:'STUDENT LINK',exact:true}).click();await page.locator('#shared-link a').waitFor();const link=await page.locator('#shared-link a').getAttribute('href');
  assert.equal(new URL(link).origin,site);assert.equal(new URL(link).hash,(sentence?'#sentence-set=':'#set=')+id);
  if(sentence)assert.deepEqual(saved.pairs,[['Yo como pan.','I eat bread.'],['Ella bebe agua.','She drinks water.']]);
  await page.goto(link);await page.locator('.student-panel').waitFor();assert.equal(await page.getByRole('button',{name:'SAVE TO FOLDER',exact:true}).count(),0);
  assert.deepEqual(requests.map(r=>r.method),['POST','GET']);await ctx.close();console.log(family,'production API mock round-trip and student-only launcher passed');
 }
 // The JavaScript origin gate also rejects a foreign parent independently of CSP.
 for(const e of manifest.engines){
  const ctx=await browser.newContext(),page=await ctx.newPage(),loaded=[];
  await ctx.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin==='https://untrusted.example')return route.fulfill({contentType:'text/html',body:'<iframe src="'+e.entries.desktop+'"></iframe>'});if(u.origin!==host)throw Error('Unexpected origin');loaded.push(u.pathname);return route.fulfill({body:await readFile(join(root,'engine-host',u.pathname)),contentType:mime(u.pathname),headers:{'Referrer-Policy':'strict-origin'}})});
  await page.goto('https://untrusted.example/');await page.frameLocator('iframe').getByRole('link',{name:'OPEN BORING TEACHER',exact:true}).waitFor();assert.ok(!loaded.some(p=>/(?:game-\d|bootstrap|session|engine\/.*\.js)/.test(p)));await ctx.close();
 }
}finally{await browser.close()}
