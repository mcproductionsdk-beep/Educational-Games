import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
const root=new URL('../',import.meta.url),out=new URL('../dist-staging/',import.meta.url);
const engine=JSON.parse(await readFile(new URL('./staging/engine-lock.json',import.meta.url),'utf8'));
if(engine.environment!=='staging'||engine.url!=='https://7bd7d241.bt-vocabulary-snake-preview.pages.dev/snake-game.html'||engine.buildId!=='5433403055ef05621455c7d608971078a36308fb')throw new Error('Unapproved staging engine lock.');
const files=['platform/config.mjs','platform/content.mjs','platform/runtime.mjs','platform/editor.mjs','platform/voice.mjs','platform/session-client.mjs','platform/shell.mjs','platform/shell.css','platform/staging/app.mjs','platform/staging/app.css','platform/staging/engine-lock.json'];
await rm(out,{recursive:true,force:true});
for(const name of files){const target=new URL(name,out);await mkdir(new URL('./',target),{recursive:true});await writeFile(target,await readFile(new URL(name,root)));}
await writeFile(new URL('index.html',out),await readFile(new URL('platform/staging/index.html',root)));
await writeFile(new URL('catalog.json',out),await readFile(new URL('libraries/vocabulary/v2.json',root)));
await writeFile(new URL('version.json',out),JSON.stringify({environment:'staging',sourceCommit:process.env.CF_PAGES_COMMIT_SHA||process.env.GITHUB_SHA||'local-unreleased',engine,configuration:'staging-v1',registry:'snake-v1'},null,2)+'\n');
await writeFile(new URL('_headers',out),`/*
  Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self' https://boringteacher-vocabulary-api-staging.mcproductionsdk.workers.dev; frame-src https://7bd7d241.bt-vocabulary-snake-preview.pages.dev; img-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'
  Referrer-Policy: strict-origin
  X-Content-Type-Options: nosniff
  Cache-Control: no-store
`);
console.log('Built isolated central staging launcher with pinned engine',engine.buildId);
