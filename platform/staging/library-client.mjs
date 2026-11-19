const messages={SIGN_IN_REQUIRED:'Sign in to use My Library. Your editor draft is still here.',SET_LIMIT_REACHED:'Your set limit has been reached. Free accounts can keep five saved sets.',REVISION_CONFLICT:'This item changed elsewhere. Reopen it from My Library before saving again. Your draft is still here.',IDEMPOTENCY_CONFLICT:'The previous save may have completed. Open My Library to check before creating another copy.',FOLDER_NAME_EXISTS:'A folder with this name already exists.',FOLDER_CHANGED:'The folder changed. Refresh the folder list and try again.',RATE_LIMITED:'Too many changes. Wait a minute and try again.',NOT_FOUND:'This item is no longer available in this account.',INVALID_SET:'Check the title, languages and set contents before saving.'};
export class LibraryError extends Error{constructor(code){super(messages[code]||'My Library is unavailable. Your editor draft is still here. Please try again.');this.code=code;}}
export function createLibraryClient({fetcher=fetch,timeout=12000}={}){
 let csrf=null;
 async function request(path,method='GET',body,key){
  if(!/^\/(?:context|folders|sets)(?:\/[a-f0-9-]+(?:\/restore)?)?(?:\?(?:deleted=[01]&)?offset=\d+|\?deleted=[01])?$/.test(path))throw new LibraryError('INVALID_REQUEST');
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
 return {context,folders:()=>request('/folders'),sets:(deleted=false,offset=0)=>request('/sets?deleted='+(deleted?'1':'0')+'&offset='+offset),get:id=>request('/sets/'+id),
  createFolder:name=>mutate('/folders','POST',{name}),renameFolder:(f,name)=>mutate('/folders/'+f.folder_id,'PATCH',{name,revision:f.revision}),deleteFolder:f=>mutate('/folders/'+f.folder_id,'DELETE',{revision:f.revision}),
  save:(payload,folder,record,key)=>record?mutate('/sets/'+record.set_id,'PATCH',{payload,folder_id:folder,revision:record.revision}):mutate('/sets','POST',{payload,folder_id:folder},key),
  move:(record,folder)=>mutate('/sets/'+record.set_id,'PATCH',{folder_id:folder,revision:record.revision}),remove:record=>mutate('/sets/'+record.set_id,'DELETE',{revision:record.revision}),restore:record=>mutate('/sets/'+record.set_id+'/restore','POST',{revision:record.revision}),reset(){csrf=null;}};
}
