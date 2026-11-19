"""Offline coverage for BIG LWA's configured discovery topic scans."""
import importlib.util
import json
import re
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
MODULE = ROOT / 'scripts/refresh-discovery.py'
spec = importlib.util.spec_from_file_location('refresh_discovery', MODULE)
refresh = importlib.util.module_from_spec(spec)
spec.loader.exec_module(refresh)

class RefreshDiscoveryTopicsTest(unittest.TestCase):
    NOW = '2026-11-18T03:00:00+00:00'

    def config(self, source_ids, terms, topic_id='gt6-live'):
        return {'topics': [{
            'id': topic_id,
            'label': 'Configured test topic',
            'guide': '/gt6-live-preview/',
            'sourceIds': source_ids,
            'terms': terms,
        }]}

    def item(self, title, source_id='markiplier', fetched=None, published=None, url=None):
        return {
            'title': title,
            'sourceId': source_id,
            'sourceName': 'Markiplier' if source_id == 'markiplier' else 'Other source',
            'publisher': 'Configured channel',
            'url': url or 'https://www.youtube.com/watch?v=abcdefghijk',
            'publishedAt': published or '2026-11-18T01:00:00+00:00',
            'fetchedAt': fetched or self.NOW,
            'kind': 'video',
        }

    def test_scan_topics_uses_only_fresh_allowed_sources_and_safe_links(self):
        config = self.config(['markiplier'], [r'\bgt6\b', r'gta\s*(?:6|vi)'])
        items = [
            self.item('GT6 gameplay from an original channel'),
            self.item('GTA VI original video', published='2026-11-18T02:00:00+00:00'),
            self.item('Stale GT6 item', fetched='2026-11-17T03:00:00+00:00'),
            self.item('Disallowed GT6 item', source_id='other'),
            self.item('Unrelated original video'),
            self.item('Unsafe GT6 item', url='javascript:alert(1)'),
            self.item('Insecure GT6 item', url='http://www.youtube.com/watch?v=abcdefghijM'),
        ]
        with patch.object(refresh, 'NOW', self.NOW):
            trends = refresh.scan_topics(items, config)
        self.assertEqual(len(trends), 1)
        trend = trends[0]
        self.assertEqual(trend['id'], 'gt6-live')
        self.assertEqual(trend['guide'], '/gt6-live-preview/')
        self.assertEqual(trend['generatedAt'], self.NOW)
        self.assertEqual(trend['sourceIds'], ['markiplier'])
        self.assertEqual(trend['totalMatches'], 2)
        self.assertEqual([row['title'] for row in trend['items']],
                         ['GTA VI original video', 'GT6 gameplay from an original channel'])
        for row in trend['items']:
            self.assertEqual(row['source'], 'Markiplier')
            self.assertEqual(row['sourceId'], 'markiplier')
            self.assertTrue(row['url'].startswith('https://'))
            for forbidden in ('rank', 'viewerCount', 'viewers', 'liveStatus', 'liveNow'):
                self.assertNotIn(forbidden, row)

    def test_scan_topics_sorts_by_publish_date_and_bounds_output(self):
        config = self.config(['*'], [r'\bgameplay\b'], topic_id='live-gaming')
        items = [self.item('Gameplay %02d' % index,
                           published='2026-11-18T%02d:00:00+00:00' % index)
                 for index in range(8)]
        with patch.object(refresh, 'NOW', self.NOW):
            trend = refresh.scan_topics(items, config)[0]
        self.assertEqual(trend['totalMatches'], 8)
        self.assertEqual(len(trend['items']), 6)
        self.assertEqual(trend['items'][0]['title'], 'Gameplay 07')
        self.assertEqual(trend['items'][-1]['title'], 'Gameplay 02')
        self.assertTrue(all(row['matchedTerms'] == 1 for row in trend['items']))

    def test_configured_topics_are_finite_local_and_allowlisted(self):
        topics = json.loads((ROOT / 'data/discovery/topics.json').read_text(encoding='utf-8'))
        sources = json.loads((ROOT / 'data/discovery/sources.json').read_text(encoding='utf-8'))
        self.assertEqual(topics['v'], '20261118-1')
        self.assertRegex(topics['note'], r'No arbitrary URLs, no viewer counts, no ranking')
        expected = ['gt6-live', 'live-gaming', 'storage-transfer',
                    'file-type-changers', 'online-video-editors']
        self.assertEqual([topic['id'] for topic in topics['topics']], expected)
        source_ids = {source['id'] for source in sources['channels']}
        for topic in topics['topics']:
            self.assertTrue(topic['terms'])
            self.assertTrue((ROOT / topic['guide'].lstrip('/') / 'index.html').is_file(), topic['id'])
            for source_id in topic['sourceIds']:
                self.assertTrue(source_id == '*' or source_id in source_ids,
                                '%s allows %s' % (topic['id'], source_id))
            for term in topic['terms']:
                self.assertIsNone(re.search(r'https?:|javascript:', term, re.I), topic['id'])
        gt6 = next(topic for topic in topics['topics'] if topic['id'] == 'gt6-live')
        self.assertEqual(set(gt6['sourceIds']),
                         {'markiplier', 'cory', 'jacksepticeye', 'dream', 'cupquake'})

    def test_refresh_writes_provenance_and_topic_scan(self):
        source = MODULE.read_text(encoding='utf-8')
        self.assertIn('def scan_topics(items, config):', source)
        self.assertIn("result['trends'] = scan_topics", source)
        self.assertIn("sourceId=source['id']", source)
        self.assertIn("sourceName=source['name']", source)
        self.assertIn("kind='video'", source)
        self.assertIn("kind='story'", source)
        latest = json.loads((ROOT / 'assets/discovery/latest.json').read_text(encoding='utf-8'))
        self.assertTrue(isinstance(latest.get('trends'), list))
        self.assertEqual([trend['id'] for trend in latest['trends']],
                         ['gt6-live', 'live-gaming', 'storage-transfer',
                          'file-type-changers', 'online-video-editors'])
        for trend in latest['trends']:
            self.assertEqual(trend['generatedAt'], latest['generatedAt'])
            self.assertTrue(isinstance(trend['totalMatches'], int))
            self.assertLessEqual(len(trend['items']), 6)
            for item in trend['items']:
                self.assertTrue(item['url'].startswith('https://'))
                self.assertTrue(item['source'])
                self.assertTrue(item['sourceId'])

if __name__ == '__main__':
    unittest.main()
