import tempfile, pathlib, unittest
from PIL import Image
from gen.og import build_og
from tests.helpers import make_latest


class OgTest(unittest.TestCase):
    def test_builds_all_images(self):
        out = pathlib.Path(tempfile.mkdtemp())
        files = build_og(out, make_latest())
        self.assertEqual(len(files), 28)
        self.assertTrue((out / "zh-china.png").exists())
        with Image.open(out / "ja-home.png") as im:
            self.assertEqual(im.size, (1200, 630))


if __name__ == "__main__":
    unittest.main()
