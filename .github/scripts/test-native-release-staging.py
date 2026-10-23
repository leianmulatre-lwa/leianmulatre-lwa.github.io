"""Offline packaging regression for BIG LWA native editor release promotion."""
import importlib.util
import io
import json
import os
from pathlib import Path
from tempfile import TemporaryDirectory
import tarfile
from unittest.mock import patch

spec=importlib.util.spec_from_file_location("stagecraft",Path(__file__).with_name("stage-craft-apps.py"))
m=importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

def add(archive,name,data):
    info=tarfile.TarInfo(name)
    info.size=len(data)
    info.mode=0o644
    archive.addfile(info,io.BytesIO(data))

with TemporaryDirectory() as tmp:
    base=Path(tmp)
    target=base/"site"
    package=base/"native.tar.gz"
    manifest={"schema":1,"source_sha":"a"*40,"editors":{name:{"chromium":"passed"} for name in m.PUBLIC_NAMES.values()}}
    with tarfile.open(package,"w:gz") as archive:
        add(archive,"biglwa-native-build.json",json.dumps(manifest).encode())
        for name in m.PUBLIC_NAMES.values():
            prefix=f"bigapps/{name}/"
            add(archive,prefix+"index.html",b"<html><head><title>Native editor</title></head><body><canvas></canvas></body></html>")
            add(archive,prefix+"editor.wasm",b"\x00asm")
            for notice in ("LICENSE-MIT","LICENSE-APACHE","NOTICE","SOURCE.txt"):
                add(archive,prefix+"upstream-licenses/"+notice,b"Original upstream license text")
    with patch.dict(os.environ,{"BIGLWA_NATIVE_ARCHIVE":str(package)}), \
         patch.object(m,"release_archive",side_effect=AssertionError("Unexpected upstream fallback")):
        m.stage(target)
    d=json.loads((target/"bigapps/manifest.json").read_text())
    assert len(d["apps"])==4
    assert all(row["available"] and row["build"]=="biglwa-native" for row in d["apps"])
    for row in d["apps"]:
        app=target/row["route"].strip("/")
        assert (app/"editor.wasm").exists()
        assert "BIG LWA" in (app/"index.html").read_text()
        assert (app/"upstream-licenses/NOTICE").exists()
        assert row["commit"]=="a"*40
    bad=base/"unsafe.tar.gz"
    with tarfile.open(bad,"w:gz") as archive:
        add(archive,"../escape.txt",b"no")
    try:
        m.install_verified_native_archive(bad,target)
        raise AssertionError("Traversal was not blocked")
    except ValueError:
        pass
print("PASS: 4 custom native editors staged without upstream fallback; unsafe tar rejected.")
