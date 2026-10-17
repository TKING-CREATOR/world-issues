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

    def test_prompts_use_feeds(self):
        r = (ROOT / "refresh.sh").read_text(encoding="utf-8")
        self.assertIn("python3 build.py --feeds", r)
        self.assertIn("git checkout -q -- data/feeds.json", r)   # 맥에서 모은 목록은 커밋하지 않고 되돌립니다
        for f in ["refresh-prompt.md", "routine-prompt.md"]:
            self.assertIn("data/feeds.json", (ROOT / f).read_text(encoding="utf-8"), f)

    def test_evening_mode_adds_only(self):
        r = (ROOT / "refresh.sh").read_text(encoding="utf-8")
        self.assertIn("update-prompt.md", r)                    # 오후(12시 이후) 실행은 추가분만
        u = (ROOT / "update-prompt.md").read_text(encoding="utf-8")
        for need in ["data/latest.json", "data/feeds.json", "python3 build.py --check data/latest.json", "4개 언어", "기존 이슈"]:
            self.assertIn(need, u)

    def test_refresh_runs_on_linux_too(self):
        r = (ROOT / "refresh.sh").read_text(encoding="utf-8")
        self.assertIn('export PATH="/opt/homebrew/bin:$HOME/.local/bin:$PATH"', r)   # Actions의 node·claude 경로 유지
        self.assertIn('MODEL_ARGS=(--model "$CLAUDE_MODEL")', r)
        self.assertIn('"${MODEL_ARGS[@]}"', r)

    def test_routine_prompt(self):
        s = (ROOT / "routine-prompt.md").read_text(encoding="utf-8")
        for need in ["refresh-prompt.md", "translate-prompt.md", "python3 build.py --check data/latest.json",
                     "git add data/latest.json", "git push origin HEAD:main", "data/draft.json"]:
            self.assertIn(need, s)
        self.assertNotIn("claude/", s)

    def test_routine_prompt_does_not_give_up_on_thin_search(self):
        # 첫 클라우드 실행이 날짜를 넣은 검색 몇 번이 부실하자 50초 만에 포기했습니다.
        s = (ROOT / "routine-prompt.md").read_text(encoding="utf-8")
        for need in ["## 검색 요령", "WebFetch", "https://www.yna.co.kr", "https://github.com/trending", "20~30분"]:
            self.assertIn(need, s)


if __name__ == "__main__":
    unittest.main()
