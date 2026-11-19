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
