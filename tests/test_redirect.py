import pathlib, tempfile, unittest
from gen import redirect


class RedirectTest(unittest.TestCase):
    def test_redirect_keeps_path(self):
        h = redirect.page("https://gtdaily.news", "/world-issues")
        self.assertIn('location.replace(B+p+location.search+location.hash)', h)
        self.assertIn('var B="https://gtdaily.news"', h)
        self.assertIn('var P="/world-issues"', h)

    def test_fallbacks_without_js(self):
        h = redirect.page("https://gtdaily.news", "/world-issues")
        self.assertIn('<meta http-equiv="refresh" content="0;url=https://gtdaily.news/">', h)
        self.assertIn('<link rel="canonical" href="https://gtdaily.news/">', h)
        self.assertIn('<meta name="robots" content="noindex">', h)
        self.assertIn('href="https://gtdaily.news/"', h)

    def test_escapes_base(self):
        h = redirect.page('https://x.test/"<', "")
        self.assertNotIn('"<', h.split("<script>")[0])
        self.assertNotIn("</script><", h.replace("</script></head>", ""))

    def test_write_files(self):
        out = pathlib.Path(tempfile.mkdtemp()) / "gh"
        redirect.write(out, "https://gtdaily.news", "/world-issues")
        self.assertEqual(sorted(p.name for p in out.iterdir()), [".nojekyll", "404.html", "index.html"])
        self.assertEqual((out / "index.html").read_text(encoding="utf-8"), (out / "404.html").read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
