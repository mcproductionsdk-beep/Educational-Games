// Same-origin staging transport. No tokens in browser storage, CORS or public proxy.
const origin='https://feature-accounts-ui.bt-vocabulary-platform-staging.pages.dev';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname.startsWith('/lesson-author/')){
   const action=url.pathname.slice('/lesson-author/'.length);
   const poll=/^jobs\/[a-f0-9]{64}$/.test(action);
   if(url.origin!==origin||url.search||!(poll||['draft','record','image','exam','questions','voice-sample'].includes(action)))return new Response(null,{status:404,headers});
   if(request.method!==(poll?'GET':'POST')||request.headers.get('Sec-Fetch-Site')!=='same-origin'||!poll&&request.headers.get('Origin')!==origin)return new Response(null,{status:403,headers});
   try{
    const read=path=>env.ACCOUNTS_SERVICE.fetch(new Request(origin+path,{headers:{Cookie:request.headers.get('Cookie')||'','Sec-Fetch-Site':'same-origin',Accept:'application/json'}}));
    const [me,context]=await Promise.all([read('/me'),read('/library/context')]);
    if(me.status===401||context.status===401)return Response.json({error:'signinRequired'},{status:401,headers});
    if(!me.ok||!context.ok)throw Error();
    const {account_id}=await me.json(),{plan}=await context.json();
    if(plan!=='premium')return Response.json({error:'premiumRequired'},{status:403,headers});
    const studio='https://feature-lesson-staging-20261.bt-lessons-staging.pages.dev';
    return await env.LESSON_AUTHOR.fetch(new Request(studio+'/api/author/'+action,{method:request.method,headers:{Origin:studio,'Content-Type':'application/json','X-Lesson-Account':account_id},...(poll?{}:{body:request.body,duplex:'half'})}));
   }catch{return Response.json({error:'aiUnavailable'},{status:503,headers});}
  }
  if(url.pathname.startsWith('/billing/')){
   if(url.origin!==origin||url.search)return new Response('Not found',{status:404,headers});
   if(['/billing/test','/billing/test.mjs'].includes(url.pathname)){
    if(request.method!=='GET')return new Response('Method not allowed',{status:405,headers});
    // Pages canonicalizes .html asset URLs; request the extensionless asset internally.
    const path=url.pathname==='/billing/test'?'/billing-test':'/billing-test.mjs';
    return env.ASSETS.fetch(new Request(new URL(path,origin),request));
   }
   const webhook=url.pathname==='/billing/webhooks/mollie';
   const read=['/billing/context','/billing/status'].includes(url.pathname);
   if(!webhook&&!read&&!['/billing/checkout','/billing/refresh'].includes(url.pathname))return new Response('Not found',{status:404,headers});
   if(request.method!==(read?'GET':'POST'))return new Response('Method not allowed',{status:405,headers});
   if(!webhook&&(request.headers.get('Sec-Fetch-Site')!=='same-origin'||!read&&request.headers.get('Origin')!==origin))return new Response('Forbidden',{status:403,headers});
   try{
    if(!env.ACCOUNTS_SERVICE?.fetch)throw Error();
    // The public webhook carries no browser authority or caller-controlled destination.
    const forwarded=webhook?new Request(url.href,{method:'POST',headers:{'Content-Type':request.headers.get('Content-Type')||''},body:request.body,duplex:'half'}):request;
    const response=await env.ACCOUNTS_SERVICE.fetch(forwarded),safe=new Headers(headers);
    safe.set('Content-Type',response.headers.get('Content-Type')||'application/json');
    safe.set('Content-Security-Policy',"default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
    return new Response(response.body,{status:response.status,headers:safe});
   }catch{return Response.json({error:'BILLING_UNAVAILABLE'},{status:503,headers});}
  }
  if(url.pathname.startsWith('/shared-sets/')&&url.pathname.endsWith('/attempt')){
   if(url.origin!==origin||url.search||!/^\/shared-sets\/[a-f0-9-]{36}\/attempt$/.test(url.pathname)||request.method!=='POST')return new Response('Not found',{status:404,headers});
   const forwarded=new Request(url.href,{method:'POST',headers:{'Content-Type':request.headers.get('Content-Type')||''},body:request.body,duplex:'half'});
   return env.ACCOUNTS_SERVICE.fetch(forwarded);
  }
  if(url.pathname.startsWith('/shared-sets/')){
   if(url.origin!==origin||!/^\/shared-sets\/[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(url.pathname)||url.search)return new Response('Not found',{status:404,headers});
   if(request.method!=='GET')return new Response('Method not allowed',{status:405,headers});
   try{if(!env.ACCOUNTS_SERVICE?.fetch)throw Error();const response=await env.ACCOUNTS_SERVICE.fetch(new Request(url.href,{method:'GET',headers:{Accept:'application/json'}}));
    const safe=new Headers(headers);safe.set('Content-Type','application/json');safe.set('Content-Security-Policy',"default-src 'none'; frame-ancestors 'none'; base-uri 'none'");return new Response(response.body,{status:response.status,headers:safe});
   }catch{return Response.json({error:'SHARED_SET_UNAVAILABLE'},{status:503,headers});}
  }
  const library=url.pathname==='/library'||url.pathname.startsWith('/library/');
  const auth=library||url.pathname==='/profile'||url.pathname==='/me'||url.pathname==='/auth'||url.pathname.startsWith('/auth/');
  if(!auth)return env.ASSETS.fetch(request);
  if(url.origin!==origin)return new Response('Not found',{status:404,headers});
  if(url.pathname==='/auth/register/restart'){
   if(url.search||request.method!=='POST'||request.headers.get('Origin')!==origin||
      request.headers.get('Sec-Fetch-Site')!=='same-origin'||request.headers.get('X-Registration-Action')!=='restart'){
    return new Response('Forbidden',{status:403,headers});
   }
   return new Response(null,{status:204,headers:{...headers,
    'Set-Cookie':'be_registration=; Path=/auth/register; Max-Age=0; HttpOnly; Secure; SameSite=Strict'}});
  }
  if(library){
   if(!/^\/library\/(?:context|folders|sets)(?:\/[a-f0-9-]{36}(?:\/(?:restore|share|results))?)?$/.test(url.pathname))return new Response('Not found',{status:404,headers});
   if(!['GET','POST','PATCH','DELETE'].includes(request.method))return new Response('Method not allowed',{status:405,headers});
   if(request.headers.get('Sec-Fetch-Site')!=='same-origin'||request.method!=='GET'&&request.headers.get('Origin')!==origin)return new Response('Forbidden',{status:403,headers});
  }
  if(!library&&!['/profile','/me','/auth/start','/auth/callback','/auth/logout','/auth/custom/context','/auth/custom/password','/auth/register/context','/auth/register/create','/auth/register/recover','/auth/register/verify','/auth/register/resend'].includes(url.pathname))return new Response('Not found',{status:404,headers});
  if((url.pathname==='/profile'&&request.method!=='GET'||['/auth/logout','/auth/custom/password','/auth/register/create','/auth/register/recover','/auth/register/verify','/auth/register/resend'].includes(url.pathname))&&(request.method!=='POST'||request.headers.get('Origin')!==origin))return new Response('Forbidden',{status:403,headers});
  if(!library&&!['/profile','/auth/logout','/auth/custom/password','/auth/register/create','/auth/register/recover','/auth/register/verify','/auth/register/resend'].includes(url.pathname)&&request.method!=='GET')return new Response('Method not allowed',{status:405,headers});
  try{
   if(!env.ACCOUNTS_SERVICE?.fetch)throw Error();
   // Preserve the actual URL, Origin and HttpOnly cookies; never trust forwarded headers.
   const response=await env.ACCOUNTS_SERVICE.fetch(request);
   const safe=new Headers(response.headers);
   safe.delete('Set-Cookie');for(const value of response.headers.getSetCookie())safe.append('Set-Cookie',value);
   for(const [key,value] of Object.entries(headers))safe.set(key,value);
   safe.set('Content-Security-Policy',"default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
   return new Response(response.body,{status:response.status,headers:safe});
  }catch{return new Response('Authentication unavailable',{status:503,headers});}
 }
};




