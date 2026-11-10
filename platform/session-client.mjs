const PROTOCOL = 'bt-vocabulary-engine/1';
const STATES = new Set(['running','paused','ended','disposed']);
function validState(state) {
  return state && STATES.has(state.status) && typeof state.soundOn === 'boolean' &&
    ['score','lives','round','done'].every(key=>Number.isFinite(state[key]) && state[key]>=0);
}

// Uses a fully validated frozen runtime. Does not choose URLs or load content itself.
export function connectEngine({frame, settings, vocabulary, soundOn, voice,
  hostWindow = window, onState = () => {}, onMenu = () => {}, onError = () => {}}) {
  const entry=settings.engines[0], engineOrigin=new URL(entry.url).origin;
  const sessionId=hostWindow.crypto.randomUUID().replace(/-/g,'_');
  const pending=new Map();let sequence=0,closed=false,initializing=false,started=false;
  let resolveReady,rejectReady;
  const ready=new Promise((resolve,reject)=>{resolveReady=resolve;rejectReady=reject;});
  const timeout=hostWindow.setTimeout(()=>fail(new Error('ENGINE_HANDSHAKE_TIMEOUT')),12000);
  function detach() {
    hostWindow.clearTimeout(timeout);hostWindow.removeEventListener('message',receive);
    hostWindow.removeEventListener('blur',background);
    hostWindow.document.removeEventListener('visibilitychange',visibility);
    voice.cancel();
  }
  function close(reason=new Error('ENGINE_DISPOSED')) {
    if(closed)return;closed=true;detach();
    for(const command of pending.values()){hostWindow.clearTimeout(command.timer);command.reject(reason);}
    pending.clear();rejectReady(reason);frame.remove();
  }
  function fail(error) {if(closed)return;close(error);onError(error);}
  function command(type,payload={}) {
    if(closed)return Promise.reject(new Error('ENGINE_DISPOSED'));
    const requestId=String(++sequence);
    return new Promise((resolve,reject)=>{
      const timer=hostWindow.setTimeout(()=>fail(new Error('ENGINE_COMMAND_TIMEOUT')),12000);
      pending.set(requestId,{type,resolve,reject,timer});
      frame.contentWindow.postMessage({protocol:PROTOCOL,engineId:entry.id,sessionId,requestId,type,payload},engineOrigin);
    });
  }
  function background() {
    // Focusing the child frame is not leaving the app.
    if(!hostWindow.document.hidden && hostWindow.document.activeElement===frame && hostWindow.document.hasFocus())return;
    voice.cancel();
    if(started&&!closed)void command('PAUSE').then(state=>onState(state)).catch(fail);
  }
  function visibility() {if(hostWindow.document.hidden)background();}
  async function initialize() {
    try {
      await command('INIT',{vocabulary,soundOn,shellControls:true});
      const state=await command('START');
      if(closed)return;
      started=true;hostWindow.clearTimeout(timeout);onState(state);frame.focus();resolveReady(state);
    } catch(error){fail(error);}
  }
  function receive(event) {
    if(closed||event.source!==frame.contentWindow||event.origin!==engineOrigin)return;
    const m=event.data;
    if(!m||m.protocol!==PROTOCOL||m.engineId!==entry.id)return;
    if(m.type==='READY'){
      if(!initializing&&m.payload?.buildId===entry.buildId){initializing=true;void initialize();}
      return;
    }
    if(m.sessionId!==sessionId||!m.payload||typeof m.payload!=='object')return;
    if(m.requestId){
      const item=pending.get(m.requestId);if(!item)return;
      if(m.type==='ERROR'){
        pending.delete(m.requestId);hostWindow.clearTimeout(item.timer);item.reject(new Error('ENGINE_REJECTED_COMMAND'));return;
      }
      const expected=item.type==='INIT'?'INITIALIZED':'ACK';
      if(m.type!==expected||!validState(m.payload.state))return;
      pending.delete(m.requestId);hostWindow.clearTimeout(item.timer);item.resolve(m.payload.state);return;
    }
    if(m.type==='CANCEL_SPEECH'){voice.cancel();return;}
    if(m.type==='STATE'&&validState(m.payload)){onState(m.payload);return;}
    if(m.type==='REQUEST_MENU'){voice.cancel();onMenu();return;}
    if(m.type==='SPEAK'&&started&&soundOn&&typeof m.payload.text==='string'&&
        vocabulary.pairs.some(pair=>pair[1]===m.payload.text)){
      // Ignore a supplied locale: the validated session snapshot owns pronunciation direction.
      void voice.speak(m.payload.text,vocabulary.language);
    }
  }
  hostWindow.addEventListener('message',receive);
  hostWindow.addEventListener('blur',background);
  hostWindow.document.addEventListener('visibilitychange',visibility);
  return Object.freeze({ready,
    async pause(paused){voice.cancel();const state=await command(paused?'PAUSE':'RESUME');onState(state);if(!paused)frame.focus();return state;},
    async restart(){voice.cancel();const state=await command('RESTART');onState(state);frame.focus();return state;},
    async setSound(value){if(typeof value!=='boolean')throw new Error('INVALID_SOUND');voice.cancel();const state=await command('SET_SOUND',{soundOn:value});soundOn=state.soundOn;onState(state);frame.focus();return state;},
    async dispose(){if(closed)return;voice.cancel();try{await command('DISPOSE');}finally{close();}},
    destroy:close
  });
}
