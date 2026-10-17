import pathlib, unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent


class ScriptsTest(unittest.TestCase):
    def test_refresh_commits_only_latest(self):
        s = (ROOT / "refresh.sh").read_text(encoding="utf-8")
        self.assertIn("git add data/latest.json", s)
        self.assertNotIn("git add data site", s)
        self.assertIn("--render-only", s)
        self.assertIn("git pull -q --rebase", s)

    def test_refresh_backup_after_pull(self):
        s = (ROOT / "refresh.sh").read_text(encoding="utf-8")
        self.assertLess(s.index("git pull -q --rebase"), s.index('cp data/latest.json "$PREV"'))
        self.assertIn("git rebase --abort", s)

    def test_routine_prompt(self):
        s = (ROOT / "routine-prompt.md").read_text(encoding="utf-8")
        for need in ["refresh-prompt.md", "translate-prompt.md", "python3 build.py --check data/latest.json",
                     "git add data/latest.json", "git push origin HEAD:main", "data/draft.json"]:
            self.assertIn(need, s)
        self.assertNotIn("claude/", s)


if __name__ == "__main__":
    unittest.main()
