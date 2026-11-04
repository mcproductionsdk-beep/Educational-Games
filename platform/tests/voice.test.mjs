import test from 'node:test';
import assert from 'node:assert/strict';
import {createPronunciationService} from '../voice.mjs';
function fixture(voices=[]){const calls=[],statuses=[];const synth={getVoices:()=>voices,cancel(){calls.push('cancel')},speak(u){calls.push(u)}};const voice=createPronunciationService({synth,utteranceFactory:text=>({text}),onStatus:s=>statuses.push(s)});return{voice,calls,statuses};}
test('exact locale precedes base language, normalized separators and case',async()=>{
 const f=fixture([{lang:'es-MX'},{lang:'ES_es'}]);const p=f.voice.speak('árbol','es-ES'),u=f.calls.at(-1);
 assert.equal(u.voice.lang,'ES_es');assert.equal(u.lang,'es-ES');u.onstart();u.onend();assert.equal((await p).status,'ended');assert.deepEqual(f.statuses,['requested','started','ended']);
});
test('base language fallback and empty enumeration still request native speech',async()=>{
 for(const voices of [[{lang:'da_NO'}],[]]){const f=fixture(voices),p=f.voice.speak('træ','da-DK'),u=f.calls.at(-1);assert.equal(u.lang,'da-DK');if(voices.length)assert.equal(u.voice.lang,'da_NO');else assert.equal(u.voice,undefined);u.onend();await p;}
});
test('mute/navigation cancellation settles previous request and ignores late callbacks',async()=>{
 const f=fixture(),p=f.voice.speak('Hund','de-DE'),u=f.calls.at(-1);f.voice.cancel();u.onend();assert.equal((await p).status,'cancelled');assert.equal(f.statuses.includes('ended'),false);
});
test('speech errors and unavailable browser remain honest',async()=>{
 const f=fixture(),p=f.voice.speak('gato','es-ES');f.calls.at(-1).onerror({error:'not-allowed'});assert.equal((await p).status,'error');
 const voice=createPronunciationService({synth:null});assert.equal((await voice.speak('gato','es-ES')).status,'unavailable');
});
