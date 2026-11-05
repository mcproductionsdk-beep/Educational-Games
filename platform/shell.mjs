import { createVocabularyRuntime } from './runtime.mjs';
import { validateVocabulary } from './content.mjs';
import { createPronunciationService } from './voice.mjs';
import { connectEngine } from './session-client.mjs';

// The application supplies its already selected set or share ID; no second editor/catalog lives here.
export function mountGameplayShell({root,config,registry,policy,set,shareId,context='student',
  soundOn=true,onSoundChange=()=>{},fetchImpl,voice: suppliedVoice,navigate=url=>location.assign(url),onCreatorReturn}={}) {
  if(!root)throw new Error('MISSING_SHELL_ROOT');
  const doc=root.ownerDocument,hostWindow=doc.defaultView,events=new AbortController();
  let runtime,snapshot,client,frame,closed=false,initialized=false,busy=false;
  let state={status:'paused',soundOn},pauseIntent=null;
  const container=doc.createElement('section');container.className='bt-game-shell';
  const title=doc.createElement('h1');title.textContent=registry?.engines?.[0]?.id==='vocabulary-racer'?'VOCABULARY RACER':registry?.engines?.[0]?.id==='vocabulary-jumper'?'VOCABULARY JUMPER':'VOCABULARY SNAKE';
  const status=doc.createElement('p');status.className='bt-game-status';status.setAttribute('role','status');
  const speechStatus=doc.createElement('p');speechStatus.className='bt-speech-status';speechStatus.setAttribute('role','status');
  const recovery=doc.createElement('button');recovery.type='button';recovery.textContent='RETRY';recovery.hidden=true;recovery.className='bt-game-retry';recovery.addEventListener('click',()=>hostWindow.location.reload(),{signal:events.signal});
  const actions=doc.createElement('div');actions.className='bt-game-actions';
  const buttons={};
  for(const [key,label]of [['pause','PAUSE'],['restart','RESTART'],['menu','MAIN MENU'],['sound','SOUND ON']]){
    const button=doc.createElement('button');button.type='button';button.textContent=label;
    button.dataset.action=key;buttons[key]=button;actions.append(button);
  }
  container.append(title,actions,status,speechStatus,recovery);root.replaceChildren(container);
  const voice=suppliedVoice??createPronunciationService({onStatus:value=>{
    if(!closed)speechStatus.textContent=({requested:'Pronunciation requested',started:'Speaking',ended:'',
      error:'Pronunciation unavailable on this device',unavailable:'Pronunciation unavailable on this device'})[value]??'';
  }});
  function update(next){
    if(next.soundOn!==state.soundOn)onSoundChange(next.soundOn);state=next;buttons.pause.textContent=state.status==='paused'?'RESUME':'PAUSE';
    buttons.sound.textContent=state.soundOn?'SOUND ON':'SOUND OFF';
    for(const button of Object.values(buttons))button.disabled=!initialized||busy||closed;
    buttons.pause.disabled ||= state.status==='ended';
    status.textContent=state.status==='paused'?'Paused — resume when ready':state.status==='ended'?'Game over — restart or return to the menu':'';
    container.dataset.state=state.status;
  }
  function showError(error){
    if(closed)return;initialized=false;recovery.hidden=false;container.dataset.state='error';status.textContent='Unable to start game. '+error.message;
    for(const button of Object.values(buttons))button.disabled=true;
    buttons.menu.disabled=false;
    client?.destroy();frame?.remove();voice.cancel();
  }
  async function action(run){
    if(!initialized||busy||closed)return;busy=true;update(state);
    try{await run();}catch(error){showError(error);}finally{busy=false;if(initialized&&!closed)update(state);}
  }
  function destroy(){if(closed)return;closed=true;initialized=false;events.abort();voice.cancel();client?.destroy();frame?.remove();}
  async function returnToMenu(){
    if(closed)return;
    const url=new URL(runtime.settings.launcherUrl);
    if(context==='student')url.hash='set='+encodeURIComponent(shareId);
    try{await client?.dispose();}catch{ /* Frame removal is the local disposal fallback. */ }
    destroy();
    if(context==='creator')onCreatorReturn(snapshot);else navigate(url.href);
  }
  buttons.pause.addEventListener('pointerdown',()=>{pauseIntent=state.status!=='paused';},{signal:events.signal});
  buttons.pause.addEventListener('click',()=>{const desired=pauseIntent??state.status!=='paused';pauseIntent=null;void action(()=>client.pause(desired));},{signal:events.signal});
  buttons.pause.addEventListener('pointercancel',()=>{pauseIntent=null;},{signal:events.signal});
  buttons.restart.addEventListener('click',()=>void action(()=>client.restart()),{signal:events.signal});
  buttons.sound.addEventListener('click',()=>void action(()=>client.setSound(!state.soundOn)),{signal:events.signal});
  buttons.menu.addEventListener('click',()=>{if(initialized)void action(returnToMenu);else{destroy();if(context==='creator')onCreatorReturn?.(snapshot);else if(runtime)navigate(runtime.settings.launcherUrl+'#set='+encodeURIComponent(shareId));}} ,{signal:events.signal});
  update(state);status.textContent='Loading game…';
  const ready=(async()=>{
    try{
      // Validate all configuration/content before assigning an iframe URL.
      runtime=createVocabularyRuntime({config,registry,policy,fetchImpl});
      if(typeof soundOn!=='boolean'||!['student','creator'].includes(context))throw new Error('INVALID_LAUNCH_CONTEXT');
      if(context==='student'&&(typeof shareId!=='string'||!shareId.trim()||shareId.length>512))throw new Error('INVALID_SET_ID');
      if(context==='creator'&&typeof onCreatorReturn!=='function')throw new Error('MISSING_CREATOR_RETURN');
      snapshot=set?validateVocabulary(set):await runtime.loadSet(shareId);
      if(closed)return{ok:false,error:'CANCELLED'};
      frame=doc.createElement('iframe');frame.title='Vocabulary game playfield';frame.className='bt-engine-frame';
      frame.setAttribute('allow','fullscreen');
      const entry=runtime.settings.engines[0];
      // Append a blank frame first so contentWindow exists before the message listener is installed.
      container.append(frame);
      client=connectEngine({frame,settings:runtime.settings,vocabulary:snapshot,soundOn,voice,hostWindow,
        onState:next=>{if(!closed)update(next);},onMenu:()=>void action(returnToMenu),onError:showError});
      frame.src=entry.url;
      await client.ready;
      if(closed)return{ok:false,error:'CANCELLED'};
      initialized=true;update(state);return{ok:true};
    }catch(error){showError(error);return{ok:false,error:error.message};}
  })();
  return Object.freeze({ready,destroy,
    testVoice(){
      if(!initialized||closed||!snapshot)return Promise.resolve({status:'unavailable'});
      if(!state.soundOn)return Promise.resolve({status:'muted'});
      return voice.speak(snapshot.pairs[0][1],snapshot.language);
    }
  });
}
