import json, pathlib, unittest
from gen.timefmt import fmt_date, kst_date, country_line, seoul
from gen.i18n import T

OCT = "2026-10-17T06:00:00+09:00"   # 서머타임 중
DEC = "2026-12-17T06:00:00+09:00"   # 서머타임 끝난 뒤


def keys(d, p=""):
    out = set()
    for k, v in d.items():
        out.add(p + k)
        if isinstance(v, dict):
            out |= keys(v, p + k + ".")
    return out


class TimeTest(unittest.TestCase):
    def test_usa_summer(self):
        self.assertEqual(country_line(OCT, "usa", "en"), "Oct 16, 5:00 PM (New York) · Oct 16, 2:00 PM (Los Angeles)")

    def test_dst_winter(self):
        self.assertEqual(country_line(DEC, "usa", "en"), "Dec 16, 4:00 PM (New York) · Dec 16, 1:00 PM (Los Angeles)")
        self.assertEqual(country_line(DEC, "world", "en"), "Dec 16, 10:00 PM (Paris) · Dec 16, 9:00 PM (London)")

    def test_languages(self):
        self.assertEqual(country_line(OCT, "korea", "ko"), "10월 17일 오전 6:00 (서울)")
        self.assertEqual(country_line(OCT, "china", "zh"), "10月17日 上午5:00（北京）")
        self.assertEqual(country_line(OCT, "japan", "ja"), "10月17日 午前6:00（東京）")
        self.assertEqual(country_line(OCT, "world", "ko"), "10월 16일 오후 11:00 (파리) · 10월 16일 오후 10:00 (런던)")

    def test_midnight_and_noon(self):
        self.assertEqual(seoul("2026-10-17T00:05:00+09:00", "en"), "Oct 17, 12:05 AM (Seoul)")
        self.assertEqual(seoul("2026-10-17T12:00:00+09:00", "ko"), "10월 17일 오후 12:00 (서울)")

    def test_dates(self):
        self.assertEqual(fmt_date("2026-10-17", "en"), "Oct 17, 2026")
        self.assertEqual(fmt_date("2026-10-17", "ko"), "2026년 10월 17일")
        self.assertEqual(fmt_date("2026-10-17", "ja"), "2026年10月17日")
        self.assertEqual(kst_date("2026-10-16T22:00:00+00:00"), "2026-10-17")

    def test_i18n_files_have_same_keys(self):
        base = keys(T("en"))
        for l in ["ko", "ja", "zh"]:
            self.assertEqual(keys(T(l)), base, l)

    def test_i18n_lists_have_same_length(self):
        for l in ["ko", "ja", "zh"]:
            for k in ["crit", "stats", "body_heads", "method"]:
                self.assertEqual(len(T(l)[k]), len(T("en")[k]), (l, k))


if __name__ == "__main__":
    unittest.main()
