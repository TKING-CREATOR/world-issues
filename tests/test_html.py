import json, re, unittest
from gen import html as H
from tests.helpers import item


class HtmlTest(unittest.TestCase):
    def page(self, **kw):
        return H.shell("ja", "korea/", "タイトル", "説明", "<main>本文</main>", **kw)

    def test_shell_basics(self):
        p = self.page()
        self.assertIn('<html lang="ja">', p)
        self.assertIn("<title>タイトル</title>", p)
        self.assertIn('<link rel="canonical" href="https://tking-creator.github.io/world-issues/ja/korea/">', p)
        for tag, l in [("en", "en"), ("ko", "ko"), ("ja", "ja"), ("zh-Hans", "zh")]:
            self.assertIn(f'hreflang="{tag}" href="https://tking-creator.github.io/world-issues/{l}/korea/"', p)
        self.assertIn('hreflang="x-default" href="https://tking-creator.github.io/world-issues/en/korea/"', p)
        self.assertIn('href="/world-issues/ko/korea/" data-lang="ko"', p)  # 언어 메뉴는 같은 페이지의 다른 언어판으로
        self.assertIn("Noto+Sans+JP", p)
        self.assertIn('og:image" content="https://tking-creator.github.io/world-issues/og/ja-home.png"', p)

    def test_home_x_default_is_root(self):
        p = H.shell("en", "", "t", "d", "")
        self.assertIn('hreflang="x-default" href="https://tking-creator.github.io/world-issues/"', p)

    def test_root_page(self):
        p = H.shell("en", "", "t", "d", "", root=True)
        self.assertIn('<link rel="canonical" href="https://tking-creator.github.io/world-issues/en/">', p)
        self.assertIn('id="lang-suggest"', p)

    def test_escapes_title_everywhere(self):
        x = item("evil")
        x["text"]["ko"]["title"] = '"><script>alert(1)</script>'
        card = H.card("ko", x)
        self.assertNotIn("<script>alert", card)
        script = H.ld({"headline": x["text"]["ko"]["title"]})
        self.assertNotIn("</script>alert", script)
        self.assertEqual(script.count("</script>"), 1)
        body = re.search(r">(.*)</script>", script).group(1)
        self.assertEqual(json.loads(body)["headline"], x["text"]["ko"]["title"])
        p = H.shell("ko", "", x["text"]["ko"]["title"], x["text"]["ko"]["title"], "")
        self.assertNotIn("<script>alert", p)

    def test_title_link_internal_or_sns(self):
        self.assertIn('href="/world-issues/en/issue/a/"', H.title_link("en", item("a")))
        sns = H.title_link("en", item("a", body=0))
        self.assertIn("search.naver.com", sns)
        self.assertIn('target="_blank"', sns)

    def test_crumbs(self):
        vis, data = H.crumbs("en", [("Korea", "korea/")])
        self.assertIn('href="/world-issues/en/korea/"', vis)
        self.assertEqual(data["itemListElement"][1]["item"], "https://tking-creator.github.io/world-issues/en/korea/")


if __name__ == "__main__":
    unittest.main()
