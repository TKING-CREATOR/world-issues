import unittest
from gen import pages as P
from tests.helpers import item, make_latest

UP = "2026-10-17T06:00:00+09:00"


def rec(it, country="korea", up=UP):
    return {"item": it, "country": country, "first_seen": up, "last_updated": up, "dates": [up[:10]]}


def paths(ps, lang="en"):
    return {p.path for p in ps if p.lang == lang}


class PagesTest(unittest.TestCase):
    def test_home_has_all_langs_and_root(self):
        ps = P.home_pages(make_latest())
        self.assertEqual(sorted(str(p.lang) for p in ps), ["None", "en", "ja", "ko", "zh"])
        en = next(p for p in ps if p.lang == "en").html
        for slug in ["korea", "usa", "japan", "china", "world", "github"]:
            self.assertIn(f'id="p-{slug}"', en)
        self.assertIn("Oct 16, 5:00 PM (New York)", en)   # 미국 패널의 현지 시각
        self.assertIn('data-updated="2026-10-17T06:00:00+09:00"', en)

    def test_home_shows_next_refresh(self):
        ps = {p.lang: p.html for p in P.home_pages(make_latest())}
        self.assertIn('data-next data-hour="6" data-since="2026-10-17T06:00:00+09:00"', ps["en"])
        static = {"en": "Updates daily at 6:00 AM KST", "ko": "매일 오전 6시(한국 시간) 갱신",
                  "ja": "毎日午前6時(韓国時間)に更新", "zh": "每天韩国时间早上6点更新"}
        for lang, text in static.items():
            self.assertIn(f'<span class="next-txt">{text}</span>', ps[lang])
        self.assertIn('data-tpl="다음 갱신까지 {h}시간 {m}분"', ps["ko"])

    def test_info_pages_built_for_all_langs(self):
        ps = P.info_pages()
        self.assertEqual(sorted((p.lang, p.path) for p in ps),
                         sorted((l, k) for l in ["en", "ko", "ja", "zh"] for k in ["about/", "privacy/", "contact/"]))
        en = next(p.html for p in ps if p.lang == "en" and p.path == "about/")
        self.assertIn('<link rel="canonical" href="https://tking-creator.github.io/world-issues/en/about/">', en)
        self.assertIn('hreflang="ja" href="https://tking-creator.github.io/world-issues/ja/about/"', en)

    def test_info_pages_have_no_ad_slots(self):
        from unittest import mock
        from gen import config as C
        with mock.patch.object(C, "ADSENSE_CLIENT", "ca-pub-1234567890123456"):
            for p in P.info_pages():
                self.assertNotIn("adsbygoogle", p.html, (p.lang, p.path))
                self.assertNotIn('class="slot"', p.html, (p.lang, p.path))

    def test_privacy_has_required_links(self):
        for p in P.info_pages():
            if p.path == "privacy/":
                for need in ['href="https://www.google.com/settings/ads"', 'href="https://policies.google.com/technologies/partner-sites"',
                             'href="mailto:hello@gtdaily.news"', 'href="https://ko-fi.com/tk9966"']:
                    self.assertIn(need, p.html, (p.lang, need))
            if p.path == "contact/":
                self.assertIn('href="mailto:hello@gtdaily.news"', p.html, p.lang)

    def test_info_placeholders_all_filled(self):
        import re
        for p in P.info_pages():
            body = p.html.split("<body>")[1]
            self.assertIsNone(re.search(r"\{(email|kofi|ads_settings|partners|date)\}", body), (p.lang, p.path))

    def test_home_hides_all_but_first_panel(self):
        en = next(p for p in P.home_pages(make_latest()) if p.lang == "en").html
        self.assertIn('id="p-korea" data-accent="kr">', en)
        self.assertIn('id="p-usa" data-accent="us" hidden>', en)

    def test_issue_pages_skip_missing_body(self):
        recs = [rec(item("good")), rec(item("thin", body=3))]
        self.assertEqual(paths(P.issue_pages(recs)), {"issue/good/"})
        self.assertEqual(len(P.issue_pages(recs)), 4)

    def test_issue_page_content(self):
        r = rec(item("good"))
        ko = next(p for p in P.issue_pages([r]) if p.lang == "ko").html
        self.assertIn("무슨 일인가요", ko)
        self.assertIn("good p3 ko", ko)
        self.assertIn('"@type": "NewsArticle"', ko)
        self.assertIn('"datePublished": "2026-10-17T06:00:00+09:00"', ko)

    def test_related_prefers_same_field(self):
        me = rec(item("me", field="tech"))
        a = rec(item("a", field="culture"))
        b = rec(item("b", field="tech"))
        other = rec(item("c", field="tech"), country="usa")
        thin = rec(item("d", field="tech", body=0))
        got = [r["item"]["id"] for r in P.related(me, [me, a, b, other, thin])]
        self.assertEqual(got, ["b", "a"])

    def test_hub_pagination_boundary(self):
        for n, want in [(30, {"korea/"}), (31, {"korea/", "korea/page/2/"})]:
            recs = [rec(item(f"i{i}")) for i in range(n)]
            got = {p for p in paths(P.hub_pages(recs)) if p.startswith("korea")}
            self.assertEqual(got, want, n)
        recs = [rec(item(f"i{i}")) for i in range(31)]
        p2 = next(p for p in P.hub_pages(recs) if p.lang == "en" and p.path == "korea/page/2/").html
        self.assertIn("i30 en", p2)
        self.assertNotIn("i29 en", p2)

    def test_hub_pages_exist_when_empty(self):
        ps = paths(P.hub_pages([]))
        self.assertTrue({"korea/", "world/", "tech/", "incidents/"} <= ps)

    def test_date_and_github_pages(self):
        lat = make_latest()
        arch = [("2026-10-17", lat), ("2026-10-16", make_latest("2026-10-16T06:00:00+09:00"))]
        self.assertEqual(paths(P.date_pages(arch)), {"2026-10-17/", "2026-10-16/"})
        self.assertEqual(paths(P.github_pages(lat, arch)), {"github/", "github/2026-10-17/", "github/2026-10-16/"})
        gh = next(p for p in P.github_pages(lat, arch) if p.lang == "ja" and p.path == "github/").html
        self.assertIn("desc 0 ja", gh)

    def test_all_pages_unique(self):
        lat = make_latest()
        recs = [rec(x, k) for k, c in lat["countries"].items() for x in c["items"]]
        ps = P.all_pages(lat, recs, [("2026-10-17", lat)])
        keys = [(p.lang, p.path) for p in ps]
        self.assertEqual(len(keys), len(set(keys)))


if __name__ == "__main__":
    unittest.main()


class AdPlacementTest(unittest.TestCase):
    CLIENT = "ca-pub-1234567890123456"

    def setUp(self):
        from unittest import mock
        from gen import config as C
        self.p = mock.patch.object(C, "ADSENSE_CLIENT", self.CLIENT)
        self.p.start()

    def tearDown(self):
        self.p.stop()

    def test_issue_page_ads_and_support(self):
        ps = P.issue_pages([rec(item("korea-one"))])
        h = next(p.html for p in ps if p.lang == "en")
        self.assertEqual(h.count('<ins class="adsbygoogle"'), 2)
        art = h.split('<article class="issue"')[1]
        first_ad = art.index('<ins class="adsbygoogle"')
        h2s = [i for i in range(len(art)) if art.startswith("<h2>", i)]
        self.assertTrue(h2s[1] < first_ad < h2s[2])   # 본문 두 번째 단락 뒤, 세 번째 제목 앞
        self.assertIn('href="https://ko-fi.com/tk9966"', art)

    def test_board_panel_has_one_ad(self):
        en = next(p.html for p in P.home_pages(make_latest()) if p.lang == "en")
        for slug in ["korea", "usa", "japan", "china", "world"]:
            panel = en.split(f'id="p-{slug}"')[1].split('<section class="panel"')[0]
            self.assertEqual(panel.count('<ins class="adsbygoogle"'), 1, slug)
