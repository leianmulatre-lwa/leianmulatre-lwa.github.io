"""Install version-pinned, open-source ArtCraft web editors during Pages deployment.

Releases are fetched from upstream GitHub, checked against upstream SHA256SUMS,
unpacked with traversal/size guards, and staged under /craftapps/<name>/.
Failures never block the normal BIG LWA site: manifest.available is only true
for a complete, checksum-verified build with source license notices.
"""
from __future__ import annotations

from pathlib import Path, PurePosixPath
import hashlib
import io
import json
import re
import shutil
import stat
import sys
import urllib.request
import zipfile

APPS = (
    ("photocraft", "0.7.0"),
    ("vectorcraft", "0.9.0"),
    ("effectcraft", "0.8.0"),
    ("pdfcraft", "0.6.0"),
)
MAX_ZIP_BYTES = 90 * 1024 * 1024
MAX_EXPANDED_BYTES = 180 * 1024 * 1024
MAX_ASSET_BYTES = 25 * 1024 * 1024


def download(url: str, limit: int = MAX_ZIP_BYTES) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": "BigLWA-Craft-Installer/1.0"})
    chunks = []
    size = 0
    with urllib.request.urlopen(request, timeout=75) as response:
        while True:
            piece = response.read(1024 * 1024)
            if not piece:
                break
            size += len(piece)
            if size > limit:
                raise ValueError("Download exceeds size limit")
            chunks.append(piece)
    return b"".join(chunks)


def release_archive(slug: str, version: str) -> bytes:
    base = f"https://github.com/storytold/{slug}/releases/download/v{version}"
    filename = f"{slug}-web-{version}.zip"
    checksums = download(base + "/SHA256SUMS.txt", 1024 * 1024).decode("utf-8")
    pattern = re.compile(r"(?m)^([0-9a-fA-F]{64})\s+\*?" + re.escape(filename) + r"\s*$")
    found = pattern.search(checksums)
    if not found:
        raise ValueError("Missing release SHA256SUMS entry for " + filename)
    archive = download(base + "/" + filename)
    if hashlib.sha256(archive).hexdigest().lower() != found.group(1).lower():
        raise ValueError("Checksum verification failed")
    return archive


def install_zip(archive: bytes, slug: str, version: str, dest: Path) -> int:
    dest.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(archive)) as z:
        entries = z.infolist()
        if len(entries) > 3000:
            raise ValueError("Too many archive files")
        indexes = [
            i for i in entries if not i.is_dir() and PurePosixPath(i.filename).name == "index.html"
        ]
        if not indexes:
            raise ValueError("Web archive has no index.html")
        indexes.sort(key=lambda i: (0 if f"{slug}-web-{version}/" in i.filename else 1,
                                    len(PurePosixPath(i.filename).parts)))
        prefix = str(PurePosixPath(indexes[0].filename).parent)
        prefix = "" if prefix == "." else prefix + "/"
        expanded = 0
        for member in entries:
            name = member.filename
            parts = PurePosixPath(name).parts
            if name.startswith("/") or "\\" in name or ".." in parts or stat.S_ISLNK(member.external_attr >> 16):
                raise ValueError("Unsafe archive path")
            if member.is_dir() or (prefix and not name.startswith(prefix)):
                continue
            relative = name[len(prefix):]
            if not relative or relative.startswith(".") or PurePosixPath(relative).name in {".htaccess", "_headers"}:
                continue
            if member.file_size > MAX_ASSET_BYTES:
                raise ValueError("Individual asset exceeds safe hosting limit")
            expanded += member.file_size
            if expanded > MAX_EXPANDED_BYTES:
                raise ValueError("Expanded release exceeds size limit")
            target = dest / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            with z.open(member) as source, target.open("wb") as output:
                shutil.copyfileobj(source, output, length=1024 * 1024)
    if not (dest / "index.html").is_file() or not any(dest.rglob("*.wasm")):
        raise ValueError("Web archive is missing executable editor files")
    return expanded


def preserve_notices(slug: str, version: str, dest: Path) -> None:
    notices = dest / "upstream-licenses"
    notices.mkdir(exist_ok=True)
    for name in ("LICENSE-MIT", "LICENSE-APACHE"):
        url = f"https://raw.githubusercontent.com/storytold/{slug}/v{version}/{name}"
        (notices / name).write_bytes(download(url, 1 * 1024 * 1024))
    try:
        url = f"https://raw.githubusercontent.com/storytold/{slug}/v{version}/NOTICE"
        (notices / "NOTICE").write_bytes(download(url, 1 * 1024 * 1024))
    except Exception:
        pass
    (notices / "SOURCE.txt").write_text(
        f"{slug} version {version}\nhttps://github.com/storytold/{slug}\n"
        "Independent, open-source ArtCraft-team software; not affiliated with Adobe.\n",
        encoding="utf-8",
    )


def stage(target: Path) -> None:
    target.mkdir(parents=True, exist_ok=True)
    root = target / "craftapps"
    root.mkdir(exist_ok=True)
    rows = []
    for slug, version in APPS:
        destination = root / slug
        row = {"id": slug, "version": version, "available": False,
               "source": f"https://github.com/storytold/{slug}"}
        try:
            archive = release_archive(slug, version)
            size = install_zip(archive, slug, version, destination)
            preserve_notices(slug, version, destination)
            row["available"] = True
            print(f"[ArtCraft] staged {slug} v{version} ({size} bytes)")
        except Exception as exc:
            shutil.rmtree(destination, ignore_errors=True)
            print(f"[ArtCraft] unavailable: {slug} v{version}: {exc}", file=sys.stderr)
        rows.append(row)
    (root / "manifest.json").write_text(
        json.dumps({"schema": 1, "apps": rows}, indent=2) + "\n",
        encoding="utf-8",
    )
    print("[ArtCraft] manifest:", {row["id"]: row["available"] for row in rows})


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: stage-craft-apps.py PUBLIC_DIRECTORY")
    stage(Path(sys.argv[1]).resolve())
