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
      const line=(label,value)=>{
        const p=document.createElement('p');
        p.textContent=label+' · '+value;
        li.append(p);
      };
      const join=values=>values.join(item.ordered?' → ':' · ');
      line(response,join(item.answer));
      if(typeof item.correct==='boolean'){
        const status=document.createElement('strong');
        status.textContent=item.correct?yes:no;
        li.append(status);
      }
      if(item.expected)line(key,join(item.expected));
      if(item.model)line(model,item.model);
      list.append(li);
    }
    section.append(heading,list);
    parent.append(section);
  }
}
