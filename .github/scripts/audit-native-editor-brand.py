#!/usr/bin/env python3
"""Audit visible legacy product strings in BIG LWA's four native Rust editors.

This does not rewrite Rust crate names, file extensions, binary formats, serialized
command IDs, or original LICENSE/NOTICE/ATTRIBUTION text. Those are NOT UI copy.
"""
from __future__ import annotations
from pathlib import Path
import json
import re
import sys

repo=Path(__file__).resolve().parents[2]
engines={"photocraft":"lightR","vectorcraft":"paintR","effectcraft":"keyframeR","pdfcraft":"fileR"}
legacy=re.compile(r"PhotoCraft|VectorCraft|EffectCraft|PdfCraft|ArtCraft|getartcraft\\.com|github\\.com/storytold|discord\\.gg/artcraft",re.I)
visible=re.compile(r'(?:tl!\\s*\\(|RichText::new|\\.label\\s*\\(|Window::new|ui\\.button|label\\s*:|description\\s*:|Help|About|Welcome|website|github|Discord|Url|link)',re.I)
report={"apps":{},"total_visible":0}
for app,new in engines.items():
    base=repo/"vendor"/"editors"/app
    out=[]
    for directory in (base/"crates"/"ui-egui"/"src",base/"apps"):
        if not directory.exists():
            continue
        for path in directory.rglob("*"):
            if not path.is_file() or path.suffix not in {".rs",".html",".js"}:
                continue
            # Only human-facing UI and browser entrypoints, not test modules.
            raw=path.read_text(encoding="utf-8",errors="replace")
            if path.suffix==".rs" and "#[cfg(test)]" in raw:
                raw=raw.split("#[cfg(test)]",1)[0]
            for line_number,line in enumerate(raw.splitlines(),1):
                if legacy.search(line) and visible.search(line) and not line.lstrip().startswith("//"):
                    out.append({"path":str(path.relative_to(repo)),"line":line_number,"text":line.strip()[:260]})
    report["apps"][new]={"engine":app,"visible_candidates":len(out),"examples":out[:75]}
    report["total_visible"]+=len(out)
report_file=Path(sys.argv[1]) if len(sys.argv)>1 else Path("/tmp/native-editor-brand-audit.json")
report_file.parent.mkdir(parents=True,exist_ok=True)
report_file.write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
print(f"Native BIG LWA old-brand UI-string audit: {report['total_visible']} candidates (some are intentional licensing or source comments).")
for name,data in report["apps"].items():
    print(f"  {name}: {data['visible_candidates']} candidate UI strings")
    for issue in data["examples"][:8]:
        print(f"   - {issue['path']}:{issue['line']} {issue['text']}")
print("Source-safe policy: original upstream authorship/licenses remain intact. Never rewrite command IDs or internal document formats.")
