// Isolated staging login. Credentials are submitted only to the same-origin account service.
export async function mountCombinedLogin({host=document.body,fetcher=fetch,onClose=()=>{},onCreateAccount=()=>{},onVerifyEmail=()=>{}}={}){
 const doc=host.ownerDocument,dialog=doc.createElement('dialog');dialog.className='bt-login-window';dialog.setAttribute('aria-labelledby','bt-login-title');
 dialog.innerHTML=`<button class="bt-login-close" type="button" aria-label="Close sign-in">Close ×</button><h2 id="bt-login-title">Sign in to Boring Teacher</h2><form><label>Email or username<input name="loginName" autocomplete="username" maxlength="320" required></label><label for="bt-login-password">Password</label><div class="bt-login-password-row"><input id="bt-login-password" name="password" type="password" autocomplete="current-password" maxlength="4096" required><button class="bt-login-visibility" type="button" aria-controls="bt-login-password" aria-pressed="false">Show password</button></div><p class="bt-login-recovery"><a href="/auth/start" title="Enter your username, then choose Reset password">Forgot password?</a></p><button class="bt-login-submit" type="submit" disabled>Sign in</button></form><p class="bt-login-status" role="status" aria-live="polite">Preparing secure sign-in…</p><a href="/auth/start">Use existing sign-in</a><button class="bt-login-switch bt-login-verify" type="button">Continue email verification</button><button class="bt-login-switch bt-login-create" type="button">Create account</button>`;
 const form=dialog.querySelector('form'),submit=dialog.querySelector('[type=submit]'),status=dialog.querySelector('[role=status]'),password=form.elements.password;
 const visibility=dialog.querySelector('.bt-login-visibility');
 const hidePassword=()=>{password.type='password';visibility.textContent='Show password';visibility.setAttribute('aria-pressed','false');};
 visibility.addEventListener('click',()=>{const reveal=password.type==='password';password.type=reveal?'text':'password';visibility.textContent=reveal?'Hide password':'Show password';visibility.setAttribute('aria-pressed',String(reveal));});
 let csrf=null,disposed=false,busy=false;const abort=new AbortController();
 const close=()=>{if(disposed)return;password.value='';hidePassword();csrf=null;disposed=true;abort.abort();dialog.remove();onClose();};
 dialog.querySelector('.bt-login-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',close,{once:true});
 dialog.querySelector('.bt-login-create').addEventListener('click',()=>{close();onCreateAccount();});
 dialog.querySelector('.bt-login-verify').addEventListener('click',()=>{close();onVerifyEmail();});
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy||!csrf||!form.reportValidity())return;
  busy=true;submit.disabled=true;status.textContent='Signing in…';
  const body=JSON.stringify({loginName:form.elements.loginName.value,password:password.value});password.value='';hidePassword();
  try{
   const response=await fetcher('/auth/custom/password',{method:'POST',credentials:'same-origin',cache:'no-store',redirect:'error',signal:abort.signal,headers:{'Content-Type':'application/json','X-Login-CSRF':csrf},body});
   if(disposed)return;
   if(!response.ok)throw Error();const data=await response.json(),u=new URL(data.callbackUrl,doc.location.origin);
   if(u.origin!==doc.location.origin||u.pathname!=='/auth/callback'||u.hash||!u.searchParams.get('code')||!u.searchParams.get('state'))throw Error();
   doc.defaultView.location.assign(u.href);
  }catch{if(!disposed){status.textContent='Sign-in could not be completed. Check your details. If your email is not verified, choose Continue email verification.';password.focus();}}
  finally{busy=false;if(!disposed)submit.disabled=!csrf;}
 });
 host.append(dialog);dialog.showModal();
 try{
  const response=await fetcher('/auth/custom/context',{credentials:'same-origin',cache:'no-store',redirect:'error',signal:abort.signal});
  if(!response.ok)throw Error();const data=await response.json();
  if(disposed)return;
  if(typeof data.csrf!=='string'||data.csrf.length<32||data.csrf.length>128)throw Error();
  csrf=data.csrf;submit.disabled=false;status.textContent='';form.elements.loginName.focus();
 }catch{if(!disposed)status.textContent='Secure sign-in is unavailable. Use the existing sign-in below.';}
 return {close(){if(!disposed)dialog.close();}};
}

