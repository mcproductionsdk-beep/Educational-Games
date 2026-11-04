import {validateVocabulary} from './content.mjs';
export function parseVocabularyDraft({title,promptLanguage,language,text}) {
  if(typeof text!=='string')throw new Error('Paste tab-separated prompt and answer pairs.');
  const pairs=[];
  for(const [index,line]of text.split(/\r?\n/).entries()){
    if(!line.trim())continue;
    const pair=line.split('\t');
    if(pair.length!==2||pair.some(value=>!value.trim()))throw new Error('Check line '+(index+1)+': use one TAB between prompt and answer.');
    pairs.push(pair.map(value=>value.trim()));
  }
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
