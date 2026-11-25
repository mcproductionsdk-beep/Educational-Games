import {authenticate} from './page-navigation.mjs';
import {mountProfile} from './custom-login/profile.mjs';

const plans=[
 {key:'free',name:'Free',monthly:0,yearly:0,features:['20 new saved sets per month','2 new set links per day','Manual set creation']},
 {key:'silver',name:'Silver',monthly:5,yearly:45,features:['50 saved sets in folders','10 new set links per day','AI language lessons']},
 {key:'golden',name:'Golden',monthly:10,yearly:90,features:['Unlimited saved sets','Unlimited new set links','Higher monthly AI lesson allowance']}
];
const names={free:'Free',premium:'Silver',ai_premium:'Golden'};
const $=id=>document.getElementById(id);
const create=(tag,text)=>{const el=document.createElement(tag);el.textContent=text;return el;};
function link(label,url){const a=create('a',label);a.href=url;a.className='plan-action';return a;}
function action(label,fn){const b=create('button',label);b.type='button';b.addEventListener('click',fn);return b;}
const accountPage=location.pathname.replace(/\/$/,'')==='/account';

let period=new URLSearchParams(location.search).get('interval')==='yearly'?'yearly':'monthly';
let context=null,state='loading',epoch=0,pilot=false,testUntil=null;
let silver=null,billingToken=null,submitting=false;
async function silverAction(operation,offer){
 if(submitting||!billingToken)return;
 submitting=true;
 const status=$('plans-status');status.textContent=operation==='checkout'?'Opening Mollie test checkout…':'Updating subscription…';
 try{
  const response=await fetch('/billing/silver/'+operation,{method:'POST',credentials:'same-origin',cache:'no-store',redirect:'error',
   headers:{'Content-Type':'application/json','X-Billing-CSRF':billingToken},body:JSON.stringify(offer?{offer}:{})});
  const result=await response.json();if(!response.ok)throw Error(result.error);
  if(result.checkout_url){
   const u=new URL(result.checkout_url);
   if(u.origin!=='https://www.mollie.com'||u.username||u.password||!u.pathname.startsWith('/checkout/'))throw Error();
   location.assign(u.href);return;
  }
  await refresh();
 }catch{status.textContent='Could not complete this request. Check My Account before trying again.';}
 finally{submitting=false;}
}
function showPrices(){
 $('cards').replaceChildren();
 for(const p of plans){
  const card=create('article','');card.className='plan-card';card.dataset.plan=p.key;
  const price=create('p','€'+p[period]);price.className='plan-price';
  const cadence=create('span',p.key==='free'?'Always free':period==='monthly'?'Billed monthly':'Billed yearly · save 25%');cadence.className='plan-period';
  const list=create('ul','');for(const feature of p.features)list.append(create('li',feature));
  const foot=create('footer','');
  const offer=p.key+'-'+period;
  const sameOffer=silver?.offer===offer;
  const pending=['creating','open','authorized','pending'].includes(silver?.state);
  const renewing=silver?.renewable&&silver.state!=='canceled';
  if(p.key!=='free'&&pilot){
   if(sameOffer&&(renewing||silver.until))foot.append(link('Manage subscription','/account'));
   else if(renewing||pending&&!sameOffer)foot.append(link('View current subscription','/account'));
   else foot.append(action('Subscribe · €'+p[period]+'/'+(period==='monthly'?'month':'year')+' (test)',()=>void silverAction('checkout',offer)));
  }else if(context&&names[context.plan]===p.name)foot.append(create('strong','Current plan'));
  else if(p.key==='free'&&state==='guest')foot.append(action('Create free account',()=>authenticate('register')));
  else if(p.key!=='free'&&state==='guest')foot.append(action('Sign in for '+p.name,()=>{try{sessionStorage.setItem('bt-plan-intent',offer);}catch{}void authenticate('signin');}));
  else if(p.key!=='free'&&state!=='loading')foot.append(create('small','Test checkout by invitation'));
  card.append(create('h2',p.name),price,cadence,list,foot);$('cards').append(card);
 }
 for(const key of ['monthly','yearly'])$(key).setAttribute('aria-pressed',String(key===period));
}
function subscriptionLabel(){return (silver?.offer||'silver-monthly').split('-').map((v,i)=>i?v:v[0].toUpperCase()+v.slice(1)).join(' ');}
function confirmRenewalCancellation(){
 if(submitting||document.getElementById('renewal-dialog'))return;
 const dialog=document.createElement('dialog');dialog.id='renewal-dialog';
 dialog.setAttribute('aria-labelledby','renewal-title');
 dialog.setAttribute('aria-describedby','renewal-description');
 const title=create('h2','Cancel automatic renewal?');title.id='renewal-title';
 const through=silver?.until?new Date(silver.until).toLocaleDateString(undefined,{day:'numeric',month:'long',year:'numeric'}):null;
 const description=create('p',through?'Your '+subscriptionLabel()+' test access continues through '+through+'.':'Your test access continues through the current paid period.');
 description.id='renewal-description';
 const keep=action('Keep renewal on',()=>dialog.close());keep.autofocus=true;
 const cancel=action('Cancel renewal',()=>{
  dialog.close();
  void silverAction('cancel');
 });
 const actions=document.createElement('div');actions.className='renewal-actions';
 actions.append(keep,cancel);dialog.append(title,description,actions);
 dialog.addEventListener('close',()=>dialog.remove(),{once:true});
 $('overview').append(dialog);dialog.showModal();
}
function showAccount(){
 const box=$('details');box.replaceChildren();$('profile').hidden=!context;
 if(state==='guest'){box.append(create('p','Sign in to see your plan and usage.'),action('Sign in',()=>authenticate('signin')));return;}
 if(!context)return;
 const panel=create('section','');panel.className='account-panel';
 panel.append(create('h2',names[context.plan]+' plan'));
 if(silver?.state){
  const canCancel=['active','pending','suspended'].includes(silver.state)&&silver.renewable;
  if(silver.until)panel.append(create('p',subscriptionLabel()+' test access through '+new Date(silver.until).toLocaleDateString()+'.'));
  panel.append(create('p',silver.state==='canceled'?'Automatic renewal canceled.':'Test subscription status · '+silver.state));
  if(canCancel)panel.append(action('Cancel automatic renewal',confirmRenewalCancellation));
  else if(!silver.renewable&&!['failed','expired','canceled'].includes(silver.state))panel.append(action('Check payment status',()=>void silverAction('refresh')));
 }
 if(testUntil)panel.append(create('p','Simulated access ends '+new Date(testUntil).toLocaleString()+'.'));
 if(context.limit_kind==='monthly_creation'&&Number.isInteger(context.limit)){
  const used=context.monthly_created,limit=context.limit;
  panel.append(create('p',used+' of '+limit+' new sets used this month'));
  const meter=document.createElement('progress');meter.max=limit;meter.value=Math.min(used,limit);meter.setAttribute('aria-label','Monthly new sets used');panel.append(meter);
  const [year,month]=context.month.split('-').map(Number);
  const reset=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(Date.UTC(year,month,1));
  panel.append(create('p','Allowance resets '+reset+' at 00:00 UTC.'));
 }
 panel.append(create('p','Sets in your library: '+context.saved_count));
 panel.append(create('p',context.plan==='free'?'AI lesson generation requires a paid plan.':'Monthly AI lesson credits are being calibrated on staging.'));
 panel.append(link(context.plan==='ai_premium'?'View plans':'Compare plans','/pricing'));box.append(panel);
}
function draw(){
 document.title=(accountPage?'My account':'Pricing')+' · Boring Teacher';
 $('prices').hidden=accountPage;$('overview').hidden=!accountPage;
 if(accountPage)showAccount();else showPrices();
}
let refreshing=false;
let renderedAccount='';
async function refresh(){
 const request=++epoch;
 refreshing=true;
 if(state==='loading')$('plans-status').textContent='Checking account…';
 try{
  const opts={credentials:'same-origin',cache:'no-store',redirect:'error'};
  const res=await fetch('/library/context',opts);
  if(request!==epoch)return;
  let nextContext=null,data=null;
  if(res.status!==401){
   if(!res.ok)throw Error();
   nextContext=await res.json();
   if(!Object.hasOwn(names,nextContext.plan)||!/^\d{4}-(0[1-9]|1[0-2])$/.test(nextContext.month))throw Error();
   if(request!==epoch)return;
   const billing=await fetch('/billing/context',opts).catch(()=>null);
   if(billing?.ok)data=await billing.json();
   if(billing?.status===401)nextContext=null;
  }
  if(request!==epoch)return;
  context=nextContext;state=context?'signed':'guest';
  silver=data?.silver??null;billingToken=data?.csrf??null;
  pilot=data?.mode==='test'&&Boolean(silver&&billingToken);
  testUntil=pilot?data.premium_test_until:null;
  const snapshot=JSON.stringify([state,context,silver,pilot,testUntil]);
  $('plans-status').textContent='';
  if(snapshot!==renderedAccount){renderedAccount=snapshot;draw();}
  if(!accountPage&&state==='signed'){
   let selected;try{selected=sessionStorage.getItem('bt-plan-intent');sessionStorage.removeItem('bt-plan-intent');}catch{}
   for(const p of plans)if(selected===p.key+'-'+period&&pilot)document.querySelector('[data-plan='+p.key+'] footer button')?.focus();
  }
 }catch{if(request!==epoch)return;renderedAccount='';state='error';context=null;silver=null;billingToken=null;pilot=false;testUntil=null;$('plans-status').replaceChildren(create('span','Account details are unavailable. '),action('Retry',refresh));draw();}
 finally{if(request===epoch)refreshing=false;}
}
for(const key of ['monthly','yearly'])$(key).addEventListener('click',()=>{
 period=key;history.replaceState(null,'','/pricing?interval='+key);showPrices();
});
$('profile').addEventListener('click',()=>void mountProfile({onSaved:refresh}));
function refreshOnReturn(){
 if(!refreshing&&!submitting&&!document.hidden&&!document.querySelector('dialog[open]'))void refresh();
}
window.addEventListener('pageshow',refreshOnReturn);
window.addEventListener('focus',refreshOnReturn);
draw();


