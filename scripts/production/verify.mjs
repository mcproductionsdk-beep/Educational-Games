import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {resolve,join,relative,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../dist-production');
const manifest=JSON.parse(await readFile(join(root,'candidate-manifest.json'),'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
assert.equal(manifest.engines.length,12);assert.equal(new Set(manifest.engines.map(e=>e.id)).size,12);
assert.equal(manifest.status,'prepared-not-authorized');
async function walk(dir){const result=[];for(const e of await readdir(dir,{withFileTypes:true})){const path=join(dir,e.name);result.push(...e.isDirectory()?await walk(path):[path])}return result}
for(const [dir,inventory]of [['site',manifest.siteFiles],['engine-host',manifest.hostFiles]]){
 const files=await walk(join(root,dir));assert.deepEqual(files.map(p=>relative(join(root,dir),p)).sort(),Object.keys(inventory).sort(),'exact publication inventory');
 for(const path of files){
  const name=relative(join(root,dir),path),bytes=await readFile(path),text=bytes.toString('utf8');assert.equal(hash(bytes),inventory[name],name+' integrity');
  assert.ok(!/(?:-staging|\.pages\.dev|raw\.githubusercontent\.com)/i.test(text),name+' must not depend on staging/source hosts');
  assert.ok(!/(?:^|\/)(?:baseline|preview|scripts|tests|node_modules)\//.test(name),name+' unwanted publication path');
  if(/\.(?:mjs|js)$/.test(path))execFileSync(process.execPath,['--check',path]);
  if(path.endsWith('.html')){
   assert.ok(!/<(?:textarea|select)\b/i.test(text)||dir==='site','engine setup editor');
   assert.ok(!/(?:Play sample|TEST FROG ENGINE|TEST VOCABULARY MATCH|staging preview|PORTRAIT PROTOTYPE)/i.test(text),'test launcher leaked');
   assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?\S[\s\S]*?<\/script>/i.test(text),'inline executable code');
  }
 }
}
for(const e of manifest.engines){
 assert.ok(/^[a-f0-9]{64}$/.test(e.artifact));assert.ok(new RegExp('^[a-f0-9]{'+(e.id.startsWith('sentence')?64:40)+'}$').test(e.buildId));
 assert.ok(e.responsePolicy.includes("connect-src 'none'"));assert.ok(!e.responsePolicy.includes("script-src 'self' 'unsafe-inline'"));
 for(const [device,url]of Object.entries(e.entries)){const u=new URL(url);assert.equal(u.origin,manifest.settings.engineOrigin);assert.ok(e.files[u.pathname.split('/').at(-1)],device+' entry missing')}
 const dir=join(root,'engine-host',e.id,e.artifact);assert.deepEqual((await walk(dir)).map(p=>relative(dir,p)).sort(),Object.keys(e.files).sort());
 for(const [file,digest]of Object.entries(e.files))assert.equal(hash(await readFile(join(dir,file))),digest);
}
assert.ok(!(await walk(root)).some(p=>relative(root,p).startsWith('work/')),'build inputs must not be published');
console.log('Production inventory, SHA-256 integrity, syntax, CSP, no-staging and unwanted-entry checks passed for all 12 engines');
