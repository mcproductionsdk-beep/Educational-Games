import {createServer} from 'node:http';import {readFile} from 'node:fs/promises';import assert from 'node:assert/strict';import {chromium} from 'playwright-core';
let creates=0,verifies=0;
const server=createServer(async(req,res)=>{
 if(req.url==='/auth/register/context'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({csrf:'x'.repeat(43),stage:'entry',policy:{enabled:true,minLength:8}}));return;}
 if(req.url==='/auth/register/create'){creates++;res.setHeader('Content-Type','application/json');res.end('{"stage":"verify"}');return;}
 if(req.url==='/auth/register/verify'){verifies++;let body='';for await(const chunk of req)body+=chunk;const code=JSON.parse(body).code;res.statusCode=code==='fixture-code'?200:400;res.setHeader('Content-Type','application/json');res.end(code==='fixture-code'?'{"stage":"verified"}':'{}');return;}
 if(req.url==='/auth/register/resend'){res.setHeader('Content-Type','application/json');res.end('{"stage":"verify"}');return;}
 if(req.url==='/register.mjs'){res.setHeader('Content-Type','text/javascript');res.end(await readFile(new URL('../staging/custom-login/register.mjs',import.meta.url)));return;}
 if(req.url==='/window.css'){res.setHeader('Content-Type','text/css');res.end(await readFile(new URL('../staging/custom-login/window.css',import.meta.url)));return;}
 res.setHeader('Content-Type','text/html');res.end(`<link rel="stylesheet" href="/window.css"><textarea id="draft">unsaved vocabulary</textarea><script type="module">import{mountRegistration}from'/register.mjs';mountRegistration({onSignIn:()=>{document.body.dataset.signedInRequested='true';}});</script>`);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try{for(const viewport of[{width:1280,height:800},{width:390,height:740}]){
 const p=await browser.newPage({viewport});await p.goto('http://127.0.0.1:'+server.address().port);const d=p.getByRole('dialog');await p.waitForFunction(()=>!document.querySelector('.bt-register-entry [type=submit]').disabled);
 const b=await d.boundingBox();assert.ok(b.x>=0&&b.x+b.width<=viewport.width&&b.height<=viewport.height);
 await d.getByLabel('First name',{exact:true}).fill('Fixture');await d.getByLabel('Last name',{exact:true}).fill('Teacher');await d.getByLabel('Email',{exact:true}).fill('fixture@example.test');await d.getByLabel('Password',{exact:true}).fill('Fixture123!');await d.getByLabel('Confirm password',{exact:true}).fill('Mismatch123!');const previous=creates;
 await d.getByRole('button',{name:'Create account',exact:true}).click();await d.getByRole('status').filter({hasText:'do not match'}).waitFor();assert.equal(creates,previous);
 await d.getByLabel('Confirm password',{exact:true}).fill('Fixture123!');await d.getByRole('button',{name:'Create account',exact:true}).click();await d.getByLabel('Verification code',{exact:true}).waitFor();assert.equal(await d.getByLabel('Password',{exact:true}).inputValue(),'');assert.equal(await d.getByLabel('Confirm password',{exact:true}).inputValue(),'');
 await d.getByLabel('Verification code',{exact:true}).fill('wrong-code');await d.getByRole('button',{name:'Verify email',exact:true}).click();await d.getByRole('status').filter({hasText:'could not be verified'}).waitFor();assert.equal(await d.getByLabel('Verification code',{exact:true}).inputValue(),'');
 await d.getByRole('button',{name:'Resend code',exact:true}).click();assert.equal(await d.getByRole('button',{name:'Resend code',exact:true}).isDisabled(),true);
 await d.getByLabel('Verification code',{exact:true}).fill('fixture-code');await d.getByRole('button',{name:'Verify email',exact:true}).click();await d.getByRole('status').filter({hasText:'Email verified'}).waitFor();await d.getByRole('button',{name:'Sign in to Boring Teacher',exact:true}).click();await d.waitFor({state:'detached'});assert.equal(await p.locator('body').getAttribute('data-signed-in-requested'),'true');assert.equal(await p.locator('#draft').inputValue(),'unsaved vocabulary');assert.deepEqual(await p.evaluate(()=>Object.keys(localStorage)),[]);await p.close();
 }assert.equal(creates,2);assert.equal(verifies,4);console.log('Registration browser checks passed: desktop/mobile, validation, password clearing, code errors, resend, explicit verification, return to sign-in and draft preservation.');
}finally{await browser.close();server.close();}
