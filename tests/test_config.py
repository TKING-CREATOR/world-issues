import importlib, os, unittest
from unittest import mock
from gen import config


class ConfigTest(unittest.TestCase):
    def tearDown(self):
        importlib.reload(config)

    def test_empty_site_url_uses_default(self):
        # GitHub Actions는 비어 있는 저장소 변수를 빈 문자열로 넘깁니다.
        with mock.patch.dict(os.environ, {"SITE_URL": ""}):
            importlib.reload(config)
        self.assertEqual(config.SITE_URL, "https://tking-creator.github.io/world-issues")
        self.assertEqual(config.PREFIX, "/world-issues")


if __name__ == "__main__":
    unittest.main()
