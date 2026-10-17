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

    def test_x_default_is_en_version(self):
        p = H.shell("en", "", "t", "d", "")
        self.assertIn('hreflang="x-default" href="https://tking-creator.github.io/world-issues/en/"', p)

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


class MonetizeTest(unittest.TestCase):
    CLIENT = "ca-pub-1234567890123456"

    def test_invalid_client_disables_ads(self):
        from gen import config as C
        self.assertEqual(C.adsense_client(self.CLIENT), self.CLIENT)
        for bad in [None, "", " ca-pub-1234567890123456", "pub-1234567890123456", "ca-pub-123", 'ca-pub-1234567890123456"']:
            self.assertEqual(C.adsense_client(bad), "", bad)

    def test_no_ads_without_client(self):
        from unittest import mock
        from gen import config as C
        with mock.patch.object(C, "ADSENSE_CLIENT", ""):
            self.assertEqual(H.slot("x"), '<div class="slot" data-slot="x"></div>')
            self.assertNotIn("adsbygoogle", H.shell("en", "", "t", "d", ""))

    def test_ads_with_client(self):
        from unittest import mock
        from gen import config as C
        with mock.patch.object(C, "ADSENSE_CLIENT", self.CLIENT):
            # 자동 광고: 구글이 위치를 정하므로 직접 넣는 광고 단위(<ins>)는 없습니다.
            self.assertEqual(H.slot("x"), '<div class="slot" data-slot="x"></div>')
            p = H.shell("en", "", "t", "d", "")
            head = p.split("</head>")[0]
            self.assertEqual(head.count("pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + self.CLIENT), 1)
            self.assertNotIn("adsbygoogle", H.shell("en", "about/", "t", "d", "", ads=False))

    def test_footer_support_and_info_links(self):
        p = H.shell("ko", "", "t", "d", "")
        foot = p.split('<footer class="method">')[1]
        self.assertIn('<a class="kofi" href="https://ko-fi.com/tk9966" target="_blank" rel="noopener">', foot)
        for path in ["about/", "privacy/", "contact/"]:
            self.assertIn(f'href="/world-issues/ko/{path}"', foot)
        self.assertNotIn("@gmail.com", p)
