"""Offline regression: public ATS providers never require applicant credentials."""
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

MODULE = Path(__file__).with_name("visual_life_ats.py")
spec = importlib.util.spec_from_file_location("visual_life_ats", MODULE)
ats = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ats)


class ATSReadOnlyTest(unittest.TestCase):
    def test_only_reviewed_tokens_and_providers(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "boards.json"
            for token in ("http://127.0.0.1", "../../secret", "abc?callback=evil", "x"*80):
                path.write_text(json.dumps({"schema": 1, "boards": [
                    {"provider": "greenhouse", "token": token, "name": "Test", "limit": 3}
                ]}))
                with self.assertRaises(ValueError):
                    ats.safe_config(path)
            path.write_text(json.dumps({"schema": 1, "boards": [
                {"provider": "unknown", "token": "test", "name": "Test", "limit": 3}
            ]}))
            with self.assertRaises(ValueError):
                ats.safe_config(path)

    def test_fixed_https_endpoints_not_arbitrary_user_urls(self):
        for row, expected in [
            ({"provider":"greenhouse","token":"thenewyorktimes"}, "https://boards-api.greenhouse.io/v1/boards/thenewyorktimes/jobs"),
            ({"provider":"lever","token":"spotify"}, "https://api.lever.co/v0/postings/spotify?mode=json&limit=100"),
            ({"provider":"ashby","token":"trueshort"}, "https://api.ashbyhq.com/posting-api/job-board/trueshort")
        ]:
            self.assertEqual(ats.endpoint(row), expected)

    def test_greenhouse_job_post_fields_are_attributed(self):
        board={"provider":"greenhouse","token":"thenewyorktimes","name":"The New York Times","limit":4,"keywords":["creative"]}
        payload={"jobs":[
            {"title":"Creative Producer", "location":{"name":"Los Angeles, CA"},
             "absolute_url":"https://job-boards.greenhouse.io/thenewyorktimes/jobs/123",
             "first_published":"2026-11-10T11:00:00Z"},
            {"title":"Accountant", "location":{"name":"New York"}, "absolute_url":"https://example.org/job"}
        ]}
        jobs=ats.normalize_board_rows(board,payload)
        self.assertEqual(len(jobs),1)
        self.assertEqual(jobs[0]["company"],"The New York Times")
        self.assertEqual(jobs[0]["date_posted"],"2026-11-10")

    def test_lever_and_ashby_are_public_listed_only(self):
        lever={"provider":"lever","token":"spotify","name":"Spotify","limit":3,"keywords":["policy"]}
        jobs=ats.normalize_board_rows(lever,[{"text":"Policy Specialist","hostedUrl":"https://jobs.lever.co/spotify/a",
                        "createdAt": 1794624000000, "categories":{"location":"Los Angeles, CA","team":"Policy"}}])
        self.assertEqual(len(jobs),1)
        self.assertEqual(jobs[0]["site"],"lever")
        ashby={"provider":"ashby","token":"trueshort","name":"TrueShort","limit":2,"keywords":["design"]}
        results=ats.normalize_board_rows(ashby,{"jobs":[
            {"title":"Design Director","location":"Los Angeles","jobUrl":"https://jobs.ashbyhq.com/trueshort/a","isListed":False},
            {"title":"Designer","location":"Los Angeles","jobUrl":"https://jobs.ashbyhq.com/trueshort/b","isListed":True}
        ]})
        self.assertEqual(len(results),1)
        self.assertEqual(results[0]["job_url"],"https://jobs.ashbyhq.com/trueshort/b")

    def test_one_unavailable_board_cannot_invent_or_erase_others(self):
        with tempfile.TemporaryDirectory() as folder:
            cfg=Path(folder)/"boards.json"
            cfg.write_text(json.dumps({"schema":1,"boards":[
                {"provider":"greenhouse","name":"A","token":"a","limit":3,"keywords":["producer"]},
                {"provider":"lever","name":"B","token":"b","limit":3,"keywords":["designer"]}
            ]}))
            def mocked(url):
                if "lever" in url:
                    raise TimeoutError("board unavailable")
                return {"jobs":[{"title":"Producer","location":{"name":"Los Angeles"},
                   "absolute_url":"https://job-boards.greenhouse.io/a/jobs/1"}]}
            with patch.object(ats,"get_json",side_effect=mocked):
                rows,sources,details=ats.collect_ats(cfg)
            self.assertEqual(len(rows),1)
            self.assertEqual(sources,["greenhouse"])
            self.assertEqual(details[1]["status"],"unavailable")


if __name__=="__main__":
    unittest.main()
