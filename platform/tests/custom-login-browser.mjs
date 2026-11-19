import {createServer} from 'node:http';import {readFile} from 'node:fs/promises';import assert from 'node:assert/strict';import {chromium} from 'playwright-core';
let submissions=0;
const server=createServer(async(req,res)=>{
 if(req.url==='/auth/custom/context'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({csrf:'x'.repeat(43)}));return;}
 if(req.url==='/auth/custom/password'){submissions++;res.statusCode=401;res.end('{}');return;}
 if(req.url==='/me'){res.statusCode=401;res.end();return;}
 const files={'/accounts.mjs':'../staging/accounts.mjs','/custom-login/window.mjs':'../staging/custom-login/window.mjs','/window.css':'../staging/custom-login/window.css'};
 if(files[req.url]){res.setHeader('Content-Type',req.url.endsWith('.css')?'text/css':'text/javascript');res.end(await readFile(new URL(files[req.url],import.meta.url)));return;}
 res.setHeader('Content-Type','text/html');res.end(`<link rel="stylesheet" href="/window.css"><div id="account"></div><textarea id="draft">unsaved words</textarea><script type="module">import {mountAccounts} from '/accounts.mjs';import {mountCombinedLogin} from '/custom-login/window.mjs';mountAccounts({root:document.getElementById('account'),openSignIn:()=>mountCombinedLogin()});</script>`);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try{for(const viewport of [{width:1280,height:800},{width:390,height:740}]){
 const p=await browser.newPage({viewport});await p.goto('http://127.0.0.1:'+server.address().port);await p.getByRole('link',{name:'Sign in',exact:true}).click();
 const d=p.getByRole('dialog');await d.getByRole('button',{name:'Sign in',exact:true}).waitFor();await p.waitForFunction(()=>!document.querySelector('.bt-login-submit').disabled);
 assert.equal(await d.getByLabel('Email or username').isVisible(),true);assert.equal(await d.getByLabel('Password',{exact:true}).isVisible(),true);
 const bounds=await d.boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=viewport.width);assert.ok(bounds.height<=viewport.height);
 await d.getByLabel('Email or username').fill('synthetic-fixture');await d.getByLabel('Password',{exact:true}).fill('synthetic-wrong-password');await d.getByRole('button',{name:'Sign in',exact:true}).click();
 await d.getByRole('status').filter({hasText:'could not be completed'}).waitFor();assert.equal(await d.getByLabel('Password',{exact:true}).inputValue(),'');
 assert.equal(await d.getByRole('link',{name:/password recovery/}).getAttribute('href'),'/auth/start');
 await p.keyboard.press('Escape');await d.waitFor({state:'detached'});assert.equal(await p.locator('#draft').inputValue(),'unsaved words');assert.deepEqual(await p.evaluate(()=>Object.keys(localStorage)),[]);await p.close();
 }assert.equal(submissions,2);console.log('Combined login browser checks passed at desktop/mobile: both fields, bounds, failure, cleared password, recovery, Escape, intact draft.');
}finally{await browser.close();server.close();}
