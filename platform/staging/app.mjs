import {LOCALES} from '../content.mjs';
import {parseVocabularyDraft,catalogCategories,categoryPairs} from '../editor.mjs';
import {createVocabularyRuntime} from '../runtime.mjs';
import {mountGameplayShell} from '../shell.mjs';
import {createPronunciationService} from '../voice.mjs';
import engine from './engine-lock.json' with {type:'json'};

const BASE='bt-vocabulary-platform-staging.pages.dev';
const API='https://boringteacher-vocabulary-api-staging.mcproductionsdk.workers.dev';
const allowedHost=location.hostname===BASE||location.hostname.endsWith('.'+BASE);
const workspace=document.getElementById('workspace'),gameplay=document.getElementById('gameplay'),notice=document.getElementById('notice');
const label={ 'en-US':'English','es-ES':'Spanish','de-DE':'German','da-DK':'Danish','fr-FR':'French','it-IT':'Italian' };
let runtime,catalog,game,renderEpoch=0,draft=null;
const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
const button=(text,action)=>{const b=node('button',text);b.type='button';b.addEventListener('click',action);return b;};
const voice=createPronunciationService({onStatus:state=>{notice.textContent=state==='error'||state==='unavailable'?'Pronunciation unavailable on this device.':state==='requested'?'Pronunciation requested.':state==='started'?'Speaking…':'';}});
function configuration(){
 if(!allowedHost||location.protocol!=='https:'||engine.environment!=='staging')throw new Error('Unapproved staging deployment.');
 const config={schemaVersion:1,environment:'staging',configRevision:'staging-v1',registryRevision:'snake-v1',shellOrigin:location.origin,catalogUrl:location.origin+'/catalog.json',launcherUrl:location.origin+'/',sharingBaseUrl:API,sharingTimeoutMs:12000};
 const registry={schemaVersion:1,revision:'snake-v1',engines:[{id:'vocabulary-snake',family:'vocabulary',protocol:'bt-vocabulary-engine/1',minPairs:5,url:engine.url,buildId:engine.buildId}]};
 const policy={environment:'staging',shellOrigin:location.origin,engineBuilds:{[engine.url]:engine.buildId},approved:{catalogUrls:[config.catalogUrl],launcherUrls:[config.launcherUrl],sharingBaseUrls:[API],engineUrls:[engine.url]}};
 return{config,registry,policy};
}
function showWorkspace(){game?.destroy();game=null;gameplay.replaceChildren();gameplay.hidden=true;workspace.hidden=false;voice.cancel();notice.textContent='';}
function launch(set,id){
 showWorkspace();workspace.hidden=true;gameplay.hidden=false;
 game=mountGameplayShell({root:gameplay,...configuration(),set,shareId:id,context:id?'student':'creator',voice,
  navigate:url=>{const next=new URL(url);if(next.origin!==location.origin)throw new Error('Invalid staging return.');if(location.hash===next.hash)void render();else location.assign(next.href);},
  onCreatorReturn:()=>{showWorkspace();void render();}});
 const tools=node('div');tools.className='actions';tools.append(button('TEST VOICE',()=>game?.testVoice()));gameplay.append(tools);
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
   box.append(button('PLAY VOCABULARY SNAKE',()=>launch(set,id)));workspace.append(box);
  }catch{if(epoch===renderEpoch)notice.textContent='Shared staging vocabulary could not be loaded. Check the link and try again.';}
  return;
 }
 const grid=node('div');grid.className='workspace-grid';const settings=node('section'),editor=node('section');settings.className=editor.className='panel';
 settings.append(node('h2','GAME SETTINGS'));editor.append(node('h2','CUSTOMIZE / EDIT'));
 const prompt=selectField(settings,'prompt-language','PROMPT LANGUAGE',draft?.promptLanguage||'en-US'),target=selectField(settings,'target-language','TARGET LANGUAGE',draft?.language||'es-ES');
 const cl=node('label','CATEGORY');cl.htmlFor='category';const category=node('select');category.id='category';category.append(node('option','Custom vocabulary'));category.firstChild.value='';
 if(catalog)for(const name of catalogCategories(catalog)){const option=node('option',name);option.value=name;category.append(option);}
 settings.append(cl,category);
 const hint=node('p','Catalog translations are a development review candidate. This staging site is for testing, not classroom distribution.');hint.className='hint';settings.append(hint);
 const titleLabel=node('label','SET TITLE');titleLabel.htmlFor='set-title';const title=node('input');title.id='set-title';title.maxLength=100;title.value=draft?.title||'Staging vocabulary';
 const wordsLabel=node('label','PROMPT [TAB] ANSWER — ONE PAIR PER LINE');wordsLabel.htmlFor='pairs';const words=node('textarea');words.id='pairs';words.spellcheck=false;words.value=draft?.pairs.map(p=>p.join('\t')).join('\n')||'';
 editor.append(titleLabel,title,wordsLabel,words);
 const current=()=>parseVocabularyDraft({title:title.value,promptLanguage:prompt.value,language:target.value,text:words.value});
 function chooseCategory(){if(!category.value)return;try{words.value=categoryPairs(catalog,category.value,prompt.value,target.value).map(p=>p.join('\t')).join('\n');title.value=category.value;notice.textContent='';}catch(e){notice.textContent=e.message;}}
 category.addEventListener('change',chooseCategory);prompt.addEventListener('change',chooseCategory);target.addEventListener('change',chooseCategory);words.addEventListener('input',()=>{category.value='';});
 settings.append(button('TEST VOICE',()=>{try{const set=current();void voice.speak(set.pairs[0][1],set.language);}catch(e){notice.textContent=e.message;}}));
 const actions=node('div');actions.className='actions';
 actions.append(button('SWAP LANGUAGES + COLUMNS',()=>{try{const set=current();prompt.value=set.language;target.value=set.promptLanguage;words.value=set.pairs.map(([p,t])=>[t,p].join('\t')).join('\n');category.value='';}catch(e){notice.textContent=e.message;}}));
 const play=button('PLAY SNAKE',()=>{try{draft=current();launch(draft,null);}catch(e){notice.textContent=e.message;}});play.className='primary';actions.append(play);
 const shareArea=node('div');shareArea.id='shared-link';
 const publish=button('CREATE STAGING STUDENT LINK',async()=>{
  let set;try{set=current();draft=set;}catch(e){notice.textContent=e.message;return;}
  publish.disabled=true;notice.textContent='Publishing to staging…';
  try{const result=await runtime.publishSet(set);if(epoch!==renderEpoch)return;const a=node('a',result.url);a.href=result.url;a.target='_blank';a.rel='noopener';shareArea.replaceChildren(a,button('COPY LINK',async()=>{try{await navigator.clipboard.writeText(result.url);notice.textContent='Staging link copied.';}catch{notice.textContent='Copy the displayed staging link manually.';}}));notice.textContent='New staging snapshot published. Existing links keep their original content.';}
  catch(e){if(epoch===renderEpoch)notice.textContent='Staging publication failed: '+e.message;}
  finally{publish.disabled=false;}
 });actions.append(publish);editor.append(actions);grid.append(settings,editor);workspace.append(grid,shareArea);
}
try{
 runtime=createVocabularyRuntime(configuration());
 const response=await fetch(runtime.settings.catalogUrl,{cache:'no-store',redirect:'error',credentials:'omit'});
 if(!response.ok)throw new Error('Vocabulary catalog unavailable.');catalog=await response.json();catalogCategories(catalog);
 await render();
}catch(error){notice.textContent='Staging initialization failed: '+error.message;}
window.addEventListener('hashchange',()=>void render());
window.addEventListener('pagehide',()=>{game?.destroy();voice.cancel();});
