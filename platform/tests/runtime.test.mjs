import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRuntimeConfiguration } from '../config.mjs';
import { validateVocabulary, LOCALES } from '../content.mjs';
import { createVocabularyRuntime } from '../runtime.mjs';

const buildId = 'd49d04988694055350c02f30bcdc7a185dd08f11';
function setup() {
  const engineUrl = 'https://engine-staging.invalid/' + buildId + '/snake-game.html';
  const config = {schemaVersion: 1, environment: 'staging', configRevision: 'test-1', registryRevision: 'test-1',
    shellOrigin: 'https://shell-staging.invalid', catalogUrl: 'https://shell-staging.invalid/catalog.json',
    launcherUrl: 'https://shell-staging.invalid/', sharingBaseUrl: 'https://api-staging.invalid', sharingTimeoutMs: 12000};
  const registry = {schemaVersion: 1, revision: 'test-1', engines: [{id: 'vocabulary-snake', family: 'vocabulary',
    protocol: 'bt-vocabulary-engine/1', minPairs: 5, buildId, url: engineUrl}]};
  const policy = {environment: 'staging', shellOrigin: config.shellOrigin, engineBuilds: {[engineUrl]: buildId},
    approved: {catalogUrls: [config.catalogUrl], launcherUrls: [config.launcherUrl],
      sharingBaseUrls: [config.sharingBaseUrl], engineUrls: [engineUrl]}};
  return {config, registry, policy};
}
const content = () => ({title: 'Árbol & città', promptLanguage: 'da-DK', language: 'es-ES',
  pairs: [['kat', 'gato'], ['hund', 'perro'], ['fugl', 'pájaro'], ['fisk', 'pez'], ['træ', 'árbol']]});
function spyFetch() {
  const calls=[];
  return {calls, fetchImpl: async (url, options) => {
    calls.push({url, options});
    return {ok:true,url,redirected:false,json:async()=>url.endsWith('/sets')?{id:'fixture-id'}:content()};
  }};
}
test('missing configuration never reaches a network dependency', () => {
  for (const args of [{}, {config: {}}, {...setup(), config: null}, {...setup(), registry: null}, {...setup(), policy: null}]) {
    const spy=spyFetch();assert.throws(()=>createVocabularyRuntime({...args,fetchImpl:spy.fetchImpl}));assert.equal(spy.calls.length,0);
  }
});
test('reject entire invalid combination before exposing any service', () => {
  for (const mutate of [
    s=>s.config.environment='production', s=>s.config.registryRevision='other',
    s=>s.config.sharingTimeoutMs=0, s=>delete s.config.sharingBaseUrl,
    s=>s.config.catalogUrl='https://unapproved.invalid/catalog.json',
    s=>s.config.launcherUrl='https://evil.invalid/', s=>s.registry.engines[0].url+='?branch=main',
    s=>s.registry.engines[0].buildId='main', s=>s.registry.engines[0].protocol='future/2',
    s=>s.registry.engines.push({...s.registry.engines[0]}), s=>s.registry.engines[0].family='sentence'
  ]) {const s=setup(),spy=spyFetch();mutate(s);assert.throws(()=>createVocabularyRuntime({...s,fetchImpl:spy.fetchImpl}));assert.equal(spy.calls.length,0);}
});
test('staging denies known production origins even when accidentally allowlisted', () => {
  for (const origin of ['https://boringteacher.com','https://www.boringteacher.com',
    'https://boringteacher-vocabulary-api.mcproductionsdk.workers.dev',
    'https://boringteacher-sentences-api.mcproductionsdk.workers.dev']) {
    for (const [field,kind,suffix] of [['sharingBaseUrl','sharingBaseUrls',''],['catalogUrl','catalogUrls','/catalog.json'],['launcherUrl','launcherUrls','/']]) {
      const s=setup(),spy=spyFetch();s.config[field]=origin+suffix;s.policy.approved[kind].push(origin+suffix);
      assert.throws(()=>createVocabularyRuntime({...s,fetchImpl:spy.fetchImpl}));assert.equal(spy.calls.length,0);
    }
  }
});
test('reject URL credential, scheme, encoding and lookalike escapes', () => {
 for (const value of ['https://api-staging.invalid.evil.invalid','https://user:secret@api-staging.invalid',
   'http://api-staging.invalid','//api-staging.invalid','javascript:alert(1)',
   'https://api-staging.invalid#prod','https://api-staging.invalid?next=prod','https://api-staging.invalid/../sets']) {
   const s=setup();s.config.sharingBaseUrl=value;assert.throws(()=>validateRuntimeConfiguration(s.config,s.registry,s.policy));
 }
});
test('configuration, registry and content are copied and frozen per session', () => {
 const s=setup(),spy=spyFetch(),runtime=createVocabularyRuntime({...s,fetchImpl:spy.fetchImpl});
 s.config.sharingBaseUrl='https://boringteacher.com';s.registry.engines[0].url='https://evil.invalid/';
 assert.equal(runtime.settings.sharingBaseUrl,'https://api-staging.invalid');assert.equal(runtime.settings.engines[0].url.includes('evil'),false);
 const source=content(),set=validateVocabulary(source);source.pairs[0][0]='mutated';assert.equal(set.pairs[0][0],'kat');
 assert.throws(()=>{set.pairs[0][0]='changed'});
});
test('preserve explicit direction and every supported target locale', () => {
 for (const language of LOCALES) {
  const set=content();set.language=language;set.promptLanguage=language==='da-DK'?'en-US':'da-DK';
  const result=validateVocabulary(set);assert.equal(result.promptLanguage,set.promptLanguage);assert.deepEqual(result.pairs,set.pairs);
 }
 const legacy=content();delete legacy.promptLanguage;
 assert.throws(()=>validateVocabulary(legacy));assert.equal(validateVocabulary(legacy,{legacy:true}).promptLanguage,'en-US');
});
test('reject malformed sets without publishing or coercing data', async () => {
 for (const mutate of [s=>s.pairs.pop(),s=>s.pairs[0]=null,s=>s.pairs[0][1]=42,s=>s.pairs[0].push('third'),
   s=>s.pairs[0][0]=' ',s=>s.language='unknown',s=>s.promptLanguage=s.language,s=>s.family='sentence',s=>s.title='']) {
  const spy=spyFetch(),runtime=createVocabularyRuntime({...setup(),fetchImpl:spy.fetchImpl}),set=content();mutate(set);
  await assert.rejects(runtime.publishSet(set));assert.equal(spy.calls.length,0);
 }
});
test('sharing uses staging paths, exact API payload and safe request options', async () => {
 const spy=spyFetch(),runtime=createVocabularyRuntime({...setup(),fetchImpl:spy.fetchImpl});
 const published=await runtime.publishSet(content());await runtime.loadSet('á / id');
 assert.equal(published.url,'https://shell-staging.invalid/#set=fixture-id');
 assert.equal(spy.calls[0].url,'https://api-staging.invalid/sets');
 assert.deepEqual(JSON.parse(spy.calls[0].options.body),content());
 assert.equal(spy.calls[1].url,'https://api-staging.invalid/sets/'+encodeURIComponent('á / id'));
 for(const {options} of spy.calls){assert.equal(options.redirect,'error');assert.equal(options.credentials,'omit');assert.equal(options.referrerPolicy,'no-referrer');}
});
test('explicitly disabled sharing performs no requests and never invents a link', async () => {
 const s=setup(),spy=spyFetch();s.config.sharingBaseUrl=null;
 const runtime=createVocabularyRuntime({...s,fetchImpl:spy.fetchImpl});
 await assert.rejects(runtime.loadSet('id'),/SHARING_UNAVAILABLE/);await assert.rejects(runtime.publishSet(content()),/SHARING_UNAVAILABLE/);
 assert.equal(spy.calls.length,0);
});
test('redirect and malformed response fail without a retry or production fallback', async () => {
 for(const response of [
  {ok:true,redirected:true,url:'https://boringteacher.com'},
  {ok:true,type:'opaqueredirect'}, {ok:false}, {ok:true,json:async()=>({pairs:[]})}
 ]) {let count=0;const runtime=createVocabularyRuntime({...setup(),fetchImpl:async()=>{count++;return response}});
  await assert.rejects(runtime.loadSet('id'));assert.equal(count,1);
 }
});
test('sharing aborts at the contract timeout without fallback requests', async t => {
 t.mock.timers.enable({apis:['setTimeout']});
 let calls=0;
 const runtime=createVocabularyRuntime({...setup(),fetchImpl:(_url,{signal})=>{
   calls++;return new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(new Error('ABORTED')),{once:true}));
 }});
 const pending=assert.rejects(runtime.loadSet('id'),/ABORTED/);
 t.mock.timers.tick(12000);await pending;assert.equal(calls,1);
 t.mock.timers.reset();
});
