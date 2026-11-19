import {createLibraryClient} from './library-client.mjs';
import {folderPath,folderLabel,canMoveFolder} from './library-tree.mjs';

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
  const {d,status,current}=shell('MY LIBRARY');d.classList.add('bt-library-explorer');
  let folders=[],items=[],location='root',offset=0,next=null,busy=false,loadEpoch=0,selected=null,dragged=null;
  const expanded=new Set(),toolbar=node('div'),layout=node('div'),side=node('nav'),main=node('section'),crumbs=node('nav'),grid=node('div'),actions=node('div'),panel=node('section'),pagination=node('div');
  toolbar.className='bt-library-toolbar';layout.className='bt-library-layout';side.className='bt-library-sidebar';side.setAttribute('aria-label','Library folders');main.className='bt-library-main';crumbs.className='bt-library-breadcrumbs';crumbs.setAttribute('aria-label','Folder path');grid.className='bt-library-grid';grid.setAttribute('aria-label','Folder contents');actions.className='bt-library-actions';panel.className='bt-library-operation';panel.hidden=true;
  const search=field(toolbar,'Search sets');search.type='search';search.maxLength=100;search.placeholder='Search this location';
  toolbar.append(button('New folder',()=>editPanel('create')),button('Refresh library',()=>void run(load)));
  const help=node('p','Select an item for actions. Double-click to open. Drag items onto folders, or use Move to… on any device.');help.className='bt-library-help';
  main.append(crumbs,help,actions,panel,grid,pagination);layout.append(side,main);d.append(toolbar,layout);
  const isFolder=id=>folders.some(f=>f.folder_id===id),parent=()=>isFolder(location)?location:null;
  const icon=kind=>{const i=node('span',kind==='folder'?'':kind==='sentence'?'S':'V');i.className='bt-library-icon bt-library-icon-'+kind;i.setAttribute('aria-hidden','true');return i;};
  function endPanel(){panel.hidden=true;panel.replaceChildren();}
  async function run(action){if(busy)return;busy=true;d.setAttribute('aria-busy','true');try{await action();}catch(e){if(current===epoch)showError(status,e);}finally{busy=false;if(current===epoch)d.removeAttribute('aria-busy');}}
  async function navigate(id){if(busy)return;location=id;offset=0;selected=null;search.value='';endPanel();await run(load);}
  function choose(item,kind){selected={item,kind};endPanel();drawActions();for(const c of grid.children)c.classList.toggle('is-selected',c.dataset.item===((kind==='folder'?'folder:':'set:')+(item.folder_id&&kind==='folder'?item.folder_id:item.set_id)));}
  function destinationPicker(container,excluded=null){
   const select=field(container,'Destination','','select'),root=node('option',excluded?'My Library (top level)':'Unfiled');root.value='';select.append(root);
   for(const f of folders){if(excluded&&!canMoveFolder(folders,excluded,f.folder_id))continue;const o=node('option',folderLabel(folders,f.folder_id));o.value=f.folder_id;select.append(o);}return select;
  }
  async function moveItem(entry,target){
   if(!entry)return;
   if(entry.kind==='folder'){
    if(!canMoveFolder(folders,entry.item.folder_id,target)){status.textContent='A folder cannot be moved inside itself or one of its subfolders.';return;}
    if((entry.item.parent_folder_id||null)===target)return;
    await client.moveFolder(entry.item,target);if(target)expanded.add(target);
   }else{if((entry.item.folder_id||null)===target)return;await client.move(entry.item,target);onChanged(entry.item.set_id);}
   selected=null;endPanel();await load();status.textContent=entry.kind==='folder'?'Folder moved.':'Set moved.';
  }
  function dropTarget(element,target){
   element.dataset.dropFolder=target||'';
   element.addEventListener('dragover',e=>{if(!dragged||busy||dragged.kind==='folder'&&!canMoveFolder(folders,dragged.item.folder_id,target))return;e.preventDefault();e.stopPropagation();e.dataTransfer.dropEffect='move';element.classList.add('is-drop-target');});
   element.addEventListener('dragleave',()=>element.classList.remove('is-drop-target'));
   element.addEventListener('drop',e=>{e.preventDefault();e.stopPropagation();element.classList.remove('is-drop-target');const entry=dragged;dragged=null;if(entry)void run(()=>moveItem(entry,target));});
  }
  function makeDraggable(element,item,kind){
   element.draggable=true;element.addEventListener('dragstart',e=>{if(busy||location==='trash'){e.preventDefault();return;}dragged={item,kind};e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',kind==='folder'?item.folder_id:item.set_id);element.classList.add('is-dragging');});
   element.addEventListener('dragend',()=>{dragged=null;element.classList.remove('is-dragging');for(const t of d.querySelectorAll('.is-drop-target'))t.classList.remove('is-drop-target');});
  }
  async function openSelected(){
   if(!selected)return;const {item,kind}=selected;
   if(kind==='folder'){expanded.add(item.folder_id);await navigate(item.folder_id);return;}
   await run(async()=>{const record=await client.get(item.set_id);if(current!==epoch)return;if(await onOpen(record)!==false)close();});
  }
  function editPanel(mode){
   if(busy)return;if(mode!=='create'&&!selected)return;
   panel.replaceChildren();panel.hidden=false;
   const entry=selected,form=node('form');panel.append(form);
   if(mode==='move'){
    form.append(node('h3','Move “'+entry.item.nameOrTitle+'”'));
    const target=destinationPicker(form,entry.kind==='folder'?entry.item.folder_id:null);target.value=(entry.kind==='folder'?entry.item.parent_folder_id:entry.item.folder_id)||'';
    const submit=node('button','Move here');submit.type='submit';form.append(submit,button('Cancel',endPanel));
    form.addEventListener('submit',e=>{e.preventDefault();void run(()=>moveItem(entry,target.value||null));});target.focus();return;
   }
   const name=field(form,mode==='create'?'New folder name':'Folder name',mode==='rename'?entry.item.name:'');name.maxLength=80;name.required=true;
   if(mode==='create')form.append(node('p','Inside: '+(parent()?folderLabel(folders,parent()):'My Library')));
   const submit=node('button',mode==='create'?'Create folder':'Rename');submit.type='submit';form.append(submit,button('Cancel',endPanel));
   form.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity())return;void run(async()=>{if(mode==='create'){await client.createFolder(name.value,parent());if(parent())expanded.add(parent());}else await client.renameFolder(entry.item,name.value);endPanel();selected=null;await load();status.textContent=mode==='create'?'Folder created.':'Folder renamed.';});});name.focus();
  }
  function drawActions(){
   actions.replaceChildren();if(!selected){actions.append(node('span','Choose a folder or set'));return;}
   const {item,kind}=selected;item.nameOrTitle=kind==='folder'?item.name:item.title;
   actions.append(node('strong',item.nameOrTitle));
   if(location==='trash'){actions.append(button('Restore',()=>void run(async()=>{await client.restore(item);onChanged(item.set_id);selected=null;await load();status.textContent='Set restored.';})));return;}
   actions.append(button(kind==='folder'?'Open folder':'Open in editor',()=>void openSelected()),button('Move to…',()=>editPanel('move')));
   if(kind==='folder')actions.append(button('Rename',()=>editPanel('rename')));
   actions.append(button(kind==='folder'?'Delete folder':'Delete set',()=>{
    const message=kind==='folder'?'Delete “'+item.name+'”? Its sets will move to Unfiled. Its subfolders will move up one level.':'Move “'+item.title+'” to Trash?';
    if(!confirm(message))return;void run(async()=>{if(kind==='folder'){await client.deleteFolder(item);onChanged();if(location===item.folder_id)location=item.parent_folder_id||'root';}else{await client.remove(item);onChanged(item.set_id);}selected=null;endPanel();await load();status.textContent=kind==='folder'?'Folder deleted. Its sets are in Unfiled; its subfolders moved up one level.':'Set moved to Trash.';});
   }));
  }
  function drawTree(){
   side.replaceChildren(node('h3','FOLDERS'));
   for(const [id,label] of [['root','My Library'],['all','All sets'],['unfiled','Unfiled'],['trash','Trash']]){const b=button(label,()=>void navigate(id));b.className='bt-library-location';b.setAttribute('aria-current',location===id?'page':'false');side.append(b);if(id==='root'||id==='unfiled')dropTarget(b,null);}
   const list=node('ul');list.className='bt-library-tree';side.append(list);
   const children=new Map();for(const f of folders){const k=f.parent_folder_id||null;if(!children.has(k))children.set(k,[]);children.get(k).push(f);}
   const visited=new Set();function branch(parentId,hostList){for(const f of children.get(parentId)||[]){if(visited.has(f.folder_id))continue;visited.add(f.folder_id);
    const li=node('li'),row=node('div'),childList=node('ul'),hasChildren=children.has(f.folder_id);row.className='bt-library-tree-row';
    const toggle=button(expanded.has(f.folder_id)?'−':'+',()=>{if(expanded.has(f.folder_id))expanded.delete(f.folder_id);else expanded.add(f.folder_id);drawTree();});toggle.className='bt-library-expand';toggle.disabled=!hasChildren;toggle.setAttribute('aria-label',(expanded.has(f.folder_id)?'Collapse ':'Expand ')+f.name);toggle.setAttribute('aria-expanded',String(expanded.has(f.folder_id)));row.append(toggle);
    const b=button('',()=>{expanded.add(f.folder_id);void navigate(f.folder_id);});b.className='bt-library-tree-folder';b.setAttribute('aria-label','Open folder '+f.name);b.setAttribute('aria-current',location===f.folder_id?'page':'false');b.title=folderLabel(folders,f.folder_id);b.append(icon('folder'),node('span',f.name));dropTarget(b,f.folder_id);makeDraggable(b,f,'folder');row.append(b);li.append(row);hostList.append(li);if(hasChildren&&expanded.has(f.folder_id)){li.append(childList);branch(f.folder_id,childList);}
   }}branch(null,list);
  }
  function draw(){
   drawTree();drawActions();crumbs.replaceChildren();const root=button('My Library',()=>void navigate('root'));dropTarget(root,null);crumbs.append(root);
   if(isFolder(location))for(const f of folderPath(folders,location)){const b=button(f.name,()=>void navigate(f.folder_id));dropTarget(b,f.folder_id);crumbs.append(node('span','/'),b);}
   else if(location!=='root')crumbs.append(node('span','/'),node('strong',location==='trash'?'Trash':location==='unfiled'?'Unfiled':'All sets'));
   grid.replaceChildren();const childFolders=['root','unfiled','all','trash'].includes(location)?(location==='root'?folders.filter(f=>!f.parent_folder_id):[]):folders.filter(f=>f.parent_folder_id===location);
   for(const f of childFolders)addTile(f,'folder');for(const item of items)addTile(item,item.family);
   if(!grid.children.length){const empty=node('p',search.value?'No matching sets in this location.':location==='trash'?'Trash is empty.':'This folder is empty.');empty.className='bt-library-empty';grid.append(empty);}
   pagination.replaceChildren();if(offset>0)pagination.append(button('Previous page',()=>{if(!busy){offset=Math.max(0,offset-50);void run(load);}}));if(next!==null)pagination.append(button('Next page',()=>{if(!busy){offset=next;void run(load);}}));
   function addTile(item,kind){
    const folder=kind==='folder',type=folder?'Folder':kind==='sentence'?'Sentence set':'Vocabulary set',title=folder?item.name:item.title;
    const card=node('article');card.className='bt-library-tile';card.dataset.item=(folder?'folder:':'set:')+(folder?item.folder_id:item.set_id);
    const b=button('',()=>choose(item,folder?'folder':'set'));b.className='bt-library-tile-button';b.setAttribute('aria-label',type+': '+title);b.title=title;b.append(icon(kind),node('span',title),node('small',type));b.addEventListener('dblclick',()=>{if(location!=='trash'){choose(item,folder?'folder':'set');void openSelected();}});b.addEventListener('keydown',e=>{if(e.key==='Enter'&&selected?.item===item&&location!=='trash'){e.preventDefault();void openSelected();}});card.append(b);
    if(location!=='trash'){makeDraggable(card,item,folder?'folder':'set');if(folder)dropTarget(card,item.folder_id);}grid.append(card);
   }
  }
  async function load(){
   const request=++loadEpoch,where=location,query=search.value.trim();status.textContent='Loading your private library…';
   try{const [ctx,list]=await Promise.all([client.context(),client.folders()]);if(current!==epoch||request!==loadEpoch)return;
    folders=list.folders;
    if(!['root','all','unfiled','trash'].includes(where)&&!isFolder(where)){location='root';offset=0;selected=null;await load();return;}
    const options={search:query,...(where==='root'||where==='unfiled'?{folder:null}:isFolder(where)?{folder:where}:{})};
    const result=await client.sets(where==='trash',offset,options);if(current!==epoch||request!==loadEpoch)return;items=result.sets;next=result.next_offset;
    selected=null;status.textContent=ctx.plan==='free'?ctx.saved_count+' of 5 saved sets used.':ctx.plan==='premium'?ctx.monthly_created+' of 50 new sets used this month.':ctx.saved_count+' saved sets.';draw();
   }catch(e){if(current===epoch&&request===loadEpoch){grid.replaceChildren();actions.replaceChildren();side.replaceChildren();endPanel();showError(status,e);}}
  }
  let searchTimer;search.addEventListener('input',()=>{clearTimeout(searchTimer);offset=0;selected=null;searchTimer=setTimeout(()=>{if(current===epoch)void load();},250);});
  await load();return {close};
 }
 async function save({getPayload,record=null,pending={}}){
  const {d,status,current}=shell('SAVE TO ACCOUNT');status.textContent='Loading folders…';
  let folders=[],busy=false;const form=node('form'),select=field(form,'Folder','','select'),name=field(form,'Or create a new folder');name.maxLength=80;form.append(node('p','A new folder is created inside the selected folder.'));
  const target=node('option','Unfiled');target.value='';select.append(target);
  const copy=record?field(form,'Save as a new set','','input'):null;if(copy){copy.type='checkbox';copy.checked=false;}
  const submit=node('button',record?'Save changes':'Save set');submit.type='submit';submit.disabled=true;form.append(submit);d.append(form);
  form.addEventListener('submit',e=>{e.preventDefault();if(busy||!form.reportValidity())return;void commit();});
  async function commit(){
   busy=true;submit.disabled=true;status.textContent='Saving…';
   try{
    const payload=getPayload();let folder=select.value||null;
    if(name.value.trim()){
     const f=await client.createFolder(name.value,select.value||null);if(current!==epoch)return;folder=f.folder_id;const o=node('option',f.name);o.value=f.folder_id;select.append(o);select.value=f.folder_id;name.value='';
    }
    const existing=record&&!copy?.checked?record:null,fingerprint=JSON.stringify({payload,folder,existing:existing?.set_id||null});
    if(pending.fingerprint!==fingerprint){pending.fingerprint=fingerprint;pending.key=crypto.randomUUID();}
    const result=await client.save(payload,folder,existing,pending.key);if(current!==epoch)return;
    if(result.deleted_at!==null)throw Error('This set is in Trash. Restore it in My Library before saving.');
    record=result;if(copy)copy.checked=false;submit.textContent='Save changes';pending.key=null;pending.fingerprint=null;onSaved(result);status.textContent='Saved to your account.';
   }catch(e){if(current===epoch)showError(status,e);}finally{busy=false;if(current===epoch)submit.disabled=false;}
  }
  try{await client.context();const list=await client.folders();if(current!==epoch)return;folders=list.folders;for(const f of folders){const o=node('option',folderLabel(folders,f.folder_id));o.value=f.folder_id;select.append(o);}select.value=record?.folder_id||'';submit.disabled=false;status.textContent='Choose a folder. Your editor stays open behind this window.';}catch(e){if(current===epoch)showError(status,e);}
  return {close};
 }
 return {browse,save,close,reset(){client.reset();close();}};
}

