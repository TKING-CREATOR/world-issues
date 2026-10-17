import json, tempfile, pathlib, unittest
from gen import store
from tests.helpers import item, make_latest

D1 = "2026-10-17T06:00:00+09:00"
D2 = "2026-10-18T06:00:00+09:00"


class StoreTest(unittest.TestCase):
    def setUp(self):
        self.dir = pathlib.Path(tempfile.mkdtemp())

    def test_merge_creates_records_and_archive(self):
        store.merge(make_latest(D1), self.dir)
        recs = store.load_issues(self.dir)
        self.assertEqual(len(recs), 10)
        r = next(r for r in recs if r["item"]["id"] == "korea-one")
        self.assertEqual((r["country"], r["first_seen"], r["last_updated"], r["dates"]), ("korea", D1, D1, ["2026-10-17"]))
        self.assertEqual([d for d, _ in store.load_archives(self.dir)], ["2026-10-17"])

    def test_same_id_next_day_updates_one_record(self):
        store.merge(make_latest(D1), self.dir)
        d2 = make_latest(D2)
        d2["countries"]["korea"]["items"][0]["text"]["en"]["title"] = "new title"
        store.merge(d2, self.dir)
        recs = [r for r in store.load_issues(self.dir) if r["item"]["id"] == "korea-one"]
        self.assertEqual(len(recs), 1)
        r = recs[0]
        self.assertEqual((r["first_seen"], r["last_updated"]), (D1, D2))
        self.assertEqual(r["dates"], ["2026-10-17", "2026-10-18"])
        self.assertEqual(r["item"]["text"]["en"]["title"], "new title")
        self.assertEqual([d for d, _ in store.load_archives(self.dir)], ["2026-10-18", "2026-10-17"])

    def test_rerun_same_day_is_idempotent(self):
        store.merge(make_latest(D1), self.dir)
        store.merge(make_latest(D1), self.dir)
        r = next(r for r in store.load_issues(self.dir) if r["item"]["id"] == "korea-one")
        self.assertEqual(r["dates"], ["2026-10-17"])

    def test_keeps_old_body_when_new_has_none(self):
        store.merge(make_latest(D1), self.dir)
        d2 = make_latest(D2)
        d2["countries"]["korea"]["items"][0] = item("korea-one", body=0)
        store.merge(d2, self.dir)
        r = next(r for r in store.load_issues(self.dir) if r["item"]["id"] == "korea-one")
        self.assertEqual(len(r["item"]["text"]["ko"]["body"]), 4)

    def test_order_newest_first(self):
        store.merge(make_latest(D1), self.dir)
        d2 = make_latest(D2)
        for c in d2["countries"].values():
            c["items"] = [x for x in c["items"] if x["id"].endswith("-two")]
        store.merge(d2, self.dir)
        self.assertTrue(store.load_issues(self.dir)[0]["item"]["id"].endswith("-two"))

    def test_empty_dir(self):
        self.assertEqual(store.load_issues(self.dir), [])
        self.assertEqual(store.load_archives(self.dir), [])


if __name__ == "__main__":
    unittest.main()
