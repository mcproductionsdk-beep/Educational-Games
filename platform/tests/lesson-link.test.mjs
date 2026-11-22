import test from 'node:test';
import assert from 'node:assert/strict';
import {lessonSetHash,readLessonSet} from '../lesson-link.mjs';
import {createPronunciationService} from '../voice.mjs';
import {readFileSync} from 'node:fs';
import {categoryPairs,catalogCategories} from '../editor.mjs';

const pairs=[['marked','marknad'],['pose','påse'],['boden','ståndet'],['æble','äpple'],['brød','bröd']];
test('a lesson snapshot preserves approved direction and accented words',()=>{
  const set={family:'vocabulary',schemaVersion:1,title:'På marknaden',promptLanguage:'da-DK',language:'sv-SE',pairs};
  assert.deepEqual(readLessonSet(lessonSetHash(set)),set);
  assert.throws(()=>lessonSetHash({...set,promptLanguage:'sv-SE'}));
  assert.throws(()=>readLessonSet('#lesson-words=!'));
});
test('each catalogue category supports both Nordic target languages',()=>{
  const catalog=JSON.parse(readFileSync(new URL('../../libraries/vocabulary/v2.json',import.meta.url)));
  for(const category of catalogCategories(catalog))for(const language of ['nb-NO','sv-SE']){
    const pairs=categoryPairs(catalog,category,'da-DK',language);
    assert.ok(pairs.length>=5);assert.ok(pairs.every(p=>p.length===2&&p.every(Boolean)));
  }
});
test('Norwegian device aliases and Swedish voices preserve the requested locale',async()=>{
  for(const [locale,alias,word] of [['nb-NO','no-NO','billett'],['sv-SE','sv-SE','äpple']]){
    let spoken;
    const voice=createPronunciationService({synth:{cancel(){},getVoices:()=>[{lang:'en-US'},{lang:alias}],speak(u){spoken=u;u.onend();}},utteranceFactory:text=>({text})});
    assert.equal((await voice.speak(word,locale)).status,'ended');assert.equal(spoken.lang,locale);assert.equal(spoken.voice.lang,alias);
  }
});
