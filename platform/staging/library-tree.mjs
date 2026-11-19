export function folderPath(folders,id){
 const byId=new Map(folders.map(f=>[f.folder_id,f])),parts=[],seen=new Set();
 while(id&&byId.has(id)&&!seen.has(id)){seen.add(id);const f=byId.get(id);parts.unshift(f);id=f.parent_folder_id;}
 return parts;
}
export function canMoveFolder(folders,id,parent){
 return !parent||!folderPath(folders,parent).some(f=>f.folder_id===id);
}
export function folderLabel(folders,id){return folderPath(folders,id).map(f=>f.name).join(' / ');}
