import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {readFile,writeFile} from 'node:fs/promises';
const target=JSON.parse(await readFile('platform/staging/verification-target.json','utf8'));
const base=new URL(target.url);assert.equal(base.protocol,'https:');assert.ok(base.hostname==='bt-vocabulary-platform-staging.pages.dev'||base.hostname.endsWith('.bt-vocabulary-platform-staging.pages.dev'));
const API='https://boringteacher-vocabulary-api-staging.mcproductionsdk.workers.dev';
const lock=JSON.parse(await readFile('platform/staging/engine-lock.json','utf8'));
const engine=new URL(lock.url);
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true,args:['--no-sandbox']});
const evidence={date:new Date().toISOString(),url:base.origin,records:[],requests:[],errors:[],viewports:[]};
function observe(page){
 page.on('request',r=>{const url=new URL(r.url());evidence.requests.push(url.href);assert.ok([base.origin,engine.origin,API].includes(url.origin),'Unexpected request: '+url.href);});
 page.on('pageerror',error=>evidence.errors.push(error.message));
}
try{
 const context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage();observe(page);
 const response=await page.goto(base.href);assert.equal(response.status(),200);const csp=response.headers()['content-security-policy'];assert.ok(csp?.includes('connect-src'));assert.ok(csp.includes(API));assert.equal(csp.includes('https://boringteacher.com'),false);
 evidence.headers={shellCsp:csp};
 const version=await(await context.request.get(base.origin+'/version.json')).json();assert.equal(version.environment,'staging');assert.equal(version.sourceCommit,target.sourceCommit);evidence.version=version;
 const engineResponse=await context.request.get(engine.origin+'/version.json');assert.equal(engineResponse.status(),200);evidence.engine=await engineResponse.json();assert.equal(evidence.engine.buildId,lock.buildId);
 const engineHeaders=await context.request.get(engine.origin+'/snake-game.html');evidence.headers.engineCsp=engineHeaders.headers()['content-security-policy'];assert.ok(evidence.headers.engineCsp?.includes("connect-src 'none'"));
 for(const path of ['/platform/tests/runtime.test.mjs','/README.md','/.github/workflows/central-runtime-contracts.yml']){const r=await context.request.get(base.origin+path);assert.equal(r.status(),404,'Excluded artifact exposed: '+path);}
 await page.locator('[data-game="vocabulary-snake"]').waitFor();assert.equal(await page.locator('#family-tabs button').count(),4);assert.equal(await page.locator('[data-game]').count(),8);assert.equal(await page.locator('[data-game]:disabled').count(),7);
 await page.getByRole('button',{name:'SAVE TO FOLDER',exact:true}).click();await page.getByRole('button',{name:'SAVE LOCALLY',exact:true}).click();assert.ok(await page.locator('dialog').textContent().then(t=>t.includes('Saved on this device.')));await page.getByRole('button',{name:'CLOSE',exact:true}).click();
 await page.locator('#category').selectOption('Animals');await page.locator('#prompt-language').selectOption('da-DK');
 const title='STAGING Snake '+Date.now();await page.locator('#set-title').fill(title);
 const mixed=['ice cream  helado','red apple : manzana roja','ice-cream — helado artesanal','pear;pera','grapes | uvas'].join('\n');
 const expected=[['ice cream','helado'],['red apple','manzana roja'],['ice-cream','helado artesanal'],['pear','pera'],['grapes','uvas']];
 const editor=page.locator('#pairs');
 const ambiguous=mixed+'\nfruit: pear;pera';
 await editor.fill(ambiguous);
 assert.equal(await page.getByText('Review this row: fruit: pear;pera',{exact:true}).count(),1);
 await page.getByRole('button',{name:/SWAP LANGUAGES/}).click();
 assert.equal(await editor.inputValue(),ambiguous);
 await page.getByRole('button',{name:'STUDENT LINK',exact:true}).click();
 assert.equal(await page.locator('#shared-link a').count(),0);
 await page.locator('[data-game="vocabulary-snake"]').click();
 assert.equal(await page.locator('iframe').count(),0);
 await editor.fill(mixed);
 const preview=()=>page.locator('.preview tr').evaluateAll(rows=>rows.slice(1).map(row=>Array.from(row.querySelectorAll('.word-cell span'),cell=>cell.textContent)));
 assert.deepEqual(await preview(),expected);
 await page.getByRole('button',{name:/SWAP LANGUAGES/}).click();
 assert.equal(await page.locator('#prompt-language').inputValue(),'es-ES');
 assert.equal(await page.locator('#target-language').inputValue(),'da-DK');
 assert.deepEqual(await preview(),expected.map(([prompt,target])=>[target,prompt]));
 await page.getByRole('button',{name:/SWAP LANGUAGES/}).click();
 assert.deepEqual(await preview(),expected);
 await page.getByRole('button',{name:'STUDENT LINK',exact:true}).click();
 await page.waitForFunction(()=>!!document.querySelector('#shared-link a'));
 const first=await page.locator('#shared-link a').getAttribute('href');const id=new URL(first).hash.slice(5);assert.match(id,/^[A-Z0-9]{6}$/);
 const saved=await(await context.request.get(API+'/sets/'+id)).json();assert.equal(saved.set.promptLanguage,'da-DK');assert.equal(saved.set.language,'es-ES');assert.equal(saved.set.title,title);assert.deepEqual(saved.set.pairs,expected);
 evidence.records.push({id,title,promptLanguage:saved.set.promptLanguage,language:saved.set.language,pairs:saved.set.pairs});
 // A later publication creates a new snapshot without mutating the first one.
 await page.locator('#set-title').fill(title+' edited');await page.locator('#shared-link').evaluate(el=>el.replaceChildren());
 await page.locator('.actionbox button').first().click();await page.waitForFunction(()=>!!document.querySelector('#shared-link a'));
 const second=await page.locator('#shared-link a').getAttribute('href'),secondId=new URL(second).hash.slice(5);assert.notEqual(secondId,id);
 const retained=await(await context.request.get(API+'/sets/'+id)).json();assert.equal(retained.set.title,title);assert.deepEqual(retained.set.pairs,saved.set.pairs);
 evidence.records.push({id:secondId,title:title+' edited'});
 for(const viewport of [{width:1280,height:900},{width:1920,height:1080},{width:390,height:844},{width:360,height:640},{width:844,height:390}]){
  const studentContext=await browser.newContext({viewport}),student=await studentContext.newPage();observe(student);
  // Student snapshots must not depend on the current category catalog.
  await student.route('**/catalog.json',route=>route.abort());
  await student.addInitScript(shellOrigin=>{
   addEventListener('message',event=>{
    if(event.origin===shellOrigin&&event.source===parent&&event.data?.type==='INIT'){
     window.receivedVocabulary=event.data.payload.vocabulary;
    }
   });
  },base.origin);
  await student.goto(first);await student.locator('[data-game="vocabulary-snake"]').waitFor();
  assert.equal(await student.locator('textarea').count(),0);assert.equal(await student.locator('#set-title').count(),0);
  await student.locator('[data-game="vocabulary-snake"]').click();
  await student.waitForFunction(()=>document.querySelector('.bt-game-shell')?.dataset.state==='running');
  const frame=student.frames().find(f=>f.url().startsWith(engine.origin));assert.ok(frame);assert.deepEqual(await frame.evaluate(()=>window.receivedVocabulary?.pairs),expected);
  assert.equal(await frame.locator('#game>.buttons,.logo,#mainMenu,#overMenu').count(),0);
  const layout=await student.evaluate(()=>({height:document.documentElement.scrollHeight,width:document.documentElement.scrollWidth,titles:[...document.querySelectorAll('h1')].filter(n=>n.getClientRects().length).length}));
  assert.ok(layout.height<=viewport.height&&layout.width<=viewport.width,JSON.stringify(layout));assert.equal(layout.titles,1);
  const bounds=await frame.locator('#wrap').boundingBox();assert.ok(bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=viewport.width&&bounds.y+bounds.height<=viewport.height,JSON.stringify(bounds));
  await student.locator('[data-action="pause"]').click();await student.waitForFunction(()=>document.querySelector('[data-action="pause"]').textContent==='RESUME');
  await student.locator('[data-action="restart"]').click();await student.waitForFunction(()=>document.querySelector('.bt-game-shell').dataset.state==='running');
  if(viewport.width<=760){assert.equal(await frame.locator('#touchUp').isVisible(),true);}
  await student.locator('[data-action="menu"]').click();await student.locator('[data-game="vocabulary-snake"]').waitFor();
  assert.equal(new URL(student.url()).hash,'#set='+id);assert.equal(student.frames().length,1);
  evidence.viewports.push({...viewport,result:'fresh student link, play, pause, restart and same-set return passed'});
  await studentContext.close();
 }
 const outage=await browser.newContext({viewport:{width:1280,height:900}}),outagePage=await outage.newPage();observe(outagePage);await outagePage.route('**/catalog.json',route=>route.abort());await outagePage.goto(base.href);await outagePage.locator('#pairs').waitFor();assert.ok((await outagePage.locator('.note').allTextContents()).some(t=>t.includes('paste a custom set')));await outage.close();
 assert.deepEqual(evidence.errors,[]);console.log('STAGING_EVIDENCE '+JSON.stringify(evidence));
 await writeFile('/tmp/staging-evidence.json',JSON.stringify(evidence,null,2));
 console.log('PASS real staging publication, frozen snapshots, fresh desktop/phone-sized guest journey; no production requests');
 await context.close();
}finally{await browser.close();}
