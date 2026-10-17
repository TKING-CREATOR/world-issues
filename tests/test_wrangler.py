import pathlib, tomllib, unittest

TOML = pathlib.Path(__file__).resolve().parent.parent / "worker" / "wrangler.toml"


class WranglerTest(unittest.TestCase):
    def test_domain_route_is_top_level(self):
        # 표([[r2_buckets]]) 아래에 쓰면 그 표의 값으로 읽혀 도메인이 붙지 않습니다.
        c = tomllib.loads(TOML.read_text(encoding="utf-8"))
        self.assertEqual(c.get("routes"), [{"pattern": "gtdaily.news", "custom_domain": True}])
        self.assertEqual(c["r2_buckets"], [{"binding": "SITE", "bucket_name": "gtdaily-site"}])


if __name__ == "__main__":
    unittest.main()
