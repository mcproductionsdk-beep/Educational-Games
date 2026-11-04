import test from 'node:test';
import assert from 'node:assert/strict';
import {parseVocabularyDraft,catalogCategories,categoryPairs} from '../editor.mjs';
const draft={title:'Test',promptLanguage:'da-DK',language:'es-ES',text:Array(5).fill('træ\tárbol').join('\n')};
test('editor normalizes explicit publication whitespace without reversing columns',()=>{
 const set=parseVocabularyDraft({...draft,title:' Test ',text:Array(5).fill(' træ \t árbol ').join('\n')});assert.equal(set.title,'Test');assert.deepEqual(set.pairs[0],['træ','árbol']);assert.equal(set.promptLanguage,'da-DK');
});
test('bad lines and API limits reject rather than silently truncate',()=>{
 for(const change of [{text:draft.text+'\nmissing tab'},{title:'x'.repeat(101)},{text:Array(201).fill('p\tt').join('\n')},{text:Array(5).fill('p\t'+'x'.repeat(201)).join('\n')}])assert.throws(()=>parseVocabularyDraft({...draft,...change}));
});
test('new categories are derived centrally and English catalog key maps explicitly',()=>{
 const catalog={schemaVersion:2,concepts:[{category:'Animals',translations:{en:'cat','es-ES':'gato'}}]};assert.deepEqual(catalogCategories(catalog),['Animals']);assert.deepEqual(categoryPairs(catalog,'Animals','en-US','es-ES'),[['cat','gato']]);
 catalog.concepts.push({category:'New topic',translations:{en:'tree','es-ES':'árbol'}});assert.deepEqual(catalogCategories(catalog),['Animals','New topic']);
 assert.throws(()=>categoryPairs(catalog,'Animals','en-US','de-DE'));
});
