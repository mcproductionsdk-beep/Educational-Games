"""Download only the pinned test dependency; verify bytes before browser execution."""
import hashlib,json,pathlib,urllib.request
spec=json.loads(pathlib.Path('platform/tests/engine-reference.json').read_text())
root=pathlib.Path('.runtime-engine-fixture')
for name,digest in spec['files'].items():
    url=f"https://raw.githubusercontent.com/{spec['repository']}/{spec['commit']}/{name}"
    data=urllib.request.urlopen(url,timeout=30).read()
    if hashlib.sha256(data).hexdigest()!=digest:
        raise SystemExit('Engine test dependency hash mismatch: '+name)
    path=root/name
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_bytes(data)
print('Verified pinned engine dependency',spec['commit'])
