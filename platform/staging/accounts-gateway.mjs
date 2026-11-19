// Same-origin staging transport. No tokens in browser storage, CORS or public proxy.
const origin='https://feature-accounts-ui.bt-vocabulary-platform-staging.pages.dev';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  const library=url.pathname==='/library'||url.pathname.startsWith('/library/');
  const auth=library||url.pathname==='/profile'||url.pathname==='/me'||url.pathname==='/auth'||url.pathname.startsWith('/auth/');
  if(!auth)return env.ASSETS.fetch(request);
  if(url.origin!==origin)return new Response('Not found',{status:404,headers});
  if(library){
   if(!/^\/library\/(?:context|folders|sets)(?:\/[a-f0-9-]{36}(?:\/restore)?)?$/.test(url.pathname))return new Response('Not found',{status:404,headers});
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


