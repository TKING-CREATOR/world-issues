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
