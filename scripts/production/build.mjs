import {readFile,writeFile,mkdir,rm,readdir} from 'node:fs/promises';
import {resolve,dirname,relative,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const here=dirname(fileURLToPath(import.meta.url)),root=resolve(here,'../..');
const args=process.argv.slice(2),cache=args.find(a=>a.startsWith('--source-cache='))?.slice(15);
const out=resolve(root,'dist-production');
const sha=(text,kind='sha256')=>createHash(kind).update(text).digest('hex');
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const sources=await json(join(root,'release/production/sources.json'));
const settings=await json(join(root,'release/production/settings.json'));
export function validateSettings(s){
 if(s.schemaVersion!==1||s.environment!=='production'||s.shellOrigin!=='https://boringteacher.com'||s.engineOrigin!=='https://games.boringteacher.com'||
    s.wordApi!=='https://boringteacher-vocabulary-api.mcproductionsdk.workers.dev'||s.sentenceApi!=='https://boringteacher-sentences-api.mcproductionsdk.workers.dev')throw Error('Unapproved production configuration');
}
validateSettings(settings);
const home=settings.shellOrigin+'/',origin=settings.engineOrigin;
const manifest={schemaVersion:1,environment:'production',status:'prepared-not-authorized',settings,centralSource:sources.central,engines:[]};
const put=async(path,content)=>{await mkdir(dirname(path),{recursive:true});await writeFile(path,content)};
function replace(source,from,to){if(!source.includes(from))throw Error('Pinned transformation missing: '+String(from).slice(0,80));return source.replace(from,to)}
function stripSection(html,id){return html.replace(new RegExp('<section\\b[^>]*id=["\']'+id+'["\'][^>]*>[\\s\\S]*?<\\/section>'),'')}
function strictOrigin(source){
 const pattern=String.raw`/^https:\/\/(?:[a-z0-9-]+\.)?bt-vocabulary-platform-staging\.pages\.dev$/`;
 source=source.replaceAll(pattern+'.test(origin)','origin === '+JSON.stringify(settings.shellOrigin));
 source=source.replaceAll(pattern+'.test(shellOrigin)','shellOrigin === '+JSON.stringify(settings.shellOrigin));
 if(source.includes('bt-vocabulary-platform-staging'))throw Error('Unconverted engine origin');return source;
}
async function fetchSources(spec,id){
 if(!/^[a-f0-9]{40}$/.test(spec.commit)||!/^mcproductionsdk-beep\/[\w.-]+$/.test(spec.repository))throw Error('Unpinned source');
 const dir=join(out,'work',id);await mkdir(dir,{recursive:true});
 for(const [path,expected]of Object.entries(spec.files)){
  if(path.includes('..')||path.startsWith('/')||!/^[a-f0-9]{64}$/.test(expected))throw Error('Invalid source path/digest');
  let bytes;
  if(cache)bytes=await readFile(resolve(cache,id,path));
  else{const response=await fetch('https://raw.githubusercontent.com/'+spec.repository+'/'+spec.commit+'/'+path,{redirect:'error',signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('Source unavailable '+id+'/'+path);bytes=Buffer.from(await response.arrayBuffer())}
  if(sha(bytes)!==expected)throw Error('Source integrity mismatch '+id+'/'+path);await put(join(dir,path),bytes);
 }
 return dir;
}
const fallback='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Boring Teacher</title><h1>Choose a set to play</h1><p>Open this game from the shared Boring Teacher menu.</p><a href="'+home+'">OPEN BORING TEACHER</a></html>';
function cleanWordEater(code){
 code=code.replace(/const LIB=[\s\S]*?(?=let maze=)/,'');
 code=code.replace(/^function (?:parse|categories|loadCategory|refresh|voice|voiceStatus)\([^\n]+\n/gm,'');
 code=replace(code,"let a=pairs??parse(E('words').value)",'let a=pairs');
 code=replace(code,"lang=language??E('language').value",'lang=language');
 code=code.replace("E('menu').classList.remove('active');",'');
 code=code.replace(/^E\('language'\)\.onchange[^\n]+\n/m,"E('again').onclick=()=>{if(sessionSet)start(sessionSet.pairs,sessionSet.language)};E('restart').onclick=E('again').onclick;E('pause').onclick=pause;function menu(){stopHold();running=false;paused=false;cancelAnimationFrame(raf);E('game').classList.remove('active');emit('BT_EATER_CANCEL_SPEECH');emit('BT_EATER_MENU')}E('mainMenu').onclick=menu;E('overMenu').onclick=menu;E('sound').onclick=()=>{soundOn=!soundOn;E('sound').textContent=soundOn?'SOUND ON':'SOUND OFF'};\n");
 code=code.replace("if('speechSynthesis'in window){speechSynthesis.addEventListener('voiceschanged',voiceStatus);setTimeout(voiceStatus,400)}",'');
 code=code.replace(/window.addEventListener\('message',[\s\S]*?\n\}\);\n(?=function state)/,'');
 code=code.replace(/\ncategories\(\);\nwindow.parent.postMessage[^\n]+/,'');
 return code;
}
function cleanWordInvaders(html){
 html=stripSection(html,'menu');
 html=html.replace('var ta=E("words"),canvas','var canvas').replace('menu=E("menu"),','');
 html=html.replace(/var LIB=[\s\S]*?(?=var W=)/,'');
 html=html.replace(/^function parse\([^\n]+\n/gm,'').replace(/^function cats\([^\n]+\n/gm,'');
 html=html.replace('configuredPairs||parse(ta.value)','configuredPairs').replace('lang=E("language").value;','').replace('menu.classList.remove("active");','');
 html=html.replace(/var speechVoices=\[\];[\s\S]*?(?=function speak\(t\))/,'');
 html=html.replace(/function speak\(t\)[\s\S]*?(?=function flash\(t,ok\))/,'function speak(t){if(soundOn)emit({type:"BT_INVADERS_SPEAK",text:t});return true}');
 html=html.replace(/^E\("testVoice"\)[^\n]+\n/m,'');
 html=html.replace(/^E\("play"\)[^\n]+\n/m,'E("again").onclick=start;E("restart").onclick=start;E("pause").onclick=pause;E("mainMenu").onclick=()=>{running=false;keys.left=false;keys.right=false;cancelAnimationFrame(raf);emit({type:"BT_INVADERS_MENU"})};E("overMenu").onclick=E("mainMenu").onclick;E("sound").onclick=()=>{soundOn=!soundOn};\n');
 html=html.replace('cats(false);preview();','').replace(/^Object.keys\(EXTRA\)[^\n]+\n/m,'');
 html=html.replace(/^var demoWords=[^\n]+\n/m,'');
 html=html.replace(/ var languageSelect=E\("language"\);[\s\S]*? languageSelect.value=chosenLanguage;/,' lang=chosenLanguage;');
 html=html.replace('window.parent.postMessage({type:"BT_INVADERS_ERROR",message:"At least five pairs are required"},"*");','');
 html=html.replace(/if\(window.parent===window\)\{ta.value=demoWords;start\(\)\}/,'');
 return html;
}
function cleanSentence(code,g){
 code=strictOrigin(code);
 if(g==='cat'){
  code=code.replace(/let examples=\[[\s\S]*?\n\];/,'let examples=[];');
  code=code.replace("if($('preview').hidden===false)return;",'if(!shellSession)return;');
  code=code.replace(/\$\('play'\)\.addEventListener\('click',[\s\S]*?\n\}\);/,'');
  code=code.replace(/\$\('menu'\)\.addEventListener\('click',[\s\S]*?\n\}\);/,"$('menu').addEventListener('click',()=>{stopCat();shellSession?.menu()});");
 }else if(g==='eater'){
  code=code.replace(/let sentences=\[[^\n]+\];/,'let sentences=[];');
  code=code.replace(/^\$\('play'\)\.onclick[^\n]+\n/m,'');
  code=code.replace(/^\$\('menuReturn'\)\.onclick[^\n]+\n/m,"$('menuReturn').onclick=()=>{stop();shellSession?.menu()};\n");
  code=code.replace(/\$\('preview'\)\.querySelector\('p'\)\.textContent=[^;]+;/,'');
 }else{
  code=code.replace(/(?:E|\$)\('play'\)\.onclick=\(\)=>start\([^;]+;/,'');
 }
 code=code.replace(/(?:E|\$)\('play'\)\.hidden=true;/g,'');
 code=code.replace(/(?:E|\$)\('(?:preview|menu)'\)\.hidden=(?:true|false);/g,'');
 return code;
}
function prepareHtml(html,files,name){
 const scripts=[];let sequence=0;
 html=html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi,(_,attrs,body)=>{
  const src=attrs.match(/\bsrc=["']([^"']+)/)?.[1],module=/\btype=["']module/.test(attrs);
  const path=src||'game-'+(++sequence)+'.js';if(!src)files[path]=body;
  scripts.push({path,module});return '';
 });
 html=html.replace(/<title>[\s\S]*?<\/title>/i,'<title>'+name+'</title>');
 html=html.replace(/<body([^>]*)>/,'<body$1 style="visibility:hidden">').replace('</body>','<script type="module" src="./launch.mjs"></script></body>');
 files['launch.mjs']=`const allowed=${JSON.stringify(settings.shellOrigin)};let source;try{source=new URL(document.referrer).origin}catch{}\nif(parent===window||source!==allowed){document.body.replaceChildren();const h=document.createElement('h1');h.textContent='Choose a set to play';const a=document.createElement('a');a.href=${JSON.stringify(home)};a.textContent='OPEN BORING TEACHER';document.body.append(h,a)}else{for(const item of ${JSON.stringify(scripts)}){await new Promise((resolve,reject)=>{const script=document.createElement('script');if(item.module)script.type='module';script.src=new URL(item.path,import.meta.url);script.onload=resolve;script.onerror=reject;document.body.append(script)})}}document.body.style.visibility='visible';\n`;
 return html;
}
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
const centralDir=await fetchSources(sources.central,'central');
for(const spec of sources.engines){
 const dir=await fetchSources(spec,spec.id),g=spec.game,isSentence=spec.build==='sentence';
 let input=dir;
 if(spec.build==='preview'){execFileSync(process.execPath,['scripts/build-preview.mjs'],{cwd:dir,env:{...process.env,CF_PAGES_COMMIT_SHA:spec.commit},stdio:'pipe'});input=join(dir,'dist-preview')}
 const files={},entries={};const copy=async(from,to=from)=>{files[to]=await readFile(join(input,from),'utf8')};
 if(isSentence){
  await copy('engine/'+g+'.js');files['engine/'+g+'.js']=cleanSentence(files['engine/'+g+'.js'],g);
  await copy('engine/'+g+'.css');await copy('engine/lifecycle.js');
  if(g==='cat'){
   await copy('engine/sentence-session.mjs');let code=strictOrigin(files['engine/sentence-session.mjs']);
   code=code.replace("  document.getElementById('play').hidden = true;",'').replace(/  const message = document.querySelector\('#preview p'\);\n  message.textContent = [^\n]+\n/,'').replace("        document.getElementById('preview').hidden = true;",'');files['engine/sentence-session.mjs']=code;
  }
  let html=await readFile(join(dir,'preview/index.html'),'utf8');html=stripSection(html,g==='warehouse'?'menu':'preview');
  if(g==='warehouse')html=html.replace('<body>','<body><p id="error" hidden></p>');
  files['index.html']=prepareHtml(html,files,'Sentence '+g[0].toUpperCase()+g.slice(1));entries.desktop='index.html';
 }else{
  const pages=g==='racer'?{'engine-desktop.html':'engine-desktop.html','engine-mobile.html':'engine-mobile.html'}:g==='warehouse'?{'electric/game-multilingual-v2.html':'desktop.html','electric/mobile-preview.html':'mobile.html'}:{[g==='snake'?'snake-game.html':g==='jumper'?'engine.html':g==='invaders'?'invaders-game.html':g==='eater'?'eater-game.html':'index.html']:'index.html'};
  const support=g==='snake'?['engine/snake.js','engine/snake.css','engine/session.mjs']:g==='eater'?['engine.js','gameplay.css','session.mjs']:g==='warehouse'?['electric/electrical.js','electric/arcade.css','electric/session.mjs']:['session.mjs'];
  for(const file of support)await copy(file,g==='warehouse'?file.replace('electric/',''):file);
  if(g==='eater')files['engine.js']=cleanWordEater(files['engine.js']);
  const adapter=g[0].toUpperCase()+g.slice(1),session=g==='snake'?'./engine/session.mjs':'./session.mjs';
  files['bootstrap.mjs']=`import {attach${adapter}Session} from '${session}';import {buildId} from './build-id.mjs';\nattach${adapter}Session({engine:window.BT${adapter},policy:{shellOrigin:${JSON.stringify(settings.shellOrigin)},engineOrigin:location.origin,buildId}});\n`;
  for(const[from,to]of Object.entries(pages)){
   let html=await readFile(join(input,from),'utf8');
   if(g==='snake')html=html.replace('./engine/staging-bootstrap.mjs','./bootstrap.mjs');
   if(g==='frog'){html=html.replace('if(window.parent!==window)E("engineTest").classList.remove("active");','');html=stripSection(html,'engineTest');html=html.replace(/^E\("testStart"\)\.onclick[^\n]+\n/m,'').replaceAll('E("engineTest").classList.remove("active");','').replace('else E("engineTest").classList.add("active")','else location.assign('+JSON.stringify(home)+')')}
   if(g==='match'){html=html.replace(/<button id="testStart"[^>]*>[^<]*<\/button>/,'').replace(/^const sampleVocab=[^\n]+\n/m,'').replace('let vocab=sampleVocab','let vocab=[]').replace(/^\s*E\("testStart"\)[^\n]+\n/gm,'')}
   if(g==='eater'){html=stripSection(html,'menu');html=html.replace('<body>','<body><p id="error" hidden></p>')}
   if(g==='invaders'){html=cleanWordInvaders(html);html=html.replace('<body>','<body><p id="error" hidden></p>')}
   if(g==='warehouse')html=html.replace(/<p[^>]*>PORTRAIT PROTOTYPE[^<]*<\/p>/,'');
   const before=new Set(Object.keys(files));html=prepareHtml(html,files,'Vocabulary '+adapter);
   // Distinct inline scripts for device variants.
   if(Object.values(pages).length>1){
    const suffix=to.startsWith('engine-mobile')||to==='mobile.html'?'mobile':'desktop';
    const launch=files['launch.mjs'];delete files['launch.mjs'];files['launch-'+suffix+'.mjs']=launch;
    html=html.replace('./launch.mjs','./launch-'+suffix+'.mjs');
    for(const key of Object.keys(files).filter(k=>/^game-\d+\.js$/.test(k)&&!before.has(k))){const renamed=key.replace('.js','-'+suffix+'.js');files[renamed]=files[key];delete files[key];files['launch-'+suffix+'.mjs']=files['launch-'+suffix+'.mjs'].replaceAll(key,renamed)}
   }
   files[to]=html;if(to.includes('mobile'))entries.mobile=to;else entries.desktop=to;
  }
  if(!files['index.html'])files['index.html']=fallback;
 }
 const responsePolicy="default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'none'; media-src 'none'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors "+settings.shellOrigin;
 const content=JSON.stringify(Object.entries(files).sort())+responsePolicy;
 const artifact=sha(content),buildId=sha(content,isSentence?'sha256':'sha1');
 files[isSentence?'engine/build-id.mjs':'build-id.mjs']=isSentence?`export default '${buildId}';\n`:`export const buildId='${buildId}';\n`;
 const version={environment:'production',sourceCommit:spec.commit,buildId,artifact};files['version.json']=JSON.stringify(version,null,2)+'\n';
 const prefix=spec.id+'/'+artifact,record={id:spec.id,repository:spec.repository,sourceCommit:spec.commit,artifact,buildId,protocol:isSentence?'bt-'+spec.id+'/1':'bt-vocabulary-engine/1',entries:Object.fromEntries(Object.entries(entries).map(([k,v])=>[k,origin+'/'+prefix+'/'+v])),files:{},responsePolicy};
 for(const[path,content]of Object.entries(files)){record.files[path]=sha(content);await put(join(out,'engine-host',prefix,path),content)}
 manifest.engines.push(record);
}

const site=join(out,'site'),readCentral=p=>readFile(join(centralDir,p),'utf8');
for(const path of ['config.mjs','content.mjs','editor.mjs','runtime.mjs','voice.mjs','session-client.mjs','shell.mjs','shell.css'])await put(join(site,'platform',path),await readCentral('platform/'+path));
const byId=id=>manifest.engines.find(e=>e.id===id);
const registry=Object.fromEntries(manifest.engines.map(e=>[e.id,{entries:e.entries,buildId:e.buildId,artifact:e.artifact}]));
await put(join(site,'platform/production/settings.mjs'),'export default '+JSON.stringify({...settings,engines:registry},null,2)+';\n');
let app=await readCentral('platform/staging/app.mjs');
app=app.replace(/import (?:catEngine|eaterEngine|warehouseEngine|invadersEngine|engine) from [^\n]+\n/g,'');
app="import production from './settings.mjs';\n"+app;
app=app.replace(/const BASE=[^\n]+\nconst API=[^\n]+\nconst allowedHost=[^\n]+\n/,`const API=production.wordApi;const allowedHost=location.origin===production.shellOrigin;\nconst sentenceLock=id=>({url:production.engines['sentence-'+id].entries.desktop,buildId:production.engines['sentence-'+id].buildId});\nconst catEngine=sentenceLock('cat'),eaterEngine=sentenceLock('eater'),warehouseEngine=sentenceLock('warehouse'),invadersEngine=sentenceLock('invaders');\n`);
const a=app.indexOf('const racerOrigin='),b=app.indexOf('function showWorkspace()',a);if(a<0||b<0)throw Error('Missing runtime configuration boundary');
app=app.slice(0,a)+`function configuration(gameId='vocabulary-snake'){
 if(!allowedHost||location.protocol!=='https:'||production.environment!=='production')throw Error('Unapproved deployment.');
 const entry=production.engines[gameId];if(!entry)throw Error('Unknown game');
 const portrait=matchMedia('(max-width:760px) and (orientation:portrait)').matches;
 const mobile=portrait&&(gameId==='vocabulary-warehouse'||matchMedia('(pointer:coarse)').matches);
 const selected={url:mobile&&entry.entries.mobile?entry.entries.mobile:entry.entries.desktop,buildId:entry.buildId};
 const config={schemaVersion:1,environment:'production',configRevision:'production-v1',registryRevision:'production-v1',shellOrigin:production.shellOrigin,catalogUrl:production.shellOrigin+'/catalog.json',launcherUrl:production.shellOrigin+'/',sharingBaseUrl:API,sharingTimeoutMs:12000};
 const registry={schemaVersion:1,revision:'production-v1',engines:[{id:gameId,family:'vocabulary',protocol:'bt-vocabulary-engine/1',minPairs:5,...selected}]};
 const policy={environment:'production',shellOrigin:production.shellOrigin,engineBuilds:{[selected.url]:selected.buildId},approved:{catalogUrls:[config.catalogUrl],launcherUrls:[config.launcherUrl],sharingBaseUrls:[API],engineUrls:[selected.url]}};
 return{config,registry,policy};
}
`+app.slice(b);
app=app.replaceAll('bt-staging-word-sets-v1','bt-word-sets-v1').replaceAll('staging site','site').replaceAll('browser and staging','browser and this site').replaceAll('Staging','').replaceAll('staging','');
await put(join(site,'platform/production/app.mjs'),app);
let sentence=await readCentral('platform/staging/sentence.mjs');
sentence=sentence.replace("const API = 'https://boringteacher-sentences-api-staging.mcproductionsdk.workers.dev';",'const API = production.sentenceApi;');
sentence="import production from './settings.mjs';\n"+sentence;
const start=sentence.indexOf("  if (engineUrl.protocol !== 'https:'"),end=sentence.indexOf("  const frame =",start);
sentence=sentence.slice(0,start)+`  const expected=production.engines['sentence-'+gameId];
  if(!expected||engine.url!==expected.entries.desktop||engine.buildId!==expected.buildId||engineUrl.origin!==production.engineOrigin)throw Error('Invalid production engine lock.');
`+sentence.slice(end);
sentence=sentence.replaceAll('bt-staging-sentence-sets-v1','bt-sentence-sets-v1').replaceAll('this staging site','this site').replaceAll('Staging','').replaceAll('staging','');
await put(join(site,'platform/production/sentence.mjs'),sentence);
await put(join(site,'platform/production/app.css'),await readCentral('platform/staging/app.css'));
let html=await readCentral('platform/staging/index.html');html=html.replace(/<p class="stage-label">[\s\S]*?<\/p>/,'').replaceAll('./platform/staging/','./platform/production/').replaceAll(' — games staging','').replaceAll(' · STAGING','').replaceAll('isolated staging','the shared platform');
await put(join(site,'index.html'),html);await put(join(site,'404.html'),fallback);
await put(join(site,'catalog.json'),await readCentral('libraries/vocabulary/v2.json'));
await put(join(site,'sentence-catalog.json'),await readCentral('sentence-games-release-candidate/grammar-candidate.json'));
await put(join(site,'_headers'),`/*\n  Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; img-src 'none'; connect-src 'self' ${settings.wordApi} ${settings.sentenceApi}; frame-src ${origin}; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'\n  Referrer-Policy: strict-origin\n  X-Content-Type-Options: nosniff\n  Cache-Control: no-store\n`);
await put(join(out,'engine-host/_headers'),manifest.engines.map(e=>`/${e.id}/${e.artifact}/*\n  Content-Security-Policy: ${e.responsePolicy}\n  Referrer-Policy: strict-origin\n  X-Content-Type-Options: nosniff\n  X-Robots-Tag: noindex, nofollow\n  Cache-Control: public, max-age=31536000, immutable\n`).join('\n'));
await put(join(out,'engine-host/404.html'),fallback);
async function inventory(dir){const result={};for(const e of await readdir(dir,{withFileTypes:true})){const path=join(dir,e.name);if(e.isDirectory()){for(const[k,v]of Object.entries(await inventory(path)))result[e.name+'/'+k]=v}else result[e.name]=sha(await readFile(path))}return result}
manifest.siteFiles=await inventory(site);manifest.hostFiles=await inventory(join(out,'engine-host'));
await put(join(out,'candidate-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
await rm(join(out,'work'),{recursive:true,force:true});
console.log('Prepared production candidate: shared site + '+manifest.engines.length+' allowlisted engines. No deployment performed.');
