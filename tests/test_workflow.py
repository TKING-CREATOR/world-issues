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

    def test_pages_copy_has_no_adsense(self):
        # 광고 번호는 R2용(새 도메인) 생성 단계에만 넘깁니다. 옛 주소 사본에는 광고가 나가면 안 됩니다.
        self.assertEqual(sum("ADSENSE_CLIENT" in l for l in self.y.splitlines()), 1)
        step = self.y.split("- name: 사이트 생성과 누적 기록 갱신")[1].split("- name:")[0]
        # SITE_URL이 비어 있으면 site/가 그대로 GitHub Pages로 복사되므로 그때는 번호를 넘기지 않습니다.
        self.assertIn("ADSENSE_CLIENT: ${{ vars.SITE_URL != '' && vars.ADSENSE_CLIENT || '' }}", step)

    def test_feeds_workflow(self):
        y = (WF / "feeds.yml").read_text(encoding="utf-8")
        self.assertIn("cron: \"20 20 * * *\"", y)            # 05:20 KST, 06:00 갱신보다 먼저
        self.assertIn("cron: \"20 8 * * *\"", y)             # 17:20 KST, 18:00 갱신보다 먼저
        self.assertIn("python3 build.py --feeds", y)
        self.assertIn("git add data/feeds.json", y)
        self.assertNotIn("data/latest.json", y)
        self.assertNotIn('"data/feeds.json"', self.y)          # 기사 목록만 바뀌면 사이트를 다시 만들지 않습니다

    def test_refresh_workflow(self):
        y = (WF / "refresh.yml").read_text(encoding="utf-8")
        self.assertIn('cron: "0 21 * * *"', y)                 # 06:00 KST 전체
        self.assertIn('cron: "0 9 * * *"', y)                  # 18:00 KST 추가분
        self.assertIn("secrets.CLAUDE_CODE_OAUTH_TOKEN", y)
        self.assertIn("zsh refresh.sh", y)
        self.assertIn("gh workflow run deploy.yml", y)          # GITHUB_TOKEN push는 deploy를 깨우지 않아 직접 실행
        self.assertIn("actions: write", y)
        self.assertIn("timeout-minutes:", y)
        self.assertIn("if: env.HAS_TOKEN == 'true'", y)         # 토큰을 넣기 전에는 실패 메일 없이 건너뜀
        self.assertIn("fetch-depth: 0", y)
        self.assertIn('pip install -q "Pillow>=11"', y)          # refresh.sh의 사이트 생성 검사에 필요
        self.assertIn("tr -d '\\r\\n '", y)                  # 붙여 넣다 들어간 줄바꿈 제거


if __name__ == "__main__":
    unittest.main()
