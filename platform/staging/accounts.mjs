// Account state is verified by same-origin /me. Never infer authentication from storage.
export function mountAccounts({root,fetcher=fetch,host=window,beforeSignIn=()=>{},openSignIn=null,openRegistration=null,openProfile=null,afterLogout=null,openLibrary=null,onStateChange=()=>{}}){
 let disposed=false,epoch=0,activeAccount=null;
 const doc=root.ownerDocument;
 const status=doc.createElement('span');status.setAttribute('role','status');
 const signIn=doc.createElement('a');signIn.textContent='Sign in';signIn.href='/auth/start';
 const createAccount=doc.createElement('button');createAccount.type='button';createAccount.textContent='Create account';createAccount.className='account-create';
 createAccount.addEventListener('click',()=>{try{beforeSignIn();void openRegistration?.();}catch{status.textContent='Unable to preserve your draft. Registration cancelled.';}});
 const logout=doc.createElement('button');logout.type='button';logout.textContent='Log out';logout.hidden=true;
 const retry=doc.createElement('button');retry.type='button';retry.textContent='Retry';retry.hidden=true;
 const library=doc.createElement('button');library.type='button';library.textContent='My Library';library.hidden=true;library.addEventListener('click',()=>void openLibrary?.());
 const plans=doc.createElement('a');plans.href='/pricing';plans.textContent='View plans';
 const account=doc.createElement('a');account.href='/account';account.textContent='My account';account.hidden=true;
 for(const link of [plans,account])link.addEventListener('click',()=>beforeSignIn());
 const home=doc.createElement('a');home.href='/';home.textContent='Home';
 const tabs=doc.createElement('nav');tabs.setAttribute('aria-label','Site navigation');
 for(const item of [home,account,plans])if(host.location?.pathname===item.getAttribute('href')&&!host.location.hash)item.setAttribute('aria-current','page');
 const menu=doc.createElement('details');
 const toggle=doc.createElement('summary');toggle.textContent='Account';
 const options=doc.createElement('div');options.className='account-options';
 options.append(status,account,plans,signIn,createAccount,logout,retry);
 menu.append(toggle,options);
 tabs.append(home,library,menu);
 tabs.addEventListener('click',event=>{if(event.target!==toggle)menu.open=false;});
 tabs.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.open){menu.open=false;toggle.focus();}});
 root.replaceChildren(tabs);
 function view(text,{signed=false,unavailable=false}={}){
  status.textContent=text;account.hidden=!signed;signIn.hidden=signed||unavailable;createAccount.hidden=signed||unavailable;library.hidden=!openLibrary;library.disabled=!signed;logout.hidden=!signed;retry.hidden=!unavailable;onStateChange({signed,unavailable,accountId:signed?activeAccount:null});
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
   if(current===epoch&&!disposed){activeAccount=value.account_id;view('Signed in',{signed:true});
   }
   try{const pr=await fetcher('/profile',{credentials:'same-origin',cache:'no-store',redirect:'manual',signal:abort.signal});if(pr.status===401){if(current===epoch&&!disposed)view('Guest');return;}if(pr.status===200){const text=await pr.text();if(text.length>1024)throw Error();const p=JSON.parse(text);if(typeof p.display_name==='string'&&Array.from(p.display_name).length<=80&&current===epoch&&!disposed)view('Signed in · '+p.display_name,{signed:true});}}catch{}
  }catch{if(current===epoch&&!disposed)view('Account service unavailable',{unavailable:true});}
  finally{host.clearTimeout(timer);}
 }
 signIn.addEventListener('click',event=>{try{beforeSignIn();if(openSignIn&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey){event.preventDefault();void openSignIn();}}catch{event.preventDefault();status.textContent='Unable to preserve your draft. Sign-in cancelled.';}});
 logout.addEventListener('click',async()=>{
  ++epoch;logout.disabled=true;retry.hidden=true;status.textContent='Signing out…';
  const abort=new AbortController(),timer=host.setTimeout(()=>abort.abort(),8000);
  try{const r=await fetcher('/auth/logout',{method:'POST',credentials:'same-origin',cache:'no-store',redirect:'manual',signal:abort.signal});
   if(r.status!==204&&r.status!==401)throw Error();view('Guest');afterLogout?.();
  }catch{view('Sign-out could not be confirmed',{unavailable:true});}
  finally{host.clearTimeout(timer);logout.disabled=false;}
 });
 retry.addEventListener('click',()=>void refresh());
 const resume=()=>{if(!doc.hidden)void refresh();};
 host.addEventListener('focus',resume);host.addEventListener('pageshow',resume);doc.addEventListener('visibilitychange',resume);
 void refresh();
 return {refresh,destroy(){disposed=true;++epoch;host.removeEventListener('focus',resume);host.removeEventListener('pageshow',resume);doc.removeEventListener('visibilitychange',resume);}};
}


