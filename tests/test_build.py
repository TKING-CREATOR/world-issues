import json, re, tempfile, pathlib, unittest
import xml.etree.ElementTree as ET
import build
from tests.helpers import make_latest

NS = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}


class BuildTest(unittest.TestCase):
    def setUp(self):
        self.tmp = pathlib.Path(tempfile.mkdtemp())
        self.data, self.out = self.tmp / "data", self.tmp / "site"
        self.data.mkdir()

    def write(self, d, name="latest.json"):
        (self.data / name).write_text(json.dumps(d, ensure_ascii=False), encoding="utf-8")

    def run_build(self, *extra):
        return build.main(["--data", str(self.data), "--out", str(self.out), *extra])

    def test_render_only_leaves_store(self):
        self.write(make_latest())
        self.assertEqual(self.run_build(), 0)
        before = {p.name: p.read_text(encoding="utf-8") for p in (self.data / "issues").glob("*.json")}
        later = make_latest(updated="2026-10-18T06:00:00+09:00")
        self.write(later)
        self.assertEqual(build.main(["--data", str(self.data), "--out", str(self.tmp / "gh"), "--render-only"]), 0)
        after = {p.name: p.read_text(encoding="utf-8") for p in (self.data / "issues").glob("*.json")}
        self.assertEqual(before, after)
        self.assertFalse((self.data / "archive" / "2026-10-18.json").exists())
        self.assertTrue((self.tmp / "gh" / "en" / "index.html").exists())

    def test_render_only_rejects_bad_latest(self):
        bad = make_latest(); bad["updated"] = "어제"
        self.write(bad)
        self.assertEqual(build.main(["--data", str(self.data), "--out", str(self.tmp / "gh"), "--render-only"]), 1)
        self.assertFalse((self.tmp / "gh").exists())

    def test_check_and_list_ids_work_without_pillow(self):
        # 클라우드 루틴 환경에는 Pillow가 없습니다. 검사와 id 목록은 Pillow 없이 돌아야 합니다.
        import subprocess, sys
        self.write(make_latest())
        code = ("import sys; sys.modules['PIL'] = None; import build; "
                f"sys.exit(build.main(['--check', {str(self.data / 'latest.json')!r}]) or build.main(['--list-ids', '--data', {str(self.data)!r}]))")
        r = subprocess.run([sys.executable, "-c", code], cwd=pathlib.Path(build.__file__).parent, capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stderr)

    def test_info_pages_in_sitemap(self):
        self.write(make_latest())
        self.run_build()
        locs = "".join(p.read_text(encoding="utf-8") for p in self.out.glob("sitemap-*.xml"))
        for path in ["en/about/", "ko/privacy/", "zh/contact/"]:
            self.assertIn(f"https://tking-creator.github.io/world-issues/{path}<", locs)

    def test_full_build(self):
        self.write(make_latest())
        self.assertEqual(self.run_build(), 0)
        for f in ["index.html", "en/index.html", "zh/issue/korea-one/index.html", "ko/korea/index.html",
                  "ja/tech/index.html", "en/2026-10-17/index.html", "en/github/index.html",
                  "sitemap.xml", "robots.txt", "en/feed.xml", "feed.json", "static/app.js", "og/ko-korea.png", ".nojekyll"]:
            self.assertTrue((self.out / f).exists(), f)

    def test_every_sitemap_url_is_a_file(self):
        self.write(make_latest())
        self.run_build()
        base = "https://tking-creator.github.io/world-issues/"
        for sm in self.out.glob("sitemap-*.xml"):
            for loc in ET.parse(sm).getroot().findall("s:url/s:loc", NS):
                rel = loc.text.removeprefix(base)
                self.assertTrue((self.out / rel / "index.html").exists(), rel)

    def test_internal_links_resolve(self):
        self.write(make_latest())
        self.run_build()
        html = (self.out / "en/index.html").read_text(encoding="utf-8")
        for path in set(re.findall(r'href="/world-issues/([^"#]*)"', html)):
            target = self.out / path
            self.assertTrue((target / "index.html").exists() or target.is_file(), path)

    def test_invalid_latest_leaves_site_and_store(self):
        self.write(make_latest())
        self.run_build()
        before = (self.out / "en/index.html").read_text(encoding="utf-8")
        issues_before = sorted(p.name for p in (self.data / "issues").glob("*.json"))
        bad = make_latest("2026-10-18T06:00:00+09:00")
        bad["countries"]["korea"]["items"][0]["id"] = "new-issue"
        bad["countries"]["korea"]["items"][0]["text"].pop("ja")
        self.write(bad)
        self.assertEqual(self.run_build(), 1)
        self.assertEqual((self.out / "en/index.html").read_text(encoding="utf-8"), before)
        self.assertEqual(sorted(p.name for p in (self.data / "issues").glob("*.json")), issues_before)
        self.assertFalse((self.data / "archive" / "2026-10-18.json").exists())

    def test_render_crash_leaves_store(self):
        self.write(make_latest())
        self.run_build()
        snap = {p.name: p.read_text(encoding="utf-8") for p in (self.data / "issues").glob("*.json")}
        bad = make_latest("2026-10-18T06:00:00+09:00")
        bad["countries"]["korea"]["items"][0]["text"]["en"]["title"] = "changed"
        import gen.pages
        orig = gen.pages.github_pages
        gen.pages.github_pages = lambda *a: (_ for _ in ()).throw(RuntimeError("render boom"))
        try:
            self.write(bad)
            with self.assertRaises(RuntimeError):
                self.run_build()
        finally:
            gen.pages.github_pages = orig
        self.assertEqual({p.name: p.read_text(encoding="utf-8") for p in (self.data / "issues").glob("*.json")}, snap)
        self.assertFalse((self.data / "archive" / "2026-10-18.json").exists())
        self.write(make_latest("2026-10-18T06:00:00+09:00"))
        self.assertEqual(self.run_build(), 0)

    def test_draft_is_never_published(self):
        self.write(make_latest(), name="draft.json")
        self.assertEqual(self.run_build(), 1)   # latest.json이 없으면 실패
        self.assertFalse(self.out.exists())

    def test_check_ko_draft(self):
        d = make_latest()
        for c in d["countries"].values():
            for x in c["items"]:
                x["text"] = {"ko": x["text"]["ko"]}
            c["cut"] = [{"ko": "뺌"}]
        for g in d["github"]["items"]:
            g["desc"] = {"ko": "설명"}
        self.write(d, name="draft.json")
        f = str(self.data / "draft.json")
        self.assertEqual(build.main(["--check", f, "--langs", "ko"]), 0)
        self.assertEqual(build.main(["--check", f]), 1)


if __name__ == "__main__":
    unittest.main()
