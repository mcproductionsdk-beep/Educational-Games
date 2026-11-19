import test from 'node:test';
import assert from 'node:assert/strict';
import {folderPath,folderLabel,canMoveFolder} from '../staging/library-tree.mjs';
test('paths and move destinations exclude self and descendants without losing safe roots',()=>{
 const folders=[{folder_id:'a',parent_folder_id:null,name:'Term'},{folder_id:'b',parent_folder_id:'a',name:'Unit'},{folder_id:'c',parent_folder_id:'b',name:'Lesson'},{folder_id:'d',parent_folder_id:null,name:'Other'}];
 assert.deepEqual(folderPath(folders,'c').map(f=>f.folder_id),['a','b','c']);assert.equal(folderLabel(folders,'c'),'Term / Unit / Lesson');
 for(const parent of ['a','b','c'])assert.equal(canMoveFolder(folders,'a',parent),false);assert.equal(canMoveFolder(folders,'a','d'),true);assert.equal(canMoveFolder(folders,'a',null),true);
});
test('corrupt remote folder paths are bounded rather than freezing the interface',()=>{
 assert.equal(folderPath([{folder_id:'a',parent_folder_id:'b',name:'A'},{folder_id:'b',parent_folder_id:'a',name:'B'}],'a').length,2);assert.deepEqual(folderPath([],'missing'),[]);
});
