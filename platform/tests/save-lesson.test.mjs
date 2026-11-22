import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {saveApprovedLesson} from '../staging/save-lesson.mjs';
const params=()=>new URLSearchParams({key:randomUUID(),nonce:randomUUID(),snapshot:'#v2.YWJj',title:'El mercado'});
test('new lesson requests the default folder and reuses its retry key',async()=>{
 const p=params(),calls=[],client={save:(...args)=>calls.push(args)};
 await saveApprovedLesson(p,client);await saveApprovedLesson(p,client);
 assert.deepEqual(calls[0],calls[1]);assert.equal(calls[0][1],null);assert.equal(calls[0][3],p.get('key'));
});
test('existing lesson retains folder, skips identical retries and detects conflicting edits',async()=>{
 const p=params(),set=randomUUID();p.set('set',set);p.set('revision','2');
 const row={family:'lesson',set_id:set,title:'Earlier',folder_id:randomUUID(),revision:2,deleted_at:null,payload:{snapshot:'#v2.YQ'}};
 const client={get:async()=>row,save:(payload,folder,record)=>{assert.equal(folder,row.folder_id);assert.equal(record,row);return {...row,payload,title:payload.title,revision:3};}};
 Object.assign(row,await saveApprovedLesson(p,client));assert.equal(await saveApprovedLesson(p,client),row);
 p.set('title','Another title');await assert.rejects(saveApprovedLesson(p,client),{code:'REVISION_CONFLICT'});
});
