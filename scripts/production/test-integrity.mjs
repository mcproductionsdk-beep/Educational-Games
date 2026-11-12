import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'),command=script=>spawnSync(process.execPath,[join(root,'scripts/production',script)],{encoding:'utf8'});
const settingsFile=join(root,'release/production/settings.json'),bytes=await readFile(settingsFile),settings=JSON.parse(bytes);
try{
 for(const patch of [{environment:'staging'},{wordApi:'https://boringteacher-vocabulary-api-staging.mcproductionsdk.workers.dev'},{engineOrigin:'https://arbitrary.example'},{shellOrigin:'https://untrusted.example'}]){
  await writeFile(settingsFile,JSON.stringify({...settings,...patch}));const result=command('build.mjs');assert.notEqual(result.status,0);assert.match(result.stderr,/Unapproved production configuration/);
 }
}finally{await writeFile(settingsFile,bytes)}
const manifest=JSON.parse(await readFile(join(root,'dist-production/candidate-manifest.json'),'utf8')),engine=manifest.engines[0];
const target=join(root,'dist-production/engine-host',engine.id,engine.artifact,'bootstrap.mjs'),original=await readFile(target);
try{await writeFile(target,Buffer.concat([original,Buffer.from('\n// unexpected change\n')]));assert.notEqual(command('verify.mjs').status,0,'modified asset must fail verification')}
finally{await writeFile(target,original)}
assert.equal(command('verify.mjs').status,0);console.log('Production rejects staging APIs, unapproved origins and modified artifacts');
