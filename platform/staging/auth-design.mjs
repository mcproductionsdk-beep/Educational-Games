// Explicit visual review route. Never collects credentials or pretends authentication works.
const mode=new URL(location.href).searchParams.get('account-design');
if(['signin','register','recovery'].includes(mode)){
 const dialog=document.createElement('dialog');dialog.className='auth-design';dialog.setAttribute('aria-labelledby','auth-design-heading');
 dialog.innerHTML=`<button type="button" class="auth-close" aria-label="Close account design preview">Close ×</button><p class="design-tag">DESIGN PREVIEW</p><img src="./platform/staging/assets/boring-teacher-logo.webp" alt="Boring Teacher"><h2 id="auth-design-heading"></h2><div class="auth-fields"></div><button type="button" class="auth-submit" disabled></button><div class="auth-links"><button type="button" data-screen="recovery">Forgot password?</button><button type="button" data-screen="register">Create account</button><button type="button" data-screen="signin">Sign in</button></div><p class="design-note">This preview does not accept login details. In-page authentication is awaiting the provider connection.</p><a class="secure-link" href="/auth/start">Use working sign-in</a>`;
 function screen(value){
  dialog.querySelector('h2').textContent=value==='register'?'Create your account':value==='recovery'?'Reset your password':'Sign in to Boring Teacher';
  const fields=dialog.querySelector('.auth-fields');fields.replaceChildren();
  const entries=value==='register'?[['Username','Choose a username'],['Email','you@example.com'],['Password','Create a password']]:value==='recovery'?[['Email','you@example.com']]:[['Email or username','Enter your email or username'],['Password','Enter your password']];
  for(const [label,placeholder] of entries){const l=document.createElement('label');l.textContent=label;const i=document.createElement('input');i.disabled=true;i.placeholder=placeholder;i.type=label==='Password'?'password':'text';l.append(i);fields.append(l);}
  dialog.querySelector('.auth-submit').textContent=value==='register'?'Create account':value==='recovery'?'Send reset link':'Sign in';
  dialog.querySelectorAll('[data-screen]').forEach(b=>b.hidden=b.dataset.screen===value);
 }
 dialog.querySelector('.auth-close').addEventListener('click',()=>dialog.close());
 dialog.querySelectorAll('[data-screen]').forEach(b=>b.addEventListener('click',()=>screen(b.dataset.screen)));
 dialog.querySelector('.secure-link').addEventListener('click',event=>{const link=document.querySelector('#account-controls .account-signin');if(link){event.preventDefault();link.click();}});
 document.body.append(dialog);screen(mode);dialog.showModal();
}
