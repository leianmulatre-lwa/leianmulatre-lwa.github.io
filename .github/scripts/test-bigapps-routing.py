"""Test BIG LWA app routes without downloading the upstream WebAssembly builds."""
import importlib.util
import json
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

script = Path(__file__).with_name("stage-craft-apps.py")
spec = importlib.util.spec_from_file_location("biglwa_stage_craft_apps", script)
stager = importlib.util.module_from_spec(spec)
spec.loader.exec_module(stager)

def fake_archive(slug, version):
    return b"mock-archive"

def fake_install(archive, slug, version, dest):
    dest.mkdir(parents=True, exist_ok=True)
    (dest / "index.html").write_text('<html><head><title>Upstream editor</title></head><body>Open editor</body></html>', encoding="utf-8")
    (dest / "editor.wasm").write_bytes(b"wasm")
    return 4

def fake_notices(slug, version, dest):
    p = dest / "upstream-licenses"
    p.mkdir(exist_ok=True)
    (p / "SOURCE.txt").write_text(f"{slug} {version}", encoding="utf-8")

with TemporaryDirectory() as directory:
    dest = Path(directory)
    with patch.object(stager, "release_archive", fake_archive), \
         patch.object(stager, "install_zip", fake_install), \
         patch.object(stager, "preserve_notices", fake_notices):
        stager.stage(dest)
    new = dest / "bigapps"
    old = dest / "craftapps"
    manifest = json.loads((new / "manifest.json").read_text())
    assert manifest["schema"] == 1
    assert len(manifest["apps"]) == 4
    assert all(row["available"] for row in manifest["apps"])
    assert (old / "manifest.json").read_bytes() == (new / "manifest.json").read_bytes()
    for row in manifest["apps"]:
        slug = row["id"]
        app = new / slug
        assert (app / "editor.wasm").is_file()
        assert (app / "upstream-licenses/SOURCE.txt").is_file()
        assert (old / slug / "upstream-licenses/SOURCE.txt").read_bytes() == (app / "upstream-licenses/SOURCE.txt").read_bytes()
        assert "BIG LWA" in (app / "index.html").read_text()
        redirect = (old / slug / "index.html").read_text()
        assert f"/bigapps/{slug}/" in redirect
        assert "location.search+location.hash" in redirect
        assert not (old / slug / "editor.wasm").exists()
    assert "/studio?view=tools" in (old / "index.html").read_text()
print("PASS: /bigapps/ editors, manifest, credits, and legacy bookmark redirects.")
