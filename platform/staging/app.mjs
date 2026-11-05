import {LOCALES} from '../content.mjs';
import {parseVocabularyDraft,inspectVocabularyDraft,catalogCategories,categoryPairs} from '../editor.mjs';
import {createVocabularyRuntime} from '../runtime.mjs';
import {mountGameplayShell} from '../shell.mjs';
import {createPronunciationService} from '../voice.mjs';
import engine from './engine-lock.json' with {type:'json'};

const BASE='bt-vocabulary-platform-staging.pages.dev';
const API='https://boringteacher-vocabulary-api-staging.mcproductionsdk.workers.dev';
const allowedHost=location.hostname===BASE||location.hostname.endsWith('.'+BASE);
const workspace=document.getElementById('workspace'),gameplay=document.getElementById('gameplay'),notice=document.getElementById('notice');
const label={ 'en-US':'English','es-ES':'Spanish','de-DE':'German','da-DK':'Danish','fr-FR':'French','it-IT':'Italian' };
let runtime,catalog,game,renderEpoch=0,draft=null,soundOn=true;
const games=[['vocabulary-snake','🐍','Word Snake'],['vocabulary-racer','🏎️','Vocabulary Racer'],['vocabulary-jumper','🏃','Vocabulary Jumper'],['vocabulary-invaders','👾','Word Invaders'],['vocabulary-frog','🐸','Word Frog'],['vocabulary-match','🔗','Word Match'],['vocabulary-eater','🟡','Word Eater'],['vocabulary-warehouse','📦','Word Warehouse']];
function gameGrid(parent,onPlay){const grid=node('div');grid.className='gamegrid';for(const [id,icon,name]of games){const b=button('',()=>onPlay(id));b.className='game';b.dataset.game=id;b.append(node('span',icon),node('small',name.toUpperCase()));if(!['vocabulary-snake','vocabulary-racer','vocabulary-jumper'].includes(id)){b.disabled=true;b.title='Not yet migrated to isolated staging';}grid.append(b);}parent.append(grid);}
async function loadCatalog(){if(catalog)return;const response=await fetch(runtime.settings.catalogUrl,{cache:'no-store',redirect:'error',credentials:'omit'});if(!response.ok)throw new Error('Vocabulary catalog unavailable.');const data=await response.json();catalogCategories(data);catalog=data;}

const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
const button=(text,action)=>{const b=node('button',text);b.type='button';b.addEventListener('click',action);return b;};
const voice=createPronunciationService({onStatus:state=>{notice.textContent=state==='error'||state==='unavailable'?'Pronunciation unavailable on this device.':state==='requested'?'Pronunciation requested.':state==='started'?'Speaking…':'';}});
const racerOrigin='https://72dd2d78.bt-vocabulary-racer-preview.pages.dev';
function configuration(gameId='vocabulary-snake'){
 const variant=matchMedia('(pointer: coarse) and (max-width: 760px) and (orientation: portrait)').matches?'mobile':'desktop';
 const selected=gameId==='vocabulary-racer'?{url:racerOrigin+'/engine-'+variant,buildId:'a4afaa1908445178c4b7559856161b8b05a14aa2'}:gameId==='vocabulary-jumper'?{url:'https://cbd5d3cd.bt-vocabulary-jumper-preview.pages.dev/engine',buildId:'f177ff7be1897bc89e29df69d08f09e9799b60dc'}:engine;
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
async function render(){
 const epoch=++renderEpoch;showWorkspace();workspace.replaceChildren();
 const hash=location.hash;
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
 const prompt=selectField(settings,'prompt-language','PROMPT LANGUAGE',draft?.promptLanguage||'en-US'),target=selectField(settings,'target-language','TARGET LANGUAGE',draft?.language||'es-ES');
 const cl=node('label','CATEGORY');cl.htmlFor='category';const category=node('select');category.id='category';
 if(catalog)for(const name of catalogCategories(catalog)){const option=node('option',name);option.value=name;category.append(option);}
 const custom=node('option','Custom vocabulary');custom.value='';category.append(custom);category.value=draft?'':catalog?'Animals':'';settings.append(cl,category);
 const hint=node('p',catalogError||'Selecting a built-in category loads editable word pairs. Choose Custom to paste your own.');hint.className='note';settings.append(hint);
 const titleLabel=node('label','SET TITLE');titleLabel.htmlFor='set-title';const title=node('input');title.id='set-title';title.maxLength=100;title.placeholder='Title this vocabulary set';title.value=draft?.title||'';
 const wordsLabel=node('label','PROMPT FIRST · TARGET SECOND');wordsLabel.htmlFor='pairs';const words=node('textarea');words.id='pairs';words.spellcheck=false;words.value=draft?.pairs.map(p=>p.join('\t')).join('\n')||'';
 const importHint=node('p','Use a tab, colon, two or more spaces, spaced dash, pipe, semicolon or arrow. For a row needing review, put one tab between the two phrases.');importHint.className='note';editor.append(titleLabel,title,wordsLabel,importHint,words);
 const current=()=>parseVocabularyDraft({title:title.value.trim()||category.value||'Custom vocabulary',promptLanguage:prompt.value,language:target.value,text:words.value});
 const parseStatus=node('div');parseStatus.className='status';parseStatus.setAttribute('role','status');
 const preview=node('section');preview.className='preview';preview.append(node('strong','WORD PREVIEW'),node('p','Press ▶ beside a word to hear it in its selected language. Voice availability depends on your browser and device.'));
 const previewSummary=node('p'),previewRows=node('div');previewSummary.className='small';preview.append(previewSummary,previewRows);
 function updatePreview(){const parsed=inspectVocabularyDraft(words.value);parseStatus.textContent=parsed.pairs.length+' valid pairs'+(parsed.errors.length?' · Review lines: '+parsed.errors.join(', '):'');parseStatus.className='status '+(parsed.errors.length?'bad':'ok');previewSummary.textContent=prompt.value+' → '+target.value+' · '+parsed.pairs.length+' pairs · at least 5 required to play/share';const table=node('table'),head=node('tr');for(const name of ['LINE','PROMPT','TARGET']){const th=node('th',name);th.scope='col';head.append(th);}table.append(head);for(const {number,raw,pair} of parsed.rows){const row=node('tr');row.append(node('td',String(number)));if(!pair){const review=node('td','Review this row: '+raw);review.colSpan=2;review.style.whiteSpace='pre-wrap';row.append(review);table.append(row);continue;}pair.forEach((value,index)=>{const cell=node('td'),wrap=node('div');wrap.className='word-cell';const speak=button('▶',()=>void voice.speak(value,index===0?prompt.value:target.value));speak.className='speak';speak.setAttribute('aria-label','Pronounce '+value);wrap.append(speak,node('span',value));cell.append(wrap);row.append(cell);});table.append(row);}previewRows.replaceChildren(table);}
 function chooseCategory(){if(!category.value){title.value='';words.value='';updatePreview();return;}try{words.value=categoryPairs(catalog,category.value,prompt.value,target.value).map(p=>p.join('\t')).join('\n');title.value=category.value;notice.textContent='';}catch(e){notice.textContent=e.message;}updatePreview();}
 category.addEventListener('change',chooseCategory);for(const select of [prompt,target])select.addEventListener('change',()=>{if(category.value)chooseCategory();else updatePreview();});words.addEventListener('input',()=>{category.value='';updatePreview();});
 settings.append(button('TEST VOICE',()=>void voice.speak(inspectVocabularyDraft(words.value).pairs[0]?.[1]||({ 'en-US':'Hello','es-ES':'Hola','de-DE':'Hallo','da-DK':'Hej','fr-FR':'Bonjour','it-IT':'Ciao' }[target.value]),target.value)));
 const editing=node('div');editing.className='row';editing.append(button('CHECK IMPORT',updatePreview),button('CLEAR',()=>{category.value='';chooseCategory();}));editor.append(parseStatus,editing);
 const swap=button('⇄ SWAP LANGUAGES + COLUMNS',()=>{const parsed=inspectVocabularyDraft(words.value);if(parsed.errors.length){notice.textContent='Fix invalid rows before swapping.';return;}const p=prompt.value;prompt.value=target.value;target.value=p;words.value=parsed.pairs.map(([p,t])=>t+'\t'+p).join('\n');category.value='';updatePreview();});swap.className='swap';editor.append(swap);grid.append(settings,editor);workspace.append(grid);
 const actions=node('div');actions.className='actions';const sharing=node('div'),saving=node('div');sharing.className=saving.className='actionbox';
 const shareArea=node('div');shareArea.id='shared-link';shareArea.className='note';shareArea.setAttribute('role','status');
 const publish=button('STUDENT LINK',async()=>{let set;try{set=current();draft=set;}catch(e){notice.textContent=e.message;return;}publish.disabled=true;publish.textContent='SAVING SHARED SET…';notice.textContent='Publishing to staging…';try{const result=await runtime.publishSet(set);if(epoch!==renderEpoch)return;const a=node('a',result.url);a.href=result.url;a.target='_blank';a.rel='noopener';shareArea.replaceChildren(a);try{await navigator.clipboard.writeText(result.url);publish.textContent='✓ LINK COPIED';notice.textContent='Student link created and copied.';}catch{publish.textContent='STUDENT LINK';notice.textContent='Student link created. Automatic copy unavailable; select the link below the button.';}}catch(e){if(epoch===renderEpoch)notice.textContent='Staging publication failed: '+e.message;}finally{publish.disabled=false;if(publish.textContent==='SAVING SHARED SET…')publish.textContent='STUDENT LINK';}});
 sharing.append(publish,node('p','Create a public student-practice snapshot in isolated staging storage.'),shareArea);
 const dialog=node('dialog');dialog.className='dialog';dialog.setAttribute('aria-label','Save to folder');
 saving.append(button('SAVE TO FOLDER',()=>{let set;try{set=current();}catch(e){notice.textContent=e.message;return;}dialog.replaceChildren(node('h3','SAVE TO FOLDER'),node('p','Local prototype only: this browser and staging site. No account or cloud sync.'));
 const folderLabel=node('label','FOLDER NAME'),folder=node('input');folder.id='local-folder';folderLabel.htmlFor=folder.id;folder.value='My Word Sets';const result=node('p');let saved=[];try{saved=JSON.parse(localStorage.getItem('bt-staging-word-sets-v1')||'[]');if(!Array.isArray(saved))saved=[];}catch{result.textContent='Local storage could not be read.';}
 dialog.append(folderLabel,folder,button('SAVE LOCALLY',()=>{if(!folder.value.trim())return;try{saved.push({...set,folder:folder.value.trim()});localStorage.setItem('bt-staging-word-sets-v1',JSON.stringify(saved));result.textContent='Saved on this device.';}catch{result.textContent='Local storage unavailable.';}}),result);
 for(const item of saved.slice(-8).reverse())dialog.append(button('LOAD · '+item.folder+' / '+item.title,()=>{try{draft=parseVocabularyDraft({...item,text:item.pairs.map(p=>p.join('\t')).join('\n')});dialog.close();void render();}catch{result.textContent='This saved set is invalid.';}}));dialog.append(button('CLOSE',()=>dialog.close()));dialog.showModal();}));saving.append(node('p','Save locally on this device for prototype testing. Cloud sync is not available.'));actions.append(sharing,saving);workspace.append(actions,dialog,node('h3','CHOOSE YOUR GAME'));gameGrid(workspace,gameId=>{try{draft=current();launch(draft,null,gameId);}catch(e){notice.textContent=e.message;}});workspace.append(preview);
 if(!draft&&category.value)chooseCategory();else updatePreview();
}

try{
 runtime=createVocabularyRuntime(configuration());
 await render();
}catch(error){notice.textContent='Staging initialization failed: '+error.message;}
window.addEventListener('hashchange',()=>void render());
window.addEventListener('pagehide',()=>{game?.destroy();voice.cancel();});
