"""Install version-pinned, open-source ArtCraft web editors during Pages deployment.

Releases are fetched from upstream GitHub, checked against upstream SHA256SUMS,
unpacked with traversal/size guards, and staged under /bigapps/<name>/.
Failures never block the normal BIG LWA site: manifest.available is only true
for a complete, checksum-verified build with source license notices.
"""
from __future__ import annotations

from pathlib import Path, PurePosixPath
import hashlib
import io
import os
import tarfile
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
PUBLIC_NAMES = {"photocraft": "lightR", "vectorcraft": "paintR", "effectcraft": "keyframeR", "pdfcraft": "fileR"}
MAX_ZIP_BYTES = 90 * 1024 * 1024
MAX_EXPANDED_BYTES = 180 * 1024 * 1024
MAX_ASSET_BYTES = 80 * 1024 * 1024  # GitHub Pages, not Cloudflare Pages


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
                raise ValueError(f"Individual asset too large for GitHub Pages: {name} ({member.file_size} bytes)")
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



def brand_web_shell(slug: str, dest: Path) -> None:
    """Apply only BIG LWA's standalone browser chrome to the pinned release.
    WASM engine binaries, upstream licenses and original source stay unmodified.
    The deep app UI is not claimed to be fully rebranded yet."""
    names = {"photocraft": "lightR", "vectorcraft": "paintR",
             "effectcraft": "keyframeR", "pdfcraft": "fileR"}
    page = dest / "index.html"
    html = page.read_text(encoding="utf-8")
    if "<body" not in html.lower() or "</body>" not in html.lower():
        raise ValueError("Unexpected upstream editor HTML structure")
    name = names[slug]
    html = re.sub(r"(?is)<title>.*?</title>",
                  f"<title>BIG LWA · {name}</title>", html, count=1)
    favicon = f'<link rel="icon" type="image/png" sizes="160x160" href="/assets/bigapps/icons/{name}.png?v=20261023-stitch-png-1">'
    css = ('<link rel="stylesheet" href="/assets/craft/editor-brand.css?v=20261026-native-identity-1">')
    js = ('<script defer src="/assets/craft/editor-brand.js?v=20261026-original-icons-2"></script>')
    if re.search(r"(?i)</head>", html):
        html = re.sub(r"(?i)</head>", lambda _: favicon + css + "</head>", html, count=1)
    else:
        html = re.sub(r"(?i)<body", favicon + css + "<body", html, count=1)
    html = re.sub(r"(?i)</body>", lambda _: js + "</body>", html, count=1)
    page.write_text(html, encoding="utf-8")

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


def write_legacy_redirect(legacy_root: Path, slug: str) -> None:
    """Redirect historical GitHub Pages links without duplicating WebAssembly binaries."""
    target = f"/bigapps/{PUBLIC_NAMES[slug]}/"
    folder = legacy_root / slug
    folder.mkdir(parents=True, exist_ok=True)
    html = (
        '<!doctype html><html lang="en"><head><meta charset="utf-8">'
        '<meta name="robots" content="noindex">'
        f'<title>Moved to BIG LWA · {slug}</title>'
        f'<meta http-equiv="refresh" content="0;url={target}">'
        '</head><body>'
        f'<script>location.replace({json.dumps(target)}+location.search+location.hash)</script>'
        f'<a href="{target}">Continue to BIG LWA</a>'
        '</body></html>'
    )
    (folder / "index.html").write_text(html, encoding="utf-8")



def install_verified_native_archive(archive_path: Path, public: Path) -> dict:
    """Install one four-app release made by prepare-native-release.py.

    This archive is SHA-256 pinned in the repo before the build starts. Never
    fall back to upstream if the activated release is missing or malformed.
    """
    permitted = {"lightR", "paintR", "keyframeR", "fileR"}
    seen = set()
    total = 0
    metadata = None
    with tarfile.open(archive_path, "r:gz") as archive:
        members = archive.getmembers()
        if len(members) > 3500:
            raise ValueError("Native release has too many members")
        for member in members:
            rel = PurePosixPath(member.name)
            if member.isdir():
                continue
            if not member.isfile() or rel.is_absolute() or ".." in rel.parts or member.name in seen:
                raise ValueError("Unsafe native package entry")
            seen.add(member.name)
            if member.size > MAX_ASSET_BYTES:
                raise ValueError("GitHub Pages cannot host an oversized native release file")
            total += member.size
            if total > 360 * 1024 * 1024:
                raise ValueError("Native package exceeds safe expanded size")
            if member.name == "biglwa-native-build.json":
                metadata = json.load(archive.extractfile(member))
            elif len(rel.parts) >= 3 and rel.parts[0] == "bigapps" and rel.parts[1] in permitted:
                pass
            else:
                raise ValueError("Unknown file in native editor release: " + member.name)
        if not isinstance(metadata, dict) or set(metadata.get("editors", {})) != permitted:
            raise ValueError("Native release provenance does not cover all four editors")
        for member in members:
            if not member.isfile() or member.name == "biglwa-native-build.json":
                continue
            output = public.joinpath(*PurePosixPath(member.name).parts)
            output.parent.mkdir(parents=True, exist_ok=True)
            with archive.extractfile(member) as incoming, output.open("wb") as written:
                shutil.copyfileobj(incoming, written, length=1024 * 1024)
    for app in permitted:
        where = public / "bigapps" / app
        if not (where / "index.html").is_file() or not any(where.rglob("*.wasm")):
            raise ValueError(f"Native release lacks runnable {app}")
        for license_file in ("LICENSE-MIT", "LICENSE-APACHE", "NOTICE", "SOURCE.txt"):
            if not (where / "upstream-licenses" / license_file).is_file():
                raise ValueError(f"Native release lacks {app}/{license_file}")
    return metadata


def stage(target: Path) -> None:
    target.mkdir(parents=True, exist_ok=True)
    root = target / "bigapps"
    root.mkdir(exist_ok=True)
    legacy_root = target / "craftapps"
    legacy_root.mkdir(exist_ok=True)
    (legacy_root / "index.html").write_text(
        '<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex">'
        '<meta http-equiv="refresh" content="0;url=/studio?view=tools">'
        '<a href="/studio?view=tools">Open BIG LWA Workshop</a>',
        encoding="utf-8",
    )
    native_archive = os.environ.get("BIGLWA_NATIVE_ARCHIVE")
    native_meta = install_verified_native_archive(Path(native_archive), target) if native_archive else None
    rows = []
    for slug, version in APPS:
        destination = root / PUBLIC_NAMES[slug]
        row = {"id": slug, "route": f"/bigapps/{PUBLIC_NAMES[slug]}/", "version": version, "available": False,
               "source": f"https://github.com/storytold/{slug}"}
        try:
            if native_meta:
                # Native WASM was built from BIG LWA's Rust source, not
                # downloaded from the old upstream editor releases.
                row["build"] = "biglwa-native"
                row["source"] = "https://github.com/leianmulatre-lwa/leianmulatre-lwa.github.io"
                row["commit"] = native_meta["source_sha"]
            else:
                archive = release_archive(slug, version)
                size = install_zip(archive, slug, version, destination)
                preserve_notices(slug, version, destination)
                print(f"[ArtCraft] staged upstream {slug} v{version} ({size} bytes)")
            brand_web_shell(slug, destination)
            row["available"] = True
            if native_meta:
                print(f"[BIG LWA] published verified Rust {PUBLIC_NAMES[slug]} from {native_meta['source_sha'][:12]}")
        except Exception as exc:
            if native_meta:
                # Never silently replace a bad custom Rust build with the
                # upstream editor under the exact same BIG LWA release URL.
                raise RuntimeError(f"Verified native {PUBLIC_NAMES[slug]} could not be staged: {exc}") from exc
            shutil.rmtree(destination, ignore_errors=True)
            print(f"[ArtCraft] unavailable: {slug} v{version}: {exc}", file=sys.stderr)
        rows.append(row)
        write_legacy_redirect(legacy_root, slug)
        write_legacy_redirect(root, slug)  # previous /bigapps/photocraft bookmarks
        # Older browser tabs may still request the old source/notice links.
        # Mirror only these small legal text files, never duplicate WASM assets.
        if row["available"]:
            shutil.copytree(
                destination / "upstream-licenses",
                legacy_root / slug / "upstream-licenses",
                dirs_exist_ok=True,
            )
            shutil.copytree(destination / "upstream-licenses", root / slug / "upstream-licenses", dirs_exist_ok=True)
    manifest_text = json.dumps({"schema": 1, "apps": rows}, indent=2) + "\n"
    (legacy_root / "manifest.json").write_text(manifest_text, encoding="utf-8")
    (root / "manifest.json").write_text(
        manifest_text,
        encoding="utf-8",
    )
    print("[ArtCraft] manifest:", {row["id"]: row["available"] for row in rows})


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: stage-craft-apps.py PUBLIC_DIRECTORY")
    stage(Path(sys.argv[1]).resolve())
