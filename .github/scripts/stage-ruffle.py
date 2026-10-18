"""Stage pinned Ruffle runtime on our own origin; verify bytes before extracting."""
import hashlib,io,pathlib,sys,tarfile,urllib.request
URL = 'https://registry.npmjs.org/@ruffle-rs/ruffle/-/ruffle-0.7.1.tgz'
SHA256 = 'dc9e7407549a91accc41a14932b0b9d9a9d51a3742ce6f020888c8a76682b157'
out=pathlib.Path(sys.argv[1])/'vendor'/'ruffle'
data=urllib.request.urlopen(URL,timeout=60).read()
if hashlib.sha256(data).hexdigest()!=SHA256: raise RuntimeError('Ruffle integrity mismatch')
out.mkdir(parents=True,exist_ok=True)
with tarfile.open(fileobj=io.BytesIO(data),mode='r:gz') as archive:
 for item in archive.getmembers():
  parts=pathlib.PurePosixPath(item.name).parts
  if not item.isfile() or not parts or parts[0]!='package' or '..' in parts: continue
  target=out.joinpath(*parts[1:]);target.parent.mkdir(parents=True,exist_ok=True)
  target.write_bytes(archive.extractfile(item).read())
if not (out/'ruffle.js').exists() or not list(out.glob('*.wasm')): raise RuntimeError('Incomplete Ruffle runtime')
print('Staged verified Ruffle runtime:',out)

import base64
fixture=pathlib.Path(sys.argv[1])/'arcade'
(fixture/'flash-test.swf').write_bytes(base64.b64decode((fixture/'flash-test.b64').read_text()))
