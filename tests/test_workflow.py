import pathlib, re, unittest

WF = pathlib.Path(__file__).resolve().parent.parent / ".github" / "workflows"


class WorkflowTest(unittest.TestCase):
    def setUp(self):
        self.y = (WF / "deploy.yml").read_text(encoding="utf-8")

    def test_workflow_paths(self):
        paths = re.search(r"paths:\s*\[(.*?)\]", self.y).group(1)
        self.assertIn('"data/latest.json"', paths)
        self.assertNotIn("data/issues", paths)
        self.assertNotIn("data/archive", paths)
        self.assertNotIn('"data/**"', paths)

    def test_no_cancel_in_progress(self):
        self.assertIn("cancel-in-progress: false", self.y)

    def test_old_pages_workflow_removed(self):
        self.assertFalse((WF / "pages.yml").exists())

    def test_secrets_not_echoed(self):
        self.assertNotRegex(self.y, r"echo[^\n]*secrets\.")

    def test_site_not_tracked(self):
        gi = (WF.parent.parent / ".gitignore").read_text(encoding="utf-8").split()
        self.assertIn("site/", gi)
        self.assertIn("site-gh/", gi)

    def test_bucket_created_before_sync(self):
        self.assertLess(self.y.index("r2 bucket create"), self.y.index("deploy/sync.py"))

    def test_checkout_latest_main(self):
        self.assertRegex(self.y, r"actions/checkout@v4\n\s+with:\n\s+ref: main")

    def test_redirect_only_when_cloudflare_ready(self):
        self.assertRegex(self.y, r'\*\) \[ "\$CF_READY" = true \] \|\| \{[^}]*exit 1; \}; python3 -m gen.redirect')

    def test_tests_run_with_default_site_url(self):
        # 테스트는 기본 주소를 가정하므로 저장소 변수 SITE_URL과 상관없이 돌아야 합니다.
        self.assertIn("SITE_URL= python3 -m unittest discover -s tests -t .", self.y)


if __name__ == "__main__":
    unittest.main()
