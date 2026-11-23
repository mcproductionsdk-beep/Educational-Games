import {appendReview,appendScores} from './answer-review.mjs';
const node=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
export function teacherLesson(root,record,openResults=false){
 const snapshot=record.payload.snapshot;
 const bytes=Uint8Array.from(atob(snapshot.slice(4).replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
 const lesson=JSON.parse(new TextDecoder().decode(bytes));
 const box=node('section');box.className='student-panel bt-teacher-lesson';
 const header=node('div');header.className='bt-lesson-header';
 const button=node('button','See student results');button.type='button';button.className='bt-see-results';button.setAttribute('aria-expanded','false');
 header.append(node('h2',record.title),button);box.append(header);
 const panel=node('section');panel.hidden=true;panel.setAttribute('aria-label','Student results');box.append(panel);
 const body=node('div');box.append(body);
 const nav=node('div');nav.className='bt-lesson-activities';
 for(const [name,activity] of [['Vocabulary','vocab'],['Listen','listen'],['Fill the blanks','gap'],['Test','test']]){
  const url=new URL('https://feature-lesson-staging-20261.bt-lessons-staging.pages.dev/student/');
  url.hash=snapshot;url.searchParams.set('activity',activity);
  const link=node('a',name);link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';nav.append(link);
 }
 const passage=node('p',lesson.text);passage.className='bt-lesson-text';
 body.append(nav,passage);root.replaceChildren(box);
 let generation=0;
 const select=node('select'),review=node('article'),rows=[];
 review.className='lesson-attempt-review';
 const chooser=node('label','Choose a student');chooser.append(select);
 select.onchange=()=>{
  const row=rows[Number(select.value)];if(!row)return;
  const s=row.scores,lang=lesson.settings?.instruction||'en';
  review.replaceChildren();
  const groups=s.review?.slice(-(s.sections?.length||0))||[];
  const titles={en:['Practice results','Fill the blanks','Test'],es:['Resultados de práctica','Completa los espacios','Prueba'],de:['Übungsergebnisse','Lückentext','Test'],fr:['Résultats','Texte à trous','Test'],it:['Risultati','Completa gli spazi','Test'],da:['Resultater','Udfyld hullerne','Test'],nb:['Resultater','Fyll inn','Test'],sv:['Resultat','Fyll i luckorna','Test']};
  const [results,gap,test]=titles[lang]||titles.en;
  appendScores(review,s,{results,gap,test,sectionName:(_,i)=>groups[i]?.title||'Section '+(i+1)});
  if(s.review)appendReview(review,s.review,lang);
  else{
   review.append(node('p','This earlier attempt was saved before full answer reviews were available.'));
   for(const item of s.writtenFeedback||[])review.append(node('p',item.prompt),node('p',item.answer),node('p',item.model));
  }
 };
 async function results(offset,version){
  const more=panel.querySelector('button');if(more)more.disabled=true;
  try{
   const res=await fetch('/library/sets/'+record.set_id+'/results?offset='+offset,{credentials:'same-origin',cache:'no-store',redirect:'error'});
   if(!res.ok)throw Error();
   const data=await res.json();
   if(version!==generation)return;
   if(!offset){rows.length=0;select.replaceChildren();review.replaceChildren();panel.replaceChildren(node('h3','Student results'));}
   more?.remove();
   if(!data.results.length&&!offset){panel.append(node('p','No student results yet. Completed tests from the shared Full lesson link will appear here.'));return;}
   for(const row of data.results){
    const option=node('option',row.nickname+' · '+new Date(row.submitted_at).toLocaleString());option.value=String(rows.length);
    rows.push(row);select.append(option);
   }
   if(!offset){panel.append(chooser,review);select.selectedIndex=0;select.onchange();}
   if(data.next_offset!==null){const next=node('button','Show more results');next.onclick=()=>results(data.next_offset,version);panel.append(next);}
  }catch{
   if(version!==generation)return;
   if(!offset)panel.replaceChildren();
   more?.remove();
   const retry=node('button','Retry loading results');retry.onclick=()=>results(offset,version);panel.append(retry);
  }
 }
 button.onclick=()=>{
  panel.hidden=!panel.hidden;body.hidden=!panel.hidden;generation++;
  button.textContent=panel.hidden?'See student results':'Back to lesson';button.setAttribute('aria-expanded',String(!panel.hidden));
  if(!panel.hidden){panel.replaceChildren(node('p','Loading student results…'));void results(0,generation);}
 };
 if(openResults){
  button.textContent='Open lesson';
  button.onclick=()=>{location.hash='private-set='+record.set_id;};
  button.removeAttribute('aria-expanded');
  generation++;panel.hidden=false;body.hidden=true;
  panel.append(node('p','Loading student results…'));void results(0,generation);
 }
}
