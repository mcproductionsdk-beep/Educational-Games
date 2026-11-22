const node=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
export function teacherLesson(root,record){
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
 async function results(offset,version){
  const more=panel.querySelector('button');if(more)more.disabled=true;
  try{
   const res=await fetch('/library/sets/'+record.set_id+'/results?offset='+offset,{credentials:'same-origin',cache:'no-store',redirect:'error'});
   if(!res.ok)throw Error();
   const data=await res.json();
   if(version!==generation)return;
   if(!offset)panel.replaceChildren(node('h3','Student results'));
   more?.remove();
   if(!data.results.length&&!offset){panel.append(node('p','No student results yet. Completed tests from the shared Full lesson link will appear here.'));return;}
   for(const row of data.results){
    const s=row.scores,details=node('details'),summary=node('summary');
    summary.textContent=row.nickname+' · Test '+s.correctTest+' / '+s.totalTest+' · '+new Date(row.submitted_at).toLocaleString();details.append(summary);
    if(Number.isInteger(s.totalGaps))details.append(node('p','Fill the blanks · '+s.correctGaps+' / '+s.totalGaps));
    for(const [i,part] of (s.sections||[]).entries())details.append(node('p','Section '+(i+1)+' · '+part.correct+' / '+part.total));
    for(const item of s.writtenFeedback||[])details.append(node('p',item.number+'. '+item.prompt),node('p',item.answer));
    panel.append(details);
   }
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
}
