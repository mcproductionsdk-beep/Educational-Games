import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';

const origin='https://feature-accounts-ui.bt-vocabulary-platform-staging.pages.dev';
const root=new URL('../../',import.meta.url);
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try{
 for(const viewport of [{width:1280,height:900},{width:390,height:740}]){
  let folders=[],sets=[],signed=true,failSave=false;
  const page=await browser.newPage({viewport});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>void d.accept());
  await page.route('**/*',async route=>{
   const req=route.request(),u=new URL(req.url());
   if(u.origin!==origin){await route.abort();return;}
   const json=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
   if(u.pathname==='/me'){await json(signed?{account_id:'b8ce6c1a-1ded-4b1d-8e86-5b84fde09d1f'}:{},signed?200:401);return;}
   if(u.pathname==='/profile'){await json({display_name:'Synthetic Teacher',csrf:'x'.repeat(43)});return;}
   if(u.pathname.startsWith('/library/')){
    if(!signed){await json({error:'SIGN_IN_REQUIRED'},401);return;}
    const parts=u.pathname.split('/').slice(2),kind=parts[0],id=parts[1],method=req.method(),body=method==='GET'?null:req.postDataJSON();
    if(method!=='GET'){assert.equal(req.headers()['x-library-csrf'],'x'.repeat(43));if(failSave&&kind==='sets'){await json({error:'LIBRARY_UNAVAILABLE'},503);return;}}
    if(kind==='context'){await json({csrf:'x'.repeat(43),plan:'free',saved_count:sets.filter(s=>s.deleted_at===null).length,limit:5});return;}
    if(kind==='folders'){
     if(method==='GET'){await json({folders});return;}
     if(method==='POST'){const f={folder_id:randomUUID(),name:body.name,parent_folder_id:body.parent_folder_id||null,revision:1};folders.push(f);await json(f);return;}
     const f=folders.find(f=>f.folder_id===id);if(!f){await json({error:'NOT_FOUND'},404);return;}
     if(method==='PATCH'){if(body.name!==undefined)f.name=body.name;if(Object.hasOwn(body,'parent_folder_id'))f.parent_folder_id=body.parent_folder_id;f.revision++;await json(f);return;}
     folders.forEach(child=>{if(child.parent_folder_id===id){child.parent_folder_id=f.parent_folder_id;child.revision++;}});folders=folders.filter(f=>f.folder_id!==id);sets.forEach(s=>{if(s.folder_id===id){s.folder_id=null;s.revision++;}});await json({deleted:true});return;
    }
    if(kind==='sets'){
     if(method==='GET'&&!id){await json({sets:sets.filter(s=>(s.deleted_at!==null)===(u.searchParams.get('deleted')==='1')).filter(s=>!u.searchParams.has('folder_id')||(s.folder_id||'unfiled')===u.searchParams.get('folder_id')).filter(s=>s.title.toLowerCase().includes((u.searchParams.get('q')||'').toLowerCase())),next_offset:null});return;}
     if(method==='POST'&&!id){
      if(sets.filter(s=>s.deleted_at===null).length>=5){await json({error:'SET_LIMIT_REACHED'},409);return;}
      const s={set_id:randomUUID(),...body,folder_id:body.folder_id,title:body.payload.title,family:body.payload.family,revision:1,deleted_at:null};sets.push(s);await json(s);return;
     }
     const s=sets.find(s=>s.set_id===id);if(!s){await json({error:'NOT_FOUND'},404);return;}
     if(method==='GET'){await json(s);return;}
     if(s.revision!==body.revision){await json({error:'REVISION_CONFLICT'},409);return;}
     if(method==='DELETE')s.deleted_at=1;
     else if(parts[2]==='restore')s.deleted_at=null;
     else {if(body.payload){s.payload=body.payload;s.title=body.payload.title;}if(Object.hasOwn(body,'folder_id'))s.folder_id=body.folder_id;}
     s.revision++;await json(s);return;
    }
   }
   let path=u.pathname==='/'?'platform/staging/index.html':u.pathname==='/catalog.json'?'libraries/vocabulary/v2.json':u.pathname==='/sentence-catalog.json'?'sentence-games-release-candidate/grammar-candidate.json':u.pathname.slice(1);
   if(!/^(platform\/|libraries\/|sentence-games-release-candidate\/)/.test(path)||path.includes('..')){await route.fulfill({status:404,body:'Not found'});return;}
   try{const body=await readFile(new URL(path,root));const contentType=path.endsWith('.mjs')?'text/javascript':path.endsWith('.css')?'text/css':path.endsWith('.json')?'application/json':path.endsWith('.html')?'text/html':path.endsWith('.webp')?'image/webp':'font/ttf';await route.fulfill({body,contentType});}catch{await route.fulfill({status:404,body:'Not found'});}
  });
  await page.goto(origin);await page.getByRole('button',{name:'My Library',exact:true}).waitFor();await page.locator('#pairs').waitFor();
  const wordText='cat\tgato\ndog\tperro\nbird\tpájaro\nmouse\tratón\nhorse\tcaballo';
  await page.locator('#set-title').fill('Words <img src=x>');await page.locator('#pairs').fill(wordText);
  await page.getByRole('button',{name:'SAVE TO ACCOUNT',exact:true}).click();
  let d=page.getByRole('dialog',{name:'SAVE TO ACCOUNT',exact:true});await d.getByRole('button',{name:'Save set',exact:true}).waitFor();await page.waitForFunction(()=>!document.querySelector('.bt-library-window button[type=submit]').disabled);
  await d.getByLabel('Or create a new folder').fill('Term 1');await d.getByRole('button',{name:'Save set',exact:true}).click();await d.getByRole('status').filter({hasText:'Saved to your account.'}).waitFor();assert.equal(sets.length,1);assert.equal(folders.length,1);
  await d.getByRole('button',{name:'Close ×',exact:true}).click();assert.equal(await page.locator('#pairs').inputValue(),wordText);
  await page.getByRole('button',{name:'SENTENCE GAMES',exact:true}).click();await page.locator('#sentence-pairs').waitFor();
  const sentenceText='He comido.\tI have eaten.\nElla ha llegado.\tShe has arrived.';
  await page.locator('#sentence-title').fill('Present perfect');await page.locator('#sentence-column-order').selectOption('target-first');await page.locator('#sentence-pairs').fill(sentenceText);
  await page.getByRole('button',{name:'SAVE TO ACCOUNT',exact:true}).click();d=page.getByRole('dialog',{name:'SAVE TO ACCOUNT',exact:true});await page.waitForFunction(()=>!document.querySelector('.bt-library-window button[type=submit]').disabled);await d.getByRole('button',{name:'Save set',exact:true}).click();await d.getByRole('status').filter({hasText:'Saved to your account.'}).waitFor();await d.getByRole('button',{name:'Close ×',exact:true}).click();
  assert.equal(sets[1].payload.metadata.columnOrder,'target-first');assert.equal(sets[1].payload.pairs[0][0],'I have eaten.');
  await page.getByRole('button',{name:'WORD GAMES',exact:true}).click();assert.equal(await page.locator('#pairs').inputValue(),wordText);
  await page.getByRole('button',{name:'My Library',exact:true}).click();d=page.getByRole('dialog',{name:'MY LIBRARY',exact:true});await d.getByRole('status').filter({hasText:'2 of 5'}).waitFor();assert.equal(await d.locator('img').count(),0);
  const bounds=await d.boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=viewport.width&&bounds.height<=viewport.height);
  const nav=()=>d.getByRole('navigation',{name:'Library folders'});
  await d.getByRole('button',{name:'Folder: Term 1',exact:true}).click();await d.getByRole('button',{name:'Rename',exact:true}).click();await d.getByLabel('Folder name',{exact:true}).fill('Unit 1');await d.getByRole('button',{name:'Rename',exact:true}).click();await d.getByRole('status').filter({hasText:'Folder renamed.'}).waitFor();assert.equal(folders[0].name,'Unit 1');
  const unit=folders[0];await nav().getByRole('button',{name:'Open folder Unit 1',exact:true}).click();await d.getByRole('button',{name:'Vocabulary set: Words <img src=x>',exact:true}).waitFor();assert.equal(await d.locator('.bt-library-icon-vocabulary').innerText(),'V');
  await d.getByRole('button',{name:'New folder',exact:true}).click();await d.getByLabel('New folder name',{exact:true}).fill('Child');await d.getByRole('button',{name:'Create folder',exact:true}).click();await d.getByRole('status').filter({hasText:'Folder created.'}).waitFor();const child=folders.find(f=>f.name==='Child');assert.equal(child.parent_folder_id,unit.folder_id);
  await nav().getByRole('button',{name:'My Library',exact:true}).click();await d.getByRole('button',{name:'New folder',exact:true}).click();await d.getByLabel('New folder name',{exact:true}).fill('Destination');await d.getByRole('button',{name:'Create folder',exact:true}).click();await d.getByRole('status').filter({hasText:'Folder created.'}).waitFor();const dest=folders.find(f=>f.name==='Destination');
  if(viewport.width>650){await d.getByRole('button',{name:'Folder: Unit 1',exact:true}).dragTo(nav().getByRole('button',{name:'Open folder Destination',exact:true}));}
  else {await d.getByRole('button',{name:'Folder: Unit 1',exact:true}).click();await d.getByRole('button',{name:'Move to…',exact:true}).click();await d.getByLabel('Destination',{exact:true}).selectOption(dest.folder_id);await d.getByRole('button',{name:'Move here',exact:true}).click();}
  await d.getByRole('status').filter({hasText:'Folder moved.'}).waitFor();assert.equal(unit.parent_folder_id,dest.folder_id);assert.equal(child.parent_folder_id,unit.folder_id);
  await nav().getByRole('button',{name:'Open folder Unit 1',exact:true}).click();await d.getByRole('button',{name:'Vocabulary set: Words <img src=x>',exact:true}).waitFor();
  if(viewport.width>650){await d.getByRole('button',{name:'Vocabulary set: Words <img src=x>',exact:true}).dragTo(nav().getByRole('button',{name:'Open folder Child',exact:true}));}
  else {await d.getByRole('button',{name:'Vocabulary set: Words <img src=x>',exact:true}).click();await d.getByRole('button',{name:'Move to…',exact:true}).click();await d.getByLabel('Destination',{exact:true}).selectOption(child.folder_id);await d.getByRole('button',{name:'Move here',exact:true}).click();}
  await d.getByRole('status').filter({hasText:'Set moved.'}).waitFor();assert.equal(sets[0].folder_id,child.folder_id);
  await nav().getByRole('button',{name:'Open folder Destination',exact:true}).click();await d.getByRole('button',{name:'Folder: Unit 1',exact:true}).click();await d.getByRole('button',{name:'Move to…',exact:true}).click();assert.equal(await d.getByLabel('Destination',{exact:true}).locator('option[value="'+unit.folder_id+'"]').count(),0);assert.equal(await d.getByLabel('Destination',{exact:true}).locator('option[value="'+child.folder_id+'"]').count(),0);await d.getByRole('button',{name:'Cancel',exact:true}).click();
  await d.getByRole('button',{name:'Delete folder',exact:true}).click();await d.getByRole('status').filter({hasText:'subfolders moved up one level.'}).waitFor();assert.equal(child.parent_folder_id,dest.folder_id);assert.equal(sets[0].folder_id,child.folder_id);
  await nav().getByRole('button',{name:'All sets',exact:true}).click();await d.getByRole('button',{name:'Sentence set: Present perfect',exact:true}).waitFor();assert.equal(await d.locator('.bt-library-icon-sentence').innerText(),'S');
  await d.getByLabel('Search sets',{exact:true}).fill('Words');await d.getByRole('button',{name:'Vocabulary set: Words <img src=x>',exact:true}).waitFor();await page.waitForFunction(()=>!Array.from(document.querySelectorAll('.bt-library-tile-button')).some(b=>b.textContent.includes('Present perfect')));await d.getByLabel('Search sets',{exact:true}).fill('');await d.getByRole('button',{name:'Sentence set: Present perfect',exact:true}).waitFor();
  await d.getByRole('button',{name:'Sentence set: Present perfect',exact:true}).click();await d.getByRole('button',{name:'Open in editor',exact:true}).click();await page.locator('#sentence-pairs').waitFor();assert.equal(await page.locator('#sentence-pairs').inputValue(),sentenceText);
  await page.locator('#sentence-title').fill('Keep this draft');failSave=true;await page.getByRole('button',{name:'SAVE TO ACCOUNT',exact:true}).click();d=page.getByRole('dialog',{name:'SAVE TO ACCOUNT',exact:true});await page.waitForFunction(()=>!document.querySelector('.bt-library-window button[type=submit]').disabled);await d.getByRole('button',{name:'Save changes',exact:true}).click();await d.getByRole('status').filter({hasText:'draft is still here'}).waitFor();await page.keyboard.press('Escape');assert.equal(await page.locator('#sentence-title').inputValue(),'Keep this draft');failSave=false;
  await page.getByRole('button',{name:'My Library',exact:true}).click();d=page.getByRole('dialog',{name:'MY LIBRARY',exact:true});await d.getByRole('status').filter({hasText:'2 of 5'}).waitFor();await d.getByRole('navigation',{name:'Library folders'}).getByRole('button',{name:'All sets',exact:true}).click();await d.getByRole('button',{name:'Sentence set: Present perfect',exact:true}).click();await d.getByRole('button',{name:'Delete set',exact:true}).click();await d.getByRole('status').filter({hasText:'Set moved to Trash.'}).waitFor();await d.getByRole('navigation',{name:'Library folders'}).getByRole('button',{name:'Trash',exact:true}).click();await d.getByRole('button',{name:'Sentence set: Present perfect',exact:true}).click();await d.getByRole('button',{name:'Restore',exact:true}).click();await d.getByRole('status').filter({hasText:'Set restored.'}).waitFor();
  signed=false;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.getByRole('status').filter({hasText:'Guest',exact:true}).waitFor();assert.equal(await page.locator('.bt-library-window').count(),0);assert.equal(await page.locator('#sentence-title').inputValue(),'Keep this draft');assert.equal(await page.getByRole('button',{name:'My Library',exact:true}).isVisible(),false);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(await page.evaluate(()=>Object.keys(localStorage)),[]);
  await page.getByRole('button',{name:'SAVE TO ACCOUNT',exact:true}).click();d=page.getByRole('dialog',{name:'SAVE TO ACCOUNT',exact:true});await d.getByRole('button',{name:'Sign in',exact:true}).waitFor();await d.getByRole('button',{name:'Sign in',exact:true}).click();await page.locator('.bt-login-window').waitFor();assert.equal(await page.locator('.bt-library-window').count(),0);assert.equal(await page.locator('#sentence-title').inputValue(),'Keep this draft');assert.equal(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('bt-staging-signin-draft-v1')).fields['sentence-title']),'Keep this draft');
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log('Library browser checks passed: actual homepage on desktop/mobile, both editors, private save, nested folders, V/S icons, desktop drag and mobile Move to, cycle filtering, preserving descendants on deletion, title search, exact sentence direction, draft preservation, literal rendering, Trash restore and sign-out cleanup.');
}finally{await browser.close();}

