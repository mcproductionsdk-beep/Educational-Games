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
function showPrices(){
 $('cards').replaceChildren();
 for(const p of plans){
  const card=create('article','');card.className='plan-card';card.dataset.plan=p.key;
  const price=create('p','€'+p[period]);price.className='plan-price';
  const cadence=create('span',p.key==='free'?'Always free':period==='monthly'?'Billed monthly':'Billed yearly · save 25%');cadence.className='plan-period';
  const list=create('ul','');for(const feature of p.features)list.append(create('li',feature));
  const foot=create('footer','');
  if(context&&names[context.plan]===p.name){const label=create('strong','Current plan');label.className='plan-current';foot.append(label);}
  else if(p.key==='free'&&state==='guest')foot.append(action('Create free account',()=>authenticate('register')));
  else if(p.key==='silver'&&period==='monthly'&&state==='guest')foot.append(action('Sign in for Silver',()=>authenticate('signin')));
  else if(p.key==='silver'&&period==='monthly'&&context?.plan==='free'&&pilot)foot.append(link('Try €1 test checkout','/billing/test'));
  else if(p.key!=='free'&&state!=='loading')foot.append(create('small',p.key==='silver'&&period==='monthly'&&context?.plan==='free'?'Test checkout by invitation':'Checkout coming later'));
  card.append(create('h2',p.name),price,cadence,list,foot);$('cards').append(card);
 }
 for(const key of ['monthly','yearly'])$(key).setAttribute('aria-pressed',String(key===period));
}
function showAccount(){
 const box=$('details');box.replaceChildren();$('profile').hidden=!context;
 if(state==='guest'){box.append(create('p','Sign in to see your plan and usage.'),action('Sign in',()=>authenticate('signin')));return;}
 if(!context)return;
 const panel=create('section','');panel.className='account-panel';
 panel.append(create('h2',names[context.plan]+' plan'));
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
async function refresh(){
 const request=++epoch;context=null;pilot=false;testUntil=null;state='loading';$('plans-status').textContent='Checking account…';draw();
 try{
  const opts={credentials:'same-origin',cache:'no-store',redirect:'error'};
  const res=await fetch('/library/context',opts);if(request!==epoch)return;
  if(res.status===401){state='guest';}
  else{
   if(!res.ok)throw Error();const value=await res.json();if(request!==epoch)return;
   if(!Object.hasOwn(names,value.plan)||!/^\d{4}-(0[1-9]|1[0-2])$/.test(value.month))throw Error();
   context=value;state='signed';
   if((!accountPage&&value.plan==='free')||(accountPage&&value.plan==='premium')){
    const billing=await fetch('/billing/context',opts).catch(()=>null);
    if(request!==epoch)return;
    if(billing?.ok){const data=await billing.json();if(request!==epoch)return;pilot=data.mode==='test'&&data.offer==='premium-test-hour-v1';testUntil=pilot?data.premium_test_until:null;}
   }
  }
  $('plans-status').textContent='';draw();
 }catch{if(request!==epoch)return;state='error';context=null;$('plans-status').replaceChildren(create('span','Account details are unavailable. '),action('Retry',refresh));draw();}
}
for(const key of ['monthly','yearly'])$(key).addEventListener('click',()=>{
 period=key;history.replaceState(null,'','/pricing?interval='+key);showPrices();
});
$('profile').addEventListener('click',()=>void mountProfile({onSaved:refresh}));
window.addEventListener('pageshow',refresh);
window.addEventListener('focus',()=>{if(!document.querySelector('dialog[open]'))void refresh();});
draw();
