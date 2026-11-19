import test from 'node:test';
import assert from 'node:assert/strict';
import {createLibraryClient,LibraryError} from '../staging/library-client.mjs';
test('library client uses same-origin HttpOnly session transport and keeps retry keys stable',async()=>{
 const calls=[],client=createLibraryClient({fetcher:async(path,options)=>{calls.push({path,options});return Response.json(path.endsWith('context')?{csrf:'x'.repeat(43)}:{set_id:'saved'});}});
 const key='668f7475-8c19-45ed-b273-8b3a820c1e05';await client.save({title:'a'},null,null,key);await client.save({title:'a'},null,null,key);
 assert.equal(calls.length,3);for(const c of calls){assert.equal(c.options.credentials,'same-origin');assert.equal(c.options.cache,'no-store');assert.equal(c.options.redirect,'error');}
 assert.equal(calls[1].options.headers['X-Library-CSRF'],'x'.repeat(43));assert.equal(calls[2].options.headers['Idempotency-Key'],key);assert.equal(Object.hasOwn(JSON.parse(calls[1].options.body),'account_id'),false);
});
test('library client surfaces quota and conflict errors and refreshes CSRF after sign-out',async()=>{
 let mode='normal',contexts=0;const client=createLibraryClient({fetcher:async path=>{
  if(path.endsWith('context')){contexts++;return Response.json({csrf:'x'.repeat(43)});}
  return mode==='normal'?Response.json({folders:[]}):Response.json({error:mode},{status:mode==='SIGN_IN_REQUIRED'?401:409});
 }});
 await client.context();mode='SET_LIMIT_REACHED';await assert.rejects(()=>client.createFolder('x'),e=>e instanceof LibraryError&&/five/.test(e.message));
 mode='REVISION_CONFLICT';await assert.rejects(()=>client.remove({set_id:'668f7475-8c19-45ed-b273-8b3a820c1e05',revision:1}),e=>/draft is still here/.test(e.message));
 mode='SIGN_IN_REQUIRED';await assert.rejects(()=>client.folders());mode='normal';await client.createFolder('x');assert.equal(contexts,2);
});
test('malformed, oversized and interrupted responses fail closed',async()=>{
 for(const fetcher of [async()=>new Response('<html>bad</html>'),async()=>Response.json({csrf:'bad'}),async()=>{throw Error('network');}]){
  const client=createLibraryClient({fetcher});await assert.rejects(()=>client.context(),LibraryError);
 }
});


test('folder hierarchy and scoped searches use the authenticated library API',async()=>{
 const calls=[],client=createLibraryClient({fetcher:async(path,options)=>{calls.push({path,options});return Response.json(path.endsWith('context')?{csrf:'x'.repeat(43)}:{});}});
 const id='668f7475-8c19-45ed-b273-8b3a820c1e05',f={folder_id:id,revision:3};
 await client.createFolder('Child',id);assert.deepEqual(JSON.parse(calls.at(-1).options.body),{name:'Child',parent_folder_id:id});
 await client.moveFolder(f,null);assert.deepEqual(JSON.parse(calls.at(-1).options.body),{parent_folder_id:null,revision:3});
 await client.sets(false,50,{folder:id,search:'100% café & test'});let u=new URL(calls.at(-1).path,'https://example.test');assert.equal(u.searchParams.get('q'),'100% café & test');assert.equal(u.searchParams.get('folder_id'),id);assert.equal(u.searchParams.get('offset'),'50');
 await client.sets(false,0,{folder:null});u=new URL(calls.at(-1).path,'https://example.test');assert.equal(u.searchParams.get('folder_id'),'unfiled');
});
