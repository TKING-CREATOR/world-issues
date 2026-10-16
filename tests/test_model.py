import unittest
from gen.model import avg, link, has_body, validate
from tests.helpers import item, make_latest


class ModelTest(unittest.TestCase):
    def test_avg(self):
        self.assertEqual(avg([8, 8, 9, 7]), 8.0)

    def test_link_rules_match_old_site(self):
        self.assertEqual(link("ig", "코스피")["url"], "https://www.instagram.com/explore/tags/%EC%BD%94%EC%8A%A4%ED%94%BC/")
        self.assertEqual(link("ig", "코스피")["q"], "#코스피")
        self.assertEqual(link("wb", "台风")["q"], "#台风#")
        self.assertTrue(link("wb", "台风")["url"].startswith("https://s.weibo.com/weibo?q=%23"))
        self.assertEqual(link("naver", "a/b")["url"], "https://search.naver.com/search.naver?query=a%2Fb")
        self.assertEqual(link("naver", "x")["cls"], "nv")

    def test_has_body(self):
        self.assertTrue(has_body(item("a")))
        self.assertFalse(has_body(item("a", body=3)))
        x = item("a"); x["text"]["zh"]["body"][2] = "  "
        self.assertFalse(has_body(x))

    def test_valid_data_passes(self):
        self.assertEqual(validate(make_latest()), [])

    def test_ko_only_draft_passes_with_langs(self):
        d = make_latest()
        for c in d["countries"].values():
            for x in c["items"]:
                x["text"] = {"ko": x["text"]["ko"]}
            c["cut"] = [{"ko": "뺌"}]
        for g in d["github"]["items"]:
            g["desc"] = {"ko": "설명"}
        self.assertEqual(validate(d, langs=["ko"]), [])
        self.assertTrue(validate(d))

    def check_error(self, mutate, needle):
        d = make_latest(); mutate(d)
        err = validate(d)
        self.assertTrue(any(needle in e for e in err), err)

    def test_errors(self):
        k = lambda d: d["countries"]["korea"]["items"]
        self.check_error(lambda d: d.update(updated="2026-10-17 06:00"), "updated")
        self.check_error(lambda d: d["countries"].pop("china"), "china: 항목 없음")
        self.check_error(lambda d: k(d)[0].update(scores=[5, 5, 4, 5]), "5.0 미만")
        self.check_error(lambda d: k(d)[0].update(scores=[9, 9, 9]), "점수 4개")
        self.check_error(lambda d: k(d)[0].update(field="sports"), "분야 키")
        self.check_error(lambda d: k(d)[0].update(source={"name": "x"}), "출처")
        self.check_error(lambda d: k(d)[0].update(links=[]), "링크")
        self.check_error(lambda d: k(d)[0].update(links=[{"p": "fb", "q": "x"}]), "링크")
        self.check_error(lambda d: k(d)[0].update(id="Bad_ID"), "id 형식")
        self.check_error(lambda d: k(d)[0].update(id="a" * 61), "id 형식")
        self.check_error(lambda d: k(d)[1].update(id="korea-one"), "id 중복")
        self.check_error(lambda d: k(d)[0]["text"].pop("ja"), "ja 제목/요약")
        self.check_error(lambda d: d["countries"]["korea"]["cut"][0].pop("zh"), "뺀 항목")
        self.check_error(lambda d: d["github"]["items"].pop(), "github 항목이 10개")
        self.check_error(lambda d: d["github"]["items"][0]["desc"].pop("en"), "github: en 설명")

    def test_id_duplicate_across_countries(self):
        d = make_latest()
        d["countries"]["usa"]["items"][0]["id"] = "korea-one"
        self.assertTrue(any("id 중복" in e for e in validate(d)))

    def test_field_limit(self):
        d = make_latest()
        d["countries"]["japan"]["items"] = [item(f"jp-{i}") for i in range(11)]
        self.assertTrue(any("tech 10개 초과" in e for e in validate(d)))

    def test_body_missing_is_not_error(self):
        d = make_latest()
        d["countries"]["korea"]["items"][0] = item("korea-one", body=0)
        self.assertEqual(validate(d), [])

    def test_render_critical_fields(self):
        k = lambda d: d["countries"]["korea"]["items"]
        g = lambda d: d["github"]["items"]
        self.check_error(lambda d: g(d)[0].update(stars="1,234"), "github: 숫자")
        self.check_error(lambda d: g(d)[0].update(today=None), "github: 숫자")
        self.check_error(lambda d: g(d)[0].update(repo="norepo"), "github: repo")
        self.check_error(lambda d: k(d)[0].update(source={"url": "https://a.com"}), "출처")
        self.check_error(lambda d: k(d)[0].update(source={"name": "a", "url": "javascript:alert(1)"}), "출처")
        self.check_error(lambda d: d["countries"].update(europe=d["countries"]["world"]), "알 수 없는 나라")
        self.check_error(lambda d: k(d)[0].update(links=[{"p": "x", "q": 5}]), "링크")
        self.check_error(lambda d: k(d)[0].update(scores=[11, 9, 9, 9]), "점수 범위")
        self.check_error(lambda d: k(d)[0].update(scores=["7", 7, 7, 7]), "점수 범위")
        self.check_error(lambda d: d["countries"]["korea"].update(cut=["뺌"]), "뺀 항목")
        self.check_error(lambda d: k(d)[0]["text"]["ko"].update(title=5), "ko 제목/요약")

    def test_string_body_is_not_a_body(self):
        x = item("a")
        x["text"]["en"]["body"] = "abcd"
        self.assertFalse(has_body(x))


if __name__ == "__main__":
    unittest.main()
