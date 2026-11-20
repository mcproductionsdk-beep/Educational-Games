import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';

const site='https://feature-accounts-ui.bt-vocabulary-platform-staging.pages.dev';
const html=await readFile(new URL('../staging/billing-test.html',import.meta.url),'utf8');
const script=await readFile(new URL('../staging/billing-test.mjs',import.meta.url),'utf8');
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try{
 for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
  const context=await browser.newContext({viewport}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  let state='ready',creates=0,refreshes=0,createFailure=false;const seenKeys=[];
  const value=()=>({mode:'test',offer:'premium-test-hour-v1',amount:'1.00',currency:'EUR',automatic_renewal:false,premium_test_until:state==='paid'?Date.now()+3600000:null,payment:state==='ready'?null:{status:state,verified_at:1}});
  await page.route('**/*',async route=>{
   const r=route.request(),url=new URL(r.url());
   if(url.origin==='https://www.mollie.com')return route.fulfill({contentType:'text/html',body:'<h1>Simulated provider checkout</h1>'});
   assert.equal(url.origin,site);
   if(url.pathname==='/billing/test')return route.fulfill({contentType:'text/html',body:html});
   if(url.pathname==='/billing/test.mjs')return route.fulfill({contentType:'application/javascript',body:script});
   if(url.pathname==='/billing/context')return route.fulfill({contentType:'application/json',body:JSON.stringify({...value(),csrf:'c'.repeat(43)})});
   if(url.pathname==='/billing/checkout'){
    creates++;assert.deepEqual(r.postDataJSON(),{offer:'premium-test-hour-v1'});assert.equal(r.headers()['x-billing-csrf'],'c'.repeat(43));
    seenKeys.push(r.headers()['idempotency-key']);
    if(createFailure)return route.fulfill({status:503,contentType:'application/json',body:'{"error":"BILLING_UNAVAILABLE"}'});
    state='open';return route.fulfill({contentType:'application/json',body:JSON.stringify({...value(),checkout_url:'https://www.mollie.com/checkout/test/fixture'})});
   }
   if(url.pathname==='/billing/refresh'){
    refreshes++;assert.deepEqual(r.postDataJSON(),{});assert.equal(r.headers()['x-billing-csrf'],'c'.repeat(43));
    return route.fulfill({contentType:'application/json',body:JSON.stringify(value())});
   }
   throw Error('Unexpected browser request '+url.pathname);
  });
  await page.goto(site+'/billing/test');await page.getByText('Ready for a simulated payment.').waitFor();
  assert.match(await page.locator('main').innerText(),/No real money is charged/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  createFailure=true;await page.locator('#billing-start').click();await page.getByText('Payment verification is unavailable. Try again.').waitFor();
  createFailure=false;await page.locator('#billing-start').click();await page.waitForURL('https://www.mollie.com/checkout/test/fixture');
  assert.equal(creates,2);assert.equal(seenKeys[0],seenKeys[1]);
  await page.goto(site+'/billing/test');await page.getByText('Payment status: open.',{exact:false}).waitFor();
  assert.equal(await page.locator('#billing-status').innerText(),'Payment status: open. Premium test access is not active.');
  state='paid';await page.locator('#billing-refresh').click();await page.getByText('Premium test access until',{exact:false}).waitFor();assert.equal(refreshes,1);
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('bt-mollie-test-checkout-v1')),null);
  assert.deepEqual(errors,[]);await context.close();
 }
 // Unauthenticated and disabled states must never enable checkout.
 for(const error of ['SIGN_IN_REQUIRED','TEST_BILLING_NOT_ENABLED','TEST_ACCOUNT_NOT_ENABLED']){
  const page=await browser.newPage();
  await page.route('**/*',route=>{const path=new URL(route.request().url()).pathname;return route.fulfill(path==='/billing/test'?{contentType:'text/html',body:html}:path==='/billing/test.mjs'?{contentType:'application/javascript',body:script}:{status:403,contentType:'application/json',body:JSON.stringify({error})});});
  await page.goto(site+'/billing/test');await page.waitForFunction(()=>!document.querySelector('#billing-status').textContent.includes('Checking'));
  assert.equal(await page.locator('#billing-start').isDisabled(),true);await page.close();
 }
 console.log('Billing browser checks passed: desktop/mobile, retry key, provider return, verified status, disabled states.');
}finally{await browser.close();}
