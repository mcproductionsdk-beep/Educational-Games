import {validateVocabulary} from './content.mjs';

function splitVocabularyRow(raw){
 const line=raw.includes('\t')?raw:raw.trim();
 // An explicit tab boundary lets a teacher retain punctuation inside either phrase.
 if(line.includes('\t')){
  const columns=line.split('\t').map(value=>value.trim());
  return columns.length===2&&columns.every(Boolean)?columns:null;
 }
 const separators=[];
 // Match URL schemes and clock colons as content. Consume padding around punctuation
 // so a spaced delimiter does not also count as a repeated-space delimiter.
 for(const match of line.matchAll(/[a-z][a-z0-9+.-]*:\/\/[^ ]+|\b\d{1,2}:\d{2}(?::\d{2})?\b| *[;:→] *| +[|–—-] +| {2,}/gi)){
  if(match[0].includes('://')||/^\d/.test(match[0]))continue;
  separators.push(match);
 }
 if(separators.length!==1)return null;
 const [separator]=separators;
 const columns=[line.slice(0,separator.index).trim(),line.slice(separator.index+separator[0].length).trim()];
 return columns.every(Boolean)?columns:null;
}

export function inspectVocabularyDraft(text){
 if(typeof text!=='string')throw new Error('Paste prompt and answer pairs.');
 const rows=[],pairs=[],errors=[];
 for(const [index,raw] of text.split(/\r?\n/).entries()){
  if(!raw.trim())continue;
  const pair=splitVocabularyRow(raw);
  const number=index+1;
  rows.push({number,raw,pair});
  if(pair)pairs.push(pair);else errors.push(number);
 }
 return {rows,pairs,errors};
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
