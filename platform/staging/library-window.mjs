import {createLibraryClient} from './library-client.mjs';

export function createLibraryWindow({host=document.body,client=createLibraryClient(),onOpen=()=>{},onSaved=()=>{},onChanged=()=>{},onSignIn=null,confirm=message=>window.confirm(message)}={}){
 const doc=host.ownerDocument;
 let active=null,epoch=0;
 const node=(tag,text)=>{const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const button=(text,action)=>{const b=node('button',text);b.type='button';b.addEventListener('click',action);return b;};
 function close(){++epoch;active?.remove();active=null;}
 function shell(title){
  close();const d=node('dialog');d.className='bt-library-window';d.setAttribute('aria-label',title);
  const head=node('div');head.className='bt-library-heading';head.append(node('h2',title),button('Close ×',()=>d.close()));
  const status=node('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  d.append(head,status);host.append(d);active=d;d.addEventListener('close',()=>{if(active===d)close();},{once:true});d.showModal();return {d,status,current:epoch};
 }
 function field(parent,label,value='',type='input'){
  const l=node('label',label),control=node(type);control.value=value;l.append(control);parent.append(l);return control;
 }
 const showError=(status,e)=>{
  status.textContent=e.message||'My Library is unavailable. Please try again.';
  if(e.code==='SIGN_IN_REQUIRED'&&onSignIn){const signIn=button('Sign in',()=>{try{onSignIn();close();}catch{status.textContent='Your draft could not be preserved. Close this window and try again.';}});status.append(doc.createElement('br'),signIn);}
 };
 async function browse(){
  const {d,status,current}=shell('MY LIBRARY');status.textContent='Loading your private library…';
  const controls=node('section'),rows=node('section'),folderRows=node('section'),pagination=node('div');d.append(controls,folderRows,rows,pagination);
  let folders=[],items=[],trash=false,offset=0,next=null,busy=false,filter='all';
  const search=field(controls,'Search these sets',''),folderFilter=field(controls,'Folder','','select');
  const all=node('option','All sets');all.value='all';folderFilter.append(all);const uf=node('option','Unfiled');uf.value='';folderFilter.append(uf);
  const toggle=button('Show Trash',()=>{if(busy)return;trash=!trash;offset=0;toggle.textContent=trash?'Show saved sets':'Show Trash';void load();});controls.append(toggle);
  const folderForm=node('form'),newName=field(folderForm,'New folder name');newName.maxLength=80;newName.required=true;const add=node('button','Create folder');add.type='submit';folderForm.append(add);controls.append(folderForm);
  async function run(action){if(busy)return;busy=true;d.setAttribute('aria-busy','true');try{await action();}catch(e){if(current===epoch)showError(status,e);}finally{busy=false;if(current===epoch)d.removeAttribute('aria-busy');}}
  folderForm.addEventListener('submit',e=>{e.preventDefault();if(!folderForm.reportValidity())return;void run(async()=>{await client.createFolder(newName.value);newName.value='';await load();});});
  function folderPicker(parent,id){const select=field(parent,'Move to folder','','select');const o=node('option','Unfiled');o.value='';select.append(o);for(const f of folders){const option=node('option',f.name);option.value=f.folder_id;select.append(option);}select.value=id||'';return select;}
  function draw(){
   rows.replaceChildren(node('h3',trash?'TRASH':'SAVED SETS'));
   if(trash)rows.append(node('p','Deleted sets can be restored. Permanent deletion is not enabled on staging.'));
   const shown=items.filter(s=>(filter==='all'||(s.folder_id||'')===filter)&&s.title.toLowerCase().includes(search.value.toLowerCase()));
   if(!shown.length)rows.append(node('p',items.length?'No matching sets on this page.':'No sets here yet.'));
   for(const item of shown){
    const card=node('article');card.className='bt-library-card';card.append(node('h4',item.title),node('p',(item.family==='sentence'?'Sentence set':'Word set')+' · '+(folders.find(f=>f.folder_id===item.folder_id)?.name||'Unfiled')));
    if(trash)card.append(button('Restore',()=>void run(async()=>{await client.restore(item);onChanged(item.set_id);await load();})));
    else{
     card.append(button('Open in editor',()=>void run(async()=>{const record=await client.get(item.set_id);if(current!==epoch)return;if(await onOpen(record)!==false)close();})));
     const target=folderPicker(card,item.folder_id);card.append(button('Move',()=>void run(async()=>{const record=await client.move(item,target.value||null);onChanged(item.set_id);await load();status.textContent='Set moved.';})));
     card.append(button('Delete set',()=>{if(confirm('Move “'+item.title+'” to Trash?'))void run(async()=>{await client.remove(item);onChanged(item.set_id);await load();status.textContent='Set moved to Trash.';});}));
    }
    rows.append(card);
   }
   folderRows.replaceChildren(node('h3','FOLDERS'));
   for(const f of folders){
    const form=node('form');form.className='bt-library-folder';const name=field(form,'Folder name',f.name);name.maxLength=80;name.required=true;
    const rename=node('button','Rename');rename.type='submit';form.append(rename);
    form.addEventListener('submit',e=>{e.preventDefault();if(form.reportValidity())void run(async()=>{await client.renameFolder(f,name.value);await load();status.textContent='Folder renamed.';});});
    form.append(button('Delete folder',()=>{if(confirm('Delete “'+f.name+'”? Its sets will move to Unfiled.'))void run(async()=>{await client.deleteFolder(f);onChanged();filter='all';await load();status.textContent='Folder deleted. Its sets are in Unfiled.';});}));folderRows.append(form);
   }
   pagination.replaceChildren();if(offset>0)pagination.append(button('Previous page',()=>{if(!busy){offset=Math.max(0,offset-50);void load();}}));if(next!==null)pagination.append(button('Next page',()=>{if(!busy){offset=next;void load();}}));
  }
  async function load(){
   status.textContent='Loading your private library…';
   try{const [ctx,list,result]=await Promise.all([client.context(),client.folders(),client.sets(trash,offset)]);if(current!==epoch)return;
    folders=list.folders;items=result.sets;next=result.next_offset;const previous=filter;
    folderFilter.replaceChildren(all,uf);for(const f of folders){const o=node('option',f.name);o.value=f.folder_id;folderFilter.append(o);}folderFilter.value=previous;filter=folderFilter.selectedIndex<0?'all':folderFilter.value;folderFilter.value=filter;
    status.textContent=ctx.plan==='free'?ctx.saved_count+' of 5 saved sets used.':ctx.plan==='premium'?ctx.monthly_created+' of 50 new sets used this month.':ctx.saved_count+' saved sets.';draw();
   }catch(e){if(current===epoch){rows.replaceChildren();folderRows.replaceChildren();showError(status,e);}}
  }
  search.addEventListener('input',draw);folderFilter.addEventListener('change',()=>{filter=folderFilter.value;draw();});controls.append(button('Refresh library',()=>void run(load)));
  await load();return {close};
 }
 async function save({getPayload,record=null,pending={}}){
  const {d,status,current}=shell('SAVE TO ACCOUNT');status.textContent='Loading folders…';
  let folders=[],busy=false;const form=node('form'),select=field(form,'Folder','','select'),name=field(form,'Or create a new folder');name.maxLength=80;
  const target=node('option','Unfiled');target.value='';select.append(target);
  const copy=record?field(form,'Save as a new set','','input'):null;if(copy){copy.type='checkbox';copy.checked=false;}
  const submit=node('button',record?'Save changes':'Save set');submit.type='submit';submit.disabled=true;form.append(submit);d.append(form);
  form.addEventListener('submit',e=>{e.preventDefault();if(busy||!form.reportValidity())return;void commit();});
  async function commit(){
   busy=true;submit.disabled=true;status.textContent='Saving…';
   try{
    const payload=getPayload();let folder=select.value||null;
    if(name.value.trim()){
     const f=await client.createFolder(name.value);if(current!==epoch)return;folder=f.folder_id;const o=node('option',f.name);o.value=f.folder_id;select.append(o);select.value=f.folder_id;name.value='';
    }
    const existing=record&&!copy?.checked?record:null,fingerprint=JSON.stringify({payload,folder,existing:existing?.set_id||null});
    if(pending.fingerprint!==fingerprint){pending.fingerprint=fingerprint;pending.key=crypto.randomUUID();}
    const result=await client.save(payload,folder,existing,pending.key);if(current!==epoch)return;
    if(result.deleted_at!==null)throw Error('This set is in Trash. Restore it in My Library before saving.');
    record=result;if(copy)copy.checked=false;submit.textContent='Save changes';pending.key=null;pending.fingerprint=null;onSaved(result);status.textContent='Saved to your account.';
   }catch(e){if(current===epoch)showError(status,e);}finally{busy=false;if(current===epoch)submit.disabled=false;}
  }
  try{await client.context();const list=await client.folders();if(current!==epoch)return;folders=list.folders;for(const f of folders){const o=node('option',f.name);o.value=f.folder_id;select.append(o);}select.value=record?.folder_id||'';submit.disabled=false;status.textContent='Choose a folder. Your editor stays open behind this window.';}catch(e){if(current===epoch)showError(status,e);}
  return {close};
 }
 return {browse,save,close,reset(){client.reset();close();}};
}
