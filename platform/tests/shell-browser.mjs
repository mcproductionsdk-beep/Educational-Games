import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {chromium} from 'playwright-core';
const spec=JSON.parse(await readFile('platform/tests/engine-reference.json','utf8'));
const root=resolve('.'),engineRoot=resolve(process.env.SNAKE_ENGINE_DIR||'.runtime-engine-fixture');
let shellOrigin,engineOrigin;
const types={'.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'};
function serverFor(base,isEngine=false){return createServer(async(req,res)=>{
 try{
  let path=new URL(req.url,'http://test.invalid').pathname;
  if(!isEngine&&path==='/harness.html'){
   res.setHeader('Content-Type','text/html');res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/platform/shell.css"><main id="root"></main><button id="voice-test">TEST VOICE</button><script type="module">import {mountGameplayShell} from "/platform/shell.mjs";window.mountShell=options=>{window.shell=mountGameplayShell({root:document.getElementById("root"),...options,navigate:url=>window.returned=url});document.getElementById("voice-test").onclick=()=>shell.testVoice();return shell.ready;};</script>');return;
  }
  if(isEngine){if(!path.startsWith('/'+spec.commit+'/'))throw Error('Unpinned engine path');path=path.slice(spec.commit.length+1);}
  const target=resolve(base,'.'+path);if(!target.startsWith(base+sep))throw Error('Path escape');
  let body=await readFile(target);
  if(isEngine&&path==='/snake-game.html'){
   const policy={shellOrigin,engineOrigin,buildId:spec.commit,allowLoopback:true};
   body=Buffer.from(body.toString().replace('<script src="./engine/adapter.js"></script>','').replace('</body>',`<script type="module">import {attachSnakeSession} from './engine/session.mjs';attachSnakeSession({engine:BTSnake,policy:${JSON.stringify(policy)}});</script></body>`));
  }
  if(isEngine&&path==='/engine/snake.js'){
   // Observation/answer injection exists only in the served test response, never engine source.
   body=Buffer.from(body.toString().replace('})();',`window.__testCorrect=()=>{foods=[{x:(snake[0].x+dir.x+COLS)%COLS,y:(snake[0].y+dir.y+ROWS)%ROWS,pair:current}];invincible=0;move();};})();`));
  }
  res.setHeader('Content-Type',types[target.slice(target.lastIndexOf('.'))]||'text/plain');res.end(body);
 }catch{res.statusCode=404;res.end('Not found');}
});}
const shellServer=serverFor(root),engineServer=serverFor(engineRoot,true);
await new Promise(r=>shellServer.listen(0,'127.0.0.1',r));await new Promise(r=>engineServer.listen(0,'127.0.0.1',r));
shellOrigin='http://127.0.0.1:'+shellServer.address().port;engineOrigin='http://localhost:'+engineServer.address().port;
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true,args:['--no-sandbox']});
const vocabulary={title:'Dansk → Español',promptLanguage:'da-DK',language:'es-ES',pairs:[['kat','gato'],['hund','perro'],['fugl','pájaro'],['fisk','pez'],['træ','árbol']]};
function settings(){const url=engineOrigin+'/'+spec.commit+'/snake-game.html';return {
 config:{schemaVersion:1,environment:'staging',configRevision:'browser-1',registryRevision:'browser-1',shellOrigin,catalogUrl:shellOrigin+'/catalog.json',launcherUrl:shellOrigin+'/',sharingBaseUrl:shellOrigin,sharingTimeoutMs:12000},
 registry:{schemaVersion:1,revision:'browser-1',engines:[{id:'vocabulary-snake',family:'vocabulary',protocol:'bt-vocabulary-engine/1',minPairs:5,url,buildId:spec.commit}]},
 policy:{environment:'staging',shellOrigin,allowLoopback:true,engineBuilds:{[url]:spec.commit},approved:{catalogUrls:[shellOrigin+'/catalog.json'],launcherUrls:[shellOrigin+'/'],sharingBaseUrls:[shellOrigin],engineUrls:[url]}},shareId:'snapshot-1',context:'student'};}
try{
 for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
  const page=await browser.newPage({viewport}),external=[],errors=[],serviceCalls=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   // Fixed rendering clock makes the injected correct-answer steps deterministic.
   window.requestAnimationFrame=()=>1;
   window.speechCalls=[];window.speechCancels=0;
   window.SpeechSynthesisUtterance=class{constructor(text){this.text=text}};
   Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[{lang:'ES_es'}],cancel(){speechCancels++},speak(u){speechCalls.push({text:u.text,lang:u.lang,voice:u.voice?.lang});queueMicrotask(()=>{u.onstart?.();u.onend?.();});}}});
  });
  await page.route('**/*',route=>{
   const url=new URL(route.request().url());
   if(![shellOrigin,engineOrigin].includes(url.origin)){external.push(url.href);return route.abort();}
   if(url.pathname.startsWith('/sets/')){serviceCalls.push(url.href);return route.fulfill({json:{set:vocabulary}});}
   return route.continue();
  });
  await page.goto(shellOrigin+'/harness.html');await page.waitForFunction(()=>window.mountShell);
  const result=await page.evaluate(options=>mountShell(options),settings());assert.deepEqual(result,{ok:true});
  const frame=page.frames().find(f=>f.url().includes('/'+spec.commit+'/snake-game.html'));
  assert.ok(frame);await page.waitForFunction(()=>document.querySelector('.bt-game-shell').dataset.state==='running');
  assert.equal(await frame.locator('#game>.buttons').isVisible(),false);assert.equal(await frame.locator('.logo').isVisible(),false);
  assert.equal(await frame.locator('#touchUp').isVisible(),viewport.width<=760);
  const labels=await page.locator('.bt-game-actions button').allTextContents();assert.deepEqual(labels,['PAUSE','RESTART','MAIN MENU','SOUND ON']);
  for(const box of await page.locator('.bt-game-actions button').evaluateAll(xs=>xs.map(x=>{const r=x.getBoundingClientRect();return{x:r.x,right:r.right,height:r.height}}))){assert.ok(box.x>=0&&box.right<=viewport.width);assert.ok(box.height>=44);}
  await page.locator('[data-action="pause"]').click();await page.waitForFunction(()=>document.querySelector('[data-action="pause"]').textContent==='RESUME');
  assert.equal(await frame.evaluate(()=>BTSnake.state().status),'paused');
  await page.locator('[data-action="restart"]').click();await page.waitForFunction(()=>document.querySelector('.bt-game-shell').dataset.state==='running');
  assert.equal(await frame.locator('#pauseOverlay').isVisible(),false);
  await page.locator('#voice-test').click();await page.waitForFunction(()=>speechCalls.length===1);
  await page.locator('[data-action="pause"]').click();
  await frame.evaluate(()=>__testCorrect());await page.waitForFunction(()=>speechCalls.length===2);
  const spoken=await page.evaluate(()=>speechCalls);assert.equal(spoken[0].lang,'es-ES');assert.equal(spoken[1].lang,'es-ES');
  assert.ok(vocabulary.pairs.some(p=>p[1]===spoken[1].text));
  await page.locator('[data-action="sound"]').click();await page.waitForFunction(()=>document.querySelector('[data-action="sound"]').textContent==='SOUND OFF');
  await frame.evaluate(()=>__testCorrect());assert.equal(await page.evaluate(()=>speechCalls.length),2);
  const score=await frame.evaluate(()=>BTSnake.state().score);assert.equal(score,20);
  await page.setViewportSize({width:viewport.height,height:viewport.width});assert.equal(await frame.evaluate(()=>BTSnake.state().score),score);
  await page.locator('[data-action="menu"]').click();await page.waitForFunction(()=>!!window.returned);
  assert.equal(await page.evaluate(()=>returned),shellOrigin+'/#set=snapshot-1');assert.equal(page.frames().length,1);
  assert.equal(serviceCalls.length,1);assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
  console.log(`PASS central shell ${viewport.width}x${viewport.height}: controls, actual engine, same voice path, direction, mute, state and same-set return`);
  await page.close();
 }
 const page=await browser.newPage(),requests=[];
 await page.route('**/*',route=>{requests.push(route.request().url());return route.continue();});
 await page.goto(shellOrigin+'/harness.html');await page.waitForFunction(()=>window.mountShell);requests.length=0;
 assert.equal((await page.evaluate(()=>mountShell({shareId:'id'}))).ok,false);
 assert.equal(await page.locator('iframe').count(),0);assert.deepEqual(requests,[]);
 assert.equal(await page.locator('.bt-game-retry').isVisible(),true);
 console.log('PASS missing shell configuration: recoverable error, no iframe and zero requests');
 await page.close();
}finally{await browser.close();await new Promise(r=>shellServer.close(r));await new Promise(r=>engineServer.close(r));}
