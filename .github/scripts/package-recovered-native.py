#!/usr/bin/env python3
"""Package only freshly built, browser-tested pinned native editors."""
import gzip
import hashlib
import io
import json
import os
from pathlib import Path
import sys
import tarfile

incoming, output, old_lock = map(Path, sys.argv[1:])
lock = json.loads(old_lock.read_text())
pins = {"lightR": lock["lightR_sha"], **{a: lock["source_sha"] for a in ("paintR", "keyframeR", "fileR")}}
expected = {"lightR": "688c579b3dada389b62c8fad95a024bff1a78564",
            **{a: "279c52ddbe4d11f3309b331755c7daa08402f12a" for a in ("paintR", "keyframeR", "fileR")}}
if pins != expected:
    raise RuntimeError("Recovery matrix and pinned source lock differ; review before rebuilding")
output.mkdir(parents=True, exist_ok=True)
archive = output / "biglwa-native-editors.tar.gz"
proof = {}
total = count = 0
with archive.open("wb") as raw, gzip.GzipFile(filename="", fileobj=raw, mode="wb", mtime=0) as gz, tarfile.open(fileobj=gz, mode="w") as tar:
    for app, pin in pins.items():
        folder = incoming / ("recovered-native-" + app)
        result = json.loads((folder / "proof.json").read_text())
        if not result.get("ready") or (result.get("canvas") or {}).get("width", 0) < 640:
            raise RuntimeError(f"{app}: Chromium canvas proof missing")
        if app == "fileR" and not (result.get("fileImport") or {}).get("acknowledged"):
            raise RuntimeError("fileR: native PDF import proof missing")
        if any("renderer crashed" in str(x) for x in result.get("errors", [])):
            raise RuntimeError(f"{app}: renderer failure")
        build = folder / "build"
        if not (build / "index.html").is_file() or not any(p.stat().st_size for p in build.rglob("*.wasm") if p.is_file()):
            raise RuntimeError(f"{app}: incomplete executable build")
        for name in ("LICENSE-MIT", "LICENSE-APACHE", "NOTICE", "SOURCE.txt"):
            if not (build / "upstream-licenses" / name).is_file():
                raise RuntimeError(f"{app}: missing license {name}")
        if pin not in (build / "upstream-licenses/SOURCE.txt").read_text():
            raise RuntimeError(f"{app}: source pin mismatch")
        proof[app] = {"run_id": os.environ["GITHUB_RUN_ID"], "canvas": result["canvas"], "chromium": "passed"}
        for path in sorted(build.rglob("*")):
            if path.is_symlink():
                raise RuntimeError("Symlinks forbidden in editor archive")
            if path.is_dir():
                continue
            if not path.is_file():
                raise RuntimeError("Unexpected non-file in editor archive")
            size = path.stat().st_size
            count += 1
            total += size
            if size > 80 * 1024**2 or total > 360 * 1024**2 or count > 3499:
                raise RuntimeError("Native archive exceeds release safety limits")
            info = tarfile.TarInfo(f"bigapps/{app}/{path.relative_to(build).as_posix()}")
            info.size = size
            info.mode = 0o644
            with path.open("rb") as stream:
                tar.addfile(info, stream)
    metadata = {"schema": 1, "source_sha": lock["source_sha"], "source_shas": pins,
                "repository": os.environ["GITHUB_REPOSITORY"], "editors": proof,
                "upstream_authorship": "Storytold, MIT OR Apache-2.0; notices retained"}
    data = json.dumps(metadata, indent=2).encode()
    info = tarfile.TarInfo("biglwa-native-build.json")
    info.size = len(data)
    info.mode = 0o644
    tar.addfile(info, io.BytesIO(data))
with archive.open("rb") as stream:
    digest = hashlib.file_digest(stream, "sha256").hexdigest()
new_lock = dict(lock, tag=f"biglwa-native-recovered-{os.environ['GITHUB_RUN_ID']}-{os.environ['GITHUB_RUN_ATTEMPT']}",
                archive=archive.name, archive_sha256=digest)
(output / "native-release-lock.json").write_text(json.dumps(new_lock, indent=2) + "\n")
print("Verified recovered native editor archive:", digest)
