// Same-origin staging transport. No tokens in browser storage, CORS or public proxy.
const origin='https://feature-accounts-ui.bt-vocabulary-platform-staging.pages.dev';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  const auth=url.pathname==='/me'||url.pathname==='/auth'||url.pathname.startsWith('/auth/');
  if(!auth)return env.ASSETS.fetch(request);
  if(url.origin!==origin)return new Response('Not found',{status:404,headers});
  if(!['/me','/auth/start','/auth/register','/auth/callback','/auth/logout'].includes(url.pathname))return new Response('Not found',{status:404,headers});
  if(url.pathname==='/auth/logout'&&(request.method!=='POST'||request.headers.get('Origin')!==origin))return new Response('Forbidden',{status:403,headers});
  if(url.pathname!=='/auth/logout'&&request.method!=='GET')return new Response('Method not allowed',{status:405,headers});
  try{
   if(!env.ACCOUNTS_SERVICE?.fetch)throw Error();
   // Preserve the actual URL, Origin and HttpOnly cookies; never trust forwarded headers.
   const registering=url.pathname==='/auth/register';
   const target=registering?new Request(new URL('/auth/start',origin),request):request;
   const response=await env.ACCOUNTS_SERVICE.fetch(target);
   const safe=new Headers(response.headers);
   if(registering&&[302,303].includes(response.status)){
    const location=new URL(safe.get('Location'));
    if(location.origin!=='https://boringeducation-staging-iig2s7.eu1.zitadel.cloud'||location.pathname!=='/oauth/v2/authorize')throw Error();
    location.searchParams.set('prompt','create');
    safe.set('Location',location.href);
   }
   for(const [key,value] of Object.entries(headers))safe.set(key,value);
   safe.set('Content-Security-Policy',"default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
   return new Response(response.body,{status:response.status,headers:safe});
  }catch{return new Response('Authentication unavailable',{status:503,headers});}
 }
};
