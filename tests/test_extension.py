import json, pathlib, unittest

EXT = pathlib.Path(__file__).resolve().parent.parent / "extension"


class ExtensionTest(unittest.TestCase):
    def test_manifest_permissions_are_minimal(self):
        m = json.loads((EXT / "manifest.json").read_text(encoding="utf-8"))
        self.assertEqual(m["manifest_version"], 3)
        self.assertEqual(sorted(m["permissions"]), ["alarms", "notifications", "storage"])
        self.assertEqual(m["host_permissions"], ["https://gtdaily.news/*"])
        self.assertEqual(m["background"], {"service_worker": "background.js", "type": "module"})
        self.assertNotIn("chrome_url_overrides", m)                 # 새 탭은 바꾸지 않습니다
        for f in [m["action"]["default_popup"], m["options_page"], *m["icons"].values()]:
            self.assertTrue((EXT / f).exists(), f)

    def test_locales_have_same_keys(self):
        keys = {d.name: set(json.loads((d / "messages.json").read_text(encoding="utf-8"))) for d in (EXT / "_locales").iterdir()}
        self.assertEqual(sorted(keys), ["en", "ja", "ko", "zh_CN"])
        self.assertEqual(len({frozenset(v) for v in keys.values()}), 1)
        for d in (EXT / "_locales").iterdir():
            msgs = json.loads((d / "messages.json").read_text(encoding="utf-8"))
            self.assertLessEqual(len(msgs["ext_desc"]["message"]), 132, d.name)   # 웹스토어 짧은 설명 한도


if __name__ == "__main__":
    unittest.main()
