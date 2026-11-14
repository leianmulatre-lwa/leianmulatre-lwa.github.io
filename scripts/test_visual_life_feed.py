"""Offline tests for the Visual-Life feed. No job boards are contacted."""
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from types import ModuleType
from unittest.mock import Mock

MODULE=Path(__file__).parent / "visual_life_feed.py"
spec=importlib.util.spec_from_file_location("visual_life_feed", MODULE)
feed=importlib.util.module_from_spec(spec)
spec.loader.exec_module(feed)

class VisualLifeFeedTest(unittest.TestCase):
    def test_safe_links_and_trusted_origin(self):
        self.assertEqual(feed.canonical_url("https://www.indeed.com/viewjob?jk=abc"),"https://www.indeed.com/viewjob?jk=abc")
        for bad in ("http://indeed.com/job","javascript:alert(1)","https://localhost/private",
                    "https://127.0.0.1/secret","https://user:pass@example.com/secret"):
            self.assertEqual(feed.canonical_url(bad),"")

    def test_records_are_deduplicated_attributed_and_bounded(self):
        row={"title":"Creative Director","company":"Cooperative Studio","site":"indeed",
             "location":"Los Angeles","job_url":"https://indeed.com/viewjob?jk=x"}
        out=feed.normalize_rows([row,row,{"title":"Fake","company":"X","site":"unknown","job_url":"javascript:alert(1)"}])
        self.assertEqual(len(out),1)
        self.assertEqual(out[0]["source"],"indeed")
        self.assertEqual(out[0]["company"],"Cooperative Studio")

    def test_empty_scrape_never_replaces_prior_feed(self):
        with tempfile.TemporaryDirectory() as folder:
            target=Path(folder)/"jobs.json"
            target.write_text('{"preserved":true}',encoding="utf-8")
            with patch.object(feed,"DEST",target):
                with self.assertRaises(ValueError):
                    feed.write_feed([],sources=["indeed"],search_term="design",location="California")
            self.assertEqual(json.loads(target.read_text()),{"preserved":True})

    def test_source_provenance_in_generated_feed(self):
        with tempfile.TemporaryDirectory() as folder:
            target=Path(folder)/"jobs.json"
            row={"title":"Producer","company":"Studio","site":"indeed",
                 "job_url":"https://www.indeed.com/viewjob?jk=good"}
            with patch.object(feed,"DEST",target):
                created=feed.write_feed([row],sources=["indeed"],search_term="producer",location="USA")
                self.assertEqual(created["status"],"published")
                self.assertIn("JobSpy",created["source_library"])
                self.assertEqual(len(json.loads(target.read_text())["jobs"]),1)

    def test_curated_query_validation_and_batch_output(self):
        class Frame:
            attrs = {"errors": {}}
            def __init__(self, term):
                self.term = term
            def to_dict(self, orient):
                self_orient=orient
                assert self_orient=="records"
                return [{"title":self.term.title(),"company":"Verified test employer",
                         "site":"indeed","location":"Los Angeles, CA",
                         "job_url":"https://www.indeed.com/viewjob?jk="+self.term.replace(" ","-")}]
        spy=ModuleType("jobspy")
        spy.scrape_jobs=Mock(side_effect=lambda **kwargs:Frame(kwargs["search_term"]))
        with tempfile.TemporaryDirectory() as folder:
            source=Path(folder)/"searches.json"
            source.write_text(json.dumps({"schema":1,"searches":[
                {"term":"casting assistant","location":"Los Angeles, CA","source":"indeed","limit":4},
                {"term":"policy analyst","location":"Los Angeles, CA","source":"indeed","limit":4}
            ]}),encoding="utf-8")
            target=Path(folder)/"jobs.json"
            with patch.dict("sys.modules",{"jobspy":spy}),patch.object(feed,"DEST",target):
                result=feed.scrape_catalog(source)
            self.assertEqual(result["status"],"published")
            self.assertEqual(len(result["jobs"]),2)
            self.assertEqual(len(result["searches"]),2)
            self.assertEqual({row["searchTerm"] for row in result["jobs"]},{"casting assistant","policy analyst"})
            self.assertEqual(spy.scrape_jobs.call_count,2)

    def test_curated_bad_config_and_empty_result_preserve_prior_feed(self):
        spy=ModuleType("jobspy")
        spy.scrape_jobs=Mock(side_effect=RuntimeError("source unavailable"))
        with tempfile.TemporaryDirectory() as folder:
            source=Path(folder)/"searches.json"
            target=Path(folder)/"jobs.json"
            target.write_text('{"preserved":true}',encoding="utf-8")
            with patch.object(feed,"DEST",target),patch.dict("sys.modules",{"jobspy":spy}):
                source.write_text(json.dumps({"schema":1,"searches":[
                    {"term":"producer","location":"Los Angeles, CA","source":"indeed","limit":5}
                ]}),encoding="utf-8")
                with self.assertRaisesRegex(ValueError,"No valid JobSpy results"):
                    feed.scrape_catalog(source)
                self.assertEqual(json.loads(target.read_text()),{"preserved":True})
                source.write_text(json.dumps({"schema":1,"searches":[
                    {"term":"producer","location":"LA","source":"unknown","limit":5}
                ]}),encoding="utf-8")
                with self.assertRaisesRegex(ValueError,"unsupported source"):
                    feed.scrape_catalog(source)
                self.assertEqual(json.loads(target.read_text()),{"preserved":True})
                self.assertEqual(spy.scrape_jobs.call_count,1)

if __name__=="__main__":
    unittest.main()
