import test from 'node:test';
import assert from 'node:assert/strict';
import {connectEngine} from '../session-client.mjs';
function fixture(){
 const events=new Map(),timers=new Map(),sent=[],states=[],spoken=[];let serial=0,removed=false;
 const frame={contentWindow:{postMessage:(m,o)=>sent.push({m,o})},remove:()=>removed=true,focus(){}};
 const doc={hidden:false,activeElement:frame,hasFocus:()=>true,addEventListener:(k,v)=>events.set(k,v),removeEventListener:k=>events.delete(k)};
 const hostWindow={document:doc,crypto:{randomUUID:()=> 'test-session'},setTimeout:fn=>{timers.set(++serial,fn);return serial},clearTimeout:id=>timers.delete(id),addEventListener:(k,v)=>events.set(k,v),removeEventListener:k=>events.delete(k)};
 const entry={id:'vocabulary-snake',url:'https://engine.invalid/sha/snake-game.html',buildId:'a'.repeat(40)};
 const voice={cancel(){},speak:(text,locale)=>{spoken.push({text,locale});return Promise.resolve({status:'ended'})}};
 const vocabulary={language:'es-ES',pairs:[['kat','gato']]};
 const client=connectEngine({frame,hostWindow,voice,vocabulary,settings:{engines:[entry]},soundOn:true,onState:s=>states.push(s)});
 const state={status:'running',soundOn:true,score:0,lives:3,round:1,done:0};
 function receive(m,extra={}){events.get('message')?.({source:frame.contentWindow,origin:'https://engine.invalid',data:{protocol:'bt-vocabulary-engine/1',engineId:entry.id,sessionId:'test_session',...m},...extra})}
 async function start(){receive({type:'READY',payload:{buildId:entry.buildId}});receive({type:'INITIALIZED',requestId:'1',payload:{state:{...state,status:'paused'}}});await Promise.resolve();receive({type:'ACK',requestId:'2',payload:{state}});await client.ready;}
 return{client,receive,start,state,doc,events,timers,sent,states,spoken,removed:()=>removed};
}
test('wrong window, origin, build and unsupported messages cannot initialize',async()=>{
 const f=fixture();const ready={type:'READY',payload:{buildId:'a'.repeat(40)}};
 f.receive(ready,{source:{}});f.receive(ready,{origin:'https://other.invalid'});f.receive({...ready,payload:{buildId:'b'.repeat(40)}});
 assert.equal(f.sent.length,0);const rejected=assert.rejects(f.client.ready,/ENGINE_HANDSHAKE_TIMEOUT/);f.timers.values().next().value();await rejected;assert.equal(f.removed(),true);
});
test('late/stale responses are ignored; pronunciation uses validated target locale',async()=>{
 const f=fixture();await f.start();const count=f.states.length;
 f.receive({type:'STATE',sessionId:'stale',payload:f.state});assert.equal(f.states.length,count);
 f.receive({type:'SPEAK',payload:{text:'gato',language:'de-DE'}});assert.deepEqual(f.spoken,[{text:'gato',locale:'es-ES'}]);
 f.receive({type:'SPEAK',payload:{text:'unbound'}});assert.equal(f.spoken.length,1);
 f.client.destroy();assert.equal(f.events.size,0);assert.equal(f.timers.size,0);
});
test('focusing the iframe is not a background pause, hidden documents do pause',async()=>{
 const f=fixture();await f.start();const count=f.sent.length;f.events.get('blur')();assert.equal(f.sent.length,count);
 f.doc.hidden=true;f.events.get('visibilitychange')();
 const last=f.sent.at(-1);assert.equal(last.m.type,'PAUSE');
 f.receive({type:'ACK',requestId:last.m.requestId,payload:{state:{...f.state,status:'paused'}}});await Promise.resolve();f.client.destroy();
});
