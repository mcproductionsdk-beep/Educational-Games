const messages={SIGN_IN_REQUIRED:'Sign in to use My Library. Your editor draft is still here.',SET_LIMIT_REACHED:'You have used this month’s new-set allowance. You can still edit your saved sets.',REVISION_CONFLICT:'This item changed elsewhere. Reopen it from My Library before saving again. Your draft is still here.',IDEMPOTENCY_CONFLICT:'The previous save may have completed. Open My Library to check before creating another copy.',FOLDER_NAME_EXISTS:'A folder with this name already exists.',FOLDER_CHANGED:'The folder changed. Refresh the folder list and try again.',RATE_LIMITED:'Too many changes. Wait a minute and try again.',NOT_FOUND:'This item is no longer available in this account.',INVALID_SET:'Check the title, languages and set contents before saving.'};
messages.FOLDER_CYCLE='A folder cannot be moved inside itself or one of its subfolders.';
export class LibraryError extends Error{constructor(code){super(messages[code]||'My Library is unavailable. Your editor draft is still here. Please try again.');this.code=code;}}
export function createLibraryClient({fetcher=fetch,timeout=12000}={}){
 let csrf=null;
 async function request(path,method='GET',body,key){
  const url=new URL(path,'https://library.invalid');
  if(!/^\/(?:context|folders|sets)(?:\/[a-f0-9-]+(?:\/(?:restore|share))?)?$/.test(url.pathname)||url.origin!=='https://library.invalid'||url.hash||[...url.searchParams.keys()].some(k=>!['deleted','offset','folder_id','q'].includes(k)))throw new LibraryError('INVALID_REQUEST');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
  try{
   const r=await fetcher('/library'+path,{method,credentials:'same-origin',cache:'no-store',redirect:'error',signal:controller.signal,headers:{...(body!==undefined?{'Content-Type':'application/json','X-Library-CSRF':csrf||''}:{}),...(key?{'Idempotency-Key':key}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
   if(!r.headers.get('Content-Type')?.includes('application/json'))throw new LibraryError('LIBRARY_UNAVAILABLE');
   const raw=await r.text();if(raw.length>400000)throw new LibraryError('LIBRARY_UNAVAILABLE');
   const data=JSON.parse(raw);if(!r.ok){if(r.status===401)csrf=null;throw new LibraryError(data.error||'LIBRARY_UNAVAILABLE');}
   return data;
  }catch(e){if(e instanceof LibraryError)throw e;throw new LibraryError('LIBRARY_UNAVAILABLE');}finally{clearTimeout(timer);}
 }
 async function context(){const d=await request('/context');if(typeof d.csrf!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(d.csrf))throw new LibraryError('LIBRARY_UNAVAILABLE');csrf=d.csrf;return d;}
 async function mutate(path,method,body,key){if(!csrf)await context();return request(path,method,body,key);}
 return {context,folders:()=>request('/folders'),sets:(deleted=false,offset=0,{folder,search=''}={})=>{const q=new URLSearchParams({deleted:deleted?'1':'0',offset:String(offset)});if(folder!==undefined)q.set('folder_id',folder||'unfiled');if(search)q.set('q',search);return request('/sets?'+q);},get:id=>request('/sets/'+id),
  createFolder:(name,parent=null)=>mutate('/folders','POST',{name,parent_folder_id:parent}),renameFolder:(f,name)=>mutate('/folders/'+f.folder_id,'PATCH',{name,revision:f.revision}),moveFolder:(f,parent)=>mutate('/folders/'+f.folder_id,'PATCH',{parent_folder_id:parent,revision:f.revision}),deleteFolder:f=>mutate('/folders/'+f.folder_id,'DELETE',{revision:f.revision}),
  save:(payload,folder,record,key)=>record?mutate('/sets/'+record.set_id,'PATCH',{payload,folder_id:folder,revision:record.revision}):mutate('/sets','POST',{payload,folder_id:folder},key),
  share:record=>mutate('/sets/'+record.set_id+'/share','POST',{}),
  move:(record,folder)=>mutate('/sets/'+record.set_id,'PATCH',{folder_id:folder,revision:record.revision}),remove:record=>mutate('/sets/'+record.set_id,'DELETE',{revision:record.revision}),restore:record=>mutate('/sets/'+record.set_id+'/restore','POST',{revision:record.revision}),reset(){csrf=null;}};
}


const SHARE_ID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
export function libraryShareUrl(id,origin){
 if(!SHARE_ID.test(id)||origin!=='https://feature-accounts-ui.bt-vocabulary-platform-staging.pages.dev')throw new LibraryError('LIBRARY_UNAVAILABLE');
 return origin+'/#shared-set='+id;
}
export function sameLibraryPayload(a,b){
 const key=p=>{const m=p?.metadata||{};return [p?.family,p?.schemaVersion,p?.title,p?.promptLanguage,p?.language,p?.pairs,p?.family==='sentence'?[m.topic,m.columnOrder,m.source]:[m.category,m.source]];};
 return JSON.stringify(key(a))===JSON.stringify(key(b));
}
export async function loadLibraryShare(id,{fetcher=fetch}={}){
 if(!SHARE_ID.test(id))throw Error('This shared set link is invalid.');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 try{const response=await fetcher('/shared-sets/'+id,{credentials:'omit',cache:'no-store',redirect:'error',referrerPolicy:'no-referrer',signal:controller.signal});
  if(!response.ok||!response.headers.get('Content-Type')?.includes('application/json'))throw Error();const raw=await response.text();if(raw.length>400000)throw Error();const value=JSON.parse(raw).set;
  if(value?.family==='lesson' && value.schemaVersion===1 && typeof value.title==='string' && /^#v2\.[A-Za-z0-9_-]{1,22000}$/.test(value.snapshot) && Object.keys(value).every(k=>['family','title','schemaVersion','snapshot'].includes(k)))return value;
  if(!value||value.schemaVersion!==1||!['vocabulary','sentence'].includes(value.family)||Object.keys(value).some(k=>!['family','schemaVersion','title','promptLanguage','language','pairs'].includes(k)))throw Error();return value;
 }catch{throw Error('This shared set is unavailable. Check the link or try again.');}finally{clearTimeout(timer);}
}
