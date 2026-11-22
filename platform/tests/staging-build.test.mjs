import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..');
test('central staging output excludes engine copies, tests and production endpoints',()=>{
 execFileSync(process.execPath,['platform/build-staging.mjs'],{cwd:root});const out=resolve(root,'dist-staging');
 const paths=readdirSync(out,{recursive:true});assert.equal(paths.some(p=>/tests|fixtures|reference|README|snake\.js|\.github/.test(p)),false);
 for(const path of paths.filter(p=>/\.(html|mjs|css|json)$/.test(p))){
  if(path==='platform/config.mjs')continue; // This validator contains production denylist strings.
  const text=readFileSync(resolve(out,path),'utf8');assert.doesNotMatch(text,/https:\/\/boringteacher\.com|https:\/\/boringteacher-vocabulary-api\.mcproductionsdk/);
 }
 const headers=readFileSync(resolve(out,'_headers'),'utf8');assert.match(headers,/connect-src 'self' https:\/\/boringteacher-vocabulary-api-staging/);assert.match(headers,/frame-src https:\/\/75b992de/);
 const version=JSON.parse(readFileSync(resolve(out,'version.json'),'utf8'));assert.equal(version.environment,'staging');assert.equal(version.engine.buildId,'5268f4cea1b180dfbe4fb32035ef9899fdb7ca8b');
});
