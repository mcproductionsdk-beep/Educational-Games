// Same-origin staging transport. No tokens in browser storage, CORS or public proxy.
const origin='https://feature-accounts-ui.bt-vocabulary-platform-staging.pages.dev';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  const auth=url.pathname==='/me'||url.pathname==='/auth'||url.pathname.startsWith('/auth/');
  if(!auth)return env.ASSETS.fetch(request);
  if(url.origin!==origin)return new Response('Not found',{status:404,headers});
  if(!['/me','/auth/start','/auth/callback','/auth/logout'].includes(url.pathname))return new Response('Not found',{status:404,headers});
  if(url.pathname==='/auth/logout'&&(request.method!=='POST'||request.headers.get('Origin')!==origin))return new Response('Forbidden',{status:403,headers});
  if(url.pathname!=='/auth/logout'&&request.method!=='GET')return new Response('Method not allowed',{status:405,headers});
  try{
   if(!env.ACCOUNTS_SERVICE?.fetch)throw Error();
   // Preserve the actual URL, Origin and HttpOnly cookies; never trust forwarded headers.
   const response=await env.ACCOUNTS_SERVICE.fetch(request);
   const safe=new Headers(response.headers);
   for(const [key,value] of Object.entries(headers))safe.set(key,value);
   safe.set('Content-Security-Policy',"default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
   return new Response(response.body,{status:response.status,headers:safe});
  }catch{return new Response('Authentication unavailable',{status:503,headers});}
 }
};
