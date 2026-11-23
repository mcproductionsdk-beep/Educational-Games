const panel=document.querySelector('#panel');
const tabs=document.querySelector('.tabs');
const menu=document.querySelector('details');
const views={word:'Word Games',sentence:'Sentence Games',lab:'Lesson Lab',edit:'Edit your lesson',generate:'Generate lesson',library:'My Library',lessons:'Lessons',saved:'En el mercado',account:'My Account',plans:'View Plans'};
const savedText='Hoy el mercado abre temprano. En el primer puesto, una mujer nos saluda. Mi hermana elige una manzana roja.';
const drafts={};
let home='word';
const link=(route,label,cls='button')=>'<a class="'+cls+'" href="#'+route+'">'+label+'</a>';
const field=(label,key,control)=>'<label>'+label+control.replace(/^(<\w+)/,'$1 data-key="'+key+'"')+'</label>';
const input=value=>'<input value="'+value+'">';
const area=value=>'<textarea rows="4">'+value+'</textarea>';
const select=values=>'<select>'+values.map(v=>'<option>'+v+'</option>').join('')+'</select>';
const languages=['English','Spanish','Danish','German','French'];
function editor(sentence){
 const prefix=sentence?'sentence':'word';
 return '<div class="grid"><div class="box"><h2>Game settings</h2>'+field('Prompt language',prefix+'-from',select(languages))+field('Target language',prefix+'-to',select(['Spanish','Danish','German','French','English']))+'</div><div class="box"><h2>Customize / edit</h2>'+field('Set title',prefix+'-title',input(sentence?'At the market':'Market day'))+field(sentence?'Sentence pairs':'Vocabulary pairs',prefix+'-pairs',area(sentence?'How much is it? — ¿Cuánto cuesta?\nI would like a kilo. — Quisiera un kilo.':'market — mercado\napple — manzana\nbread — pan'))+'</div></div>';
}
function steps(route){
 return '<nav class="steps" aria-label="Lesson steps">'+[['lab','1/3 Lesson settings'],['edit','2/3 Edit your lesson'],['generate','3/3 Generate lesson']].map(([r,l])=>'<a href="#'+r+'" '+(route===r?'aria-current="step"':'')+'>'+l+'</a>').join('')+'</nav>';
}
function item(route,badge,name){
 return '<a class="item" href="#'+route+'"><span class="icon" aria-hidden="true">'+badge+'</span><strong>'+name+'</strong></a>';
}
function view(r){
 if(r==='word'||r==='sentence')return editor(r==='sentence');
 if(r==='library'||r==='lessons')return (r==='lessons'?link('library','My Library','crumb'):'')+'<div class="box"><h2>'+(r==='library'?'Folders':'Saved lessons')+'</h2>'+(r==='library'?item('lessons','▰','Lessons'):item('saved','L','En el mercado'))+'</div>';
 if(r==='saved')return link('lessons','Back to Lessons','crumb')+'<div class="grid"><div class="box"><h2>Lesson details</h2><p>Spanish · IB MYP</p><p>Listening comprehension</p></div><div class="box"><h2>Lesson text</h2><p>'+savedText+'</p><div class="actions">'+link('edit','Edit sample lesson','button primary')+'</div></div></div>';
 if(r==='account')return '<div class="box"><h2>Sample teacher account</h2><p>Plan · Free</p><div class="actions">'+link('plans','View Plans')+'</div></div>';
 if(r==='plans')return '<div class="box"><h2>Teacher plans</h2>'+[['Free','Manual set creation'],['Silver','AI language lessons'],['Golden','Higher monthly AI lesson allowance']].map(([name,desc])=>'<div class="plan"><strong>'+name+'</strong>'+desc+'</div>').join('')+'</div>';
 if(r==='lab')return steps(r)+'<div class="grid"><div class="box"><h2>Languages</h2>'+field('Instruction language','instruction',select(languages))+field('Target language','target',select(['Spanish','Danish','German','French','English']))+'</div><div class="box"><h2>Lesson settings</h2>'+field('Assessment system','system',select(['IB MYP','CEFR','Cambridge Lower Secondary']))+field('Extra instructions','notes',area(''))+link('edit','Open sample draft','button primary')+'</div></div>';
 if(r==='edit')return steps(r)+field('Lesson title','lesson-title',input('En el mercado'))+field('Lesson text','text',area(savedText))+field('Vocabulary','vocab',area('mercado — market\nmanzana — apple'))+link('generate','Approve text, vocabulary and gaps','button primary');
 return steps(r)+'<div class="grid"><div class="box"><h2>Recording</h2>'+field('Accent','accent',select(['European Spanish','Colombian Spanish','Mexican Spanish']))+field('Recording pace','pace',select(['Normal','Slow','Very slow']))+'</div><div class="box"><h2>Sample lesson</h2><p>Audio, illustration and test generation are available in the staging Lesson Lab.</p><div class="actions"><a class="button primary" href="/#lesson-lab">Open staging Lesson Lab</a></div></div></div>';
}
function render(moveFocus=false){
 const hash=location.hash.slice(1);
 const r=Object.hasOwn(views,hash)?hash:'word';
 const family=['edit','generate'].includes(r)?'lab':r;
 const workspace=['word','sentence','lab'].includes(family);
 if(workspace)home=family;
 document.querySelector('[data-home]').href='#'+home;
 tabs.hidden=!workspace;
 for(const a of document.querySelectorAll('.bar nav a,.tabs a')){
  const selected=a.closest('.tabs')?a.hash==='#'+family:a.hasAttribute('data-home')?workspace:a.hasAttribute('data-library')?['library','lessons','saved'].includes(r):a.hash==='#'+r;
  if(selected)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
 }
 menu.open=false;
 panel.innerHTML='<h1 tabindex="-1">'+views[r]+'</h1>'+view(r);
 for(const el of panel.querySelectorAll('[data-key]'))if(Object.hasOwn(drafts,el.dataset.key))el.value=drafts[el.dataset.key];
 document.title=views[r]+' · Boring Teacher preview';
 if(moveFocus)panel.querySelector('h1').focus({preventScroll:true});
}
panel.addEventListener('input',e=>{if(e.target.dataset.key)drafts[e.target.dataset.key]=e.target.value;});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.open){menu.open=false;menu.querySelector('summary').focus();}});
document.addEventListener('click',e=>{if(!menu.contains(e.target))menu.open=false;});
window.addEventListener('hashchange',()=>render(true));
document.querySelector('.skip').addEventListener('click',e=>{e.preventDefault();document.querySelector('main').focus();});
render();