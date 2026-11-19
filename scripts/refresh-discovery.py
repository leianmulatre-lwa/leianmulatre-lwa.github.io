"""Refresh original-source video/news metadata and checked radio listings.
No user data, keys or arbitrary input URLs. Keep last successful source on failure.
"""
import concurrent.futures as futures
import datetime as dt
import email.utils
import json
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/discovery/latest.json'
NOW = dt.datetime.now(dt.timezone.utc).isoformat()

def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'BIGLWA-Discovery/1.0 (+https://biglwa.com)', 'Accept': '*/*'})
    with urllib.request.urlopen(req, timeout=18) as r:
        return r.read(15_000_000)

def https(url):
    try:
        u = urllib.parse.urlsplit(url)
        return url if u.scheme == 'https' and u.hostname and not u.username else ''
    except ValueError:
        return ''

def radio(path):
    for host in ['de1', 'nl1', 'at1']:
        try:
            return json.loads(get('https://' + host + '.api.radio-browser.info/json/stations/' + path))
        except Exception:
            pass
    raise RuntimeError('Radio Browser unavailable')

def usable(row):
    return row.get('lastcheckok') == 1 and https(row.get('url_resolved') or row.get('url', ''))

def videos(source):
    tree = ET.fromstring(get('https://www.youtube.com/feeds/videos.xml?channel_id=' + source['channelId']))
    ns = {'a': 'http://www.w3.org/2005/Atom', 'yt': 'http://www.youtube.com/xml/schemas/2015'}
    result = []
    for entry in tree.findall('a:entry', ns)[:6]:
        vid = entry.findtext('yt:videoId', '', ns)
        if not re.fullmatch(r'[\w-]{11}', vid):
            continue
        result.append(dict(id='latest-' + vid, videoId=vid, title=entry.findtext('a:title', '', ns),
                           creator=source['name'], channelId=source['channelId'], section=source['section'],
                           sourceId=source['id'], sourceName=source['name'], tags=source['tags'],
                           publishedAt=entry.findtext('a:published', '', ns),
                           url='https://www.youtube.com/watch?v=' + vid, source='Original channel · recent uploads',
                           provider='youtube', category='lwa-tv', kind='video', fetchedAt=NOW))
    return result

def stories(source):
    tree = ET.fromstring(get(source['url']))
    rows = []
    for entry in tree.findall('.//item')[:30]:
        title = entry.findtext('title', '')
        description = re.sub('<[^>]+>', ' ', entry.findtext('description', ''))
        if source.get('pattern') and not re.search(source['pattern'], title + ' ' + description, re.I):
            continue
        url = https(entry.findtext('link', ''))
        if not url:
            continue
        date = entry.findtext('pubDate', '')
        try:
            date = email.utils.parsedate_to_datetime(date).isoformat()
        except (ValueError, TypeError):
            date = ''
        rows.append(dict(title=title, url=url, source=source['name'], sourceId=source['id'],
                         publishedAt=date, excerpt=description[:500], kind='story', fetchedAt=NOW))
    return rows[:12]

def scan_topics(items, config):
    """Match only locally configured terms against this run's allowed sources.

    Retained feed rows keep their older fetchedAt and are deliberately excluded,
    so a failed source cannot surface as "recently seen". The output contains
    source labels and original links, never rankings, viewer counts or live status.
    """
    trends = []
    for topic in config.get('topics', []):
        allowed = set(topic.get('sourceIds', []))
        matched = []
        for item in items or []:
            if item.get('fetchedAt') != NOW:
                continue
            source_id = str(item.get('sourceId') or '')
            if allowed and '*' not in allowed and source_id not in allowed:
                continue
            haystack = ' '.join(str(item.get(key) or '') for key in
                                ('title', 'excerpt', 'tags', 'creator', 'sourceName', 'source'))
            terms = [term for term in topic.get('terms', []) if re.search(term, haystack, re.I)]
            if not terms:
                continue
            url = https(item.get('url', ''))
            if not url:
                continue
            source_label = item.get('sourceName') or item.get('creator') or item.get('source') or 'Configured source'
            matched.append(dict(title=item.get('title', ''), url=url, source=source_label,
                                sourceId=source_id, publishedAt=item.get('publishedAt', ''),
                                fetchedAt=item.get('fetchedAt', NOW), kind=item.get('kind', ''),
                                matchedTerms=len(terms)))
        matched.sort(key=lambda row: row.get('publishedAt', ''), reverse=True)
        trends.append(dict(id=topic.get('id', ''), label=topic.get('label', ''),
                           guide=topic.get('guide', ''), generatedAt=NOW,
                           sourceIds=sorted(allowed), totalMatches=len(matched),
                           items=matched[:6]))
    return trends

def refresh():
    old = json.loads(OUT.read_text()) if OUT.exists() else {}
    sources = json.loads((ROOT / 'data/discovery/sources.json').read_text())
    topics = json.loads((ROOT / 'data/discovery/topics.json').read_text())
    result = dict(generatedAt=NOW, videos=[], stories=[], radio=old.get('radio', []), errors=[], trends=[])
    jobs = [('videos', s, videos) for s in sources['channels']] + [('stories', s, stories) for s in sources['feeds']]
    with futures.ThreadPoolExecutor(max_workers=6) as pool:
        running = {pool.submit(fn, s): (kind, s) for kind, s, fn in jobs}
        for job in futures.as_completed(running):
            kind, source = running[job]
            try:
                items = job.result()
                if not items:
                    raise ValueError('No matching entries')
                result[kind].extend(items)
            except Exception:
                result['errors'].append(source['id'] + ': refresh unavailable')
                result[kind].extend(x for x in old.get(kind, []) if x.get('channelId') == source.get('channelId') and kind == 'videos' or kind == 'stories' and x.get('sourceId') == source['id'])
    try:
        # One bulk country query, not fifty requests on every visitor's device.
        us = radio('search?' + urllib.parse.urlencode(dict(countrycode='US', hidebroken='true', limit=10000)))
        campuses = json.loads((ROOT / 'assets/radio/college-radio-50-states.json').read_text())['stations']
        rows = []
        for station in campuses:
            sign = re.search(r'\b[KW][A-Z]{2,4}\b', station['name'])
            matches = [r for r in us if sign and usable(r) and re.search(r'\b' + sign[0] + r'\b', r.get('name', '').upper()) and (not r.get('state') or r['state'].casefold() == station['state'].casefold())]
            matches.sort(key=lambda r: r.get('votes', 0), reverse=True)
            found = matches[0] if matches else {}
            rows.append(dict(**station, kind='college', stream=usable(found) or '', checkedAt=found.get('lastcheckoktime_iso8601', ''), directoryId=found.get('stationuuid', '')))
        # Equal country representation in this starter set; no claim of global audience rank.
        countries = ['HT', 'JM', 'MX', 'BR', 'FR', 'GB', 'GH', 'NG', 'SN', 'ZA', 'IN', 'JP']
        def world(code):
            try:
                matches = radio('search?' + urllib.parse.urlencode(dict(countrycode=code, hidebroken='true', order='clickcount', reverse='true', limit=20)))
                return next((r for r in matches if usable(r)), None)
            except Exception:
                return None
        with futures.ThreadPoolExecutor(max_workers=4) as pool:
            for code, found in zip(countries, pool.map(world, countries)):
                if found:
                    rows.append(dict(name=found['name'], school=found.get('language', ''), state=found.get('country', code), stateCode=code, homepage=https(found.get('homepage', '')), kind='world', stream=usable(found), checkedAt=found.get('lastcheckoktime_iso8601', ''), directoryId=found.get('stationuuid', '')))
        result['radio'] = rows
    except Exception:
        result['errors'].append('Radio directory: refresh unavailable; retaining last catalog')
    result['videos'].sort(key=lambda x: x.get('publishedAt', ''), reverse=True)
    result['stories'].sort(key=lambda x: x.get('publishedAt', ''), reverse=True)
    result['trends'] = scan_topics(result['videos'] + result['stories'], topics)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({k: len(result[k]) for k in ['videos', 'stories', 'radio', 'trends', 'errors']}))

if __name__ == '__main__':
    refresh()
