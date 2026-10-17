import pathlib, tempfile, unittest
from deploy import sync


class SyncTest(unittest.TestCase):
    def test_only_changed_files(self):
        old = {"en/index.html": "a", "en/issue/x/index.html": "b", "static/app.js": "c"}
        new = {"en/index.html": "a2", "en/issue/x/index.html": "b", "static/app.js": "c"}
        self.assertEqual(sync.plan(old, new), ([], ["en/index.html"], []))

    def test_issue_pages_before_lists(self):
        new = {"en/index.html": "1", "en/issue/y/index.html": "2", "sitemap.xml": "3", "sitemap-1.xml": "4",
               "en/feed.xml": "5", "feed.json": "6", "robots.txt": "7", "og/en-home.png": "8",
               "static/styles.css": "9", "index.html": "10", "en/2026-10-18/index.html": "11"}
        first, last, deletes = sync.plan({}, new)
        self.assertEqual(first, ["en/issue/y/index.html", "og/en-home.png", "static/styles.css"])
        self.assertEqual(last, ["en/2026-10-18/index.html", "en/feed.xml", "en/index.html", "feed.json",
                                "index.html", "robots.txt", "sitemap-1.xml", "sitemap.xml"])
        self.assertEqual(deletes, [])

    def test_deletes_missing(self):
        self.assertEqual(sync.plan({"old.html": "a", "keep.css": "b"}, {"keep.css": "b"}), ([], [], ["old.html"]))

    def test_content_type(self):
        cases = {"a/index.html": "text/html; charset=utf-8", "s.css": "text/css; charset=utf-8",
                 "a.js": "text/javascript; charset=utf-8", "f.json": "application/json; charset=utf-8",
                 "sitemap.xml": "application/xml; charset=utf-8", "en/feed.xml": "application/rss+xml; charset=utf-8",
                 "o.png": "image/png", "robots.txt": "text/plain; charset=utf-8", "x.bin": "application/octet-stream"}
        for p, t in cases.items():
            self.assertEqual(sync.content_type(p), t, p)

    def test_hash_tree(self):
        root = pathlib.Path(tempfile.mkdtemp())
        (root / "en").mkdir()
        (root / "en" / "index.html").write_text("hi", encoding="utf-8")
        (root / ".nojekyll").write_text("", encoding="utf-8")
        self.assertEqual(sync.hash_tree(root),
                         {"en/index.html": "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4"})


if __name__ == "__main__":
    unittest.main()
