#!/usr/bin/env python3
"""Publish only a matching, successful four-editor Chromium-verified Rust build.

Uses GitHub Actions artifacts from one pinned native source revision.
No production files are touched here. The caller signs a release and creates a
separate activation lock only after every check succeeds.
"""
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import sys
import tarfile
import urllib.error
import urllib.request
import zipfile

REPO = os.environ["GITHUB_REPOSITORY"]
TOKEN = os.environ["GH_TOKEN"]
PIN = os.environ["NATIVE_SOURCE_SHA"]
LIGHTR_PIN = os.environ["NATIVE_LIGHTR_SHA"]
OUT = Path(sys.argv[1])
OUT.mkdir(parents=True, exist_ok=True)
BASE = f"https://api.github.com/repos/{REPO}"
APPS = [
    ("lightR", "Build BIG LWA native lightR (pilot)", "lightR-native-wasm-test-", "lightR-chromium-evidence-"),
    ("paintR", "Build BIG LWA native paintR, keyframeR and fileR", "paintR-wasm-test-", "paintR-chromium-evidence-"),
    ("keyframeR", "Build BIG LWA native paintR, keyframeR and fileR", "keyframeR-motion-wasm-test-", "keyframeR-chromium-evidence-"),
    ("fileR", "Build BIG LWA native paintR, keyframeR and fileR", "fileR-wasm-test-", "fileR-chromium-evidence-"),
]
MAX_ZIP = 170 * 1024 * 1024
MAX_FILE = 80 * 1024 * 1024
MAX_TOTAL = 360 * 1024 * 1024

def get(url):
    req = urllib.request.Request(
        url if url.startswith("https://") else BASE + url,
        headers={"Authorization": f"Bearer {TOKEN}", "Accept": "application/vnd.github+json",
                 "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "BIG-LWA-provenance-gate"},
    )
    with urllib.request.urlopen(req, timeout=120) as response:
        if response.headers.get("Content-Length") and int(response.headers["Content-Length"]) > MAX_ZIP:
            raise RuntimeError("GitHub artifact exceeds compressed size limit")
        blob = response.read(MAX_ZIP + 1)
        if len(blob) > MAX_ZIP:
            raise RuntimeError("Oversized artifact")
        return blob

def api(path):
    return json.loads(get(path))

# The pinned source must not be obsolete because newer Rust source changed.
compare = api(f"/compare/{PIN}...biglwa-native-editors")
if compare.get("status") not in ("ahead", "identical"):
    raise RuntimeError("Pinned native source is not an ancestor of the native branch")
changed = [f["filename"] for f in compare.get("files", [])]
if compare.get("total_commits", 0) > 100 or any(
    (f.startswith("vendor/editors/") and not f.startswith("vendor/editors/photocraft/"))
    or f == ".github/scripts/native-editor-browser-smoke.cjs"
    for f in changed
):
    raise RuntimeError("Newer native editor source exists; rebuild it before publishing: " + str(changed[:12]))

# The only native difference since the three-app suite build must be the
# isolated lightR Rust monogram correction. All other app files are identical.
if "vendor/editors/photocraft/crates/ui-egui/src/brand.rs" not in changed:
    raise RuntimeError("Expected isolated lightR source correction not found")
light_compare = api(f"/compare/{LIGHTR_PIN}...biglwa-native-editors")
if light_compare.get("status") not in ("ahead", "identical") or any(
    f["filename"].startswith("vendor/editors/") for f in light_compare.get("files", [])
):
    raise RuntimeError("lightR source changed again; rebuild with current source")
runs = api("/actions/runs?branch=biglwa-native-editors&per_page=100")["workflow_runs"]
proof = {}
native = {}
for app, workflow, artifact_prefix, evidence_prefix in APPS:
    source_pin = LIGHTR_PIN if app == "lightR" else PIN
    candidates = [r for r in runs
                  if r["name"] == workflow and r["head_sha"] == source_pin
                  and r["status"] == "completed" and r["conclusion"] == "success"]
    if not candidates:
        raise RuntimeError(f"{app}: no successful, SHA-matched native build and browser test")
    run = sorted(candidates, key=lambda r: r["run_number"], reverse=True)[0]
    artifacts = api(f"/actions/runs/{run['id']}/artifacts?per_page=100")["artifacts"]
    def artifact_with(prefix):
        matches = [a for a in artifacts if a["name"] == prefix + source_pin and not a.get("expired")]
        if len(matches) != 1:
            raise RuntimeError(f"{app}: expected one unexpired artifact for {prefix}{source_pin}")
        return matches[0]
    build_art = artifact_with(artifact_prefix)
    chrome_art = artifact_with(evidence_prefix)
    with zipfile.ZipFile(io.BytesIO(get(f"/actions/artifacts/{chrome_art['id']}/zip"))) as z:
        rows = [n for n in z.namelist() if n.endswith(f"{app}.json")]
        if len(rows) != 1:
            raise RuntimeError(f"{app}: browser proof missing")
        p = json.loads(z.read(rows[0]))
        if not p.get("ready") or (p.get("canvas") or {}).get("width", 0) < 640:
            raise RuntimeError(f"{app}: actual WASM editor canvas was not verified")
        if app == "fileR" and not (p.get("fileImport") or {}).get("acknowledged"):
            raise RuntimeError("fileR: original PDF was not confirmed by native Rust import bridge")
        if any("renderer crashed" in m for m in p.get("errors", [])):
            raise RuntimeError(f"{app}: browser renderer crashed")
        proof[app] = {"run_id": run["id"], "canvas": p["canvas"], "chromium": "passed"}
    with zipfile.ZipFile(io.BytesIO(get(f"/actions/artifacts/{build_art['id']}/zip"))) as z:
        files = {}
        total = 0
        for item in z.infolist():
            if item.is_dir():
                continue
            parts = PurePosixPath(item.filename)
            if parts.is_absolute() or ".." in parts.parts or len(parts.parts) > 12:
                raise RuntimeError(f"{app}: unsafe ZIP path")
            if item.file_size > MAX_FILE:
                raise RuntimeError(f"{app}: file exceeds GitHub Pages limit")
            if ((item.external_attr >> 16) & 0o170000) == 0o120000:
                raise RuntimeError(f"{app}: symlink forbidden")
            if item.filename in files:
                raise RuntimeError(f"{app}: duplicate ZIP member")
            total += item.file_size
            if total > MAX_TOTAL:
                raise RuntimeError(f"{app}: expanded archive exceeds limit")
            files[item.filename] = z.read(item)
    if "index.html" not in files or not any(x.endswith(".wasm") for x in files):
        raise RuntimeError(f"{app}: missing executable browser editor")
    for license_name in ("LICENSE-MIT", "LICENSE-APACHE", "NOTICE"):
        if f"upstream-licenses/{license_name}" not in files:
            raise RuntimeError(f"{app}: missing {license_name}")
    source_label = f"{app} BIG LWA customized Rust build at {source_pin}\nOriginal engine by Storytold; original source licenses and notices preserved.\n"
    files["upstream-licenses/SOURCE.txt"] = source_label.encode()
    native[app] = files
    print(f"PASS {app}: {len(files)} native files, {total} bytes, Chromium and license proof from run {run['id']}", flush=True)

package = OUT / "biglwa-native-editors.tar.gz"
meta = {"schema": 1, "source_sha": PIN, "source_shas": {app: (LIGHTR_PIN if app == "lightR" else PIN) for app in native}, "repository": REPO, "editors": proof,
        "upstream_authorship": "Storytold, MIT OR Apache-2.0; notices retained"}
with tarfile.open(package, mode="w:gz") as archive:
    for app, files in native.items():
        for filename, content in files.items():
            info = tarfile.TarInfo(f"bigapps/{app}/{filename}")
            info.size = len(content)
            info.mode = 0o644
            archive.addfile(info, io.BytesIO(content))
    data = (json.dumps(meta, indent=2) + "\n").encode()
    info = tarfile.TarInfo("biglwa-native-build.json")
    info.mode, info.size = 0o644, len(data)
    archive.addfile(info, io.BytesIO(data))

digest = hashlib.sha256(package.read_bytes()).hexdigest()
lock = {"tag": "biglwa-native-20261023", "archive": package.name,
        "archive_sha256": digest, "source_sha": PIN, "lightR_sha": LIGHTR_PIN}
(OUT / "native-release-lock.json").write_text(json.dumps(lock, indent=2) + "\n")
print("Native publication package verified:", json.dumps(lock))
