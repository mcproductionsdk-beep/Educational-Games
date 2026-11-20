// No account, price or paid-state authority is stored in the browser.
const status=document.querySelector('#billing-status'),start=document.querySelector('#billing-start'),refresh=document.querySelector('#billing-refresh');
let csrf='',busy=false;
const storageKey='bt-mollie-test-checkout-v1';
const message={SIGN_IN_REQUIRED:'Sign in to continue.',TEST_ACCOUNT_NOT_ENABLED:'This account is not enabled for the payment test.',TEST_BILLING_NOT_ENABLED:'Test checkout is not enabled yet.',CHECKOUT_ALREADY_PENDING:'A checkout is already pending. Check payment status before starting another.',CHECKOUT_RECONCILIATION_REQUIRED:'This checkout needs review before it can be retried.',BILLING_RATE_LIMITED:'Too many attempts. Try again shortly.'};
function render(value){
 if(value.mode!=='test'||value.offer!=='premium-test-hour-v1'||value.amount!=='1.00'||value.currency!=='EUR'||value.automatic_renewal!==false)throw Error('Unexpected test configuration.');
 status.textContent=value.premium_test_until?'Premium test access until '+new Date(value.premium_test_until).toLocaleString():value.payment?'Payment status: '+value.payment.status+'. Premium test access is not active.':'Ready for a simulated payment.';
 if(value.payment&&['paid','adjusted','failed','canceled','expired'].includes(value.payment.status))sessionStorage.removeItem(storageKey);
}
async function call(path,{body,key}={}){
 const response=await fetch('/billing/'+path,{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',redirect:'error',
  headers:body?{'Content-Type':'application/json','X-Billing-CSRF':csrf,...(key?{'Idempotency-Key':key}:{})}:{},...(body?{body:JSON.stringify(body)}:{})});
 const value=await response.json();if(!response.ok)throw Error(message[value.error]||'Payment verification is unavailable. Try again.');return value;
}
async function run(operation){if(busy)return;busy=true;start.disabled=refresh.disabled=true;
 try{await operation();}catch(e){status.textContent=e.message;}finally{busy=false;start.disabled=refresh.disabled=!csrf;}}
start.addEventListener('click',()=>run(async()=>{
 let key=sessionStorage.getItem(storageKey);if(!key){key=crypto.randomUUID();sessionStorage.setItem(storageKey,key);}
 const value=await call('checkout',{body:{offer:'premium-test-hour-v1'},key});render(value);
 if(value.checkout_url){const u=new URL(value.checkout_url);if(u.protocol!=='https:'||u.hostname!=='www.mollie.com'||u.username||u.password||u.port||!u.pathname.startsWith('/checkout/'))throw Error('Unexpected checkout destination.');location.assign(u.href);}
}));
refresh.addEventListener('click',()=>run(async()=>render(await call('refresh',{body:{}}))));
await run(async()=>{const value=await call('context');if(typeof value.csrf!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(value.csrf))throw Error('Secure checkout is unavailable.');render(value);csrf=value.csrf;});
