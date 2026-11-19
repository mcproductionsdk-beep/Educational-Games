// Account state is verified by same-origin /me. Never infer authentication from storage.
export function mountAccounts({root,fetcher=fetch,host=window,beforeSignIn=()=>{},openSignIn=null}){
 let disposed=false,epoch=0;
 const doc=root.ownerDocument;
 const status=doc.createElement('span');status.setAttribute('role','status');
 const signIn=doc.createElement('a');signIn.textContent='Sign in';signIn.href='/auth/start';
 const logout=doc.createElement('button');logout.type='button';logout.textContent='Log out';logout.hidden=true;
 const retry=doc.createElement('button');retry.type='button';retry.textContent='Retry';retry.hidden=true;
 root.replaceChildren(status,signIn,logout,retry);
 function view(text,{signed=false,unavailable=false}={}){
  status.textContent=text;signIn.hidden=signed||unavailable;logout.hidden=!signed;retry.hidden=!unavailable;
 }
 async function refresh(){
  const current=++epoch;view('Checking account…',{unavailable:true});retry.hidden=true;
  const abort=new AbortController(),timer=host.setTimeout(()=>abort.abort(),8000);
  try{
   const r=await fetcher('/me',{credentials:'same-origin',cache:'no-store',redirect:'manual',signal:abort.signal});
   if(current!==epoch||disposed)return;
   if(r.status===401){view('Guest');return;}
   if(r.status!==200||!r.headers.get('content-type')?.includes('application/json'))throw Error();
   const text=await r.text();if(text.length>1024)throw Error();const value=JSON.parse(text);
   if(typeof value.account_id!=='string'||!/^[a-f0-9]{8}-[a-f0-9-]{27}$/.test(value.account_id))throw Error();
   if(current===epoch&&!disposed)view('Signed in · Account '+value.account_id.slice(0,8),{signed:true});
  }catch{if(current===epoch&&!disposed)view('Account service unavailable',{unavailable:true});}
  finally{host.clearTimeout(timer);}
 }
 signIn.addEventListener('click',event=>{try{beforeSignIn();if(openSignIn&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey){event.preventDefault();void openSignIn();}}catch{event.preventDefault();status.textContent='Unable to preserve your draft. Sign-in cancelled.';}});
 logout.addEventListener('click',async()=>{
  ++epoch;logout.disabled=true;retry.hidden=true;status.textContent='Signing out…';
  const abort=new AbortController(),timer=host.setTimeout(()=>abort.abort(),8000);
  try{const r=await fetcher('/auth/logout',{method:'POST',credentials:'same-origin',cache:'no-store',redirect:'manual',signal:abort.signal});
   if(r.status!==204&&r.status!==401)throw Error();view('Guest');
  }catch{view('Sign-out could not be confirmed',{unavailable:true});}
  finally{host.clearTimeout(timer);logout.disabled=false;}
 });
 retry.addEventListener('click',()=>void refresh());
 const resume=()=>{if(!doc.hidden)void refresh();};
 host.addEventListener('focus',resume);host.addEventListener('pageshow',resume);doc.addEventListener('visibilitychange',resume);
 void refresh();
 return {refresh,destroy(){disposed=true;++epoch;host.removeEventListener('focus',resume);host.removeEventListener('pageshow',resume);doc.removeEventListener('visibilitychange',resume);}};
}

