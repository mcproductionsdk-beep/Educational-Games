import test from 'node:test';
import assert from 'node:assert/strict';
import gateway from '../staging/accounts-gateway.mjs';
const site='https://feature-accounts-ui.bt-vocabulary-platform-staging.pages.dev';
test('gateway preserves cookies, URL and origin through private binding without caching',async()=>{
 let seen;
 const env={ACCOUNTS_SERVICE:{async fetch(r){seen=r;return new Response(null,{status:204,headers:{'Set-Cookie':'be_session=; Max-Age=0; HttpOnly; Secure; SameSite=Lax'}});}}};
 const r=await gateway.fetch(new Request(site+'/auth/logout',{method:'POST',headers:{Origin:site,Cookie:'be_session=fixture'}}),env);
 assert.equal(r.status,204);assert.equal(seen.url,site+'/auth/logout');assert.equal(seen.headers.get('cookie'),'be_session=fixture');assert.equal(seen.headers.get('origin'),site);assert.equal(r.headers.get('cache-control'),'no-store');assert.match(r.headers.get('set-cookie'),/HttpOnly/);
});
test('gateway rejects cross-origin logout, unsupported origins and paths without service calls',async()=>{
 const env={ACCOUNTS_SERVICE:{fetch(){throw Error('must not run');}}};
 for(const r of [new Request(site+'/auth/logout',{method:'POST',headers:{Origin:'https://evil.test'}}),new Request(site+'/auth/logout'),new Request('https://evil.test/me'),new Request(site+'/auth/unknown')])assert.ok([403,404].includes((await gateway.fetch(r,env)).status));
});
test('missing or failing binding returns unavailable; guest assets remain accessible',async()=>{
 assert.equal((await gateway.fetch(new Request(site+'/me'),{})).status,503);
 assert.equal((await gateway.fetch(new Request(site+'/me'),{ACCOUNTS_SERVICE:{fetch(){throw Error();}}})).status,503);
 assert.equal(await (await gateway.fetch(new Request(site+'/'),{ASSETS:{fetch:()=>new Response('guest games')}})).text(),'guest games');
});


test('combined password transport rejects cross-site and preserves separate HttpOnly flow cookies',async()=>{
 const origin='https://feature-accounts-ui.bt-vocabulary-platform-staging.pages.dev';let calls=0;
 const env={ACCOUNTS_SERVICE:{fetch:async()=>{calls++;const h=new Headers();h.append('Set-Cookie','a=one; HttpOnly; Secure');h.append('Set-Cookie','b=two; HttpOnly; Secure');return new Response('{}',{headers:h});}}};
 const bad=await gateway.fetch(new Request(origin+'/auth/custom/password',{method:'POST',headers:{Origin:'https://evil.test'}}),env);assert.equal(bad.status,403);assert.equal(calls,0);
 const good=await gateway.fetch(new Request(origin+'/auth/custom/context'),env);assert.equal(good.status,200);assert.equal(good.headers.getSetCookie().length,2);
});

test('private library routes require same-origin browser requests and preserve session/CSRF headers',async()=>{
 let seen=null;const env={ACCOUNTS_SERVICE:{async fetch(r){seen=r;return Response.json({sets:[]});}}};
 const id='668f7475-8c19-45ed-b273-8b3a820c1e05';
 for(const request of [new Request(site+'/library/sets'),new Request(site+'/library/sets/'+id,{method:'PATCH',headers:{'Sec-Fetch-Site':'same-origin',Origin:'https://evil.test'}}),new Request(site+'/library/admin',{headers:{'Sec-Fetch-Site':'same-origin'}})])assert.ok([403,404].includes((await gateway.fetch(request,env)).status));
 assert.equal(seen,null);
 const r=await gateway.fetch(new Request(site+'/library/sets/'+id,{method:'PATCH',headers:{Origin:site,'Sec-Fetch-Site':'same-origin','X-Library-CSRF':'fixture','Content-Type':'application/json',Cookie:'be_session=synthetic'},body:'{"revision":1,"folder_id":null}'}),env);
 assert.equal(r.status,200);assert.equal(seen.method,'PATCH');assert.equal(seen.headers.get('X-Library-CSRF'),'fixture');assert.equal(seen.headers.get('Cookie'),'be_session=synthetic');assert.equal(r.headers.get('Cache-Control'),'no-store');
});


test('stable public shares are GET-only and strip credentials and response cookies',async()=>{
 const id='668f7475-8c19-45ed-b273-8b3a820c1e05';let seen,calls=0;const env={ACCOUNTS_SERVICE:{fetch:async r=>{seen=r;calls++;return Response.json({set:{title:'Public'}},{headers:{'Set-Cookie':'not-forwarded','X-Private':'no'}});}}};
 const r=await gateway.fetch(new Request(site+'/shared-sets/'+id,{headers:{Cookie:'be_session=secret',Authorization:'Bearer secret'}}),env);assert.equal(r.status,200);assert.equal(seen.headers.get('Cookie'),null);assert.equal(seen.headers.get('Authorization'),null);assert.equal(r.headers.get('Set-Cookie'),null);assert.equal(r.headers.get('X-Private'),null);assert.equal(r.headers.get('Cache-Control'),'no-store');
 for(const req of [new Request(site+'/shared-sets/'+id,{method:'POST'}),new Request(site+'/shared-sets/'+id+'?url=https://evil.test'),new Request('https://evil.test/shared-sets/'+id)])assert.ok([404,405].includes((await gateway.fetch(req,env)).status));assert.equal(calls,1);
});
test('ensuring a stable link is an authenticated CSRF-protected private operation',async()=>{
 const id='668f7475-8c19-45ed-b273-8b3a820c1e05';let seen;const env={ACCOUNTS_SERVICE:{fetch:async r=>{seen=r;return Response.json({share_id:id});}}};
 const result=await gateway.fetch(new Request(site+'/library/sets/'+id+'/share',{method:'POST',headers:{Origin:site,'Sec-Fetch-Site':'same-origin','X-Library-CSRF':'fixture',Cookie:'be_session=fixture','Content-Type':'application/json'},body:'{}'}),env);assert.equal(result.status,200);assert.equal(seen.headers.get('Cookie'),'be_session=fixture');
});

test('Mollie notification is a narrowly scoped public POST without cookies, authorization or response cookies',async()=>{
 let seen,calls=0;const env={ACCOUNTS_SERVICE:{fetch:async r=>{seen=r;calls++;return new Response('OK',{headers:{'Set-Cookie':'private','X-Internal':'private'}});}}};
 const r=await gateway.fetch(new Request(site+'/billing/webhooks/mollie',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',Cookie:'be_session=secret',Authorization:'Bearer secret','X-Forwarded-Host':'evil.test','X-Account-Id':'forged'},body:'id=tr_fixture'}),env);
 assert.equal(r.status,200);assert.equal(await seen.text(),'id=tr_fixture');assert.equal(seen.headers.get('Content-Type'),'application/x-www-form-urlencoded');
 for(const h of ['Cookie','Authorization','X-Forwarded-Host','X-Account-Id'])assert.equal(seen.headers.get(h),null);
 assert.equal(r.headers.get('Set-Cookie'),null);assert.equal(r.headers.get('X-Internal'),null);assert.equal(r.headers.get('Cache-Control'),'no-store');
 for(const request of [new Request(site+'/billing/webhooks/mollie'),new Request(site+'/billing/webhooks/mollie?url=https://evil.test',{method:'POST'}),new Request(site+'/billing/webhooks/other',{method:'POST'})])assert.ok([404,405].includes((await gateway.fetch(request,env)).status));assert.equal(calls,1);
});
test('private billing endpoints retain same-origin restrictions and forward session plus CSRF to backend',async()=>{
 let seen,calls=0;const env={ACCOUNTS_SERVICE:{fetch:async r=>{seen=r;calls++;return Response.json({mode:'test'});}}};
 for(const r of [new Request(site+'/billing/status'),new Request(site+'/billing/checkout',{method:'POST',headers:{'Sec-Fetch-Site':'same-origin',Origin:'https://evil.test'}}),new Request('https://boringteacher.com/billing/status')])assert.ok([403,404].includes((await gateway.fetch(r,env)).status));assert.equal(calls,0);
 const r=await gateway.fetch(new Request(site+'/billing/checkout',{method:'POST',headers:{'Sec-Fetch-Site':'same-origin',Origin:site,Cookie:'be_session=fixture','X-Billing-CSRF':'fixture','Content-Type':'application/json'},body:'{}'}),env);
 assert.equal(r.status,200);assert.equal(seen.headers.get('Cookie'),'be_session=fixture');assert.equal(seen.headers.get('X-Billing-CSRF'),'fixture');
});
test('test page and script resolve only to fixed static assets without granting backend authority',async()=>{
 const seen=[],env={ASSETS:{fetch:async r=>{seen.push(r.url);return new Response('synthetic asset');}}};
 for(const path of ['/billing/test','/billing/test.mjs'])assert.equal((await gateway.fetch(new Request(site+path),env)).status,200);
 assert.deepEqual(seen,[site+'/billing-test',site+'/billing-test.mjs']);
 assert.equal((await gateway.fetch(new Request(site+'/billing/test',{method:'POST'}),env)).status,405);
});

test('Lesson Lab accepts both paid plans and blocks free and unknown plans',async()=>{
 for(const [plan,allowed] of [['premium',true],['ai_premium',true],['free',false],['unknown',false]]){
  let calls=0;
  const env={
   ACCOUNTS_SERVICE:{fetch:r=>Response.json(new URL(r.url).pathname==='/me'?{account_id:'teacher'}:{plan})},
   LESSON_AUTHOR:{fetch:r=>{calls++;assert.equal(r.headers.get('X-Lesson-Account'),'teacher');return new Response(null,{status:202});}}
  };
  const req=new Request(site+'/lesson-author/draft',{method:'POST',headers:{Origin:site,'Sec-Fetch-Site':'same-origin'},body:'{}'});
  const res=await gateway.fetch(req,env);
  assert.equal(res.status,allowed?202:403,plan);
  assert.equal(calls,allowed?1:0,plan);
 }
});
