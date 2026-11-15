#!/usr/bin/env python3
"""Read curated public employer ATS job boards without importing an unrelated app.

The uploaded JobSync actions describe Greenhouse/Lever/Ashby boards but depend on
missing Next.js modules, Prisma auth and server actions. This small adapter uses
those providers' documented PUBLIC GET APIs only, on vetted board tokens.
No applications, credentials, passwords, personal profiles, private endpoints,
proxy bypass, browser emulation or remote code execution.
"""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, HTTPRedirectHandler, ProxyHandler, build_opener

HOSTS = {
    "greenhouse": "boards-api.greenhouse.io",
    "lever": "api.lever.co",
    "ashby": "api.ashbyhq.com",
    "pinpoint": "pinpointhq.com",  # publicly documented, keyless postings feed
}
TOKEN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]{0,59}$")
MAX_BOARDS = 16
MAX_RESULTS_PER_BOARD = 40
MAX_RESPONSE = 4 * 1024 * 1024


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def safe_config(path: Path) -> list[dict]:
    doc = json.loads(path.read_text(encoding="utf-8"))
    boards = doc.get("boards")
    if doc.get("schema") != 1 or not isinstance(boards, list) or len(boards) > MAX_BOARDS:
        raise ValueError("Invalid ATS board configuration")
    result = []
    for row in boards:
        if not isinstance(row, dict):
            raise ValueError("ATS board entries must be objects")
        provider = row.get("provider")
        token = row.get("token")
        name = str(row.get("name") or "").strip()[:100]
        limit = row.get("limit", 10)
        keywords = row.get("keywords", [])
        if provider not in HOSTS or not isinstance(token, str) or not TOKEN.fullmatch(token):
            raise ValueError("Unsupported ATS board provider or token")
        if not name or type(limit) is not int or not 1 <= limit <= MAX_RESULTS_PER_BOARD:
            raise ValueError("Invalid ATS board name or result limit")
        if not isinstance(keywords, list) or len(keywords) > 24 or any(not isinstance(k, str) or len(k) > 45 for k in keywords):
            raise ValueError("Invalid ATS title keywords")
        result.append({"provider": provider, "token": token, "name": name, "limit": limit,
                       "keywords": [k.strip().lower() for k in keywords if k.strip()]})
    return result


def endpoint(board: dict) -> str:
    provider, token = board["provider"], board["token"]
    if provider == "greenhouse":
        return f"https://boards-api.greenhouse.io/v1/boards/{token}/jobs"
    if provider == "lever":
        return f"https://api.lever.co/v0/postings/{token}?mode=json&limit=100"
    if provider == "pinpoint":
        return f"https://{token}.pinpointhq.com/postings.json"
    return f"https://api.ashbyhq.com/posting-api/job-board/{token}"


def get_json(url: str) -> object:
    opener = build_opener(ProxyHandler({}), NoRedirect())
    request = Request(url, headers={"Accept": "application/json", "User-Agent": "BIGLWA-WerkSourceReader/1.0 (read-only public boards)"})
    with opener.open(request, timeout=12) as response:
        if response.status != 200:
            raise ValueError("Unexpected ATS response status")
        raw = response.read(MAX_RESPONSE + 1)
        if len(raw) > MAX_RESPONSE:
            raise ValueError("ATS job response too large")
        return json.loads(raw)


def normalize_board_rows(board: dict, payload: object) -> list[dict]:
    provider = board["provider"]
    if provider == "lever":
        entries = payload if isinstance(payload, list) else []
    elif provider == "pinpoint" and isinstance(payload, dict):
        entries = payload.get("data", [])
    elif isinstance(payload, dict):
        entries = payload.get("jobs", [])
    else:
        entries = []
    if not isinstance(entries, list):
        raise ValueError("Unexpected ATS jobs payload")

    collected = []
    for job in entries[:200]:
        if not isinstance(job, dict):
            continue
        if provider == "ashby" and job.get("isListed") is not True:
            continue  # Do not surface unlisted Ashby positions.
        if provider == "greenhouse":
            title = job.get("title")
            location = (job.get("location") or {}).get("name", "")
            url = job.get("absolute_url")
            date = job.get("first_published") or job.get("updated_at") or ""
            searchable = " ".join([str(title or ""), str(job.get("department") or "")])
        elif provider == "lever":
            title = job.get("text")
            categories = job.get("categories") or {}
            location = categories.get("location") or ""
            url = job.get("hostedUrl") or job.get("applyUrl")
            created = job.get("createdAt")
            date = (datetime.fromtimestamp(created / 1000, tz=timezone.utc).date().isoformat()
                    if isinstance(created, (int, float)) and created > 0 else "")
            searchable = " ".join([str(title or ""), str(categories.get("team") or "")])
        elif provider == "pinpoint":
            title = job.get("title")
            place = job.get("location") or {}
            location = place.get("name", "") if isinstance(place, dict) else str(place)
            url = job.get("url")
            date = job.get("published_at") or job.get("created_at") or ""
            department = job.get("department") or {}
            department_name = department.get("name", "") if isinstance(department, dict) else str(department)
            searchable = " ".join([str(title or ""), department_name])
        else:
            title = job.get("title")
            location = job.get("location") or ""
            url = job.get("jobUrl") or job.get("applyUrl")
            date = job.get("publishedAt") or ""
            searchable = " ".join([str(title or ""), str(job.get("department") or ""), str(job.get("team") or "")])
        if not title or not url:
            continue
        if board["keywords"] and not any(term in searchable.lower() for term in board["keywords"]):
            continue
        collected.append({
            "title": str(title).strip()[:160],
            "company": board["name"],
            "site": provider,
            "location": str(location).strip()[:120],
            "job_url": str(url).strip()[:1000],
            "date_posted": str(date)[:10],
            "searchTerm": "",
        })
        if len(collected) >= board["limit"]:
            break
    return collected


def collect_ats(path: Path) -> tuple[list[dict], list[str], list[dict]]:
    rows, sources, details = [], set(), []
    for board in safe_config(path):
        try:
            payload = get_json(endpoint(board))
            found = normalize_board_rows(board, payload)
            rows.extend(found)
            if found:
                sources.add(board["provider"])
            details.append({"name": board["name"], "provider": board["provider"],
                            "count": len(found), "status": "ok"})
        except (HTTPError, URLError, ValueError, TimeoutError, OSError, json.JSONDecodeError) as exc:
            details.append({"name": board["name"], "provider": board["provider"],
                            "count": 0, "status": "unavailable"})
            print(f"ATS board unavailable: {board['name']} ({type(exc).__name__})")
    return rows, sorted(sources), details
