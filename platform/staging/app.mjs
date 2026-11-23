import {saveApprovedLesson} from './save-lesson.mjs';
import {teacherLesson} from './teacher-lesson.mjs';
import {mountAccounts} from './accounts.mjs';
import {createLibraryWindow} from './library-window.mjs';
import {createLibraryClient,libraryShareUrl,sameLibraryPayload,loadLibraryShare} from './library-client.mjs';
import {mountCombinedLogin} from './custom-login/window.mjs';
import {mountProfile} from './custom-login/profile.mjs';
import {mountRegistration} from './custom-login/register.mjs';
import {LOCALES,validateVocabulary} from '../content.mjs';
import {parseVocabularyDraft,inspectVocabularyDraft,catalogCategories,categoryPairs} from '../editor.mjs';
import {createVocabularyRuntime} from '../runtime.mjs';
import {mountGameplayShell} from '../shell.mjs';
import {createPronunciationService} from '../voice.mjs';
import {createSentenceWorkspace,mountSentenceCat,sentenceRequest,validateSentenceSet} from './sentence.mjs';
import catEngine from './cat-lock.json' with {type:'json'};
import eaterEngine from './eater-lock.json' with {type:'json'};
import warehouseEngine from './warehouse-lock.json' with {type:'json'};
import invadersEngine from './invaders-lock.json' with {type:'json'};
import engine from './engine-lock.json' with {type:'json'};

const BASE='bt-vocabulary-platform-staging.pages.dev';
const API='https://boringteacher-vocabulary-api-staging.mcproductionsdk.workers.dev';
const allowedHost=location.hostname===BASE||location.hostname.endsWith('.'+BASE);
const workspace=document.getElementById('workspace'),gameplay=document.getElementById('gameplay'),notice=document.getElementById('notice');
const label={ 'en-US':'English','es-ES':'Spanish','de-DE':'German','da-DK':'Danish','fr-FR':'French','it-IT':'Italian' };
let runtime,catalog,game,renderEpoch=0,draft=null,soundOn=true;
let wordEditorDraft=null;
const privateRecords={vocabulary:null,sentence:null},pendingSaves={vocabulary:{},sentence:{}};
function captureEditorDraft(){
 const text=document.getElementById('pairs');if(!text)return;
 wordEditorDraft={title:document.getElementById('set-title').value,promptLanguage:document.getElementById('prompt-language').value,language:document.getElementById('target-language').value,text:text.value,category:document.getElementById('category').value};
}
const games=[['vocabulary-snake','🐍','Word Snake'],['vocabulary-racer','🏎️','Vocabulary Racer'],['vocabulary-jumper','🏃','Vocabulary Jumper'],['vocabulary-invaders','👾','Vocabulary Invaders'],['vocabulary-frog','🐸','Vocabulary Frog'],['vocabulary-match','🔗','Vocabulary Match'],['vocabulary-eater','🟡','Vocabulary Eater'],['vocabulary-warehouse','📦','Vocabulary Warehouse']];
function gameGrid(parent,onPlay){const grid=node('div');grid.className='gamegrid';for(const [id,icon,name]of games){const b=button('',()=>onPlay(id));b.className='game';b.dataset.game=id;b.append(node('span',icon),node('small',name.toUpperCase()));if(!['vocabulary-snake','vocabulary-racer','vocabulary-jumper','vocabulary-invaders','vocabulary-frog','vocabulary-match','vocabulary-eater','vocabulary-warehouse'].includes(id)){b.disabled=true;b.title='Not yet migrated to isolated staging';}grid.append(b);}parent.append(grid);}
async function loadCatalog(){if(catalog)return;const response=await fetch(runtime.settings.catalogUrl,{cache:'no-store',redirect:'error',credentials:'omit'});if(!response.ok)throw new Error('Vocabulary catalog unavailable.');const data=await response.json();catalogCategories(data);catalog=data;}

const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
const button=(text,action)=>{const b=node('button',text);b.type='button';b.addEventListener('click',action);return b;};
const voice=createPronunciationService({onStatus:state=>{notice.textContent=state==='error'||state==='unavailable'?'Pronunciation unavailable on this device.':state==='requested'?'Pronunciation requested.':state==='started'?'Speaking…':'';}});
const racerOrigin='https://72dd2d78.bt-vocabulary-racer-preview.pages.dev';
function configuration(gameId='vocabulary-snake'){
 const variant=matchMedia('(pointer: coarse) and (max-width: 760px) and (orientation: portrait)').matches?'mobile':'desktop';
 const selected=gameId==='vocabulary-racer'?{url:racerOrigin+'/engine-'+variant,buildId:'a4afaa1908445178c4b7559856161b8b05a14aa2'}:gameId==='vocabulary-jumper'?{url:'https://cbd5d3cd.bt-vocabulary-jumper-preview.pages.dev/engine',buildId:'f177ff7be1897bc89e29df69d08f09e9799b60dc'}:gameId==='vocabulary-invaders'?{url:'https://f80f705c.bt-vocabulary-invaders-preview.pages.dev/invaders-game',buildId:'32644f495b60e26736a6d48d1a52431baca3b751'}:gameId==='vocabulary-frog'?{url:'https://82dc1cac.bt-vocabulary-frog-preview.pages.dev/',buildId:'b99776f4a432db00fd8bdacd2d99c5ac9965ca00'}:gameId==='vocabulary-match'?{url:'https://b12ef808.bt-vocabulary-match-preview.pages.dev/',buildId:'75fa265b57a9b6700340a75b939d3e85b661bb30'}:gameId==='vocabulary-eater'?{url:'https://d1203cab.bt-vocabulary-eater-preview.pages.dev/eater-game.html',buildId:'1c1511e562738b824497440cbb505f6df927fcc5'}:gameId==='vocabulary-warehouse'?{url:'https://3fa45459.bt-vocabulary-warehouse-preview.pages.dev/electric/'+(matchMedia('(max-width: 760px) and (orientation: portrait)').matches?'mobile-preview':'game-multilingual-v2'),buildId:'629374a28333dbe4c09c623f1252edf4cb44b6c0'}:engine;
 if(!allowedHost||location.protocol!=='https:'||engine.environment!=='staging')throw new Error('Unapproved staging deployment.');
 const config={schemaVersion:1,environment:'staging',configRevision:'staging-v1',registryRevision:'snake-v1',shellOrigin:location.origin,catalogUrl:location.origin+'/catalog.json',launcherUrl:location.origin+'/',sharingBaseUrl:API,sharingTimeoutMs:12000};
 const registry={schemaVersion:1,revision:'snake-v1',engines:[{id:gameId,family:'vocabulary',protocol:'bt-vocabulary-engine/1',minPairs:5,url:selected.url,buildId:selected.buildId}]};
 const policy={environment:'staging',shellOrigin:location.origin,engineBuilds:{[selected.url]:selected.buildId},approved:{catalogUrls:[config.catalogUrl],launcherUrls:[config.launcherUrl],sharingBaseUrls:[API],engineUrls:[selected.url]}};
 return{config,registry,policy};
}
function showWorkspace(){document.body.classList.remove('playing');game?.destroy();game=null;gameplay.replaceChildren();gameplay.hidden=true;workspace.hidden=false;voice.cancel();notice.textContent='';}
function launch(set,id,gameId){
 showWorkspace();document.body.classList.add('playing');window.scrollTo(0,0);workspace.hidden=true;gameplay.hidden=false;
 game=mountGameplayShell({root:gameplay,...configuration(gameId),set,shareId:id,context:id?'student':'creator',voice,soundOn,onSoundChange:value=>{soundOn=value;},
  navigate:url=>{const next=new URL(url);if(next.origin!==location.origin)throw new Error('Invalid staging return.');if(location.hash===next.hash)void render();else location.assign(next.href);},
  onCreatorReturn:()=>{showWorkspace();void render();}});
 void game.ready.then(result=>{if(!result.ok)notice.textContent='Unable to start the staging game: '+result.error;});
}
function selectField(parent,id,title,value){const l=node('label',title);l.htmlFor=id;const s=node('select');s.id=id;for(const locale of LOCALES){const o=node('option',label[locale]);o.value=locale;s.append(o);}s.value=value;parent.append(l,s);return s;}
function renderPairPreview(container,rows,locales){
 const table=node('table'),head=node('tr');
 for(const name of ['LINE','PROMPT','TARGET']){
  const column=node('th',name);column.scope='col';head.append(column);
 }
 table.append(head);
 for(const {number,raw,pair} of rows){
  const row=node('tr');row.append(node('td',String(number)));
  if(!pair){
   const review=node('td','Review this row: '+raw);
   review.colSpan=2;review.style.whiteSpace='pre-wrap';row.append(review);
  }else{
   pair.forEach((value,index)=>{
    const cell=node('td'),wrap=node('div');
    wrap.className='word-cell';
    const speak=button('▶',()=>void voice.speak(value,locales[index]));
    speak.className='speak';speak.setAttribute('aria-label','Pronounce '+value);
    wrap.append(speak,node('span',value));cell.append(wrap);row.append(cell);
   });
  }
  table.append(row);
 }
 container.replaceChildren(table);
}

const wordTab=document.getElementById('word-tab'),sentenceTab=document.getElementById('sentence-tab');
const lessonTab=document.getElementById('lesson-tab');
const lessonOrigin='https://feature-lesson-staging-20261.bt-lessons-staging.pages.dev';
const familyTabs=document.getElementById('family-tabs');
const accountDraftKey='bt-staging-signin-draft-v1';
const draftFields=['prompt-language','target-language','category','set-title','pairs','sentence-language','sentence-topic','sentence-title','sentence-pairs','sentence-column-order'];
let savedAccountDraft=null;
try{const raw=sessionStorage.getItem(accountDraftKey);if(raw&&raw.length<150000)savedAccountDraft=JSON.parse(raw);}catch{}
let family=savedAccountDraft?.family==='sentence'?'sentence':'word';
let loginWindow=null;
async function openAccountWindow(mode,initialCode=''){
 if(loginWindow)return;loginWindow=true;
 try{const mounted=await (mode==='profile'?mountProfile:mode==='register'||mode==='recover'?mountRegistration:mountCombinedLogin)({onSaved:()=>void accounts.refresh(),initialCode,initialMode:mode==='recover'?'recover':'entry',onVerifyEmail:()=>void openAccountWindow('recover'),onClose:()=>{loginWindow=null;},onSignIn:()=>void openAccountWindow('signin'),onCreateAccount:()=>void openAccountWindow('register')});if(loginWindow)loginWindow=mounted;}catch{loginWindow=null;notice.textContent='Account window could not open. Please try again.';}
}
function preserveAccountDraft(){
 const fields={};for(const id of draftFields){const field=document.getElementById(id);if(field)fields[id]=field.value;}
 const saved=JSON.stringify({family,hash:location.hash,fields});if(saved.length>150000)throw Error('Draft too large');
 sessionStorage.setItem(accountDraftKey,saved);
}
const libraryClient=createLibraryClient();
let openedPrivateId=null;
const privateLink=/^#(?:private-set|lesson-results)=([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12})$/;
function loadPrivateRecord(record){
 if(record.deleted_at!==null)throw Error('Restore this set from Trash before opening it.');
 if(record.family==='sentence'){sentenceWorkspace.loadPrivate(record.payload);family='sentence';}
 else{const p=record.payload;draft=p;wordEditorDraft={...p,text:p.pairs.map(pair=>pair.join('\t')).join('\n'),category:p.metadata.category};family='word';}
 privateRecords[record.family]=record;
}
const library=createLibraryWindow({client:libraryClient,onSignIn:()=>{preserveAccountDraft();void openAccountWindow('signin');},onSaved:record=>{privateRecords[record.family]=record;},onOpenInTab:item=>{
 const url=new URL('/',location.origin);url.hash='private-set='+item.set_id;window.open(url.href,'_blank','noopener,noreferrer');
},onShare:async record=>{
 const url=await ensureStableLink(record);try{await navigator.clipboard.writeText(url);return {url,copied:true};}catch{return {url,copied:false};}
}});
async function ensureStableLink(record){
 if(!record.share_id)record.share_id=(await libraryClient.share(record)).share_id;
 return libraryShareUrl(record.share_id,location.origin);
}
async function savedStudentLink(type,getPayload){
 let record=privateRecords[type];if(!record)return null;
 const payload=getPayload();if(!sameLibraryPayload(payload,record.payload)){record=await libraryClient.save(payload,record.folder_id,record);privateRecords[type]=record;}
 return {url:await ensureStableLink(record)};
}
const saveToAccount=(type,getPayload)=>{captureEditorDraft();return library.save({getPayload,record:privateRecords[type],pending:pendingSaves[type]});};
let libraryAccountId=null;
let labAccount=null;
const accounts=mountAccounts({root:document.getElementById('account-controls'),openLibrary:()=>{captureEditorDraft();void library.browse();},onStateChange:state=>{labAccount=state;if(!state.signed&&!state.unavailable||state.signed&&libraryAccountId!==state.accountId){libraryAccountId=state.signed?state.accountId:null;library.reset();privateRecords.vocabulary=privateRecords.sentence=null;pendingSaves.vocabulary={};pendingSaves.sentence={};}},openProfile:()=>openAccountWindow('profile'),openRegistration:()=>openAccountWindow('register'),openSignIn:()=>openAccountWindow('signin'),beforeSignIn:()=>{
 preserveAccountDraft();
}});
function restoreAccountDraft(){
 const saved=savedAccountDraft;savedAccountDraft=null;if(!saved)return;
 if(saved.hash!==location.hash&&(/^#(?:set|sentence-set)=[A-Z0-9]{6}$/.test(saved.hash)||privateLink.test(saved.hash))){location.hash=saved.hash;return;}
 for(const id of draftFields){const field=document.getElementById(id),value=saved.fields?.[id];if(field&&typeof value==='string')field.value=value;}
 const text=document.getElementById(family==='sentence'?'sentence-pairs':'pairs');text?.dispatchEvent(new Event('input',{bubbles:true}));
 try{sessionStorage.removeItem(accountDraftKey);}catch{}
}
const sentenceWorkspace=createSentenceWorkspace({node,button,voice,notice,renderPairPreview,saveToAccount:getPayload=>saveToAccount('sentence',getPayload),shareSaved:getPayload=>savedStudentLink('sentence',getPayload),launch:(set,gameId='cat')=>{
 showWorkspace();
 document.body.classList.add('playing');
 window.scrollTo(0,0);
 workspace.hidden=true;
 gameplay.hidden=false;
 game=mountSentenceCat({root:gameplay,engine:gameId==='cat'?catEngine:gameId==='eater'?eaterEngine:gameId==='warehouse'?warehouseEngine:invadersEngine,gameId,set,soundOn,voice,
  onSound:value=>{soundOn=value;},onMenu:()=>void render(),
  onError:message=>{void render().then(()=>{notice.textContent=message+' Return to the game card to retry.';});}});
}});
for(const [tab,value] of [[wordTab,'word'],[sentenceTab,'sentence']]){
 tab.addEventListener('click',()=>{family=value;if(location.hash==='#lesson-lab')location.hash='';else void render();});
}

lessonTab.addEventListener('click',()=>{if(location.hash!=='#lesson-lab')location.hash='lesson-lab';});
window.addEventListener('message',async event=>{
 const frame=document.getElementById('lesson-builder');
 if(!frame||event.source!==frame.contentWindow||event.origin!==lessonOrigin)return;
 const data=event.data;
 if(data?.type==='lesson-height'&&Number.isFinite(data.height)){
  frame.style.height=Math.min(20000,Math.max(450,Math.ceil(data.height)))+'px';return;
 }
 if(data?.type==='lesson-author-request'){
  const port=event.ports[0],action=data.action;
  if(!port)return;
  try{
   const poll=typeof action==='string'&&/^jobs\/[a-f0-9]{64}$/.test(action);
   if(!(poll||['draft','record','image','exam','questions','voice-sample'].includes(action))||!poll&&(typeof data.body!=='string'||data.body.length>32000))throw Error();
   const response=await fetch('/lesson-author/'+action,{method:poll?'GET':'POST',credentials:'same-origin',redirect:'error',cache:'no-store',...(poll?{}:{headers:{'Content-Type':'application/json'},body:data.body})});
   port.postMessage({status:response.status,body:await response.text()});
  }catch{port.postMessage({status:503,body:'{"error":"aiUnavailable"}'});}
  finally{port.close();}
  return;
 }
 if(data?.type==='lesson-account'){
  if(!labAccount||labAccount.unavailable)await accounts.refresh();
  if(!frame.isConnected)return;
  const signed=Boolean(labAccount?.signed);
  frame.contentWindow.postMessage({type:'lesson-account-reply',signed},lessonOrigin);
  if(!signed){if(labAccount?.unavailable)notice.textContent='Account service unavailable. Please try again.';else void openAccountWindow('signin');}
 }
 if(data?.type==='lesson-save'&&typeof data.params==='string'&&data.params.length<26000){
  const params=new URLSearchParams(data.params);
  const reply={type:'lesson-saved',nonce:params.get('nonce')};
  try{
   const record=await saveApprovedLesson(params,libraryClient);
   Object.assign(reply,{set:record.set_id,share:record.share_id,revision:record.revision});
  }catch(e){reply.error=e.code||'UNAVAILABLE';}
  if(frame.isConnected)frame.contentWindow.postMessage(reply,lessonOrigin);
 }
});
function openLesson(snapshot,share){
 if(typeof snapshot!=='string'||!/^#v2\.[A-Za-z0-9_-]{1,22000}$/.test(snapshot))throw Error('This lesson link is invalid.');
 const url=new URL('https://feature-lesson-staging-20261.bt-lessons-staging.pages.dev/student/');
 url.hash=snapshot;url.searchParams.set('share',share);
 location.replace(url.href);
}
function mountLessonBuilder(src,title){
 const frame=node('iframe');
 frame.title=title;
 frame.referrerPolicy='origin';
 frame.allow='clipboard-write';
 frame.id='lesson-builder';
 frame.src=src;
 workspace.classList.add('lesson-workspace');
 workspace.replaceChildren(frame);
}
async function render(skipCapture=false){
 if(!skipCapture)captureEditorDraft();
 workspace.classList.remove('lesson-workspace');
 lessonTab.setAttribute('aria-current','false');
 const epoch=++renderEpoch;showWorkspace();workspace.replaceChildren();
 let hash=location.hash;
 const stableStudent=hash.startsWith('#shared-set=');document.getElementById('account-controls').hidden=stableStudent;
 if(stableStudent){
  familyTabs.hidden=true;notice.textContent='Loading shared set…';
  try{const raw=await loadLibraryShare(hash.slice('#shared-set='.length));if(epoch!==renderEpoch)return;
   if(raw.family==='lesson'){openLesson(raw.snapshot,hash.slice('#shared-set='.length));return;}
   if(raw.family==='sentence'){if(raw.promptLanguage!=='en-US')throw Error();await sentenceWorkspace.render(workspace,hash,()=>epoch===renderEpoch,validateSentenceSet(raw));}
   else{const set=validateVocabulary(raw);notice.textContent='';const box=node('section');box.className='student-panel';box.append(node('h2',set.title),node('p',label[set.promptLanguage]+' → '+label[set.language]+' · '+set.pairs.length+' pairs'),node('h3','CHOOSE YOUR GAME'));gameGrid(box,gameId=>launch(set,null,gameId));workspace.append(box);}
  }catch(e){if(epoch===renderEpoch){workspace.replaceChildren();notice.textContent=e.message||'This shared set could not be loaded. Check the link and try again.';}}
  return;
 }

 if(hash.startsWith('#private-set=')||hash.startsWith('#lesson-results=')){
  familyTabs.hidden=true;
  const match=hash.match(privateLink);if(!match){notice.textContent='This private set link is invalid.';return;}
  if(openedPrivateId!==match[1]){
   notice.textContent='Opening your private set…';
   try{await accounts.refresh();if(epoch!==renderEpoch)return;const record=await libraryClient.get(match[1]);if(epoch!==renderEpoch)return;if(record.family==='lesson'&&record.deleted_at===null){familyTabs.hidden=true;notice.textContent='';
     if(hash.startsWith('#lesson-results=')){teacherLesson(workspace,record,true);return;}
     const url=new URL('/embedded',lessonOrigin);
     url.searchParams.set('saved',record.set_id);
     const params=new URLSearchParams({snapshot:record.payload.snapshot,title:record.title,revision:String(record.revision)});
     if(record.share_id)params.set('share',record.share_id);
     url.hash=params.toString();
     mountLessonBuilder(url.href,'Edit saved lesson');return;}loadPrivateRecord(record);openedPrivateId=match[1];notice.textContent='Private set opened. Use Save to folder to save your changes.';}
   catch(e){if(epoch===renderEpoch)notice.textContent=e.code==='SIGN_IN_REQUIRED'?'Sign in to open this private set.':e.message;return;}
  }
  hash='';
 }
 if(hash==='#lesson-lab'){
  familyTabs.hidden=false;
  wordTab.setAttribute('aria-current','false');sentenceTab.setAttribute('aria-current','false');lessonTab.setAttribute('aria-current','page');
  mountLessonBuilder(lessonOrigin+'/embedded','Create a lesson');return;
 }
 const sentence=hash.startsWith('#sentence-set=')||(!hash&&family==='sentence');
 familyTabs.hidden=hash.startsWith('#sentence-set=');
 wordTab.setAttribute('aria-current',sentence?'false':'page');
 sentenceTab.setAttribute('aria-current',sentence?'page':'false');
 if(sentence){
  await sentenceWorkspace.render(workspace,hash,()=>epoch===renderEpoch);
  return;
 }
 if(hash){
  if(!/^#set=[A-Z0-9]{6}$/.test(hash)){notice.textContent='Invalid staging link. Open the staging homepage to create a test set.';return;}
  const id=hash.slice(5);notice.textContent='Loading shared vocabulary…';
  try{const set=await runtime.loadSet(id);if(epoch!==renderEpoch)return;notice.textContent='';
   const box=node('section');box.className='student-panel';box.append(node('h2',set.title),node('p',label[set.promptLanguage]+' → '+label[set.language]+' · '+set.pairs.length+' pairs'));
   box.append(node('h3','CHOOSE YOUR GAME'));gameGrid(box,gameId=>launch(set,id,gameId));workspace.append(box);
  }catch{if(epoch===renderEpoch)notice.textContent='Shared staging vocabulary could not be loaded. Check the link and try again.';}
  return;
 }
 let catalogError='';try{await loadCatalog();}catch{catalogError='Built-in vocabulary is unavailable. You can still paste a custom set.';}if(epoch!==renderEpoch)return;
 workspace.append(node('h2','WORD GAMES'));
 const grid=node('div');grid.className='columns';const settings=node('section'),editor=node('section');settings.className=editor.className='panel';
 settings.append(node('h3','GAME SETTINGS'));editor.append(node('h3','CUSTOMIZE / EDIT'));
 const prompt=selectField(settings,'prompt-language','PROMPT LANGUAGE',wordEditorDraft?.promptLanguage||draft?.promptLanguage||'en-US'),target=selectField(settings,'target-language','TARGET LANGUAGE',wordEditorDraft?.language||draft?.language||'es-ES');
 const cl=node('label','CATEGORY');cl.htmlFor='category';const category=node('select');category.id='category';
 if(catalog)for(const name of catalogCategories(catalog)){const option=node('option',name);option.value=name;category.append(option);}
 const custom=node('option','Custom vocabulary');custom.value='';category.append(custom);category.value=wordEditorDraft?wordEditorDraft.category:draft?'':catalog?'Animals':'';if(category.selectedIndex<0)category.value='';settings.append(cl,category);
 const hint=node('p',catalogError||'Selecting a built-in category loads editable word pairs. Choose Custom to paste your own.');hint.className='note';settings.append(hint);
 const titleLabel=node('label','SET TITLE');titleLabel.htmlFor='set-title';const title=node('input');title.id='set-title';title.maxLength=100;title.placeholder='Title this vocabulary set';title.value=wordEditorDraft?.title??draft?.title??'';
 const wordsLabel=node('label','PROMPT FIRST · TARGET SECOND');wordsLabel.htmlFor='pairs';const words=node('textarea');words.id='pairs';words.spellcheck=false;words.value=wordEditorDraft?.text??draft?.pairs.map(p=>p.join('\t')).join('\n')??'';
 const importHint=node('p','Use a tab, colon, two or more spaces, spaced dash, pipe, semicolon or arrow. For a row needing review, put one tab between the two phrases.');importHint.className='note';editor.append(titleLabel,title,wordsLabel,importHint,words);
 const current=()=>parseVocabularyDraft({title:title.value.trim()||category.value||'Custom vocabulary',promptLanguage:prompt.value,language:target.value,text:words.value});
 const libraryPayload=()=>({...current(),metadata:{category:category.value,source:privateRecords.vocabulary?.payload.metadata.source||(category.value?'catalog':'custom')}});
 const parseStatus=node('div');parseStatus.className='status';parseStatus.setAttribute('role','status');
 const preview=node('section');preview.className='preview';preview.append(node('strong','WORD PREVIEW'),node('p','Press ▶ beside a word to hear it in its selected language. Voice availability depends on your browser and device.'));
 const previewSummary=node('p'),previewRows=node('div');previewSummary.className='small';preview.append(previewSummary,previewRows);
 function updatePreview(){const parsed=inspectVocabularyDraft(words.value);parseStatus.textContent=parsed.pairs.length+' valid pairs'+(parsed.errors.length?' · Review lines: '+parsed.errors.join(', '):'');parseStatus.className='status '+(parsed.errors.length?'bad':'ok');previewSummary.textContent=prompt.value+' → '+target.value+' · '+parsed.pairs.length+' pairs · at least 5 required to play/share';renderPairPreview(previewRows,parsed.rows,[prompt.value,target.value]);}
 function chooseCategory(){if(!category.value){title.value='';words.value='';updatePreview();return;}try{words.value=categoryPairs(catalog,category.value,prompt.value,target.value).map(p=>p.join('\t')).join('\n');title.value=category.value;notice.textContent='';}catch(e){notice.textContent=e.message;}updatePreview();}
 category.addEventListener('change',chooseCategory);for(const select of [prompt,target])select.addEventListener('change',()=>{if(category.value)chooseCategory();else updatePreview();});words.addEventListener('input',()=>{category.value='';updatePreview();});
 settings.append(button('TEST VOICE',()=>void voice.speak(inspectVocabularyDraft(words.value).pairs[0]?.[1]||({ 'en-US':'Hello','es-ES':'Hola','de-DE':'Hallo','da-DK':'Hej','fr-FR':'Bonjour','it-IT':'Ciao' }[target.value]),target.value)));
 const editing=node('div');editing.className='row';editing.append(button('CHECK IMPORT',updatePreview),button('CLEAR',()=>{category.value='';chooseCategory();}));editor.append(parseStatus,editing);
 const swap=button('⇄ SWAP LANGUAGES + COLUMNS',()=>{const parsed=inspectVocabularyDraft(words.value);if(parsed.errors.length){notice.textContent='Fix invalid rows before swapping.';return;}const p=prompt.value;prompt.value=target.value;target.value=p;words.value=parsed.pairs.map(([p,t])=>t+'\t'+p).join('\n');category.value='';updatePreview();});swap.className='swap';editor.append(swap);grid.append(settings,editor);workspace.append(grid);
 const actions=node('div');actions.className='actions';const sharing=node('div'),saving=node('div');sharing.className=saving.className='actionbox';
 const shareArea=node('div');shareArea.id='shared-link';shareArea.className='note';shareArea.setAttribute('role','status');
 const publish=button('STUDENT LINK',async()=>{let set;try{set=current();draft=set;}catch(e){notice.textContent=e.message;return;}publish.disabled=true;publish.textContent='SAVING SHARED SET…';notice.textContent='Publishing to staging…';try{const result=await savedStudentLink('vocabulary',libraryPayload)||await runtime.publishSet(set);if(epoch!==renderEpoch)return;const a=node('a',result.url);a.href=result.url;a.target='_blank';a.rel='noopener';shareArea.replaceChildren(a);try{await navigator.clipboard.writeText(result.url);publish.textContent='✓ LINK COPIED';notice.textContent='Student link created and copied.';}catch{publish.textContent='STUDENT LINK';notice.textContent='Student link created. Automatic copy unavailable; select the link below the button.';}}catch(e){if(epoch===renderEpoch)notice.textContent='Staging publication failed: '+e.message;}finally{publish.disabled=false;if(publish.textContent==='SAVING SHARED SET…')publish.textContent='STUDENT LINK';}});
 sharing.append(publish,node('p','Create a public student-practice snapshot in isolated staging storage.'),shareArea);
 saving.append(button('SAVE TO FOLDER',()=>{try{current();void saveToAccount('vocabulary',libraryPayload);}catch(e){notice.textContent=e.message;}}));
 saving.append(node('p','Save to your account. Its student link will show the latest saved version.'));actions.append(sharing,saving);workspace.append(actions,node('h3','CHOOSE YOUR GAME'));gameGrid(workspace,gameId=>{try{draft=current();launch(draft,null,gameId);}catch(e){notice.textContent=e.message;}});workspace.append(preview);
 if(!wordEditorDraft&&!draft&&category.value)chooseCategory();else updatePreview();
}

try{
 runtime=createVocabularyRuntime(configuration());
 await render();
 restoreAccountDraft();
}catch(error){notice.textContent='Staging initialization failed: '+error.message;}
window.addEventListener('hashchange',()=>void render());
window.addEventListener('pagehide',()=>{game?.destroy();voice.cancel();});



if(location.hash.startsWith('#verify-email=')){
 let code='';try{code=decodeURIComponent(location.hash.slice(14));}catch{}
 history.replaceState(null,'',location.pathname+location.search);
 void openAccountWindow('register',code.length<=20?code:'');code='';
}

