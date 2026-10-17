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


if __name__ == "__main__":
    unittest.main()
