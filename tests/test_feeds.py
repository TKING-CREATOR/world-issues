import json, unittest
import xml.etree.ElementTree as ET
from gen import feeds
from gen.model import Page
from tests.helpers import item, make_latest

NS = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9", "x": "http://www.w3.org/1999/xhtml"}
UP = "2026-10-17T06:00:00+09:00"


def fake_pages(n):
    return [Page(l, f"issue/i{i}/", "", UP) for i in range(n) for l in ["en", "ko", "ja", "zh"]] + [Page(None, "", "", UP)]


class FeedsTest(unittest.TestCase):
    def test_sitemap_index_and_alternates(self):
        files = feeds.sitemap(fake_pages(3))
        self.assertEqual(set(files), {"sitemap.xml", "sitemap-1.xml"})
        idx = ET.fromstring(files["sitemap.xml"])
        self.assertTrue(idx.find("s:sitemap/s:loc", NS).text.endswith("/sitemap-1.xml"))
        urls = ET.fromstring(files["sitemap-1.xml"]).findall("s:url", NS)
        self.assertEqual(len(urls), 12)  # 루트는 넣지 않음(canonical이 /en/)
        alts = urls[0].findall("x:link", NS)
        self.assertEqual(len(alts), 5)  # 4개 언어 + x-default
        xd = [a.get("href") for a in alts if a.get("hreflang") == "x-default"]
        self.assertEqual(xd, ["https://tking-creator.github.io/world-issues/en/issue/i0/"])

    def test_home_x_default_is_en(self):
        files = feeds.sitemap([Page(l, "", "", UP) for l in ["en", "ko", "ja", "zh"]])
        self.assertIn('hreflang="x-default" href="https://tking-creator.github.io/world-issues/en/"', files["sitemap-1.xml"])

    def test_sitemap_chunks(self):
        files = feeds.sitemap(fake_pages(3), chunk=5)
        self.assertEqual(set(files), {"sitemap.xml", "sitemap-1.xml", "sitemap-2.xml", "sitemap-3.xml"})

    def test_rss_only_body_issues_and_escaped(self):
        good = item("good"); good["text"]["en"]["title"] = "A & B <c>"
        recs = [{"item": good, "country": "korea", "first_seen": UP, "last_updated": UP, "dates": []},
                {"item": item("thin", body=0), "country": "korea", "first_seen": UP, "last_updated": UP, "dates": []}]
        xml = feeds.rss("en", recs)
        root = ET.fromstring(xml)
        items = root.findall("channel/item")
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0].find("title").text, "A & B <c>")
        self.assertIn("+0900", items[0].find("pubDate").text)

    def test_feed_json_top_ten_per_country(self):
        from tests.helpers import item
        d = make_latest()
        d["countries"]["korea"]["items"] = [item(f"k{i}", field=["tech", "politics", "culture", "incidents"][i % 4]) for i in range(12)]
        out = json.loads(feeds.feed_json(d))
        self.assertEqual(len(out["countries"]["korea"]), 10)

    def test_feed_json(self):
        d = json.loads(feeds.feed_json(make_latest()))
        self.assertEqual(d["updated"], UP)
        top = d["countries"]["korea"][0]
        self.assertEqual(top["id"], "korea-one")
        self.assertEqual(set(top["title"]), {"en", "ko", "ja", "zh"})
        self.assertTrue(top["url"]["ko"].endswith("/ko/issue/korea-one/"))
        self.assertLessEqual(len(d["countries"]["korea"]), 5)

    def test_robots(self):
        self.assertIn("Sitemap: https://tking-creator.github.io/world-issues/sitemap.xml", feeds.robots())


if __name__ == "__main__":
    unittest.main()
