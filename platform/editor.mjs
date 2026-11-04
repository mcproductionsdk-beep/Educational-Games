import {validateVocabulary} from './content.mjs';
// Delimiter precedence preserved from the published homepage.
export function inspectVocabularyDraft(text){
 if(typeof text!=='string')throw new Error('Paste prompt and answer pairs.');
 const pairs=[],errors=[];
 for(const [index,line] of text.split(/\r?\n/).entries()){
  if(!line.trim())continue;let pair;
  for(const delimiter of [/\t/,/\s+\|\s+/,/\s+[–—-]\s+/,/\s*;\s*/,/\s*→\s*/]){
   const parts=line.split(delimiter);if(parts.length===2&&parts.every(v=>v.trim())){pair=parts.map(v=>v.trim());break;}
  }
  if(pair)pairs.push(pair);else errors.push(index+1);
 }
 return {pairs,errors};
}
export function parseVocabularyDraft({title,promptLanguage,language,text}) {
 const {pairs,errors}=inspectVocabularyDraft(text);
 if(errors.length)throw new Error('Check lines: '+errors.join(', '));
 return validateVocabulary({title:title.trim(),promptLanguage,language,pairs});
}
export function catalogCategories(catalog){
  if(catalog?.schemaVersion!==2||!Array.isArray(catalog.concepts))throw new Error('Vocabulary catalog unavailable.');
  return [...new Set(catalog.concepts.map(c=>c.category).filter(c=>typeof c==='string'&&c))];
}
export function categoryPairs(catalog,category,promptLanguage,language){
  const prompt=promptLanguage==='en-US'?'en':promptLanguage,target=language==='en-US'?'en':language;
  return catalog.concepts.filter(c=>c.category===category).map(c=>{
    const p=c.translations?.[prompt],t=c.translations?.[target];
    if(typeof p!=='string'||!p.trim()||typeof t!=='string'||!t.trim())throw new Error('This category is incomplete for the selected languages.');
    return[p,t];
  });
}
