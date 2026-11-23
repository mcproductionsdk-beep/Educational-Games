import {createLibraryClient} from './library-client.mjs';
const editor='https://feature-lesson-staging-20261.bt-lessons-staging.pages.dev';
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
export async function saveApprovedLesson(params,client){
 const key=params.get('key'),title=params.get('title'),snapshot=params.get('snapshot');
 if(!uuid.test(key)||!title?.trim()||title.length>100||!/^#v2\.[A-Za-z0-9_-]{1,22000}$/.test(snapshot))throw Error();
 const payload={family:'lesson',schemaVersion:1,title,snapshot};
 if(!params.has('set'))return client.save(payload,null,null,key);
 const set=params.get('set'),revision=Number(params.get('revision'));
 if(!uuid.test(set)||!Number.isSafeInteger(revision)||revision<1)throw Error();
 const current=await client.get(set);
 if(current.family!=='lesson'||current.deleted_at!==null)throw Error();
 if(current.payload.snapshot===snapshot&&current.title===title)return current;
 if(current.revision!==revision)throw Object.assign(Error(),{code:'REVISION_CONFLICT'});
 return client.save(payload,current.folder_id,current);
}
async function run(){
 const params=new URLSearchParams(location.hash.slice(1));
 history.replaceState(null,'',location.pathname);
 if(window.top!==window||!document.referrer.startsWith(editor+'/')||!uuid.test(params.get('nonce'))){
  document.querySelector('p').textContent='Open Generate lesson in the staging lesson editor to save a lesson.';return;
 }
 const reply=new URLSearchParams({lessonSave:params.get('nonce')});
 try{
  const r=await saveApprovedLesson(params,createLibraryClient());
  if(!uuid.test(r.set_id)||!uuid.test(r.share_id)||!Number.isSafeInteger(r.revision))throw Error();
  reply.set('set',r.set_id);reply.set('share',r.share_id);reply.set('revision',String(r.revision));
 }catch(e){
  reply.set('error',e.code||'UNAVAILABLE');
 }
 location.replace(editor+'/#'+reply.toString());
}
if(typeof document!=='undefined'&&location.pathname==='/platform/staging/save-lesson.html')void run();
