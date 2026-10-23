// Multilingual vocabulary API candidate — NOT deployed.
// Backward compatible with existing D1 vocabulary_sets(id,title,language,vocabulary,created_at).
// Legacy vocabulary JSON: [[target,English], ...]
// V2 vocabulary JSON: {schemaVersion:2,promptLanguage:"es-ES",pairs:[[target,prompt],...]}
// The existing "language" column continues to store the TARGET language.
const LOCALES = new Set(["en-US","es-ES","de-DE","da-DK","fr-FR","it-IT"]);
const headers={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET, POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type"};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=UTF-8",...headers}});
const createId=()=>{const alphabet="ABCDEFGHJKLMNPQRSTUVWXYZ23456789",bytes=new Uint8Array(6);crypto.getRandomValues(bytes);return Array.from(bytes,b=>alphabet[b%alphabet.length]).join("");};
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(request.method==="OPTIONS")return new Response(null,{headers});
  try{
   if(url.pathname==="/"&&request.method==="GET")return json({ok:true,service:"Boring Teacher Vocabulary API",schemaVersion:2});
   if(url.pathname==="/sets"&&request.method==="POST"){
    const body=await request.json();
    const title=typeof body.title==="string"?body.title.trim().slice(0,100):"Vocabulary Set";
    const language=typeof body.language==="string"?body.language.trim():"";
    const promptLanguage=typeof body.promptLanguage==="string"?body.promptLanguage.trim():"en-US";
    if(!LOCALES.has(language)||!LOCALES.has(promptLanguage)||language===promptLanguage)return json({error:"Choose different supported prompt and target languages."},400);
    if(!Array.isArray(body.pairs)||body.pairs.length<5||body.pairs.length>200)return json({error:"A set must contain between 5 and 200 word pairs."},400);
    const pairs=[];
    for(const pair of body.pairs){
     if(!Array.isArray(pair)||pair.length!==2||pair.some(x=>typeof x!=="string"||!x.trim()||x.trim().length>200))return json({error:"Invalid word pair."},400);
     pairs.push(pair.map(x=>x.trim()));
    }
    // Keep legacy storage unchanged for English prompts, reducing regression risk.
    const stored=promptLanguage==="en-US"?pairs:{schemaVersion:2,promptLanguage,pairs};
    let id,created=false;
    for(let i=0;i<5&&!created;i++){
     id=createId();
     try{
      await env.DB.prepare("INSERT INTO vocabulary_sets (id,title,language,vocabulary) VALUES (?,?,?,?)").bind(id,title,language,JSON.stringify(stored)).run();
      created=true;
     }catch(e){if(!String(e).toLowerCase().includes("unique"))throw e;}
    }
    if(!created)throw Error("Unable to allocate unique set ID.");
    return json({ok:true,id,title,language,promptLanguage,wordCount:pairs.length},201);
   }
   if(request.method==="GET"&&url.pathname.startsWith("/sets/")){
    const id=url.pathname.slice(6).trim().toUpperCase();
    if(!/^[A-Z0-9]{6}$/.test(id))return json({error:"Invalid set ID."},400);
    const row=await env.DB.prepare("SELECT id,title,language,vocabulary,created_at FROM vocabulary_sets WHERE id=?").bind(id).first();
    if(!row)return json({error:"Vocabulary set not found."},404);
    const data=JSON.parse(row.vocabulary);
    const legacy=Array.isArray(data);
    const promptLanguage=legacy?"en-US":data?.promptLanguage;
    const pairs=legacy?data:data?.pairs;
    if(!LOCALES.has(promptLanguage)||promptLanguage===row.language||!Array.isArray(pairs))throw Error("Invalid stored vocabulary.");
    return json({ok:true,set:{id:row.id,title:row.title,language:row.language,promptLanguage,pairs,createdAt:row.created_at}});
   }
   return json({error:"Not found."},404);
  }catch(e){console.error(e);return json({error:"Server error."},500);}
 }
};
