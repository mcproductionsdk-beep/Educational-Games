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
test('registration uses normal OIDC flow while preserving state, PKCE and flow cookie',async()=>{
 let seen;
 const location='https://boringeducation-staging-iig2s7.eu1.zitadel.cloud/oauth/v2/authorize?client_id=fixture&state=state-fixture&nonce=nonce-fixture&code_challenge=pkce-fixture&prompt=login&max_age=0';
 const result=await gateway.fetch(new Request(site+'/auth/register'),{ACCOUNTS_SERVICE:{fetch(r){seen=r;return new Response(null,{status:302,headers:{Location:location,'Set-Cookie':'flow=fixture; HttpOnly; Secure; SameSite=Lax'}});}}});
 assert.equal(seen.url,site+'/auth/start');assert.equal(result.status,302);
 const redirect=new URL(result.headers.get('Location'));assert.equal(redirect.searchParams.get('prompt'),'create');
 for(const key of ['state','nonce','code_challenge','max_age','client_id'])assert.equal(redirect.searchParams.get(key),new URL(location).searchParams.get(key));
 assert.match(result.headers.get('Set-Cookie'),/HttpOnly/);
});
test('registration rejects unexpected provider redirects and non-GET requests',async()=>{
 assert.equal((await gateway.fetch(new Request(site+'/auth/register'),{ACCOUNTS_SERVICE:{fetch:()=>new Response(null,{status:302,headers:{Location:'https://evil.test/authorize'}})}})).status,503);
 assert.equal((await gateway.fetch(new Request(site+'/auth/register',{method:'POST'}),{})).status,405);
});
