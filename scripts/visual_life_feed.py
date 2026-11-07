#!/usr/bin/env python3
"""Create BIG LWA Visual-Life's attributed jobs feed from vendored werk-main/JobSpy.

Manual invocation only; no credentials, proxy bypass, or scraping at import time.
A failed/empty scrape does not overwrite the last valid jobs feed.
"""
from __future__ import annotations
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit
import argparse
import ipaddress
import json
import os
import sys
import tempfile

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / "data" / "visual-life" / "jobs.json"
MAX_ROWS = 60

def canonical_url(raw: object) -> str:
    try:
        if not isinstance(raw, str):
            return ""
        p = urlsplit(raw.strip())
        if p.scheme != "https" or not p.hostname or p.username or p.password:
            return ""
        host = p.hostname.lower().strip(".")
        if host == "localhost" or host.endswith(".local"):
            return ""
        try:
            ipaddress.ip_address(host)
            return ""
        except ValueError:
            pass
        return urlunsplit(("https", p.netloc.lower(), p.path, p.query, ""))
    except Exception:
        return ""

def brief(value: object, limit: int = 140) -> str:
    if value is None:
        return ""
    s = str(value).strip()
    if s.lower() in {"none", "nan", "nat", "<na>"}:
        return ""
    return " ".join(s.split())[:limit]

def normalize_rows(rows: list[dict]) -> list[dict]:
    seen: set[str] = set()
    result = []
    for raw in rows[:MAX_ROWS * 3]:
        if not isinstance(raw, dict):
            continue
        url = canonical_url(raw.get("job_url_direct") or raw.get("job_url") or raw.get("url"))
        title, company = brief(raw.get("title")), brief(raw.get("company"))
        source = brief(raw.get("site") or raw.get("source"), 65)
        if not url or not title or not company or not source:
            continue
        key = url + "|" + title.casefold()
        if key in seen:
            continue
        seen.add(key)
        job = dict(url=url, title=title, company=company, source=source,
                   location=brief(raw.get("location"), 120),
                   postedAt=brief(raw.get("date_posted") or raw.get("postedAt"), 30))
        result.append(job)
        if len(result) >= MAX_ROWS:
            break
    return result

def write_feed(rows: list[dict], *, sources: list[str], search_term: str, location: str) -> dict:
    jobs = normalize_rows(rows)
    if not jobs:
        raise ValueError("No valid jobs returned; preserving any prior feed.")
    feed = {
        "schema": 1,
        "status": "published",
        "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "source_library": "werk-main / JobSpy 1.4.1 (MIT; Cullen Watson and contributors)",
        "search_term": brief(search_term, 100),
        "location": brief(location, 100),
        "sources": sources,
        "jobs": jobs,
        "disclaimer": "Independent discovery hints. Verify availability, compensation and employer details on the original job posting."
    }
    DEST.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=DEST.parent, delete=False) as output:
        json.dump(feed, output, indent=2, ensure_ascii=False)
        output.write("\n")
        tmp = Path(output.name)
    os.replace(tmp, DEST)
    return feed

def scrape(*, term: str, location: str, source: str, limit: int) -> dict:
    # Explicit vendored source. No implicit package upgrade or remote code execution.
    sys.path.insert(0, str(ROOT / "werk-main"))
    from jobspy import scrape_jobs  # pylint: disable=import-outside-toplevel

    if source not in {"indeed", "zip_recruiter"}:
        raise ValueError("Unreviewed job source: " + source)
    frame = scrape_jobs(
        site_name=[source],
        search_term=term,
        location=location,
        country_indeed="usa",
        results_wanted=min(max(limit, 1), 15),
        hours_old=96,
        fetch_description=False,
        verbose=1,
    )
    errors = getattr(frame, "attrs", {}).get("errors") or {}
    if errors:
        raise RuntimeError("JobSpy source returned failures: " + ", ".join(sorted(errors.keys())))
    return write_feed(frame.to_dict(orient="records"), sources=[source], search_term=term, location=location)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--term", default="creative director")
    parser.add_argument("--location", default="United States")
    parser.add_argument("--source", choices=["indeed", "zip_recruiter"], default="indeed")
    parser.add_argument("--limit", type=int, default=10)
    args = parser.parse_args()
    result = scrape(term=args.term[:100], location=args.location[:100], source=args.source, limit=args.limit)
    print("Visual-Life feed validated:", len(result["jobs"]), "jobs from", args.source)
