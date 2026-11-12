import assert from 'node:assert/strict';
import {inspectSentences,validateSentenceSet,saveSentenceDraft,readSentenceDrafts,validateSavedSentenceDraft,SENTENCE_DRAFT_KEY,sentenceRequest} from '../platform/staging/sentence.mjs';
const targets={'es-ES':['Como pan.','Bebo agua.'],'de-DE':['Ich esse Brot.','Ich trinke Wasser.'],'da-DK':['Jeg spiser brød.','Jeg drikker vand.'],'fr-FR':['Je mange du pain.','Je bois de l’eau.'],'it-IT':['Mangio pane.','Bevo acqua.']};
for(const [language,words] of Object.entries(targets))for(const order of ['english-first','target-first']){
 const pairs=[['I eat bread.',words[0]],['I drink water.',words[1]]];
 const editor=pairs.map(p=>(order==='target-first'?[...p].reverse():p).join('\t')).join('\n');
 assert.deepEqual(inspectSentences(editor,order).pairs,pairs);
 const storage=new Map([['bt-word-sets-v1','untouched']]);storage.getItem=storage.get.bind(storage);storage.setItem=storage.set.bind(storage);
 const set={title:'Unicode · '+language,language,pairs};saveSentenceDraft(storage,set,'Class A',order);
 const [saved]=readSentenceDrafts(storage);assert.deepEqual(validateSavedSentenceDraft(saved),{...set,columnOrder:order});
 assert.equal(storage.get('bt-word-sets-v1'),'untouched');assert.equal(saved.folder,'Class A');
 const original=storage.get(SENTENCE_DRAFT_KEY);assert.throws(()=>saveSentenceDraft(storage,set,' ',order));assert.equal(storage.get(SENTENCE_DRAFT_KEY),original);
 let request;const originalFetch=globalThis.fetch;
 try{globalThis.fetch=async(url,options)=>{request={url,options};return {ok:true,json:async()=>({id:'SABCDEFGH'})}};
  assert.equal(await sentenceRequest(null,validateSentenceSet({...set,pairs:inspectSentences(editor,order).pairs})),'SABCDEFGH');
  assert.ok(request.url.startsWith('https://boringteacher-sentences-api-staging.'));
  assert.deepEqual(JSON.parse(request.options.body).pairs,pairs.map(p=>[...p].reverse()));
  globalThis.fetch=async()=>({ok:true,json:async()=>({set:{...set,id:'SABCDEFGH',pairs:pairs.map(p=>[...p].reverse())}})});
  assert.deepEqual(await sentenceRequest('SABCDEFGH'),set);
 }finally{globalThis.fetch=originalFetch}
}
for(const value of ['broken JSON','{}','null']){
 const storage={getItem:()=>value,setItem(){throw Error('must not overwrite corrupted data')}};
 assert.throws(()=>saveSentenceDraft(storage,{title:'Test',language:'es-ES',pairs:[['A','Uno'],['B','Dos']]},'Folder','english-first'));
}
assert.throws(()=>validateSavedSentenceDraft({schemaVersion:1,family:'word',columnOrder:'english-first'}));
assert.throws(()=>inspectSentences('One|Uno','unknown'));
assert.deepEqual(inspectSentences('Uno|One\ninvalid','target-first').errors,[2]);
console.log('Sentence menu contracts passed: five locales, both editor orders, local persistence, corruption protection and API orientation');
