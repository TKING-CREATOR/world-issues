import datetime as dt, json, unittest
from gen import news

NOW = dt.datetime(2026, 10, 17, 20, 30, tzinfo=dt.timezone.utc)

RSS = b"""<?xml version="1.0"?><rss version="2.0"><channel><title>X</title>
<item><title>Fresh &amp; big</title><link>https://a.test/1</link><pubDate>Sat, 17 Oct 2026 10:30:00 GMT</pubDate>
<description>&lt;p&gt;Hello &lt;b&gt;world&lt;/b&gt;&lt;/p&gt;</description></item>
<item><title>Old one</title><link>https://a.test/2</link><pubDate>Mon, 12 Oct 2026 10:30:00 GMT</pubDate></item>
<item><title>No date</title><link>https://a.test/3</link></item>
</channel></rss>"""

ATOM = b"""<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom">
<entry><title>Atom item</title><link href="https://b.test/1"/><updated>2026-10-17T09:00:00Z</updated></entry></feed>"""

RDF = b"""<?xml version="1.0"?><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns="http://purl.org/rss/1.0/" xmlns:dc="http://purl.org/dc/elements/1.1/">
<item rdf:about="https://c.test/1"><title>RDF item</title><link>https://c.test/1</link><dc:date>2026-10-17T08:00:00+02:00</dc:date></item></rdf:RDF>"""

TRENDS = b"""<?xml version="1.0"?><rss xmlns:ht="https://trends.google.com/trending/rss" version="2.0"><channel>
<item><title>keyword one</title><ht:approx_traffic>2000+</ht:approx_traffic><link>https://trends.google.com/x</link>
<pubDate>Sat, 17 Oct 2026 03:20:00 -0700</pubDate>
<ht:news_item><ht:news_item_title>Story A</ht:news_item_title><ht:news_item_url>https://d.test/a</ht:news_item_url><ht:news_item_source>Outlet</ht:news_item_source></ht:news_item>
</item></channel></rss>"""


class NewsTest(unittest.TestCase):
    def test_parse_rss(self):
        items = news.parse(RSS)
        self.assertEqual([x["title"] for x in items], ["Fresh & big", "Old one", "No date"])
        self.assertEqual(items[0]["url"], "https://a.test/1")
        self.assertEqual(items[0]["time"], "2026-10-17T10:30:00+00:00")
        self.assertEqual(items[0]["desc"], "Hello world")
        self.assertIsNone(items[2]["time"])

    def test_parse_atom_and_rdf(self):
        self.assertEqual(news.parse(ATOM), [{"title": "Atom item", "url": "https://b.test/1", "time": "2026-10-17T09:00:00+00:00", "desc": ""}])
        self.assertEqual(news.parse(RDF)[0]["time"], "2026-10-17T06:00:00+00:00")

    def test_parse_trends(self):
        t = news.parse(TRENDS, kind="trends")[0]
        self.assertEqual(t["title"], "keyword one")
        self.assertEqual(t["traffic"], "2000+")
        self.assertEqual(t["news"], [{"title": "Story A", "url": "https://d.test/a", "source": "Outlet"}])

    def test_collect_filters_dedupes_and_records_errors(self):
        feeds = [("korea", "A", "https://a.test/rss", "news"), ("korea", "A2", "https://a2.test/rss", "news"),
                 ("korea", "T", "https://t.test/rss", "trends"), ("usa", "Broken", "https://x.test/rss", "news")]
        bodies = {"https://a.test/rss": RSS, "https://a2.test/rss": RSS, "https://t.test/rss": TRENDS}

        def fetch(url):
            if url not in bodies:
                raise OSError("boom")
            return bodies[url]

        d = news.collect(fetch, NOW, feeds)
        self.assertEqual(d["collected"], "2026-10-17T20:30:00+00:00")
        k = d["countries"]["korea"]
        self.assertEqual([x["title"] for x in k["news"]], ["Fresh & big"])   # 36시간 밖·날짜 없음 제외, 같은 주소는 한 번
        self.assertEqual(k["news"][0]["source"], "A")
        self.assertEqual(k["trends"][0]["title"], "keyword one")
        self.assertEqual(d["countries"]["usa"], {"news": [], "trends": []})
        self.assertEqual(d["errors"], ["Broken"])
        json.dumps(d)

    def test_trends_with_same_link_all_kept(self):
        two = TRENDS.replace(b"</channel>", b"<item><title>keyword two</title><link>https://trends.google.com/x</link>"
                                            b"<pubDate>Sat, 17 Oct 2026 04:20:00 -0700</pubDate></item></channel>")
        d = news.collect(lambda u: two, NOW, [("korea", "T", "https://t.test/rss", "trends")])
        self.assertEqual([x["title"] for x in d["countries"]["korea"]["trends"]], ["keyword one", "keyword two"])

    def test_feed_list_covers_every_country(self):
        from gen import config as C
        for c in C.COUNTRIES:
            self.assertTrue(any(f[0] == c and f[3] == "news" for f in news.FEEDS), c)
        self.assertEqual(len({f[2] for f in news.FEEDS}), len(news.FEEDS))


if __name__ == "__main__":
    unittest.main()
