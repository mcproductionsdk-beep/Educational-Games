#!/usr/bin/env python3
"""Read-only Boring Teacher source/route audit. No deployment or mutations."""
import html.parser, json, os, pathlib, urllib.request
ROOT=pathlib.Path(__file__).resolve().parents[1]
GAMES={
"word-racer":"Word-Racer","word-jumper":"Word-Jumper","frog-river":"Frog-River",
"word-invaders":"Word-Invaders","word-eater":"Word-eater","word-snake":"Word-Snake",
"word-warehouse":None,"matching-columns":"Matching-Columns",
"sentences-invaders":"Sentences-Invaders","sentence-eater":None,
"sentence-warehouse":None,"conjugation-shooter":"Conjugation-Shooter",
"conjugation-adventure":"Conjugation-Adventure"}
class Links(html.parser.HTMLParser):
 def __init__(self): super().__init__(); self.hrefs=[]
 def handle_starttag(self,tag,attrs):
  if tag=="a":
   a=dict(attrs)
   if "card" in a.get("class","").split(): self.hrefs.append(a.get("href",""))
def fetch(repo,path):
 url="https://api.github.com/repos/mcproductionsdk-beep/"+repo+"/contents/"+path
 req=urllib.request.Request(url,headers={"Accept":"application/vnd.github.raw+json","User-Agent":"boringteacher-source-audit"})
 try:
  with urllib.request.urlopen(req,timeout=12) as response: return response.read()
 except Exception as e: return None
def main():
 issues=[]
 def flag(severity,code,detail): issues.append(dict(severity=severity,code=code,detail=detail))
 parser=Links();parser.feed((ROOT/"index.html").read_text(encoding="utf-8"))
 expected={"/"+slug+"/" for slug in GAMES}
 actual=set(parser.hrefs)
 for href in sorted(actual-expected): flag("ERROR","unregistered_homepage_link",href)
 for href in sorted(expected-actual): flag("WARN","registered_but_not_on_homepage",href)
 if len(parser.hrefs)!=len(actual): flag("WARN","duplicate_homepage_links",str(len(parser.hrefs)-len(actual)))
 for slug,repo in GAMES.items():
  if repo is None:
   if not (ROOT/slug/"index.html").is_file(): flag("ERROR","missing_local_index",slug)
  elif fetch(repo,"index.html") is None: flag("ERROR","missing_dedicated_index_or_api_unavailable",repo+"/index.html")
 # Prevent preview-only homepage from becoming the live homepage accidentally.
 live=(ROOT/"index.html").read_text(encoding="utf-8").lower()
 if "spacious homepage preview" in live or "arcade-homepage-spacious" in live:
  flag("ERROR","possible_preview_promotion","Review root index.html")
 # Shared Core menu hash difference is an existing known discrepancy, not automatic authority.
 import hashlib
 local=ROOT/"core/menu.js"
 if local.exists():
  local_hash=hashlib.sha256(local.read_bytes()).hexdigest()
  remote=fetch("Word-Racer","core/menu.js")
  if remote is not None and hashlib.sha256(remote).hexdigest()!=local_hash:
   flag("WARN","core_menu_divergence","Educational-Games/core/menu.js differs from Word-Racer/core/menu.js; reconcile sharing contract before syncing")
 # Known unresolved route-to-repository mismatch; cannot verify Cloudflare live routing here.
 flag("WARN","cloudflare_route_not_verified","Worker route config and public HTTP status require separate live check")
 result={"mode":"read_only","registry_count":len(GAMES),"homepage_cards":len(parser.hrefs),"issues":issues}
 out=ROOT/"source-audit-report.json";out.write_text(json.dumps(result,indent=2)+"\n",encoding="utf-8")
 print(json.dumps(result,indent=2))
 # Advisory initially: do not block existing production until baseline is resolved.
 return 0
if __name__=="__main__": raise SystemExit(main())
