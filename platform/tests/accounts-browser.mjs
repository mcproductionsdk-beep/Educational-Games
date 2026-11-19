import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
let state='guest',logoutFailure=false;
const server=createServer(async(req,res)=>{
 if(req.url==='/me'){res.setHeader('Cache-Control','no-store');if(state==='signed'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({account_id:'b8ce6c1a-1ded-4b1d-8e86-5b84fde09d1f'}));}else{res.statusCode=state==='guest'?401:503;res.end();}return;}
 if(req.url==='/auth/logout'){res.statusCode=logoutFailure?503:204;if(!logoutFailure)state='guest';res.end();return;}
 if(req.url==='/accounts.mjs'){res.setHeader('Content-Type','text/javascript');res.end(await readFile(new URL('../staging/accounts.mjs',import.meta.url)));return;}
 res.setHeader('Content-Type','text/html');res.end(`<div id="account"></div><textarea id="draft">unsaved words</textarea><script type="module">import {mountAccounts} from '/accounts.mjs';window.accounts=mountAccounts({root:document.getElementById('account')});</script>`);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);
 await page.getByRole('status').filter({hasText:'Guest'}).waitFor();assert.equal(await page.getByRole('link',{name:'Sign in'}).getAttribute('href'),'/auth/start');
 assert.equal(await page.getByRole('button',{name:'Create account',exact:true}).isVisible(),true);state='signed';await page.evaluate(()=>accounts.refresh());assert.equal(await page.getByRole('button',{name:'Create account',exact:true}).isVisible(),false);assert.match(await page.getByRole('status').textContent(),/Account b8ce6c1a/);
 assert.equal(await page.getByRole('button',{name:'Log out',exact:true}).isVisible(),true);
 state='unavailable';await page.evaluate(()=>accounts.refresh());assert.equal(await page.getByRole('link',{name:'Sign in'}).isVisible(),false);assert.match(await page.getByRole('status').textContent(),/unavailable/);
 state='signed';await page.getByRole('button',{name:'Retry'}).click();await page.getByRole('button',{name:'Log out',exact:true}).waitFor();
 logoutFailure=true;await page.getByRole('button',{name:'Log out',exact:true}).click();await page.getByRole('status').filter({hasText:'could not be confirmed'}).waitFor();
 logoutFailure=false;await page.getByRole('button',{name:'Retry'}).click();await page.getByRole('button',{name:'Log out',exact:true}).waitFor();await page.getByRole('button',{name:'Log out',exact:true}).click();await page.getByRole('status').filter({hasText:'Guest'}).waitFor();
 assert.equal(await page.locator('#draft').inputValue(),'unsaved words');assert.deepEqual(await page.evaluate(()=>Object.keys(localStorage)),[]);
 console.log('Account browser checks passed: guest, account display, unavailable, failed logout, confirmed logout, draft intact.');
}finally{await browser.close();server.close();}

