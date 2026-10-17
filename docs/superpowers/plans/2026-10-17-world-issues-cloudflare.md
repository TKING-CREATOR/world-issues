# 2단계: Cloudflare Worker + R2 이전과 클라우드 갱신 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 맥북 없이 매일 06:00 KST에 갱신되고, Cloudflare Worker + R2에서 파일 수 제한 없이 `gtdaily.news`로 서비스되는 구조를 만든다.

**Architecture:** 클라우드 루틴(또는 맥북 대체 실행)은 `data/latest.json`만 main에 올린다. GitHub Actions `deploy.yml`이 `build.py`로 누적 기록 갱신·사이트 생성 → 누적 기록 커밋 → `deploy/sync.py`로 R2에 바뀐 파일만 순서대로 올림 → `wrangler deploy`로 Worker 갱신 → GitHub Pages에 (도메인 전) github.io 사본 또는 (도메인 뒤) 넘겨주기 페이지를 올린다. Worker는 요청 경로를 R2 키로 바꿔 꺼내 준다.

**Tech Stack:** Python 3.12+ 표준 라이브러리 + Pillow(기존) + boto3(배포 전용), Cloudflare Workers(ES module, 의존성 없음) + R2, wrangler 4, GitHub Actions, Node 20+ `node --test`.

**Spec:** `docs/superpowers/specs/2026-10-17-world-issues-cloudflare-design.md`

## Global Constraints

- 사용자에게 보이는 글과 주석은 한국어. 저장소의 기존 코드 모양(짧은 함수, 표준 라이브러리 우선)을 따른다.
- 생성기(`gen/`)는 순수 함수가 문자열을 돌려주는 구조를 유지한다. 새 파이썬 의존성은 `deploy/`에서만 boto3 하나.
- `SITE_URL`은 지금처럼 환경 변수로만 바꾼다(`gen/config.py`). 기본값 `https://tking-creator.github.io/world-issues`는 그대로 둔다.
- 저장소 변수 `SITE_URL`이 비어 있거나 Cloudflare 비밀 값이 없으면 R2·Worker 단계는 건너뛰고, GitHub Pages는 지금과 같은 github.io 사이트를 계속 올린다. (병합만으로 공개 사이트가 깨지지 않게 하기 위해서)
- R2 버킷 이름 `gtdaily-site`, Worker 이름 `gtdaily`, 도메인 `gtdaily.news`.
- 비밀 값 이름: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`. 값은 코드·로그·대화에 남기지 않는다.
- 루틴과 `refresh.sh`는 `data/latest.json` 하나만 커밋한다. `data/issues`·`data/archive`는 Actions만 커밋한다.
- 테스트: `python3 -m unittest discover -s tests -t .` 와 `node --test worker/test/`.

## Review Focus

1. R2 동기화 도중 끊김: 첫 화면·목록·사이트맵이 아직 없는 이슈 페이지를 가리키면 안 된다 → Task 3 `test_issue_pages_before_lists`.
2. 경로 조작(`/../_manifest.json`, `//`, `%2e%2e`)으로 R2의 내부 파일이 나가면 안 된다 → Task 4 `blocks traversal and manifest`.
3. `--render-only`가 누적 기록을 바꾸면 GitHub Pages용 두 번째 생성이 기록을 두 번 쌓는다 → Task 1 `test_render_only_leaves_store`.
4. 옛 주소의 하위 경로(`/world-issues/ko/issue/x/?a=1#b`)가 새 주소에서 같은 곳으로 가야 한다 → Task 2 `test_redirect_keeps_path`.
5. Actions의 누적 기록 커밋이 다시 Actions를 돌리면 무한 반복 → Task 5에서 트리거 경로에 `data/issues`·`data/archive`를 넣지 않고, `GITHUB_TOKEN` push는 원래 워크플로를 깨우지 않음을 주석으로 남긴다(검사: `test_workflow_paths`).

---

### Task 0: 작업 공간

- [ ] **Step 1:** `git -C ~/Desktop/world-issues worktree add ~/Desktop/world-issues-cf -b cloudflare main`
- [ ] **Step 2:** `cd ~/Desktop/world-issues-cf && python3 -m unittest discover -s tests -t . 2>&1 | grep -E "^(Ran|OK|FAILED)"`
  Expected: `Ran 53 tests` / `OK`

### Task 1: `build.py --render-only`

**Files:**
- Modify: `build.py` (main의 인자와 누적 단계)
- Test: `tests/test_build.py`

**Interfaces:**
- Produces: `python3 build.py --render-only [--data D] [--out O]` — `latest.json` 검사 후 `D/issues`·`D/archive`를 읽기만 해서 `O`에 사이트를 만든다. 종료 코드 0/1은 기존과 같다.

- [ ] **Step 1: 실패하는 테스트**

`tests/test_build.py`의 `BuildTest`에 추가:

```python
    def test_render_only_leaves_store(self):
        self.write(make_latest())
        self.assertEqual(self.run_build(), 0)
        before = {p.name: p.read_text(encoding="utf-8") for p in (self.data / "issues").glob("*.json")}
        later = make_latest(updated="2026-10-18T06:00:00+09:00")
        self.write(later)
        self.assertEqual(build.main(["--data", str(self.data), "--out", str(self.tmp / "gh"), "--render-only"]), 0)
        after = {p.name: p.read_text(encoding="utf-8") for p in (self.data / "issues").glob("*.json")}
        self.assertEqual(before, after)
        self.assertFalse((self.data / "archive" / "2026-10-18.json").exists())
        self.assertTrue((self.tmp / "gh" / "en" / "index.html").exists())

    def test_render_only_rejects_bad_latest(self):
        bad = make_latest(); bad["updated"] = "어제"
        self.write(bad)
        self.assertEqual(build.main(["--data", str(self.data), "--out", str(self.tmp / "gh"), "--render-only"]), 1)
        self.assertFalse((self.tmp / "gh").exists())
```

- [ ] **Step 2:** `python3 -m unittest tests.test_build -v 2>&1 | tail -5`
  Expected: 두 테스트 FAIL/ERROR (`unrecognized arguments: --render-only`, argparse가 SystemExit 2)

- [ ] **Step 3: 구현** — `build.py`

인자 추가(`--list-ids` 줄 아래):

```python
    ap.add_argument("--render-only", action="store_true", help="누적 기록을 바꾸지 않고 페이지만 만듭니다")
```

`err = validate(latest)` 검사 블록 바로 뒤, `# 누적 기록은 복사본에…` 주석 앞에:

```python
    if a.render_only:
        issues, archives = store.load_issues(a.data), store.load_archives(a.data)
        ps = write_site(a.out, latest, issues, archives)
        print(f"페이지만 만들었습니다 ({latest['updated']}) · 페이지 {len(ps)}개")
        return 0
```

`store.load_issues`/`load_archives`는 폴더가 없으면 빈 목록을 돌려준다(`glob`)는 점을 이용한다.

- [ ] **Step 4:** `python3 -m unittest discover -s tests -t . 2>&1 | grep -E "^(Ran|OK|FAILED)"`
  Expected: `Ran 55 tests` / `OK`

- [ ] **Step 5: Commit**

```bash
git add build.py tests/test_build.py
git commit -m "build.py --render-only: 누적 기록을 건드리지 않고 페이지만 생성"
```

### Task 2: 옛 주소 넘겨주기 페이지 `gen/redirect.py`

**Files:**
- Create: `gen/redirect.py`
- Test: `tests/test_redirect.py`

**Interfaces:**
- Produces: `redirect.page(new_base: str, old_prefix: str) -> str` (HTML 한 장), `redirect.write(out: pathlib.Path, new_base: str, old_prefix: str) -> None` (`out/index.html`, `out/404.html`, `out/.nojekyll`). 명령: `python3 -m gen.redirect OUT NEW_BASE OLD_PREFIX`.

- [ ] **Step 1: 실패하는 테스트** — `tests/test_redirect.py`

```python
import pathlib, tempfile, unittest
from gen import redirect


class RedirectTest(unittest.TestCase):
    def test_redirect_keeps_path(self):
        h = redirect.page("https://gtdaily.news", "/world-issues")
        self.assertIn('location.replace(B+p+location.search+location.hash)', h)
        self.assertIn('var B="https://gtdaily.news"', h)
        self.assertIn('var P="/world-issues"', h)

    def test_fallbacks_without_js(self):
        h = redirect.page("https://gtdaily.news", "/world-issues")
        self.assertIn('<meta http-equiv="refresh" content="0;url=https://gtdaily.news/">', h)
        self.assertIn('<link rel="canonical" href="https://gtdaily.news/">', h)
        self.assertIn('<meta name="robots" content="noindex">', h)
        self.assertIn('href="https://gtdaily.news/"', h)

    def test_escapes_base(self):
        h = redirect.page('https://x.test/"<', "")
        self.assertNotIn('"<', h.split("<script>")[0])
        self.assertNotIn("</script><", h.replace("</script></head>", ""))

    def test_write_files(self):
        out = pathlib.Path(tempfile.mkdtemp()) / "gh"
        redirect.write(out, "https://gtdaily.news", "/world-issues")
        self.assertEqual(sorted(p.name for p in out.iterdir()), [".nojekyll", "404.html", "index.html"])
        self.assertEqual((out / "index.html").read_text(encoding="utf-8"), (out / "404.html").read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2:** `python3 -m unittest tests.test_redirect -v 2>&1 | tail -3`
  Expected: ERROR `cannot import name 'redirect'`

- [ ] **Step 3: 구현** — `gen/redirect.py`

```python
# 도메인을 옮긴 뒤 GitHub Pages(옛 주소)에 올리는 넘겨주기 페이지.
# GitHub Pages는 서버 쪽 301을 못 하므로, 같은 경로·쿼리·해시를 붙여 새 주소로 바로 보냅니다.
import json, pathlib, sys
from html import escape


def page(new_base, old_prefix):
    b = new_base.rstrip("/")
    js = lambda s: json.dumps(s).replace("<", "\\u003c")
    u = escape(b + "/", quote=True)
    return ("<!doctype html><html><head><meta charset=\"utf-8\">"
            f"<meta name=\"robots\" content=\"noindex\">"
            f"<meta http-equiv=\"refresh\" content=\"0;url={u}\">"
            f"<link rel=\"canonical\" href=\"{u}\">"
            "<title>gtdaily.news</title>"
            f"<script>var B={js(b)};var P={js(old_prefix)};"
            "var p=location.pathname;if(P&&p.indexOf(P)===0)p=p.slice(P.length)||\"/\";"
            "location.replace(B+p+location.search+location.hash)</script></head>"
            f"<body><p>This site moved to <a href=\"{u}\">{escape(b)}</a>.</p></body></html>\n")


def write(out, new_base, old_prefix):
    out = pathlib.Path(out)
    out.mkdir(parents=True, exist_ok=True)
    h = page(new_base, old_prefix)
    for name in ("index.html", "404.html"):
        (out / name).write_text(h, encoding="utf-8")
    (out / ".nojekyll").write_text("", encoding="utf-8")


if __name__ == "__main__":
    write(*sys.argv[1:4])
```

- [ ] **Step 4:** `python3 -m unittest discover -s tests -t . 2>&1 | grep -E "^(Ran|OK|FAILED)"`
  Expected: `Ran 59 tests` / `OK`

- [ ] **Step 5: Commit**

```bash
git add gen/redirect.py tests/test_redirect.py
git commit -m "옛 github.io 주소용 넘겨주기 페이지 생성기"
```

### Task 3: R2 동기화 `deploy/sync.py`

**Files:**
- Create: `deploy/__init__.py`(빈 파일), `deploy/sync.py`, `deploy/requirements.txt`
- Test: `tests/test_sync.py`

**Interfaces:**
- Produces:
  - `hash_tree(root: Path) -> dict[str, str]` — 상대 경로(`/` 구분) → sha256 hex. `.nojekyll` 제외.
  - `is_last(path: str) -> bool` — 마지막 묶음 판별.
  - `plan(old: dict, new: dict) -> tuple[list, list, list]` — `(first, last, deletes)`, 각 목록은 정렬됨.
  - `content_type(path: str) -> str`
  - `main(argv) -> int` — `python3 deploy/sync.py SITE_DIR BUCKET`. 환경 변수 `CLOUDFLARE_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`.
  - R2 키 `_manifest.json` = `{path: sha256}`.

- [ ] **Step 1: 실패하는 테스트** — `tests/test_sync.py`

```python
import pathlib, tempfile, unittest
from deploy import sync


class SyncTest(unittest.TestCase):
    def test_only_changed_files(self):
        old = {"en/index.html": "a", "en/issue/x/index.html": "b", "static/app.js": "c"}
        new = {"en/index.html": "a2", "en/issue/x/index.html": "b", "static/app.js": "c"}
        self.assertEqual(sync.plan(old, new), ([], ["en/index.html"], []))

    def test_issue_pages_before_lists(self):
        new = {"en/index.html": "1", "en/issue/y/index.html": "2", "sitemap.xml": "3", "sitemap-1.xml": "4",
               "en/feed.xml": "5", "feed.json": "6", "robots.txt": "7", "og/en-home.png": "8",
               "static/styles.css": "9", "index.html": "10", "en/2026-10-18/index.html": "11"}
        first, last, deletes = sync.plan({}, new)
        self.assertEqual(first, ["en/issue/y/index.html", "og/en-home.png", "static/styles.css"])
        self.assertEqual(last, ["en/2026-10-18/index.html", "en/feed.xml", "en/index.html", "feed.json",
                                "index.html", "robots.txt", "sitemap-1.xml", "sitemap.xml"])
        self.assertEqual(deletes, [])

    def test_deletes_missing(self):
        self.assertEqual(sync.plan({"old.html": "a", "keep.css": "b"}, {"keep.css": "b"}), ([], [], ["old.html"]))

    def test_content_type(self):
        cases = {"a/index.html": "text/html; charset=utf-8", "s.css": "text/css; charset=utf-8",
                 "a.js": "text/javascript; charset=utf-8", "f.json": "application/json; charset=utf-8",
                 "sitemap.xml": "application/xml; charset=utf-8", "en/feed.xml": "application/rss+xml; charset=utf-8",
                 "o.png": "image/png", "robots.txt": "text/plain; charset=utf-8", "x.bin": "application/octet-stream"}
        for p, t in cases.items():
            self.assertEqual(sync.content_type(p), t, p)

    def test_hash_tree(self):
        root = pathlib.Path(tempfile.mkdtemp())
        (root / "en").mkdir()
        (root / "en" / "index.html").write_text("hi", encoding="utf-8")
        (root / ".nojekyll").write_text("", encoding="utf-8")
        self.assertEqual(sync.hash_tree(root),
                         {"en/index.html": "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4"})


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2:** `python3 -m unittest tests.test_sync -v 2>&1 | tail -3`
  Expected: ERROR `No module named 'deploy'`

- [ ] **Step 3: 구현** — `deploy/__init__.py`(빈 파일), `deploy/requirements.txt`:

```
boto3==1.35.99
```

`deploy/sync.py`:

```python
# site/를 Cloudflare R2 버킷에 맞춥니다. 바뀐 파일만 올리고, 첫 화면·목록·피드·사이트맵은 마지막에,
# 지울 파일은 맨 끝에 지웁니다. 중간에 끊겨도 아직 없는 이슈 페이지를 가리키는 목록이 먼저 올라가지 않게 하기 위해서입니다.
import hashlib, json, os, pathlib, sys

MANIFEST = "_manifest.json"
_TYPES = {".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json",
          ".xml": "application/xml", ".txt": "text/plain", ".png": "image/png"}
_LAST_FILES = {"feed.json", "robots.txt"}


def hash_tree(root):
    root = pathlib.Path(root)
    return {p.relative_to(root).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in sorted(root.rglob("*")) if p.is_file() and p.name != ".nojekyll"}


def is_last(path):
    name = path.rsplit("/", 1)[-1]
    if path.endswith(".html"):
        return "/issue/" not in path
    return name in _LAST_FILES or name.endswith("feed.xml") or name.startswith("sitemap")


def plan(old, new):
    changed = sorted(p for p, h in new.items() if old.get(p) != h)
    return ([p for p in changed if not is_last(p)], [p for p in changed if is_last(p)],
            sorted(p for p in old if p not in new))


def content_type(path):
    if path.endswith("feed.xml"):
        return "application/rss+xml; charset=utf-8"
    t = _TYPES.get(pathlib.PurePosixPath(path).suffix, "application/octet-stream")
    return t + "; charset=utf-8" if t.startswith(("text/", "application/j", "application/x")) else t


def main(argv=None):
    import boto3
    site, bucket = argv or sys.argv[1:3]
    s3 = boto3.client("s3", region_name="auto",
                      endpoint_url=f"https://{os.environ['CLOUDFLARE_ACCOUNT_ID']}.r2.cloudflarestorage.com",
                      aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
                      aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"])
    try:
        old = json.loads(s3.get_object(Bucket=bucket, Key=MANIFEST)["Body"].read())
    except s3.exceptions.NoSuchKey:
        old = {}
    new = hash_tree(site)
    first, last, deletes = plan(old, new)
    for p in first + last:
        s3.upload_file(str(pathlib.Path(site) / p), bucket, p, ExtraArgs={"ContentType": content_type(p)})
    s3.put_object(Bucket=bucket, Key=MANIFEST, Body=json.dumps(new).encode(), ContentType="application/json")
    for i in range(0, len(deletes), 1000):
        s3.delete_objects(Bucket=bucket, Delete={"Objects": [{"Key": k} for k in deletes[i:i + 1000]]})
    print(f"R2 동기화: 올림 {len(first) + len(last)}개 · 지움 {len(deletes)}개 · 전체 {len(new)}개")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

주의: `main()`이 `argv`를 받으면 `site, bucket = argv`로 풀린다(테스트는 `main`을 부르지 않는다. R2 연결이 필요해서).

- [ ] **Step 4:** `python3 -m unittest discover -s tests -t . 2>&1 | grep -E "^(Ran|OK|FAILED)"`
  Expected: `Ran 64 tests` / `OK`

- [ ] **Step 5: Commit**

```bash
git add deploy tests/test_sync.py
git commit -m "R2 동기화: 바뀐 파일만, 이슈 페이지 먼저·목록 나중·삭제 마지막"
```

### Task 4: Cloudflare Worker `worker/`

**Files:**
- Create: `worker/src/index.js`, `worker/wrangler.toml`, `worker/test/resolve.test.mjs`, `worker/package.json`

**Interfaces:**
- Produces (from `worker/src/index.js`):
  - `resolve(pathname: string) -> {key: string} | {redirect: string} | {notFound: true}`
  - `cacheControl(key: string) -> string`
  - `isPreview(host: string) -> boolean`
  - `default { fetch(request, env) }` — `env.SITE`는 R2 바인딩.

- [ ] **Step 1: 실패하는 테스트** — `worker/package.json`:

```json
{ "name": "gtdaily-worker", "private": true, "type": "module" }
```

`worker/test/resolve.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import worker, { resolve, cacheControl, isPreview } from "../src/index.js";

test("maps directories to index.html", () => {
  assert.deepEqual(resolve("/"), { key: "index.html" });
  assert.deepEqual(resolve("/ko/"), { key: "ko/index.html" });
  assert.deepEqual(resolve("/ko/issue/x-y/"), { key: "ko/issue/x-y/index.html" });
  assert.deepEqual(resolve("/static/app.js"), { key: "static/app.js" });
  assert.deepEqual(resolve("/sitemap-1.xml"), { key: "sitemap-1.xml" });
});

test("adds trailing slash to extensionless paths", () => {
  assert.deepEqual(resolve("/ko"), { redirect: "/ko/" });
  assert.deepEqual(resolve("/en/issue/abc"), { redirect: "/en/issue/abc/" });
});

test("decodes percent-encoding", () => {
  assert.deepEqual(resolve("/ko/issue/%61bc/"), { key: "ko/issue/abc/index.html" });
});

test("blocks traversal and manifest", () => {
  for (const p of ["/../x", "/ko/../_manifest.json", "/_manifest.json", "//etc", "/%2e%2e/x", "/a/./b", "/%zz"]) {
    assert.deepEqual(resolve(p), { notFound: true }, p);
  }
});

test("cache times", () => {
  assert.equal(cacheControl("ko/index.html"), "public, max-age=300");
  assert.equal(cacheControl("sitemap.xml"), "public, max-age=300");
  assert.equal(cacheControl("static/styles.css"), "public, max-age=86400");
  assert.equal(cacheControl("og/en-home.png"), "public, max-age=86400");
});

test("preview host detection", () => {
  assert.equal(isPreview("gtdaily.abc.workers.dev"), true);
  assert.equal(isPreview("gtdaily.news"), false);
});

const bucket = (files) => ({
  async get(key) {
    if (!(key in files)) return null;
    return { body: files[key], httpMetadata: { contentType: "text/html; charset=utf-8" }, httpEtag: '"e"' };
  },
});

test("fetch serves files, 404s, redirects, noindex on preview", async () => {
  const env = { SITE: bucket({ "ko/index.html": "<p>ko</p>" }) };
  let r = await worker.fetch(new Request("https://gtdaily.news/ko/"), env);
  assert.equal(r.status, 200);
  assert.equal(await r.text(), "<p>ko</p>");
  assert.equal(r.headers.get("cache-control"), "public, max-age=300");
  assert.equal(r.headers.get("x-robots-tag"), null);
  r = await worker.fetch(new Request("https://gtdaily.news/ko?x=1"), env);
  assert.equal(r.status, 301);
  assert.equal(r.headers.get("location"), "https://gtdaily.news/ko/?x=1");
  r = await worker.fetch(new Request("https://gtdaily.news/nope/"), env);
  assert.equal(r.status, 404);
  r = await worker.fetch(new Request("https://gtdaily.news/ko/", { method: "POST" }), env);
  assert.equal(r.status, 405);
  r = await worker.fetch(new Request("https://gtdaily.a.workers.dev/ko/"), env);
  assert.equal(r.headers.get("x-robots-tag"), "noindex");
  r = await worker.fetch(new Request("https://gtdaily.news/ko/", { method: "HEAD" }), env);
  assert.equal(r.status, 200);
  assert.equal(await r.text(), "");
});
```

- [ ] **Step 2:** `node --test worker/test/ 2>&1 | tail -5`
  Expected: FAIL — `Cannot find module .../worker/src/index.js`

- [ ] **Step 3: 구현** — `worker/src/index.js`

```js
// gtdaily.news: R2 버킷(SITE)에 올린 정적 사이트를 꺼내 보여 줍니다.
// 주소 → 파일 이름 규칙은 resolve()에 모아 두고 테스트합니다.

export function resolve(pathname) {
  let p;
  try { p = decodeURIComponent(pathname); } catch { return { notFound: true }; }
  const parts = p.split("/").slice(1);
  const dir = parts.length > 0 && parts[parts.length - 1] === "";
  const segs = dir ? parts.slice(0, -1) : parts;
  if (segs.some((s) => s === "" || s === "." || s === ".." || s.includes("\\"))) return { notFound: true };
  const key = segs.join("/");
  if (key === "_manifest.json") return { notFound: true };
  if (dir) return { key: key ? `${key}/index.html` : "index.html" };
  if (!segs[segs.length - 1].includes(".")) return { redirect: `/${key}/` };
  return { key };
}

export function cacheControl(key) {
  return /^(static|og)\//.test(key) ? "public, max-age=86400" : "public, max-age=300";
}

export function isPreview(host) {
  return host.endsWith(".workers.dev");
}

export default {
  async fetch(request, env) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405, headers: { allow: "GET, HEAD" } });
    }
    const url = new URL(request.url);
    const r = resolve(url.pathname);
    const headers = new Headers();
    if (isPreview(url.hostname)) headers.set("x-robots-tag", "noindex");
    if (r.redirect) {
      headers.set("location", `${url.origin}${r.redirect}${url.search}`);
      return new Response(null, { status: 301, headers });
    }
    const obj = r.key ? await env.SITE.get(r.key) : null;
    if (!obj) {
      headers.set("content-type", "text/plain; charset=utf-8");
      return new Response("404 Not Found", { status: 404, headers });
    }
    headers.set("content-type", obj.httpMetadata?.contentType || "application/octet-stream");
    headers.set("cache-control", cacheControl(r.key));
    if (obj.httpEtag) headers.set("etag", obj.httpEtag);
    return new Response(request.method === "HEAD" ? null : obj.body, { status: 200, headers });
  },
};
```

`worker/wrangler.toml`:

```toml
# Cloudflare Worker 설정. 배포는 GitHub Actions(deploy.yml)가 합니다.
name = "gtdaily"
main = "src/index.js"
compatibility_date = "2026-10-01"
workers_dev = true

[[r2_buckets]]
binding = "SITE"
bucket_name = "gtdaily-site"

# 도메인을 산 뒤 아래 두 줄의 주석을 풉니다.
# routes = [{ pattern = "gtdaily.news", custom_domain = true }]
```

- [ ] **Step 4:** `node --test worker/test/ 2>&1 | grep -E "^# (pass|fail)"`
  Expected: `# pass 7` / `# fail 0`

- [ ] **Step 5: Commit**

```bash
git add worker
git commit -m "Cloudflare Worker: R2에서 페이지 제공, 경로 차단, 캐시, 테스트 주소 noindex"
```

### Task 5: GitHub Actions `deploy.yml`, `site/` 저장소에서 빼기

**Files:**
- Create: `.github/workflows/deploy.yml`
- Delete: `.github/workflows/pages.yml`
- Modify: `.gitignore` (`site/`, `site-gh/` 추가)
- Untrack: `site/` (`git rm -r -q --cached site`)
- Test: `tests/test_workflow.py`

**Interfaces:**
- Consumes: `build.py`, `build.py --render-only`(Task 1), `python3 -m gen.redirect OUT NEW_BASE OLD_PREFIX`(Task 2), `python3 deploy/sync.py site gtdaily-site`(Task 3), `worker/wrangler.toml`(Task 4).
- Produces: 저장소 변수 `SITE_URL` 하나로 동작이 갈림 — 빈 값: github.io 사이트만 / `*.workers.dev`: R2 + github.io 사본 / 그 외(`https://gtdaily.news`): R2 + 넘겨주기 페이지.

- [ ] **Step 1: 실패하는 테스트** — `tests/test_workflow.py` (YAML 해석기 없이 글자로 검사한다)

```python
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
```

- [ ] **Step 2:** `python3 -m unittest tests.test_workflow -v 2>&1 | tail -3`
  Expected: ERROR `FileNotFoundError ... deploy.yml`

- [ ] **Step 3: 구현** — `.github/workflows/deploy.yml`

```yaml
# data/latest.json(루틴 또는 맥북이 올림)이나 생성기가 바뀌면: 사이트 생성 → 누적 기록 커밋 → R2·Worker → GitHub Pages
# 저장소 변수 SITE_URL: 비어 있으면 github.io만, *.workers.dev면 R2 + github.io 사본, 그 외(도메인)면 R2 + 옛 주소 넘겨주기
name: Deploy
on:
  push:
    branches: [main]
    # data/issues·data/archive는 넣지 않습니다. 이 워크플로가 커밋하는 경로라서 넣으면 반복될 수 있습니다.
    # (GITHUB_TOKEN으로 한 push는 원래 워크플로를 다시 깨우지 않지만, 두 겹으로 막아 둡니다.)
    paths: ["data/latest.json", "gen/**", "static/**", "i18n/**", "worker/**", "deploy/**", "build.py", ".github/workflows/deploy.yml"]
  workflow_dispatch: {}
permissions:
  contents: write
  pages: write
  id-token: write
concurrency:
  group: deploy
  cancel-in-progress: false
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.pages.outputs.page_url }}
    env:
      SITE_URL: ${{ vars.SITE_URL }}
      OLD_URL: https://tking-creator.github.io/world-issues
      CF_READY: ${{ vars.SITE_URL != '' && secrets.CLOUDFLARE_API_TOKEN != '' && secrets.R2_ACCESS_KEY_ID != '' }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - name: 글꼴과 파이썬 패키지
        run: |
          sudo apt-get update -q && sudo apt-get install -y -q fonts-noto-cjk
          pip install -q "Pillow>=11" -r deploy/requirements.txt
      - name: 테스트
        run: python3 -m unittest discover -s tests -t .
      - name: 사이트 생성과 누적 기록 갱신
        run: |
          [ -n "$SITE_URL" ] || export SITE_URL="$OLD_URL"
          python3 build.py
      - name: 누적 기록 커밋
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add data/issues data/archive
          if git diff --cached --quiet; then echo "누적 기록 변화 없음"; exit 0; fi
          git commit -q -m "누적 기록 $(python3 -c 'import json;print(json.load(open("data/latest.json"))["updated"])')"
          git push -q origin HEAD:main || { git pull -q --rebase origin main && git push -q origin HEAD:main; }
      - name: R2 동기화
        if: env.CF_READY == 'true'
        env:
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          R2_ACCESS_KEY_ID: ${{ secrets.R2_ACCESS_KEY_ID }}
          R2_SECRET_ACCESS_KEY: ${{ secrets.R2_SECRET_ACCESS_KEY }}
        run: python3 deploy/sync.py site gtdaily-site
      - name: Worker 배포
        if: env.CF_READY == 'true'
        working-directory: worker
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: |
          npx -y wrangler@4.14.0 r2 bucket create gtdaily-site 2>/dev/null || true
          npx -y wrangler@4.14.0 deploy
      - name: GitHub Pages용 폴더
        run: |
          case "$SITE_URL" in
            "") cp -R site site-gh ;;
            *.workers.dev*) SITE_URL="$OLD_URL" python3 build.py --render-only --out site-gh ;;
            *) python3 -m gen.redirect site-gh "$SITE_URL" /world-issues ;;
          esac
      - uses: actions/upload-pages-artifact@v3
        with:
          path: site-gh
      - id: pages
        uses: actions/deploy-pages@v4
```

`.gitignore`에 두 줄 추가:

```
site/
site-gh/
```

그리고:

```bash
git rm -q .github/workflows/pages.yml
git rm -r -q --cached site
```

`wrangler@4.14.0`이 실제로 있는 버전인지 `npm view wrangler@4.14.0 version`으로 확인한다. 없으면 `npm view wrangler versions --json`에서 2주 넘은 4.x 최신을 골라 두 곳을 바꾸고 `Ruling:`으로 남긴다.

YAML 문법 확인: `ruby -ryaml -e 'YAML.load_file(".github/workflows/deploy.yml"); puts "yaml-ok"'`
Expected: `yaml-ok`

- [ ] **Step 4:** `python3 -m unittest discover -s tests -t . 2>&1 | grep -E "^(Ran|OK|FAILED)"`
  Expected: `Ran 69 tests` / `OK`

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/deploy.yml .gitignore tests/test_workflow.py
git commit -m "배포를 deploy.yml 하나로: 사이트 생성·누적 기록 커밋·R2·Worker·GitHub Pages, site/는 저장소에서 뺌"
```

### Task 6: 루틴 프롬프트와 `refresh.sh`

**Files:**
- Create: `routine-prompt.md`
- Modify: `refresh.sh`
- Test: `tests/test_scripts.py`

**Interfaces:**
- Consumes: `build.py --list-ids`, `--check FILE --langs`, `--render-only --out`(Task 1).
- Produces: 루틴과 `refresh.sh` 모두 `data/latest.json` 하나만 커밋하고 `git push origin HEAD:main`.

- [ ] **Step 1: 실패하는 테스트** — `tests/test_scripts.py`

```python
import pathlib, unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent


class ScriptsTest(unittest.TestCase):
    def test_refresh_commits_only_latest(self):
        s = (ROOT / "refresh.sh").read_text(encoding="utf-8")
        self.assertIn("git add data/latest.json", s)
        self.assertNotIn("git add data site", s)
        self.assertIn("--render-only", s)
        self.assertIn("git pull -q --rebase", s)

    def test_routine_prompt(self):
        s = (ROOT / "routine-prompt.md").read_text(encoding="utf-8")
        for need in ["refresh-prompt.md", "translate-prompt.md", "python3 build.py --check data/latest.json",
                     "git add data/latest.json", "git push origin HEAD:main", "data/draft.json"]:
            self.assertIn(need, s)
        self.assertNotIn("claude/", s)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2:** `python3 -m unittest tests.test_scripts -v 2>&1 | tail -3`
  Expected: FAIL (`git add data/latest.json` 없음) / ERROR (`routine-prompt.md` 없음)

- [ ] **Step 3: 구현**

`refresh.sh` 변경:
1. 첫 줄 주석을 바꾼다: `# 맥북 대체 실행용(평소에는 Claude 클라우드 루틴이 매일 06:00에 같은 일을 합니다). ① 한국어 원고 → ② 번역(실패하면 한 번 더) → ③ 검사 → ④ data/latest.json만 GitHub에 올리기. 사이트 생성·배포는 GitHub Actions가 합니다.`
2. `echo "== 시작 $(date)" >> "$LOG"` 다음 줄에: `git pull -q --rebase origin main >> "$LOG" 2>&1 || { echo "== 실패: 최신 내용을 받지 못했습니다" >> "$LOG"; finish 1; }` — `finish`가 그보다 아래에 정의돼 있으므로 이 줄은 `restore()` 정의 뒤, `rm -f data/draft.json` 앞에 둔다.
3. 번역 반복문의 검사 줄 `if python3 build.py >> "$LOG" 2>&1; then` 을 `if python3 build.py --render-only --out "logs/$STAMP-site" >> "$LOG" 2>&1; then rm -rf "logs/$STAMP-site";` 로 바꾼다(누적 기록은 Actions가 갱신한다).
4. 올리기 부분 `git add data site` → `git add data/latest.json`, `git push -q origin main` → `git push -q origin HEAD:main`.

`routine-prompt.md`:

```markdown
지금은 {{NOW}} 무렵(한국 시간 매일 06:00 예약 실행)입니다. "오늘의 세계 이슈판" 데이터를 갱신합니다. 사람이 지켜보지 않는 자동 실행이므로 질문하지 말고 끝까지 진행하세요. {{NOW}}가 그대로 보이면 `TZ=Asia/Seoul date +%Y-%m-%dT%H:%M:00+09:00`로 지금 시각을 구해 그 값을 씁니다.

1. `refresh-prompt.md`를 읽고 그대로 따릅니다. 결과는 `data/draft.json`이고, `python3 build.py --check data/draft.json --langs ko`를 통과해야 합니다. 이어지는 이슈의 id는 `python3 build.py --list-ids`로 확인해 그대로 씁니다.
2. `translate-prompt.md`를 읽고 그대로 따릅니다. 결과는 `data/latest.json`이고, `python3 build.py --check data/latest.json`을 통과해야 합니다. 통과하지 못하면 고쳐서 한 번 더 검사합니다.
3. 두 검사를 모두 통과했을 때만 올립니다. `data/draft.json`은 지우고, 다른 파일은 바꾸지 않습니다.
   ```
   rm -f data/draft.json
   git add data/latest.json
   git commit -m "자동 갱신 <updated 값>"
   git push origin HEAD:main
   ```
   새 브랜치를 만들지 말고 main에 바로 올립니다. push가 거절되면 `git pull --rebase origin main` 후 한 번 더 push합니다.
4. 검사를 통과하지 못했거나 조사가 끝나지 않았으면 아무것도 올리지 않고 끝냅니다. 사이트는 어제 내용으로 남습니다.
```

- [ ] **Step 4:** `python3 -m unittest discover -s tests -t . 2>&1 | grep -E "^(Ran|OK|FAILED)"` 그리고 `zsh -n refresh.sh && echo sh-ok`
  Expected: `Ran 71 tests` / `OK`, `sh-ok`

- [ ] **Step 5: Commit**

```bash
git add refresh.sh routine-prompt.md tests/test_scripts.py
git commit -m "갱신은 data/latest.json만 올림: 클라우드 루틴 프롬프트, refresh.sh는 맥북 대체 실행용"
```

### Task 7: 문서

**Files:**
- Modify: `README.md`(배포·갱신 절), `CLAUDE.md`

- [ ] **Step 1:** `README.md`의 갱신·배포 설명을 새 흐름으로 바꾼다: 루틴(06:00 KST) → `data/latest.json` → `deploy.yml` → R2/Worker/GitHub Pages, 저장소 변수 `SITE_URL`의 세 가지 값과 동작, 필요한 비밀 값 4개 이름, 맥북 대체 실행(`refresh.sh`, launchd plist 경로), 도메인 연결 순서(spec 7절 4번).
- [ ] **Step 2:** `CLAUDE.md`에 한 줄씩 추가: "`site/`는 저장소에 넣지 않는다. Actions가 만든다." / "Worker 주소 규칙은 `worker/src/index.js`의 `resolve()`; 테스트 `node --test worker/test/`."
- [ ] **Step 3:** 전체 확인: `python3 -m unittest discover -s tests -t . 2>&1 | grep -E "^(Ran|OK|FAILED)"; node --test worker/test/ 2>&1 | grep -E "^# (pass|fail)"`
  Expected: `Ran 71 tests` / `OK`, `# pass 7` / `# fail 0`
- [ ] **Step 4: Commit**

```bash
git add README.md CLAUDE.md
git commit -m "문서: Cloudflare 배포와 클라우드 갱신"
```

---

## 사용자 확인이 필요한 배포 단계 (구현 뒤, 각 단계마다 확인받고 진행)

1. **병합(비밀 값 없이도 안전):** `cloudflare` 브랜치를 main에 병합·push. `SITE_URL`이 비어 있어 Actions는 github.io 사이트만 올린다. 확인: Actions 성공, github.io 주요 주소 200, 저장소에 `site/`가 없어짐, 누적 기록 커밋이 생기거나 "변화 없음".
2. **Cloudflare 준비(사용자):** 가입, 비밀 값 4개를 GitHub Secrets에 입력. 그 뒤 workers.dev 하위 주소를 확인해 `gh variable set SITE_URL --body https://gtdaily.<하위주소>.workers.dev` → 수동 실행 `gh workflow run deploy.yml` → 테스트 주소에서 내부 링크 전체 확인(깨진 링크 0), `x-robots-tag: noindex`, 404 상태.
3. **루틴:** `routine-prompt.md` 내용으로 매일 21:00 UTC 루틴 생성(사용자가 GitHub 접근 허락) → 수동 1회 실행 → `data/latest.json` 커밋과 Actions 배포 확인 → `launchctl bootout gui/$(id -u)/local.world-issues.refresh`(plist는 남김).
4. **도메인(사용자 구입 뒤):** `worker/wrangler.toml` routes 주석 풀기 → `gh variable set SITE_URL --body https://gtdaily.news` → 배포 → `https://gtdaily.news` 확인, 옛 주소 넘겨주기 확인 → Search Console에 새 사이트맵 제출(사용자).
