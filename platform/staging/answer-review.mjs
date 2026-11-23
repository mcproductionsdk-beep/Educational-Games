const copy={
  en:['Response','Correct answer','Model answer','Correct','Incorrect'],
  es:['Respuesta','Respuesta correcta','Respuesta modelo','Correcta','Incorrecta'],
  de:['Antwort','Richtige Antwort','Musterantwort','Richtig','Falsch'],
  da:['Svar','Korrekt svar','Eksempelsvar','Rigtigt','Forkert'],
  sv:['Svar','Rätt svar','Exempelsvar','Rätt','Fel'],
  nb:['Svar','Riktig svar','Eksempelsvar','Riktig','Feil'],
  fr:['Réponse','Bonne réponse','Exemple de réponse','Correct','Incorrect'],
  it:['Risposta','Risposta corretta','Risposta modello','Corretta','Errata']
};
export function appendReview(parent,groups,lang){
  const [response,key,model,yes,no]=copy[lang]||copy.en;
  for(const group of groups){
    const section=document.createElement('section');
    const heading=document.createElement('h3');
    heading.textContent=group.title;
    const list=document.createElement('ol');
    for(const item of group.items){
      const li=document.createElement('li'),prompt=document.createElement('strong');
      prompt.textContent=item.prompt;
      li.append(prompt);
      const line=(label,value,style)=>{
        const p=document.createElement('p');
        const answer=document.createElement('span');
        answer.className=style;answer.textContent=value;
        p.append(label+' · ',answer);
        li.append(p);
      };
      const join=values=>values.join(item.ordered?' → ':' · ');
      const grade=typeof item.correct==='boolean'?(item.correct?'review-correct':'review-incorrect'):'';
      line(response,join(item.answer),grade);
      if(typeof item.correct==='boolean'){
        const status=document.createElement('strong');
        status.className=grade;status.textContent=item.correct?yes:no;
        li.append(status);
      }
      if(item.expected)line(key,join(item.expected),'review-key');
      if(item.model)line(model,item.model,'review-model');
      list.append(li);
    }
    section.append(heading,list);
    parent.append(section);
  }
}

export function appendScores(parent,scores,{results,gap,test,sectionName}){
  const add=(tag,text,cls)=>{
    const el=document.createElement(tag);el.textContent=text;if(cls)el.className=cls;parent.append(el);
  };
  add('h2',results);
  if(Number.isInteger(scores.correctGaps))add('p',gap+' · '+scores.correctGaps+' / '+scores.totalGaps,'result-score');
  if(Number.isInteger(scores.correctTest))add('p',test+' · '+scores.correctTest+' / '+scores.totalTest,'result-score');
  if(scores.sections?.length){
    const list=document.createElement('ul');list.className='exam-breakdown';
    scores.sections.forEach((part,i)=>{
      const li=document.createElement('li');li.textContent=sectionName(part,i)+' · '+part.correct+' / '+part.total;list.append(li);
    });
    parent.append(list);
  }
}
