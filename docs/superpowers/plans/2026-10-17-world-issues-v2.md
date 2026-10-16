# 오늘의 세계 이슈판 v2 (1번 덩어리: 사이트 새로 짜기) 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 한 페이지 한국어 사이트를, 4개 언어 정적 페이지(첫 화면·이슈 개별·날짜·나라·분야·깃허브)와 검색 장치(사이트 지도·hreflang·구조 정보·RSS·공유 이미지)를 매일 06:00 KST에 만들어 올리는 사이트로 바꾼다.

**Architecture:** Claude가 `data/draft.json`(한국어)을 쓰고 번역해 `data/latest.json`(4개 언어)을 만든다. `build.py`가 검사 → `data/issues/`, `data/archive/` 누적 → `site/`에 완성 HTML을 생성한다. 페이지 HTML은 `gen/` 안의 파이썬 함수(f-string)로 만들고, 브라우저 스크립트(`static/app.js`)는 탭·필터·언어 기억·"N시간 전" 표시만 맡는다. `site/`는 GitHub Actions로 GitHub Pages에 올린다(2번 덩어리에서 Cloudflare로 옮김).

**Tech Stack:** Python 3.14 표준 라이브러리(zoneinfo, json, html, unittest), Pillow 12(공유 이미지), 바닐라 JS, GitHub Actions(Pages 배포), Claude Code `claude -p`(갱신).

**Spec:** `docs/superpowers/specs/2026-10-17-world-issues-v2-design.md`

## Global Constraints

- 언어: `en`, `ko`, `ja`, `zh`(간체). 루트 `/`는 영어판 내용이고 canonical은 `/en/`.
- 나라 주소 키: `korea`, `usa`, `japan`, `china`, `world`. 분야 키: `tech`, `politics`, `culture`, `incidents`.
- 선정 기준: 점수 4개(화제성·파급력·시의성·지속성, 각 10점) 평균 **5.0 이상**. 분야별 최대 10개.
- 이슈 개별 페이지는 4개 언어 모두 본문이 정확히 네 단락일 때만 만든다. 아니면 건너뛰고 목록을 출력한다(오류 아님).
- `id`: `^[a-z0-9]+(?:-[a-z0-9]+)*$`, 60자 이하, 같은 회차 안에서 중복 금지.
- 갱신: 하루 한 번 06:00 KST. 날짜별 기록은 한국 날짜 기준.
- 나라별 갱신 시각 시간대: 한국 Asia/Seoul / 미국 America/New_York, America/Los_Angeles / 일본 Asia/Tokyo / 중국 Asia/Shanghai / 유럽 외 Europe/Paris, Europe/London.
- 점수를 실제 SNS 언급량처럼 표현하지 않는다. 모든 이슈에 출처 URL이 있어야 한다.
- 색은 `:root` 토큰으로 정의하고, 다크 모드 두 블록(`prefers-color-scheme` 안의 `:root:not([data-theme="light"])`, `:root[data-theme="dark"]`)에도 같이 넣는다.
- 외부 의존성은 Pillow 하나만. 테스트는 `python3 -m unittest`(pytest 없음).
- 화면 문구, 로그, 오류 메시지, 주석은 한국어. 코드 이름은 영어.
- 기존 `history/`, `data.js`는 지우지 않는다.

## Review Focus

1. **뉴스 제목에 `<`, `"`, `</script>`가 들어간 경우**: HTML과 JSON-LD 어디에도 태그로 해석되면 안 된다. → Task 4 테스트 `test_escapes_title_everywhere`
2. **한 번 만든 개별 페이지가 다음 회차에 본문 없이 다시 나온 경우**: 이미 검색에 걸린 페이지가 404가 되면 안 된다. 이전 본문을 유지해야 한다. → Task 3 테스트 `test_keeps_old_body_when_new_has_none`
3. **번역 단계가 실패해 `latest.json`이 깨진 경우**: `build.py`는 사이트와 누적 기록을 건드리지 않고 실패해야 한다. → Task 9 테스트 `test_invalid_latest_leaves_site_and_store`
4. **모음 페이지 이슈 수가 30의 경계(30, 31개)인 경우**: 쪽 나눔이 빈 2쪽을 만들거나 31번째를 빠뜨리면 안 된다. → Task 5 테스트 `test_hub_pagination_boundary`
5. **서머타임이 바뀌는 날짜**: 미국·유럽 현지 시각이 1시간 어긋나면 안 된다. → Task 2 테스트 `test_dst_winter`

---

## File Structure

| 파일 | 상태 | 역할 |
|---|---|---|
| `gen/__init__.py` | 새로 | 패키지 표시 |
| `gen/config.py` | 새로 | 사이트 주소, 언어·나라·분야 표, 기준값 |
| `gen/model.py` | 새로 | 점수 평균, SNS 링크 만들기, 본문 유무, 데이터 검사, `Page` |
| `gen/store.py` | 새로 | `data/issues/`, `data/archive/` 누적과 읽기 |
| `gen/timefmt.py` | 새로 | 언어별 날짜·시각 문구, 나라별 현지 시각 |
| `gen/i18n.py` | 새로 | 언어 파일 읽기 |
| `gen/html.py` | 새로 | 이스케이프, 주소, 페이지 틀, 카드 조각 |
| `gen/pages.py` | 새로 | 페이지 종류별 생성 |
| `gen/feeds.py` | 새로 | 사이트 지도, robots, RSS, feed.json |
| `gen/og.py` | 새로 | 공유 미리보기 이미지 |
| `i18n/{en,ko,ja,zh}.json` | 새로 | 화면 고정 문구 |
| `static/styles.css` | `styles.css`를 옮기고 고침 | 디자인 |
| `static/app.js` | 새로 | 탭·필터·언어 기억·내 시간 표시·루트 언어 안내 |
| `build.py` | 다시 씀 | 진입점(검사·누적·생성, `--check`, `--list-ids`) |
| `refresh.sh`, `refresh-prompt.md` | 다시 씀 | 2단계 갱신 |
| `translate-prompt.md` | 새로 | 번역 단계 지시 |
| `.github/workflows/pages.yml` | 새로 | `site/`를 Pages에 배포 |
| `tests/helpers.py`, `tests/test_*.py` | 새로 | 테스트 |
| `index.html`, `app.js` | 삭제 | 새 생성 코드로 대체됨 |
| `CLAUDE.md`, `README.md`, `.gitignore` | 고침 | 새 구조 반영 |

설계 문서와 다른 점 두 가지(설계 문서도 함께 고침):
- `templates/` 폴더 대신 `gen/html.py`의 함수로 HTML을 만든다. 템플릿 엔진 의존성을 늘리지 않기 위해서다.
- 나라별 "분석 플랫폼" 목록은 매일 바뀌지 않으므로 `latest.json`이 아니라 `gen/config.py`에 둔다.

---

### Task 1: 기본 설정, 모델, 데이터 검사

**Files:**
- Create: `gen/__init__.py`, `gen/config.py`, `gen/model.py`, `tests/__init__.py`, `tests/helpers.py`, `tests/test_model.py`

**Interfaces:**
- Produces:
  - `gen.config`: `SITE_URL: str`, `PREFIX: str`, `LANGS: list[str]`, `COUNTRIES: dict[str, tuple[code, flag, accent, zones]]`, `COUNTRY_PLATFORMS: dict[str, list[tuple[name_key, url]]]`, `FIELDS: dict[str, css_var]`, `MIN_SCORE=5.0`, `MAX_PER_FIELD=10`, `HUB_PAGE_SIZE=30`
  - `gen.model`: `avg(scores) -> float`, `link(p, q) -> {"p","cls","q","url"}`, `has_body(item) -> bool`, `validate(d, langs=LANGS) -> list[str]`, `Page(lang, path, html, lastmod)` (namedtuple, 루트는 `lang=None`)
  - `tests.helpers`: `item(id, field="tech", scores=(7,7,7,7), body=4, youth=False) -> dict`, `make_latest(updated=...) -> dict`

- [ ] **Step 1: 테스트 도우미와 실패하는 테스트 쓰기**

`tests/__init__.py`는 빈 파일로 만든다.

`tests/helpers.py`:

```python
# 테스트용 데이터: 검사를 통과하는 최소 latest.json을 만듭니다.
LANGS = ["en", "ko", "ja", "zh"]
COUNTRIES = ["korea", "usa", "japan", "china", "world"]


def text(title, body=4):
    return {l: {"title": f"{title} {l}", "summary": f"{title} summary {l}",
                "body": [f"{title} p{i} {l}" for i in range(body)]} for l in LANGS}


def item(id, field="tech", scores=(7, 7, 7, 7), body=4, youth=False):
    return {"id": id, "field": field, "scores": list(scores), "youth": youth,
            "links": [{"p": "naver", "q": "검색어"}],
            "source": {"name": "Src 10/16", "url": "https://example.com/a"},
            "text": text(id, body)}


def make_latest(updated="2026-10-17T06:00:00+09:00"):
    cs = {k: {"items": [item(f"{k}-one"), item(f"{k}-two", field="culture", scores=(6, 5, 6, 5), youth=True)],
              "cut": [{l: f"cut {l}" for l in LANGS}]} for k in COUNTRIES}
    gh = {"date": updated[:10], "items": [
        {"repo": f"owner/repo{i}", "language": "Python", "stars": 1000 + i, "today": 10 + i,
         "desc": {l: f"desc {i} {l}" for l in LANGS}} for i in range(10)]}
    return {"updated": updated, "countries": cs, "github": gh}
```

`tests/test_model.py`:

```python
import unittest
from gen.model import avg, link, has_body, validate
from tests.helpers import item, make_latest


class ModelTest(unittest.TestCase):
    def test_avg(self):
        self.assertEqual(avg([8, 8, 9, 7]), 8.0)

    def test_link_rules_match_old_site(self):
        self.assertEqual(link("ig", "코스피")["url"], "https://www.instagram.com/explore/tags/%EC%BD%94%EC%8A%A4%ED%94%BC/")
        self.assertEqual(link("ig", "코스피")["q"], "#코스피")
        self.assertEqual(link("wb", "台风")["q"], "#台风#")
        self.assertTrue(link("wb", "台风")["url"].startswith("https://s.weibo.com/weibo?q=%23"))
        self.assertEqual(link("naver", "a/b")["url"], "https://search.naver.com/search.naver?query=a%2Fb")
        self.assertEqual(link("naver", "x")["cls"], "nv")

    def test_has_body(self):
        self.assertTrue(has_body(item("a")))
        self.assertFalse(has_body(item("a", body=3)))
        x = item("a"); x["text"]["zh"]["body"][2] = "  "
        self.assertFalse(has_body(x))

    def test_valid_data_passes(self):
        self.assertEqual(validate(make_latest()), [])

    def test_ko_only_draft_passes_with_langs(self):
        d = make_latest()
        for c in d["countries"].values():
            for x in c["items"]:
                x["text"] = {"ko": x["text"]["ko"]}
            c["cut"] = [{"ko": "뺌"}]
        for g in d["github"]["items"]:
            g["desc"] = {"ko": "설명"}
        self.assertEqual(validate(d, langs=["ko"]), [])
        self.assertTrue(validate(d))

    def check_error(self, mutate, needle):
        d = make_latest(); mutate(d)
        err = validate(d)
        self.assertTrue(any(needle in e for e in err), err)

    def test_errors(self):
        k = lambda d: d["countries"]["korea"]["items"]
        self.check_error(lambda d: d.update(updated="2026-10-17 06:00"), "updated")
        self.check_error(lambda d: d["countries"].pop("china"), "china: 항목 없음")
        self.check_error(lambda d: k(d)[0].update(scores=[5, 5, 4, 5]), "5.0 미만")
        self.check_error(lambda d: k(d)[0].update(scores=[9, 9, 9]), "점수 4개")
        self.check_error(lambda d: k(d)[0].update(field="sports"), "분야 키")
        self.check_error(lambda d: k(d)[0].update(source={"name": "x"}), "출처")
        self.check_error(lambda d: k(d)[0].update(links=[]), "링크")
        self.check_error(lambda d: k(d)[0].update(links=[{"p": "fb", "q": "x"}]), "링크")
        self.check_error(lambda d: k(d)[0].update(id="Bad_ID"), "id 형식")
        self.check_error(lambda d: k(d)[0].update(id="a" * 61), "id 형식")
        self.check_error(lambda d: k(d)[1].update(id="korea-one"), "id 중복")
        self.check_error(lambda d: k(d)[0]["text"].pop("ja"), "ja 제목/요약")
        self.check_error(lambda d: d["countries"]["korea"]["cut"][0].pop("zh"), "뺀 항목")
        self.check_error(lambda d: d["github"]["items"].pop(), "github 항목이 10개")
        self.check_error(lambda d: d["github"]["items"][0]["desc"].pop("en"), "github: en 설명")

    def test_id_duplicate_across_countries(self):
        d = make_latest()
        d["countries"]["usa"]["items"][0]["id"] = "korea-one"
        self.assertTrue(any("id 중복" in e for e in validate(d)))

    def test_field_limit(self):
        d = make_latest()
        d["countries"]["japan"]["items"] = [item(f"jp-{i}") for i in range(11)]
        self.assertTrue(any("tech 10개 초과" in e for e in validate(d)))

    def test_body_missing_is_not_error(self):
        d = make_latest()
        d["countries"]["korea"]["items"][0] = item("korea-one", body=0)
        self.assertEqual(validate(d), [])


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: 실패 확인**

Run: `cd ~/Desktop/world-issues && python3 -m unittest tests.test_model -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'gen'`

- [ ] **Step 3: 구현**

`gen/__init__.py`는 빈 파일로 만든다.

`gen/config.py`:

```python
# 사이트 전체 설정: 주소, 언어, 나라, 분야, 기준값
import os
from urllib.parse import urlparse

SITE_URL = os.environ.get("SITE_URL", "https://tking-creator.github.io/world-issues").rstrip("/")
PREFIX = urlparse(SITE_URL).path  # 하위 경로에 올릴 때 내부 링크 앞에 붙는 부분 ("" 또는 "/world-issues")
LANGS = ["en", "ko", "ja", "zh"]

# 주소 키: (탭 코드, 국기, 강조색 키, 갱신 시각을 보여 줄 시간대)
COUNTRIES = {
    "korea": ("KR", "🇰🇷", "kr", ["Asia/Seoul"]),
    "usa":   ("US", "🇺🇸", "us", ["America/New_York", "America/Los_Angeles"]),
    "japan": ("JP", "🇯🇵", "jp", ["Asia/Tokyo"]),
    "china": ("CN", "🇨🇳", "cn", ["Asia/Shanghai"]),
    "world": ("EU+", "🌍", "etc", ["Europe/Paris", "Europe/London"]),
}

# 나라별 분석 플랫폼: (i18n plat_names 키, 주소)
COUNTRY_PLATFORMS = {
    "korea": [("instagram", "https://www.instagram.com/explore/"), ("threads", "https://www.threads.com/"), ("naver_search", "https://search.naver.com/")],
    "usa":   [("instagram", "https://www.instagram.com/explore/"), ("reddit", "https://www.reddit.com/r/news/"), ("x", "https://x.com/explore")],
    "japan": [("x_trends", "https://x.com/explore"), ("tiktok", "https://www.tiktok.com/explore")],
    "china": [("weibo_hot", "https://s.weibo.com/top/summary")],
    "world": [("x", "https://x.com/explore"), ("r_europe", "https://www.reddit.com/r/europe/"), ("r_worldnews", "https://www.reddit.com/r/worldnews/")],
}

# 분야 키: 색 토큰
FIELDS = {"tech": "--f-tech", "politics": "--f-pol", "culture": "--f-cul", "incidents": "--f-acc"}

MIN_SCORE = 5.0
MAX_PER_FIELD = 10
HUB_PAGE_SIZE = 30
```

`gen/model.py`:

```python
# 데이터 규칙: 점수 평균, SNS 검색 링크, 본문 유무, latest.json 검사
import re
from collections import namedtuple
from urllib.parse import quote
from . import config as C

Page = namedtuple("Page", "lang path html lastmod")  # lang이 None이면 루트(/) 페이지

ID_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
UPDATED_RE = re.compile(r"^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d[+-]\d\d:\d\d$")
_q = lambda s: quote(s, safe="")

# 플랫폼 키: (CSS 클래스, 화면에 보일 검색어, 검색 주소). 옛 사이트의 L 도우미와 같은 규칙입니다.
_PLAT = {
    "ig":    ("ig", lambda q: "#" + q, lambda q: "https://www.instagram.com/explore/tags/" + _q(q) + "/"),
    "naver": ("nv", lambda q: q, lambda q: "https://search.naver.com/search.naver?query=" + _q(q)),
    "x":     ("x", lambda q: q, lambda q: "https://x.com/search?q=" + _q(q) + "&f=live"),
    "rd":    ("rd", lambda q: q, lambda q: "https://www.reddit.com/search/?q=" + _q(q) + "&sort=hot&t=day"),
    "th":    ("th", lambda q: q, lambda q: "https://www.threads.com/search?q=" + _q(q) + "&serp_type=default"),
    "tt":    ("tt", lambda q: q, lambda q: "https://www.tiktok.com/search?q=" + _q(q)),
    "wb":    ("wb", lambda q: "#" + q + "#", lambda q: "https://s.weibo.com/weibo?q=" + _q("#" + q + "#")),
}
PLATFORMS = tuple(_PLAT)


def avg(scores):
    return sum(scores) / len(scores)


def link(p, q):
    cls, shown, url = _PLAT[p]
    return {"p": p, "cls": cls, "q": shown(q), "url": url(q)}


def has_body(item):
    for l in C.LANGS:
        body = (item.get("text", {}).get(l) or {}).get("body") or []
        if len(body) != 4 or not all(str(x).strip() for x in body):
            return False
    return True


def validate(d, langs=C.LANGS):
    err, seen = [], set()
    if not UPDATED_RE.match(str(d.get("updated", ""))):
        err.append(f"updated 형식이 틀렸습니다(예: 2026-10-17T06:00:00+09:00): {d.get('updated')!r}")
    countries = d.get("countries") or {}
    for k in C.COUNTRIES:
        c = countries.get(k)
        if not c or not c.get("items"):
            err.append(f"{k}: 항목 없음")
            continue
        for x in c["items"]:
            name = x.get("id")
            s = x.get("scores") or []
            if len(s) != 4:
                err.append(f"{k}: 점수 4개 아님 - {name}")
            elif avg(s) < C.MIN_SCORE:
                err.append(f"{k}: {C.MIN_SCORE} 미만 - {name}")
            if x.get("field") not in C.FIELDS:
                err.append(f"{k}: 분야 키 틀림 - {name}")
            if not (x.get("source") or {}).get("url"):
                err.append(f"{k}: 출처 없음 - {name}")
            links = x.get("links") or []
            if not links or any(l.get("p") not in PLATFORMS or not l.get("q") for l in links):
                err.append(f"{k}: 링크 없음 또는 플랫폼 키 틀림 - {name}")
            if not isinstance(name, str) or len(name) > 60 or not ID_RE.match(name):
                err.append(f"{k}: id 형식 틀림 - {name}")
            elif name in seen:
                err.append(f"{k}: id 중복 - {name}")
            else:
                seen.add(name)
            for l in langs:
                t = (x.get("text") or {}).get(l) or {}
                if not t.get("title") or not t.get("summary"):
                    err.append(f"{k}: {l} 제목/요약 없음 - {name}")
        for f in C.FIELDS:
            if sum(1 for x in c["items"] if x.get("field") == f) > C.MAX_PER_FIELD:
                err.append(f"{k}: {f} {C.MAX_PER_FIELD}개 초과")
        for cut in c.get("cut") or []:
            for l in langs:
                if not cut.get(l):
                    err.append(f"{k}: 뺀 항목에 {l} 문구 없음")
    gh = d.get("github") or {}
    items = gh.get("items") or []
    if not gh.get("date"):
        err.append("github: date 없음")
    if len(items) != 10:
        err.append(f"github 항목이 10개가 아님({len(items)}개)")
    for g in items:
        for l in langs:
            if not (g.get("desc") or {}).get(l):
                err.append(f"github: {l} 설명 없음 - {g.get('repo')}")
    return err
```

- [ ] **Step 4: 통과 확인**

Run: `python3 -m unittest tests.test_model -v`
Expected: 모든 테스트 OK

- [ ] **Step 5: 커밋**

```bash
git add gen/__init__.py gen/config.py gen/model.py tests/__init__.py tests/helpers.py tests/test_model.py
git commit -m "v2: 설정, 데이터 모델, latest.json 검사"
```

---

### Task 2: 시간 표시와 언어 파일

**Files:**
- Create: `gen/timefmt.py`, `gen/i18n.py`, `i18n/en.json`, `i18n/ko.json`, `i18n/ja.json`, `i18n/zh.json`, `tests/test_timefmt.py`

**Interfaces:**
- Consumes: `gen.config.COUNTRIES`, `LANGS`
- Produces:
  - `gen.timefmt`: `parse(iso) -> datetime`, `fmt_time(dt, lang) -> str`, `fmt_date(ymd, lang) -> str`, `kst_date(iso) -> "YYYY-MM-DD"`, `country_line(iso, country, lang) -> str`, `seoul(iso, lang) -> str`
  - `gen.i18n.T(lang) -> dict` (아래 JSON 구조)

- [ ] **Step 1: 실패하는 테스트 쓰기**

`tests/test_timefmt.py`:

```python
import json, pathlib, unittest
from gen.timefmt import fmt_date, kst_date, country_line, seoul
from gen.i18n import T

OCT = "2026-10-17T06:00:00+09:00"   # 서머타임 중
DEC = "2026-12-17T06:00:00+09:00"   # 서머타임 끝난 뒤


def keys(d, p=""):
    out = set()
    for k, v in d.items():
        out.add(p + k)
        if isinstance(v, dict):
            out |= keys(v, p + k + ".")
    return out


class TimeTest(unittest.TestCase):
    def test_usa_summer(self):
        self.assertEqual(country_line(OCT, "usa", "en"), "Oct 16, 5:00 PM (New York) · Oct 16, 2:00 PM (Los Angeles)")

    def test_dst_winter(self):
        self.assertEqual(country_line(DEC, "usa", "en"), "Dec 16, 4:00 PM (New York) · Dec 16, 1:00 PM (Los Angeles)")
        self.assertEqual(country_line(DEC, "world", "en"), "Dec 16, 10:00 PM (Paris) · Dec 16, 9:00 PM (London)")

    def test_languages(self):
        self.assertEqual(country_line(OCT, "korea", "ko"), "10월 17일 오전 6:00 (서울)")
        self.assertEqual(country_line(OCT, "china", "zh"), "10月17日 上午5:00（北京）")
        self.assertEqual(country_line(OCT, "japan", "ja"), "10月17日 午前6:00（東京）")
        self.assertEqual(country_line(OCT, "world", "ko"), "10월 16일 오후 11:00 (파리) · 10월 16일 오후 10:00 (런던)")

    def test_midnight_and_noon(self):
        self.assertEqual(seoul("2026-10-17T00:05:00+09:00", "en"), "Oct 17, 12:05 AM (Seoul)")
        self.assertEqual(seoul("2026-10-17T12:00:00+09:00", "ko"), "10월 17일 오후 12:00 (서울)")

    def test_dates(self):
        self.assertEqual(fmt_date("2026-10-17", "en"), "Oct 17, 2026")
        self.assertEqual(fmt_date("2026-10-17", "ko"), "2026년 10월 17일")
        self.assertEqual(fmt_date("2026-10-17", "ja"), "2026年10月17日")
        self.assertEqual(kst_date("2026-10-16T22:00:00+00:00"), "2026-10-17")

    def test_i18n_files_have_same_keys(self):
        base = keys(T("en"))
        for l in ["ko", "ja", "zh"]:
            self.assertEqual(keys(T(l)), base, l)

    def test_i18n_lists_have_same_length(self):
        for l in ["ko", "ja", "zh"]:
            for k in ["crit", "stats", "body_heads", "method"]:
                self.assertEqual(len(T(l)[k]), len(T("en")[k]), (l, k))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: 실패 확인**

Run: `python3 -m unittest tests.test_timefmt -v`
Expected: FAIL — `No module named 'gen.timefmt'`

- [ ] **Step 3: 구현**

`gen/timefmt.py`:

```python
# 언어별 날짜·시각 문구와 나라별 현지 갱신 시각
from datetime import date, datetime
from zoneinfo import ZoneInfo
from . import config as C

_MON = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split()
_CITY = {
    "Asia/Seoul":          {"en": "Seoul", "ko": "서울", "ja": "ソウル", "zh": "首尔"},
    "America/New_York":    {"en": "New York", "ko": "뉴욕", "ja": "ニューヨーク", "zh": "纽约"},
    "America/Los_Angeles": {"en": "Los Angeles", "ko": "LA", "ja": "ロサンゼルス", "zh": "洛杉矶"},
    "Asia/Tokyo":          {"en": "Tokyo", "ko": "도쿄", "ja": "東京", "zh": "东京"},
    "Asia/Shanghai":       {"en": "Beijing", "ko": "베이징", "ja": "北京", "zh": "北京"},
    "Europe/Paris":        {"en": "Paris", "ko": "파리", "ja": "パリ", "zh": "巴黎"},
    "Europe/London":       {"en": "London", "ko": "런던", "ja": "ロンドン", "zh": "伦敦"},
}
_AMPM = {"ja": ("午前", "午後"), "zh": ("上午", "下午")}


def parse(iso):
    return datetime.fromisoformat(iso)


def fmt_time(dt, lang):
    h12, am, mm = dt.hour % 12 or 12, dt.hour < 12, f"{dt.minute:02d}"
    if lang == "en":
        return f"{_MON[dt.month - 1]} {dt.day}, {h12}:{mm} {'AM' if am else 'PM'}"
    if lang == "ko":
        return f"{dt.month}월 {dt.day}일 {'오전' if am else '오후'} {h12}:{mm}"
    return f"{dt.month}月{dt.day}日 {_AMPM[lang][0 if am else 1]}{h12}:{mm}"


def fmt_date(ymd, lang):
    d = date.fromisoformat(ymd)
    if lang == "en":
        return f"{_MON[d.month - 1]} {d.day}, {d.year}"
    if lang == "ko":
        return f"{d.year}년 {d.month}월 {d.day}일"
    return f"{d.year}年{d.month}月{d.day}日"


def kst_date(iso):
    return parse(iso).astimezone(ZoneInfo("Asia/Seoul")).date().isoformat()


def _at(dt, zone, lang):
    city = _CITY[zone][lang]
    paren = f"（{city}）" if lang in _AMPM else f" ({city})"
    return fmt_time(dt.astimezone(ZoneInfo(zone)), lang) + paren


def country_line(iso, country, lang):
    dt = parse(iso)
    return " · ".join(_at(dt, z, lang) for z in C.COUNTRIES[country][3])


def seoul(iso, lang):
    return _at(parse(iso), "Asia/Seoul", lang)
```

`gen/i18n.py`:

```python
# 화면 고정 문구를 i18n/{lang}.json에서 읽습니다.
import json, pathlib

_DIR = pathlib.Path(__file__).resolve().parent.parent / "i18n"
_cache = {}


def T(lang):
    if lang not in _cache:
        _cache[lang] = json.loads((_DIR / f"{lang}.json").read_text(encoding="utf-8"))
    return _cache[lang]
```

`i18n/en.json`:

```json
{
  "lang_name": "English",
  "site_name": "World Issues Today",
  "tagline": "What people in Korea, the US, Japan, China and Europe are talking about on social media today, picked from news reports and scored.",
  "language": "Language",
  "lang_suggest": "Read this page in",
  "home": "Home",
  "tabs_label": "Choose a country",
  "countries": {"korea": "Korea", "usa": "United States", "japan": "Japan", "china": "China", "world": "Europe & more"},
  "github": "GitHub",
  "fields": {"tech": "Tech & Economy", "politics": "Politics", "culture": "Culture & Society", "incidents": "Incidents"},
  "crit": ["Buzz", "Impact", "Timeliness", "Staying power"],
  "stats": ["Regions", "Issues", "Min score"],
  "updated_viewer": "Updated {time} your time · {n}h ago",
  "updated_kst": "Updated {time}",
  "updated_local": "Local time",
  "top": "#1 today",
  "rank": "#{n}",
  "all": "All",
  "field_label": "Field",
  "platforms_label": "Platforms analyzed",
  "plat_names": {"instagram": "Instagram", "threads": "Threads", "naver_search": "Naver Search", "reddit": "Reddit", "x": "X", "x_trends": "X Trends", "tiktok": "TikTok", "weibo_hot": "Weibo Hot Search", "r_europe": "r/europe", "r_worldnews": "r/worldnews"},
  "platforms": {"ig": "Instagram", "naver": "Naver", "x": "X", "rd": "Reddit", "th": "Threads", "tt": "TikTok", "wb": "Weibo"},
  "empty_field": "No {field} issue scored 5.0 or higher today.",
  "empty_hub": "No issues yet.",
  "cut_summary": "{n} items left out for low scores",
  "youth": "Gen Z trend",
  "source": "Source",
  "first_seen": "First seen",
  "last_updated": "Last updated",
  "body_heads": ["What happened", "Why it's trending", "Reactions", "What to watch"],
  "related": "Related issues",
  "on_social": "See it on social media",
  "gh_top": "#1 on GitHub Trending today",
  "gh_rest": "#2–10",
  "gh_note": "{date} · all languages · in GitHub Trending order, not scored",
  "gh_today": "today",
  "gh_stars_today": "stars today",
  "newer": "← Newer",
  "older": "Older →",
  "page_suffix": " — page {n}",
  "archive_label": "Daily archive",
  "disclaimer": "Written with AI from public news reports and social media. Scores are editorial judgments, not measured social media volume. Social links open keyword searches, not individual posts.",
  "method": [
    ["How we score", "Buzz (how much it will be talked about), impact (how far it reaches), timeliness (is it new today) and staying power (will it last for days) are each rated out of 10 and averaged."],
    ["What's left out", "Issues averaging under 5.0 are dropped, so some fields have fewer than 10. Dropped items are listed at the bottom of each tab."],
    ["Gen Z trend", "Items marked “Gen Z trend” are picked from trend media and youth surveys covering what spreads on Reels, Threads and TikTok."],
    ["Before you read", "Scores are Claude's judgment based on news reports, not counts of posts."]
  ],
  "titles": {
    "home": "{date} · What's trending by country | {site}",
    "date": "{date} · Trending issues archive | {site}",
    "country": "What's trending in {country} today | {site}",
    "field": "Trending {field} issues by country | {site}",
    "issue": "{title} | {site}",
    "github": "{date} · GitHub Trending top 10 explained | {site}"
  },
  "descs": {
    "home": "Today's most talked-about issues in Korea, the US, Japan, China and Europe, scored and linked to social media searches. Updated daily.",
    "date": "Trending issues by country on {date}, scored and linked to social media searches.",
    "country": "The latest trending issues in {country}, updated every day.",
    "field": "The latest trending {field} issues across Korea, the US, Japan, China and Europe, updated every day.",
    "github": "The top 10 GitHub Trending repositories on {date}, explained in plain words."
  }
}
```

`i18n/ko.json`:

```json
{
  "lang_name": "한국어",
  "site_name": "오늘의 세계 이슈판",
  "tagline": "한국, 미국, 일본, 중국, 유럽에서 오늘 SNS에서 화제가 된 이슈를 뉴스 보도를 근거로 골라 점수순으로 정리했습니다.",
  "language": "언어",
  "lang_suggest": "이 페이지를 다른 언어로 보기",
  "home": "홈",
  "tabs_label": "나라 선택",
  "countries": {"korea": "한국", "usa": "미국", "japan": "일본", "china": "중국", "world": "유럽 외"},
  "github": "깃허브",
  "fields": {"tech": "기술·경제", "politics": "정치", "culture": "문화·사회", "incidents": "사건사고"},
  "crit": ["화제성", "파급력", "시의성", "지속성"],
  "stats": ["지역", "선정 이슈", "최저 기준점"],
  "updated_viewer": "내 시간 기준 {time} 갱신 · {n}시간 전",
  "updated_kst": "{time} 갱신",
  "updated_local": "현지 시각",
  "top": "오늘 1위",
  "rank": "{n}위",
  "all": "전체",
  "field_label": "분야",
  "platforms_label": "분석 플랫폼",
  "plat_names": {"instagram": "Instagram", "threads": "Threads", "naver_search": "네이버 검색", "reddit": "Reddit", "x": "X", "x_trends": "X 트렌드", "tiktok": "TikTok", "weibo_hot": "웨이보 핫검색", "r_europe": "r/europe", "r_worldnews": "r/worldnews"},
  "platforms": {"ig": "Instagram", "naver": "네이버", "x": "X", "rd": "Reddit", "th": "Threads", "tt": "TikTok", "wb": "웨이보"},
  "empty_field": "오늘 5.0점을 넘는 {field} 이슈를 찾지 못했습니다.",
  "empty_hub": "아직 이슈가 없습니다.",
  "cut_summary": "점수 미달로 뺀 항목 {n}개 보기",
  "youth": "10~20대 트렌드",
  "source": "출처",
  "first_seen": "처음 나온 날",
  "last_updated": "마지막 갱신",
  "body_heads": ["무슨 일인가요", "왜 화제인가요", "반응", "앞으로 볼 점"],
  "related": "관련 이슈",
  "on_social": "SNS에서 보기",
  "gh_top": "오늘 깃허브 트렌딩 1위",
  "gh_rest": "2~10위",
  "gh_note": "{date} 기준 · 전체 언어 · GitHub 트렌딩 순서 그대로이며 점수는 매기지 않았습니다",
  "gh_today": "오늘",
  "gh_stars_today": "오늘 받은 별",
  "newer": "← 최신",
  "older": "이전 →",
  "page_suffix": " — {n}쪽",
  "archive_label": "날짜별 기록",
  "disclaimer": "AI가 공개 기사와 SNS를 바탕으로 정리했습니다. 점수는 실제 SNS 언급량이 아니라 판단 값입니다. SNS 링크는 개별 게시글이 아닌 키워드 검색 페이지입니다.",
  "method": [
    ["평가 항목", "화제성(SNS에서 얼마나 언급될지), 파급력(영향 범위), 시의성(오늘 새로 나온 소식인지), 지속성(며칠 이어질지)을 각각 10점 만점으로 매겨 평균을 냈습니다."],
    ["제외 기준", "평균 5.0 미만은 이슈성이 약하다고 보고 뺐습니다. 그래서 분야별 10개를 채우지 않은 곳이 있고, 뺀 항목은 각 탭 하단에 적어두었습니다."],
    ["10~20대 트렌드", "초록색 \"10~20대 트렌드\" 표시가 붙은 항목은 릴스·쓰레드·틱톡에서 퍼진 유행을 다룬 트렌드 매체와 청소년 설문 등을 근거로 골랐습니다."],
    ["읽을 때 참고", "점수는 뉴스 보도를 근거로 한 Claude의 판단이며 실제 SNS 언급량 집계가 아닙니다."]
  ],
  "titles": {
    "home": "{date} 나라별 SNS 화제 이슈 | {site}",
    "date": "{date} 나라별 화제 이슈 기록 | {site}",
    "country": "오늘 {country} SNS 화제 이슈 | {site}",
    "field": "나라별 {field} 화제 이슈 | {site}",
    "issue": "{title} | {site}",
    "github": "{date} 깃허브 트렌딩 1~10위 정리 | {site}"
  },
  "descs": {
    "home": "한국, 미국, 일본, 중국, 유럽에서 오늘 가장 화제가 된 이슈를 점수와 SNS 검색 링크로 정리했습니다. 매일 갱신됩니다.",
    "date": "{date} 나라별 화제 이슈를 점수와 SNS 검색 링크로 정리했습니다.",
    "country": "{country}의 최신 화제 이슈를 매일 정리합니다.",
    "field": "한국, 미국, 일본, 중국, 유럽의 최신 {field} 화제 이슈를 매일 정리합니다.",
    "github": "{date} 깃허브 트렌딩 상위 10개 저장소를 쉬운 말로 설명합니다."
  }
}
```

`i18n/ja.json`:

```json
{
  "lang_name": "日本語",
  "site_name": "今日の世界トレンド",
  "tagline": "韓国・アメリカ・日本・中国・ヨーロッパで今日SNSで話題になった出来事を、ニュース報道をもとに選んでスコア順にまとめました。",
  "language": "言語",
  "lang_suggest": "このページを別の言語で読む",
  "home": "ホーム",
  "tabs_label": "国を選ぶ",
  "countries": {"korea": "韓国", "usa": "アメリカ", "japan": "日本", "china": "中国", "world": "ヨーロッパほか"},
  "github": "GitHub",
  "fields": {"tech": "テック・経済", "politics": "政治", "culture": "文化・社会", "incidents": "事件・事故"},
  "crit": ["話題性", "影響力", "新しさ", "持続性"],
  "stats": ["地域", "選んだ話題", "最低スコア"],
  "updated_viewer": "あなたの時間で{time}に更新 · {n}時間前",
  "updated_kst": "{time}に更新",
  "updated_local": "現地時間",
  "top": "今日の1位",
  "rank": "{n}位",
  "all": "すべて",
  "field_label": "分野",
  "platforms_label": "分析したSNS",
  "plat_names": {"instagram": "Instagram", "threads": "Threads", "naver_search": "NAVER検索", "reddit": "Reddit", "x": "X", "x_trends": "Xのトレンド", "tiktok": "TikTok", "weibo_hot": "微博ホット検索", "r_europe": "r/europe", "r_worldnews": "r/worldnews"},
  "platforms": {"ig": "Instagram", "naver": "NAVER", "x": "X", "rd": "Reddit", "th": "Threads", "tt": "TikTok", "wb": "微博"},
  "empty_field": "今日はスコア5.0以上の{field}の話題がありませんでした。",
  "empty_hub": "まだ話題がありません。",
  "cut_summary": "スコア不足で外した{n}件を見る",
  "youth": "10〜20代トレンド",
  "source": "出典",
  "first_seen": "初出",
  "last_updated": "最終更新",
  "body_heads": ["何が起きたか", "なぜ話題か", "反応", "今後の注目点"],
  "related": "関連する話題",
  "on_social": "SNSで見る",
  "gh_top": "今日のGitHubトレンド1位",
  "gh_rest": "2〜10位",
  "gh_note": "{date}時点 · 全言語 · GitHubトレンドの順番どおりで、スコアは付けていません",
  "gh_today": "今日",
  "gh_stars_today": "今日増えたスター",
  "newer": "← 新しい",
  "older": "古い →",
  "page_suffix": " — {n}ページ",
  "archive_label": "日付別の記録",
  "disclaimer": "公開されたニュースとSNSをもとにAIがまとめました。スコアは実際のSNS投稿数ではなく判断による値です。SNSリンクは個別の投稿ではなくキーワード検索ページです。",
  "method": [
    ["評価項目", "話題性(SNSでどれだけ語られるか)、影響力(影響の広さ)、新しさ(今日の新しいニュースか)、持続性(何日続くか)をそれぞれ10点満点で付けて平均しました。"],
    ["外した基準", "平均5.0未満は話題性が弱いとして外しました。そのため分野ごとに10件ない場合があり、外した項目は各タブの下にあります。"],
    ["10〜20代トレンド", "緑の「10〜20代トレンド」が付いた項目は、リール・Threads・TikTokで広がった流行を扱うトレンドメディアや若者向け調査をもとに選びました。"],
    ["読む前に", "スコアはニュース報道にもとづくClaudeの判断で、実際の投稿数の集計ではありません。"]
  ],
  "titles": {
    "home": "{date} 国別SNSトレンド | {site}",
    "date": "{date} 国別トレンドの記録 | {site}",
    "country": "今日の{country}のSNSトレンド | {site}",
    "field": "国別の{field}トレンド | {site}",
    "issue": "{title} | {site}",
    "github": "{date} GitHubトレンド1〜10位まとめ | {site}"
  },
  "descs": {
    "home": "韓国・アメリカ・日本・中国・ヨーロッパで今日もっとも話題になった出来事を、スコアとSNS検索リンクでまとめました。毎日更新。",
    "date": "{date}の国別トレンドを、スコアとSNS検索リンクでまとめました。",
    "country": "{country}の最新トレンドを毎日まとめています。",
    "field": "韓国・アメリカ・日本・中国・ヨーロッパの最新{field}トレンドを毎日まとめています。",
    "github": "{date}のGitHubトレンド上位10リポジトリをわかりやすく説明します。"
  }
}
```

`i18n/zh.json`:

```json
{
  "lang_name": "简体中文",
  "site_name": "今日世界热点",
  "tagline": "根据新闻报道，挑选韩国、美国、日本、中国和欧洲今天在社交媒体上热议的话题，并按评分排序。",
  "language": "语言",
  "lang_suggest": "用其他语言阅读本页",
  "home": "首页",
  "tabs_label": "选择国家",
  "countries": {"korea": "韩国", "usa": "美国", "japan": "日本", "china": "中国", "world": "欧洲及其他"},
  "github": "GitHub",
  "fields": {"tech": "科技·经济", "politics": "政治", "culture": "文化·社会", "incidents": "突发事件"},
  "crit": ["热度", "影响力", "时效性", "持续性"],
  "stats": ["地区", "入选话题", "最低分"],
  "updated_viewer": "按你的时间 {time} 更新 · {n}小时前",
  "updated_kst": "{time} 更新",
  "updated_local": "当地时间",
  "top": "今日第1",
  "rank": "第{n}",
  "all": "全部",
  "field_label": "领域",
  "platforms_label": "分析平台",
  "plat_names": {"instagram": "Instagram", "threads": "Threads", "naver_search": "Naver 搜索", "reddit": "Reddit", "x": "X", "x_trends": "X 趋势", "tiktok": "TikTok", "weibo_hot": "微博热搜", "r_europe": "r/europe", "r_worldnews": "r/worldnews"},
  "platforms": {"ig": "Instagram", "naver": "Naver", "x": "X", "rd": "Reddit", "th": "Threads", "tt": "TikTok", "wb": "微博"},
  "empty_field": "今天没有评分达到 5.0 的{field}话题。",
  "empty_hub": "暂时还没有话题。",
  "cut_summary": "查看因评分不足而未入选的 {n} 条",
  "youth": "年轻人趋势",
  "source": "来源",
  "first_seen": "首次出现",
  "last_updated": "最近更新",
  "body_heads": ["发生了什么", "为什么热议", "各方反应", "后续看点"],
  "related": "相关话题",
  "on_social": "在社交媒体上查看",
  "gh_top": "今日 GitHub 趋势第1",
  "gh_rest": "第2–10",
  "gh_note": "{date} · 全部语言 · 按 GitHub 趋势原始顺序排列，未评分",
  "gh_today": "今日",
  "gh_stars_today": "今日新增星标",
  "newer": "← 较新",
  "older": "较早 →",
  "page_suffix": " — 第{n}页",
  "archive_label": "按日期查看",
  "disclaimer": "本页由 AI 根据公开新闻和社交媒体整理。评分是编辑判断，并非实际的社交媒体提及量。社交媒体链接是关键词搜索页，而非单条帖子。",
  "method": [
    ["评分方法", "热度（会被讨论多少）、影响力（影响范围）、时效性（是否为今日新消息）、持续性（会持续几天）各按 10 分打分后取平均。"],
    ["排除标准", "平均分低于 5.0 的话题因热度不足被排除，所以有些领域不足 10 条。被排除的条目列在每个标签页底部。"],
    ["年轻人趋势", "带有绿色“年轻人趋势”标记的条目，依据报道 Reels、Threads、TikTok 流行内容的趋势媒体和青少年调查挑选。"],
    ["阅读提示", "评分是 Claude 根据新闻报道作出的判断，不是帖子数量统计。"]
  ],
  "titles": {
    "home": "{date} 各国社交媒体热点 | {site}",
    "date": "{date} 各国热点记录 | {site}",
    "country": "今日{country}社交媒体热点 | {site}",
    "field": "各国{field}热点 | {site}",
    "issue": "{title} | {site}",
    "github": "{date} GitHub 趋势前10名解读 | {site}"
  },
  "descs": {
    "home": "整理韩国、美国、日本、中国和欧洲今天最受关注的话题，附评分和社交媒体搜索链接。每日更新。",
    "date": "{date} 各国热点话题，附评分和社交媒体搜索链接。",
    "country": "每日整理{country}的最新热点话题。",
    "field": "每日整理韩国、美国、日本、中国和欧洲最新的{field}热点话题。",
    "github": "用通俗的话解读 {date} GitHub 趋势前 10 名仓库。"
  }
}
```

- [ ] **Step 4: 통과 확인**

Run: `python3 -m unittest tests.test_timefmt -v`
Expected: 모든 테스트 OK

- [ ] **Step 5: 커밋**

```bash
git add gen/timefmt.py gen/i18n.py i18n tests/test_timefmt.py
git commit -m "v2: 언어별 시각 표시와 화면 문구 4개 언어"
```

---

### Task 3: 누적 기록 (issues, archive)

**Files:**
- Create: `gen/store.py`, `tests/test_store.py`

**Interfaces:**
- Consumes: `gen.timefmt.kst_date`, `gen.model.has_body`, `gen.model.avg`
- Produces:
  - `gen.store.merge(latest: dict, data_dir: Path) -> None`
  - `gen.store.load_issues(data_dir) -> list[rec]` — `rec = {"item": dict, "country": str, "first_seen": iso, "last_updated": iso, "dates": [ymd]}`, `last_updated` 최신순, 같으면 평균 점수 높은 순
  - `gen.store.load_archives(data_dir) -> list[tuple[ymd, latest]]` — 최신 날짜순

- [ ] **Step 1: 실패하는 테스트 쓰기**

`tests/test_store.py`:

```python
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
```

- [ ] **Step 2: 실패 확인**

Run: `python3 -m unittest tests.test_store -v`
Expected: FAIL — `cannot import name 'store'`

- [ ] **Step 3: 구현**

`gen/store.py`:

```python
# 누적 기록: data/issues/{id}.json(이슈별), data/archive/{YYYY-MM-DD}.json(그날 갱신분)
import json
from .model import avg, has_body
from .timefmt import kst_date


def _read(p):
    return json.loads(p.read_text(encoding="utf-8"))


def _write(p, obj):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(obj, ensure_ascii=False, indent=1), encoding="utf-8")


def merge(latest, data_dir):
    up, day = latest["updated"], kst_date(latest["updated"])
    _write(data_dir / "archive" / f"{day}.json", latest)
    for country, c in latest["countries"].items():
        for item in c["items"]:
            p = data_dir / "issues" / f"{item['id']}.json"
            rec = _read(p) if p.exists() else {"first_seen": up, "dates": []}
            old = rec.get("item")
            if old and has_body(old) and not has_body(item):
                # 이미 만든 개별 페이지가 사라지지 않도록 이전 본문을 이어 씁니다.
                item = {**item, "text": {l: {**t, "body": old["text"][l]["body"]} for l, t in item["text"].items()}}
            rec.update(item=item, country=country, last_updated=up)
            if day not in rec["dates"]:
                rec["dates"].append(day)
            _write(p, rec)


def load_issues(data_dir):
    recs = [_read(p) for p in (data_dir / "issues").glob("*.json")]
    recs.sort(key=lambda r: avg(r["item"]["scores"]), reverse=True)
    recs.sort(key=lambda r: r["last_updated"], reverse=True)
    return recs


def load_archives(data_dir):
    return [(p.stem, _read(p)) for p in sorted((data_dir / "archive").glob("*.json"), reverse=True)]
```

주의: `has_body(old)`는 4개 언어 본문을 모두 보므로, 새 항목의 `text`에 4개 언어가 모두 있다는 전제(검사 통과)에서만 이 코드가 돈다. `merge`는 검사 통과 뒤에만 부른다(Task 9).

- [ ] **Step 4: 통과 확인**

Run: `python3 -m unittest tests.test_store -v`
Expected: 모든 테스트 OK

- [ ] **Step 5: 커밋**

```bash
git add gen/store.py tests/test_store.py
git commit -m "v2: 이슈별·날짜별 누적 기록"
```

---

### Task 4: HTML 조각과 페이지 틀

**Files:**
- Create: `gen/html.py`, `tests/test_html.py`

**Interfaces:**
- Consumes: `gen.config`, `gen.i18n.T`, `gen.model.{avg, link, has_body}`
- Produces (`gen.html`):
  - `esc(s) -> str`, `href(lang, path="") -> str`(내부 링크), `abs_url(lang, path="") -> str`, `asset(p) -> str`, `ld(obj) -> str`(JSON-LD script)
  - `crumbs(lang, trail: list[(name, path)]) -> (html, ld_dict)`
  - `shell(lang, path, title, desc, body, *, accent="kr", og="home", data=(), root=False, og_type="website") -> str`
  - `ring(v)`, `crit(lang, s)`, `pills(lang, links)`, `tags(lang, item)`, `title_link(lang, item)`, `card(lang, item, rank="")`, `slot(name)`

- [ ] **Step 1: 실패하는 테스트 쓰기**

`tests/test_html.py`:

```python
import json, re, unittest
from gen import html as H
from tests.helpers import item


class HtmlTest(unittest.TestCase):
    def page(self, **kw):
        return H.shell("ja", "korea/", "タイトル", "説明", "<main>本文</main>", **kw)

    def test_shell_basics(self):
        p = self.page()
        self.assertIn('<html lang="ja">', p)
        self.assertIn("<title>タイトル</title>", p)
        self.assertIn('<link rel="canonical" href="https://tking-creator.github.io/world-issues/ja/korea/">', p)
        for tag, l in [("en", "en"), ("ko", "ko"), ("ja", "ja"), ("zh-Hans", "zh")]:
            self.assertIn(f'hreflang="{tag}" href="https://tking-creator.github.io/world-issues/{l}/korea/"', p)
        self.assertIn('hreflang="x-default" href="https://tking-creator.github.io/world-issues/en/korea/"', p)
        self.assertIn('href="/world-issues/ko/korea/" data-lang="ko"', p)  # 언어 메뉴는 같은 페이지의 다른 언어판으로
        self.assertIn("Noto+Sans+JP", p)
        self.assertIn('og:image" content="https://tking-creator.github.io/world-issues/og/ja-home.png"', p)

    def test_home_x_default_is_root(self):
        p = H.shell("en", "", "t", "d", "")
        self.assertIn('hreflang="x-default" href="https://tking-creator.github.io/world-issues/"', p)

    def test_root_page(self):
        p = H.shell("en", "", "t", "d", "", root=True)
        self.assertIn('<link rel="canonical" href="https://tking-creator.github.io/world-issues/en/">', p)
        self.assertIn('id="lang-suggest"', p)

    def test_escapes_title_everywhere(self):
        x = item("evil")
        x["text"]["ko"]["title"] = '"><script>alert(1)</script>'
        card = H.card("ko", x)
        self.assertNotIn("<script>alert", card)
        script = H.ld({"headline": x["text"]["ko"]["title"]})
        self.assertNotIn("</script>alert", script)
        self.assertEqual(script.count("</script>"), 1)
        body = re.search(r">(.*)</script>", script).group(1)
        self.assertEqual(json.loads(body)["headline"], x["text"]["ko"]["title"])
        p = H.shell("ko", "", x["text"]["ko"]["title"], x["text"]["ko"]["title"], "")
        self.assertNotIn("<script>alert", p)

    def test_title_link_internal_or_sns(self):
        self.assertIn('href="/world-issues/en/issue/a/"', H.title_link("en", item("a")))
        sns = H.title_link("en", item("a", body=0))
        self.assertIn("search.naver.com", sns)
        self.assertIn('target="_blank"', sns)

    def test_crumbs(self):
        vis, data = H.crumbs("en", [("Korea", "korea/")])
        self.assertIn('href="/world-issues/en/korea/"', vis)
        self.assertEqual(data["itemListElement"][1]["item"], "https://tking-creator.github.io/world-issues/en/korea/")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: 실패 확인**

Run: `python3 -m unittest tests.test_html -v`
Expected: FAIL — `cannot import name 'html'`

- [ ] **Step 3: 구현**

`gen/html.py`:

```python
# HTML 조각: 이스케이프, 주소, 페이지 틀(머리말·언어 메뉴·하단 안내), 카드·점수 링·SNS 버튼
import html as _h
import json
from . import config as C
from .i18n import T
from .model import avg, has_body, link

FONTS = {"ko": "Noto+Sans+KR", "ja": "Noto+Sans+JP", "zh": "Noto+Sans+SC"}
LANG_TAG = {"en": "en", "ko": "ko", "ja": "ja", "zh": "zh-Hans"}


def esc(s):
    return _h.escape(str(s), quote=True)


def href(lang, path=""):
    return f"{C.PREFIX}/{lang}/{path}"


def abs_url(lang, path=""):
    return f"{C.SITE_URL}/{lang}/{path}"


def asset(p):
    return f"{C.PREFIX}/{p}"


def ld(obj):
    # "<"를 \u003c로 바꿔 글 안의 </script>가 태그를 닫지 못하게 합니다.
    return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False).replace("<", "\\u003c") + "</script>"


def crumbs(lang, trail):
    items = [(T(lang)["home"], "")] + list(trail)
    vis = '<nav class="crumbs">' + " › ".join(f'<a href="{href(lang, p)}">{esc(n)}</a>' for n, p in items) + "</nav>"
    data = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": n, "item": abs_url(lang, p)} for i, (n, p) in enumerate(items)]}
    return vis, data


def slot(name):
    return f'<div class="slot" data-slot="{name}"></div>'


def _menu(lang, path):
    t = T(lang)
    links = ""
    for l in C.LANGS:
        cur = ' aria-current="true"' if l == lang else ""
        links += f'<li><a href="{href(l, path)}" data-lang="{l}" hreflang="{LANG_TAG[l]}"{cur}>{esc(T(l)["lang_name"])}</a></li>'
    return f'<details class="langmenu"><summary aria-label="{esc(t["language"])}">🌐 {esc(t["lang_name"])}</summary><ul>{links}</ul></details>'


def _suggest():
    links = "".join(f'<a href="{href(l)}" data-lang="{l}" hidden>{esc(T(l)["lang_name"])}</a>' for l in C.LANGS if l != "en")
    return f'<div id="lang-suggest" class="suggest" hidden>{esc(T("en")["lang_suggest"])}: {links}</div>'


def _footer(lang):
    t = T(lang)
    cols = "".join(f"<div><h5>{esc(h)}</h5><p>{esc(p)}</p></div>" for h, p in t["method"])
    return f'<footer class="method">{cols}<p class="disclaimer">{esc(t["disclaimer"])}</p></footer>'


def shell(lang, path, title, desc, body, *, accent="kr", og="home", data=(), root=False, og_type="website"):
    t = T(lang)
    can = abs_url(lang, path)
    alts = "".join(f'<link rel="alternate" hreflang="{LANG_TAG[l]}" href="{abs_url(l, path)}">' for l in C.LANGS)
    x_default = f"{C.SITE_URL}/" if path == "" else abs_url("en", path)
    alts += f'<link rel="alternate" hreflang="x-default" href="{x_default}">'
    font = (f'<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
            f'<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family={FONTS[lang]}:wght@400;500;600;700&display=swap">') if lang in FONTS else ""
    img = f"{C.SITE_URL}/og/{lang}-{og}.png"
    meta = (f'<meta name="description" content="{esc(desc)}">'
            f'<meta property="og:type" content="{og_type}"><meta property="og:site_name" content="{esc(t["site_name"])}">'
            f'<meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(desc)}">'
            f'<meta property="og:url" content="{can}"><meta property="og:image" content="{img}">'
            f'<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">'
            f'<meta name="twitter:card" content="summary_large_image">')
    return (f'<!doctype html>\n<html lang="{LANG_TAG[lang]}"><head><meta charset="utf-8">'
            f'<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
            f'<title>{esc(title)}</title><link rel="canonical" href="{can}">{alts}{meta}'
            f'<link rel="alternate" type="application/rss+xml" title="{esc(t["site_name"])}" href="{href(lang, "feed.xml")}">'
            f'{font}<link rel="stylesheet" href="{asset("static/styles.css")}">'
            + "".join(ld(x) for x in data) +
            f'</head><body><div id="app" data-c="{accent}"><div class="wrap">'
            f'<header class="top"><a class="brand" href="{href(lang)}">{esc(t["site_name"])}</a>{_menu(lang, path)}</header>'
            + (_suggest() if root else "") + body + _footer(lang) +
            f'</div></div><script src="{asset("static/app.js")}" defer></script></body></html>\n')


def ring(v):
    return f'<div class="ring" style="--v:{v * 10:.0f}"><div class="in"><b>{v:.1f}</b><small>/ 10</small></div></div>'


def crit(lang, s):
    return '<div class="critrow">' + "".join(
        f'<div><span>{esc(k)}<em>{s[j]}</em></span><u><i style="width:{s[j] * 10}%"></i></u></div>'
        for j, k in enumerate(T(lang)["crit"])) + "</div>"


def pills(lang, links):
    names = T(lang)["platforms"]
    out = []
    for l in links:
        x = link(l["p"], l["q"])
        out.append(f'<a class="pill {x["cls"]}" href="{esc(x["url"])}" target="_blank" rel="noopener"><b>{esc(names[x["p"]])}</b><span>{esc(x["q"])}</span></a>')
    return '<div class="pills">' + "".join(out) + "</div>"


def tags(lang, item):
    t, f = T(lang), item["field"]
    youth = f'<span class="youth">{esc(t["youth"])}</span>' if item.get("youth") else ""
    return f'<span class="ftag" style="--fc:var({C.FIELDS[f]})">{esc(t["fields"][f])}</span>{youth}'


def title_link(lang, item):
    title = esc(item["text"][lang]["title"])
    if has_body(item):
        return f'<a href="{href(lang, "issue/" + item["id"] + "/")}">{title}</a>'
    first = item["links"][0]
    return f'<a href="{esc(link(first["p"], first["q"])["url"])}" target="_blank" rel="noopener">{title}</a>'


def card(lang, item, rank=""):
    tx, src = item["text"][lang], item["source"]
    rank_html = f'<span class="rank">{esc(rank)}</span>' if rank else ""
    return (f'<article class="card" style="--fc:var({C.FIELDS[item["field"]]})">'
            f'<div class="ctop"><div class="cmeta">{rank_html}<span class="tagline">{tags(lang, item)}</span></div>{ring(avg(item["scores"]))}</div>'
            f'<h4>{title_link(lang, item)}</h4><p>{esc(tx["summary"])}</p>{crit(lang, item["scores"])}{pills(lang, item["links"])}'
            f'<a class="src" href="{esc(src["url"])}" target="_blank" rel="noopener">{esc(T(lang)["source"])} · {esc(src["name"])} ↗</a></article>')
```

- [ ] **Step 4: 통과 확인**

Run: `python3 -m unittest tests.test_html -v`
Expected: 모든 테스트 OK

- [ ] **Step 5: 커밋**

```bash
git add gen/html.py tests/test_html.py
git commit -m "v2: HTML 조각과 다국어 페이지 틀(hreflang, OG, 언어 메뉴)"
```

---

### Task 5: 페이지 생성 (첫 화면·날짜·이슈·모음·깃허브)

**Files:**
- Create: `gen/pages.py`, `tests/test_pages.py`

**Interfaces:**
- Consumes: `gen.html.*`, `gen.timefmt.*`, `gen.store` 레코드 형식, `gen.model.{Page, avg, has_body}`
- Produces (`gen.pages`):
  - `board(lang, latest, h1, intro) -> str`
  - `home_pages(latest) -> list[Page]` (4개 언어 + 루트)
  - `date_pages(archives) -> list[Page]`
  - `issue_pages(issues) -> list[Page]`
  - `hub_pages(issues) -> list[Page]`
  - `github_pages(latest, archives) -> list[Page]`
  - `all_pages(latest, issues, archives) -> list[Page]`
  - `related(rec, issues, n=6) -> list[rec]`

- [ ] **Step 1: 실패하는 테스트 쓰기**

`tests/test_pages.py`:

```python
import unittest
from gen import pages as P
from tests.helpers import item, make_latest

UP = "2026-10-17T06:00:00+09:00"


def rec(it, country="korea", up=UP):
    return {"item": it, "country": country, "first_seen": up, "last_updated": up, "dates": [up[:10]]}


def paths(ps, lang="en"):
    return {p.path for p in ps if p.lang == lang}


class PagesTest(unittest.TestCase):
    def test_home_has_all_langs_and_root(self):
        ps = P.home_pages(make_latest())
        self.assertEqual(sorted(str(p.lang) for p in ps), ["None", "en", "ja", "ko", "zh"])
        en = next(p for p in ps if p.lang == "en").html
        for slug in ["korea", "usa", "japan", "china", "world", "github"]:
            self.assertIn(f'id="p-{slug}"', en)
        self.assertIn("Oct 16, 5:00 PM (New York)", en)   # 미국 패널의 현지 시각
        self.assertIn('data-updated="2026-10-17T06:00:00+09:00"', en)

    def test_home_hides_all_but_first_panel(self):
        en = next(p for p in P.home_pages(make_latest()) if p.lang == "en").html
        self.assertIn('id="p-korea" data-accent="kr">', en)
        self.assertIn('id="p-usa" data-accent="us" hidden>', en)

    def test_issue_pages_skip_missing_body(self):
        recs = [rec(item("good")), rec(item("thin", body=3))]
        self.assertEqual(paths(P.issue_pages(recs)), {"issue/good/"})
        self.assertEqual(len(P.issue_pages(recs)), 4)

    def test_issue_page_content(self):
        r = rec(item("good"))
        ko = next(p for p in P.issue_pages([r]) if p.lang == "ko").html
        self.assertIn("무슨 일인가요", ko)
        self.assertIn("good p3 ko", ko)
        self.assertIn('"@type": "NewsArticle"', ko)
        self.assertIn('"datePublished": "2026-10-17T06:00:00+09:00"', ko)

    def test_related_prefers_same_field(self):
        me = rec(item("me", field="tech"))
        a = rec(item("a", field="culture"))
        b = rec(item("b", field="tech"))
        other = rec(item("c", field="tech"), country="usa")
        thin = rec(item("d", field="tech", body=0))
        got = [r["item"]["id"] for r in P.related(me, [me, a, b, other, thin])]
        self.assertEqual(got, ["b", "a"])

    def test_hub_pagination_boundary(self):
        for n, want in [(30, {"korea/"}), (31, {"korea/", "korea/page/2/"})]:
            recs = [rec(item(f"i{i}")) for i in range(n)]
            got = {p for p in paths(P.hub_pages(recs)) if p.startswith("korea")}
            self.assertEqual(got, want, n)
        recs = [rec(item(f"i{i}")) for i in range(31)]
        p2 = next(p for p in P.hub_pages(recs) if p.lang == "en" and p.path == "korea/page/2/").html
        self.assertIn("i30 en", p2)
        self.assertNotIn("i29 en", p2)

    def test_hub_pages_exist_when_empty(self):
        ps = paths(P.hub_pages([]))
        self.assertTrue({"korea/", "world/", "tech/", "incidents/"} <= ps)

    def test_date_and_github_pages(self):
        lat = make_latest()
        arch = [("2026-10-17", lat), ("2026-10-16", make_latest("2026-10-16T06:00:00+09:00"))]
        self.assertEqual(paths(P.date_pages(arch)), {"2026-10-17/", "2026-10-16/"})
        self.assertEqual(paths(P.github_pages(lat, arch)), {"github/", "github/2026-10-17/", "github/2026-10-16/"})
        gh = next(p for p in P.github_pages(lat, arch) if p.lang == "ja" and p.path == "github/").html
        self.assertIn("desc 0 ja", gh)

    def test_all_pages_unique(self):
        lat = make_latest()
        recs = [rec(x, k) for k, c in lat["countries"].items() for x in c["items"]]
        ps = P.all_pages(lat, recs, [("2026-10-17", lat)])
        keys = [(p.lang, p.path) for p in ps]
        self.assertEqual(len(keys), len(set(keys)))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: 실패 확인**

Run: `python3 -m unittest tests.test_pages -v`
Expected: FAIL — `cannot import name 'pages'`

- [ ] **Step 3: 구현**

`gen/pages.py`:

```python
# 페이지 종류별 생성. 모든 함수는 Page(lang, path, html, lastmod) 목록을 돌려줍니다.
from . import config as C
from .html import abs_url, card, crit, crumbs, esc, href, pills, ring, shell, slot, tags, title_link
from .i18n import T
from .model import Page, avg, has_body
from .timefmt import country_line, fmt_date, kst_date, seoul

TAB_KEYS = list(C.COUNTRIES) + ["github"]


# ---- 이슈판 본문 (첫 화면, 날짜 페이지 공용) ----

def _lead(lang, slug, it):
    t = T(lang)
    crown = f'{t["top"]} · {C.COUNTRIES[slug][1]} {t["countries"][slug]}'
    return (f'<article class="lead" style="--fc:var({C.FIELDS[it["field"]]})"><div class="body">'
            f'<div class="tagrow"><span class="crown">{esc(crown)}</span>{tags(lang, it)}</div>'
            f'<h2>{title_link(lang, it)}</h2><p>{esc(it["text"][lang]["summary"])}</p>'
            f'{pills(lang, it["links"])}{crit(lang, it["scores"])}</div>{ring(avg(it["scores"]))}</article>')


def _country_panel(lang, slug, c, up, hidden):
    t = T(lang)
    items = sorted(c["items"], key=lambda x: -avg(x["scores"]))
    h = f'<p class="when">{esc(t["updated_local"])} · {esc(country_line(up, slug, lang))}</p>' + _lead(lang, slug, items[0])
    chips = f'<button class="chip" data-f="all" aria-pressed="true">{esc(t["all"])} <small>{len(items)}</small></button>' + "".join(
        f'<button class="chip" data-f="{f}" aria-pressed="false" style="--fc:var({v})"><i></i>{esc(t["fields"][f])} <small>{sum(1 for x in items if x["field"] == f)}</small></button>'
        for f, v in C.FIELDS.items())
    plats = ", ".join(f'<a href="{u}" target="_blank" rel="noopener">{esc(t["plat_names"][k])}</a>' for k, u in C.COUNTRY_PLATFORMS[slug])
    h += f'<div class="filters" role="group"><span class="lbl">{esc(t["field_label"])}</span>{chips}<span class="lbl plats">{esc(t["platforms_label"])} · {plats}</span></div>'
    for f, v in C.FIELDS.items():
        name, lst = t["fields"][f], [x for x in items if x["field"] == f]
        h += f'<section class="field" data-f="{f}" style="--fc:var({v})"><div class="fhead"><h3>{esc(name)}</h3><span>{len(lst)}</span></div>'
        if not lst:
            h += f'<div class="empty">{esc(t["empty_field"].format(field=name))}</div></section>'
            continue
        h += '<div class="grid">' + "".join(card(lang, x, f'{name} {t["rank"].format(n=i + 1)}') for i, x in enumerate(lst)) + "</div></section>"
    if c.get("cut"):
        h += (f'<details class="cut"><summary>{esc(t["cut_summary"].format(n=len(c["cut"])))}</summary><ul>'
              + "".join(f"<li>{esc(x[lang])}</li>" for x in c["cut"]) + "</ul></details>")
    return f'<section class="panel" id="p-{slug}" data-accent="{C.COUNTRIES[slug][2]}"{" hidden" if hidden else ""}>{h}</section>'


def _gh_body(lang, gh):
    t = T(lang)
    top, rest = gh["items"][0], gh["items"][1:]
    n = lambda v: f"{v:,}"

    def name(x):
        o, r = x["repo"].split("/", 1)
        return f'<a href="https://github.com/{esc(x["repo"])}" target="_blank" rel="noopener"><span class="owner">{esc(o)} /</span> {esc(r)}</a>'

    def meta(x):
        lang_tag = f'<span><i></i>{esc(x["language"])}</span>' if x.get("language") else ""
        return f'<div class="ghmeta">{lang_tag}<span>★ {n(x["stars"])}</span><span class="up">+{n(x["today"])} {esc(t["gh_today"])}</span></div>'

    h = (f'<article class="lead"><div class="body"><div class="tagrow"><span class="crown">{esc(t["gh_top"])}</span></div>'
         f'<h2>{name(top)}</h2><p>{esc(top["desc"][lang])}</p>{meta(top)}</div>'
         f'<div class="ghbig"><b>+{n(top["today"])}</b><small>{esc(t["gh_stars_today"])}</small></div></article>')
    h += f'<div class="filters"><span class="lbl">{esc(t["gh_note"].format(date=fmt_date(gh["date"], lang)))}</span></div>'
    h += (f'<section class="field" style="--fc:var(--acc)"><div class="fhead"><h3>{esc(t["gh_rest"])}</h3><span>{len(rest)}</span></div><div class="grid">'
          + "".join(f'<article class="card"><span class="rank">{esc(t["rank"].format(n=i + 2))}</span><h4>{name(x)}</h4><p>{esc(x["desc"][lang])}</p>{meta(x)}</article>'
                    for i, x in enumerate(rest)) + "</div></section>")
    return h


def board(lang, latest, h1, intro):
    t, up, cs = T(lang), latest["updated"], latest["countries"]
    total = sum(len(c["items"]) for c in cs.values())
    head = (f'<header class="mast"><div><div class="eyebrow" data-updated="{up}" data-tpl="{esc(t["updated_viewer"])}">'
            f'{esc(t["updated_kst"].format(time=seoul(up, lang)))}</div><h1>{esc(h1)}</h1><p>{esc(intro)}</p></div>'
            f'<div class="stats"><div><b>{len(cs)}</b><span>{esc(t["stats"][0])}</span></div><div><b>{total}</b><span>{esc(t["stats"][1])}</span></div>'
            f'<div><b>{C.MIN_SCORE:.1f}</b><span>{esc(t["stats"][2])}</span></div></div></header>')
    tabs = []
    for i, k in enumerate(TAB_KEYS):
        code, flag = (C.COUNTRIES[k][0], C.COUNTRIES[k][1]) if k in C.COUNTRIES else ("GH", "💻")
        label = t["countries"][k] if k in C.COUNTRIES else t["github"]
        tabs.append(f'<a role="tab" data-k="{k}" href="{href(lang, k + "/")}" aria-selected="{"true" if i == 0 else "false"}">'
                    f'<span class="code">{code}</span><span class="flag" aria-hidden="true">{flag}</span>{esc(label)}</a>')
    nav = f'<nav class="tabs" aria-label="{esc(t["tabs_label"])}"><div class="seg" role="tablist">{"".join(tabs)}</div></nav>'
    panels = "".join(_country_panel(lang, k, cs[k], up, i > 0) for i, k in enumerate(C.COUNTRIES))
    panels += f'<section class="panel" id="p-github" data-accent="gh" hidden>{_gh_body(lang, latest["github"])}</section>'
    return head + nav + f"<main>{panels}</main>"


def _top_list(lang, latest):
    urls = [abs_url(lang, f"issue/{x['id']}/") for c in latest["countries"].values()
            for x in sorted(c["items"], key=lambda x: -avg(x["scores"])) if has_body(x)]
    return {"@context": "https://schema.org", "@type": "ItemList",
            "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": u} for i, u in enumerate(urls)]}


# ---- 첫 화면, 날짜별 기록 ----

def home_pages(latest):
    up, day, out = latest["updated"], kst_date(latest["updated"]), []
    for lang in C.LANGS:
        t = T(lang)
        title = t["titles"]["home"].format(date=fmt_date(day, lang), site=t["site_name"])
        body = board(lang, latest, t["site_name"], t["tagline"]) + slot("home-bottom")
        out.append(Page(lang, "", shell(lang, "", title, t["descs"]["home"], body, data=[_top_list(lang, latest)]), up))
    t = T("en")
    title = t["titles"]["home"].format(date=fmt_date(day, "en"), site=t["site_name"])
    out.append(Page(None, "", shell("en", "", title, t["descs"]["home"], board("en", latest, t["site_name"], t["tagline"]), root=True), up))
    return out


def _date_nav(lang, days, i, base=""):
    newer = f'<a href="{href(lang, base + days[i - 1] + "/")}">{esc(T(lang)["newer"])}</a>' if i > 0 else "<span></span>"
    older = f'<a href="{href(lang, base + days[i + 1] + "/")}">{esc(T(lang)["older"])}</a>' if i + 1 < len(days) else "<span></span>"
    return f'<nav class="pager">{newer}{older}</nav>'


def date_pages(archives):
    days, out = [d for d, _ in archives], []
    for i, (day, latest) in enumerate(archives):
        for lang in C.LANGS:
            t, nice = T(lang), fmt_date(day, lang)
            vis, bc = crumbs(lang, [(nice, day + "/")])
            body = vis + board(lang, latest, nice, t["descs"]["date"].format(date=nice)) + _date_nav(lang, days, i)
            title = t["titles"]["date"].format(date=nice, site=t["site_name"])
            out.append(Page(lang, f"{day}/", shell(lang, f"{day}/", title, t["descs"]["date"].format(date=nice), body, data=[bc]), latest["updated"]))
    return out


# ---- 이슈 개별 ----

def related(rec, issues, n=6):
    me = rec["item"]
    cands = [r for r in issues if r["item"]["id"] != me["id"] and r["country"] == rec["country"] and has_body(r["item"])]
    cands.sort(key=lambda r: r["item"]["field"] != me["field"])  # 같은 분야 먼저, 그 안에서는 최신순 유지
    return cands[:n]


def issue_pages(issues):
    out = []
    for rec in issues:
        it = rec["item"]
        if not has_body(it):
            continue
        slug, f, path = rec["country"], it["field"], f"issue/{it['id']}/"
        for lang in C.LANGS:
            t, tx = T(lang), it["text"][lang]
            vis, bc = crumbs(lang, [(t["countries"][slug], slug + "/"), (t["fields"][f], f + "/")])
            dates = (f'<p class="when">{esc(t["first_seen"])} · {esc(seoul(rec["first_seen"], lang))}'
                     f' · {esc(t["last_updated"])} · {esc(seoul(rec["last_updated"], lang))}</p>')
            sections = "".join(f"<h2>{esc(hd)}</h2><p>{esc(p)}</p>" for hd, p in zip(t["body_heads"], tx["body"]))
            rel = related(rec, issues)
            rel_html = (f'<section class="field"><div class="fhead"><h3>{esc(t["related"])}</h3></div><div class="grid">'
                        + "".join(card(lang, r["item"]) for r in rel) + "</div></section>") if rel else ""
            body = (vis + f'<article class="issue" style="--fc:var({C.FIELDS[f]})"><div class="tagrow">{tags(lang, it)}</div>'
                    f'<h1>{esc(tx["title"])}</h1>{dates}<div class="score">{ring(avg(it["scores"]))}{crit(lang, it["scores"])}</div>'
                    f'<p class="dek">{esc(tx["summary"])}</p>{slot("issue-top")}{sections}'
                    f'<h2>{esc(t["on_social"])}</h2>{pills(lang, it["links"])}'
                    f'<p><a class="src" href="{esc(it["source"]["url"])}" target="_blank" rel="noopener">{esc(t["source"])} · {esc(it["source"]["name"])} ↗</a></p>'
                    f'{slot("issue-bottom")}</article>' + rel_html)
            art = {"@context": "https://schema.org", "@type": "NewsArticle", "headline": tx["title"][:110],
                   "description": tx["summary"], "datePublished": rec["first_seen"], "dateModified": rec["last_updated"],
                   "inLanguage": lang if lang != "zh" else "zh-Hans", "image": [f"{C.SITE_URL}/og/{lang}-{slug}.png"],
                   "mainEntityOfPage": abs_url(lang, path), "isBasedOn": it["source"]["url"],
                   "author": {"@type": "Organization", "name": t["site_name"], "url": abs_url(lang)},
                   "publisher": {"@type": "Organization", "name": t["site_name"]}}
            title = t["titles"]["issue"].format(title=tx["title"], site=t["site_name"])
            out.append(Page(lang, path, shell(lang, path, title, tx["summary"][:160], body, accent=C.COUNTRIES[slug][2],
                                              og=slug, data=[art, bc], og_type="article"), rec["last_updated"]))
    return out


# ---- 나라별·분야별 모음 ----

def _hub(slug, recs, accent, og, name_of, kind):
    size = C.HUB_PAGE_SIZE
    chunks = [recs[i:i + size] for i in range(0, len(recs), size)] or [[]]
    lastmod = recs[0]["last_updated"] if recs else None
    out = []
    for n, chunk in enumerate(chunks, 1):
        path = f"{slug}/" if n == 1 else f"{slug}/page/{n}/"
        for lang in C.LANGS:
            t, name = T(lang), name_of(lang)
            suffix = t["page_suffix"].format(n=n) if n > 1 else ""
            title = t["titles"][kind].format(**{kind: name, "site": t["site_name"]}).replace(" | ", suffix + " | ", 1)
            desc = t["descs"][kind].format(**{kind: name})
            vis, bc = crumbs(lang, [(name, f"{slug}/")])
            grid = ('<div class="grid">' + "".join(card(lang, r["item"], fmt_date(kst_date(r["last_updated"]), lang)) for r in chunk) + "</div>"
                    ) if chunk else f'<div class="empty">{esc(t["empty_hub"])}</div>'
            newer = f'<a href="{href(lang, slug + "/" if n == 2 else f"{slug}/page/{n - 1}/")}">{esc(t["newer"])}</a>' if n > 1 else "<span></span>"
            older = f'<a href="{href(lang, f"{slug}/page/{n + 1}/")}">{esc(t["older"])}</a>' if n < len(chunks) else "<span></span>"
            body = vis + f'<header class="mast"><div><h1>{esc(name)}{esc(suffix)}</h1><p>{esc(desc)}</p></div></header>{slot("hub-top")}{grid}<nav class="pager">{newer}{older}</nav>'
            out.append(Page(lang, path, shell(lang, path, title, desc, body, accent=accent, og=og, data=[bc]), lastmod))
    return out


def hub_pages(issues):
    out = []
    for slug in C.COUNTRIES:
        recs = [r for r in issues if r["country"] == slug]
        out += _hub(slug, recs, C.COUNTRIES[slug][2], slug, lambda l, s=slug: T(l)["countries"][s], "country")
    for f in C.FIELDS:
        recs = [r for r in issues if r["item"]["field"] == f]
        out += _hub(f, recs, "kr", "home", lambda l, f=f: T(l)["fields"][f], "field")
    return out


# ---- 깃허브 ----

def github_pages(latest, archives):
    days = [d for d, _ in archives]
    out = []
    targets = [("github/", latest, None)] + [(f"github/{d}/", a, i) for i, (d, a) in enumerate(archives)]
    for path, data, i in targets:
        gh = data["github"]
        for lang in C.LANGS:
            t, nice = T(lang), fmt_date(gh["date"], lang)
            trail = [(t["github"], "github/")] + ([(nice, path)] if i is not None else [])
            vis, bc = crumbs(lang, trail)
            nav = _date_nav(lang, days, i, "github/") if i is not None else ""
            title = t["titles"]["github"].format(date=nice, site=t["site_name"])
            desc = t["descs"]["github"].format(date=nice)
            body = vis + f'<header class="mast"><div><h1>{esc(t["github"])} · {esc(nice)}</h1><p>{esc(desc)}</p></div></header>' + _gh_body(lang, gh) + nav
            out.append(Page(lang, path, shell(lang, path, title, desc, body, accent="gh", og="github", data=[bc]), data["updated"]))
    return out


def all_pages(latest, issues, archives):
    return home_pages(latest) + date_pages(archives) + issue_pages(issues) + hub_pages(issues) + github_pages(latest, archives)
```

- [ ] **Step 4: 통과 확인**

Run: `python3 -m unittest tests.test_pages -v`
Expected: 모든 테스트 OK. `test_hub_pagination_boundary`가 실패하면 `chunks` 계산을 먼저 본다.

- [ ] **Step 5: 커밋**

```bash
git add gen/pages.py tests/test_pages.py
git commit -m "v2: 첫 화면·날짜·이슈 개별·나라/분야 모음·깃허브 페이지 생성"
```

---

### Task 6: 사이트 지도, robots, RSS, feed.json

**Files:**
- Create: `gen/feeds.py`, `tests/test_feeds.py`

**Interfaces:**
- Consumes: `Page` 목록, store 레코드, `gen.html.abs_url`, `gen.html.LANG_TAG`
- Produces (`gen.feeds`):
  - `sitemap(pages, chunk=10000) -> dict[filename, xml]` — 항상 `sitemap.xml`(색인) + `sitemap-1.xml`…
  - `robots() -> str`
  - `rss(lang, issues, limit=50) -> str`
  - `feed_json(latest) -> str`

- [ ] **Step 1: 실패하는 테스트 쓰기**

`tests/test_feeds.py`:

```python
import json, unittest
import xml.etree.ElementTree as ET
from gen import feeds
from gen.model import Page
from tests.helpers import item, make_latest

NS = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9", "x": "http://www.w3.org/1999/xhtml"}
UP = "2026-10-17T06:00:00+09:00"


def fake_pages(n):
    return [Page(l, f"issue/i{i}/", "", UP) for i in range(n) for l in ["en", "ko", "ja", "zh"]] + [Page(None, "", "", UP)]


class FeedsTest(unittest.TestCase):
    def test_sitemap_index_and_alternates(self):
        files = feeds.sitemap(fake_pages(3))
        self.assertEqual(set(files), {"sitemap.xml", "sitemap-1.xml"})
        idx = ET.fromstring(files["sitemap.xml"])
        self.assertTrue(idx.find("s:sitemap/s:loc", NS).text.endswith("/sitemap-1.xml"))
        urls = ET.fromstring(files["sitemap-1.xml"]).findall("s:url", NS)
        self.assertEqual(len(urls), 12)  # 루트는 넣지 않음(canonical이 /en/)
        alts = urls[0].findall("x:link", NS)
        self.assertEqual(len(alts), 5)  # 4개 언어 + x-default

    def test_sitemap_chunks(self):
        files = feeds.sitemap(fake_pages(3), chunk=5)
        self.assertEqual(set(files), {"sitemap.xml", "sitemap-1.xml", "sitemap-2.xml", "sitemap-3.xml"})

    def test_rss_only_body_issues_and_escaped(self):
        good = item("good"); good["text"]["en"]["title"] = "A & B <c>"
        recs = [{"item": good, "country": "korea", "first_seen": UP, "last_updated": UP, "dates": []},
                {"item": item("thin", body=0), "country": "korea", "first_seen": UP, "last_updated": UP, "dates": []}]
        xml = feeds.rss("en", recs)
        root = ET.fromstring(xml)
        items = root.findall("channel/item")
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0].find("title").text, "A & B <c>")
        self.assertIn("+0900", items[0].find("pubDate").text)

    def test_feed_json(self):
        d = json.loads(feeds.feed_json(make_latest()))
        self.assertEqual(d["updated"], UP)
        top = d["countries"]["korea"][0]
        self.assertEqual(top["id"], "korea-one")
        self.assertEqual(set(top["title"]), {"en", "ko", "ja", "zh"})
        self.assertTrue(top["url"]["ko"].endswith("/ko/issue/korea-one/"))
        self.assertLessEqual(len(d["countries"]["korea"]), 5)

    def test_robots(self):
        self.assertIn("Sitemap: https://tking-creator.github.io/world-issues/sitemap.xml", feeds.robots())


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: 실패 확인**

Run: `python3 -m unittest tests.test_feeds -v`
Expected: FAIL — `cannot import name 'feeds'`

- [ ] **Step 3: 구현**

`gen/feeds.py`:

```python
# 사이트 지도(언어 연결 포함), robots.txt, 언어별 RSS, 크롬 확장용 feed.json
import json
from email.utils import format_datetime
from xml.sax.saxutils import escape
from . import config as C
from .html import LANG_TAG, abs_url
from .i18n import T
from .model import avg, has_body
from .timefmt import parse


def sitemap(pages, chunk=10000):
    groups = {}
    for p in pages:
        if p.lang is not None:
            groups.setdefault(p.path, {})[p.lang] = p.lastmod
    entries = []
    for path, langs in groups.items():
        x_default = f"{C.SITE_URL}/" if path == "" else abs_url("en", path)
        alts = "".join(f'<xhtml:link rel="alternate" hreflang="{LANG_TAG[l]}" href="{abs_url(l, path)}"/>' for l in langs)
        alts += f'<xhtml:link rel="alternate" hreflang="x-default" href="{x_default}"/>'
        for l, lastmod in langs.items():
            mod = f"<lastmod>{lastmod}</lastmod>" if lastmod else ""
            entries.append(f"<url><loc>{abs_url(l, path)}</loc>{mod}{alts}</url>")
    head = '<?xml version="1.0" encoding="UTF-8"?>\n'
    files, names = {}, []
    for i in range(0, len(entries), chunk):
        name = f"sitemap-{i // chunk + 1}.xml"
        names.append(name)
        files[name] = (head + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'
                       + "".join(entries[i:i + chunk]) + "</urlset>\n")
    files["sitemap.xml"] = (head + '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
                            + "".join(f"<sitemap><loc>{C.SITE_URL}/{n}</loc></sitemap>" for n in names) + "</sitemapindex>\n")
    return files


def robots():
    return f"User-agent: *\nAllow: /\nSitemap: {C.SITE_URL}/sitemap.xml\n"


def rss(lang, issues, limit=50):
    t = T(lang)
    items = []
    for r in [r for r in issues if has_body(r["item"])][:limit]:
        it, tx = r["item"], r["item"]["text"][lang]
        url = abs_url(lang, f"issue/{it['id']}/")
        items.append(f"<item><title>{escape(tx['title'])}</title><link>{url}</link><guid>{url}</guid>"
                     f"<description>{escape(tx['summary'])}</description><pubDate>{format_datetime(parse(r['last_updated']))}</pubDate></item>")
    return ('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel>'
            f"<title>{escape(t['site_name'])}</title><link>{abs_url(lang)}</link><description>{escape(t['descs']['home'])}</description>"
            f"<language>{LANG_TAG[lang]}</language>" + "".join(items) + "</channel></rss>\n")


def feed_json(latest):
    out = {"updated": latest["updated"], "site": {l: abs_url(l) for l in C.LANGS}, "countries": {}}
    for slug, c in latest["countries"].items():
        top = sorted(c["items"], key=lambda x: -avg(x["scores"]))[:5]
        out["countries"][slug] = [{
            "id": x["id"], "field": x["field"], "score": round(avg(x["scores"]), 1),
            "title": {l: x["text"][l]["title"] for l in C.LANGS},
            "url": {l: abs_url(l, f"issue/{x['id']}/") if has_body(x) else abs_url(l) for l in C.LANGS},
        } for x in top]
    return json.dumps(out, ensure_ascii=False)
```

- [ ] **Step 4: 통과 확인**

Run: `python3 -m unittest tests.test_feeds -v`
Expected: 모든 테스트 OK

- [ ] **Step 5: 커밋**

```bash
git add gen/feeds.py tests/test_feeds.py
git commit -m "v2: 사이트 지도·robots·RSS·feed.json"
```

---

### Task 7: 공유 미리보기 이미지

**Files:**
- Create: `gen/og.py`, `tests/test_og.py`

**Interfaces:**
- Consumes: `gen.i18n.T`, `gen.timefmt.{fmt_date, kst_date}`, `gen.config`
- Produces: `gen.og.build_og(out_dir: Path, latest: dict) -> list[Path]` — `og/{lang}-{key}.png`, key는 `home`, 나라 5개, `github` (언어당 7장, 모두 28장)

- [ ] **Step 1: 실패하는 테스트 쓰기**

`tests/test_og.py`:

```python
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
```

- [ ] **Step 2: 실패 확인**

Run: `python3 -m unittest tests.test_og -v`
Expected: FAIL — `No module named 'gen.og'`

- [ ] **Step 3: 구현**

`gen/og.py`:

```python
# 공유 미리보기 이미지(1200x630): 언어 x (첫 화면, 나라 5곳, 깃허브)
import os, sys
from PIL import Image, ImageDraw, ImageFont
from . import config as C
from .i18n import T
from .timefmt import fmt_date, kst_date

# 맥 기본 글꼴을 먼저 찾고, 리눅스(클라우드 갱신)에서는 Noto CJK를 찾습니다.
_NOTO = ["/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc", "/usr/share/fonts/noto-cjk/NotoSansCJK-Bold.ttc"]
FONT_CANDIDATES = {
    "en": ["/System/Library/Fonts/Helvetica.ttc", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"] + _NOTO,
    "ko": ["/System/Library/Fonts/AppleSDGothicNeo.ttc"] + _NOTO,
    "ja": ["/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc"] + _NOTO,
    "zh": ["/System/Library/Fonts/STHeiti Medium.ttc", "/System/Library/Fonts/Hiragino Sans GB.ttc"] + _NOTO,
}
COLORS = {"kr": "#0071e3", "us": "#248a3d", "jp": "#d30f45", "cn": "#c93400", "etc": "#5e5ce6", "gh": "#1d1d1f"}


def _font_path(lang):
    return next((p for p in FONT_CANDIDATES[lang] if os.path.exists(p)), None)


def _render(path, font_path, heading, sub, color):
    img = Image.new("RGB", (1200, 630), "#f2f2f7")
    d = ImageDraw.Draw(img)
    f = (lambda s: ImageFont.truetype(font_path, s)) if font_path else (lambda s: ImageFont.load_default(s))
    d.rectangle([0, 0, 1200, 18], fill=color)
    d.text((80, 190), heading, font=f(84), fill="#1d1d1f")
    d.text((80, 320), sub, font=f(46), fill=color)
    d.text((80, 520), C.SITE_URL.split("://", 1)[1], font=f(30), fill="#6e6e73")
    img.save(path, optimize=True)


def build_og(out_dir, latest):
    out_dir.mkdir(parents=True, exist_ok=True)
    day, files = kst_date(latest["updated"]), []
    for lang in C.LANGS:
        font = _font_path(lang)
        text_lang = lang if font else "en"  # 글꼴이 없으면 글자가 깨지지 않게 영어로 그립니다.
        if not font:
            print(f"경고: {lang} 글꼴을 찾지 못해 공유 이미지를 영어로 만듭니다", file=sys.stderr)
        t = T(text_lang)
        date = fmt_date(day, text_lang)
        targets = [("home", "", "kr")]
        targets += [(k, t["countries"][k], C.COUNTRIES[k][2]) for k in C.COUNTRIES]
        targets += [("github", "GitHub Trending", "gh")]
        for key, label, accent in targets:
            p = out_dir / f"{lang}-{key}.png"
            _render(p, font, t["site_name"], f"{label} · {date}" if key != "home" else date, COLORS[accent])
            files.append(p)
    return files
```

- [ ] **Step 4: 통과 확인**

Run: `python3 -m unittest tests.test_og -v`
Expected: OK. 만든 이미지 하나를 열어 글자가 깨지지 않는지 눈으로 본다: `open /tmp/...` 대신 테스트 출력 경로를 프린트해서 `Read` 도구로 확인한다.

- [ ] **Step 5: 커밋**

```bash
git add gen/og.py tests/test_og.py
git commit -m "v2: 언어·나라별 공유 미리보기 이미지"
```

---

### Task 8: 스타일과 브라우저 스크립트

**Files:**
- Move: `styles.css` → `static/styles.css` (`git mv`)
- Modify: `static/styles.css`
- Create: `static/app.js`
- Delete: `index.html`, `app.js` (생성 코드로 대체됨)

**Interfaces:**
- Consumes: Task 4·5가 만드는 HTML 구조 — `.seg a[data-k]`, `section.panel#p-{k}[data-accent]`, `.chip[data-f]`, `section.field[data-f]`, `[data-updated][data-tpl]`, `.langmenu a[data-lang]`, `#lang-suggest a[data-lang]`, `.slot`
- Produces: 화면 동작(테스트 대신 Task 9 이후 브라우저로 확인)

- [ ] **Step 1: 스타일 옮기기**

```bash
git mv styles.css static/styles.css
git rm -q index.html app.js
```

- [ ] **Step 2: `static/styles.css` 고치기**

(1) 탭이 `<button>`에서 `<a>`로 바뀌었으므로 `.seg button` 규칙을 전부 `.seg :is(button,a)`로 바꾼다. 예:

```css
.seg :is(button,a){flex:1 0 auto;display:flex;align-items:center;justify-content:center;gap:8px;font:inherit;font-weight:500;font-size:15px;color:var(--ink);background:none;border:0;border-radius:9px;padding:8px 16px;cursor:pointer;white-space:nowrap;text-decoration:none;transition:background .25s,box-shadow .25s,color .25s}
```

(`text-decoration:none` 추가.) 640px 이하 미디어 쿼리 안의 `.seg button` 규칙도 같은 방식으로 바꾼다: `grep -n "seg button" static/styles.css`로 남은 곳이 없는지 확인.

(2) 언어별 글꼴: `:root` 블록 바로 아래에 추가한다.

```css
:lang(ja){--display:-apple-system,BlinkMacSystemFont,"Hiragino Sans","Noto Sans JP",system-ui,sans-serif;--body:var(--display)}
:lang(zh-Hans){--display:-apple-system,BlinkMacSystemFont,"PingFang SC","Noto Sans SC","Microsoft YaHei",system-ui,sans-serif;--body:var(--display)}
```

(3) 파일 끝에 새 요소 스타일을 추가한다. 새 색은 만들지 않고 기존 토큰만 쓴다.

```css
/* v2: 머리말·언어 메뉴, 패널, 이슈 개별 페이지, 모음 페이지 */
header.top{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:28px}
.brand{font-family:var(--display);font-weight:700;font-size:17px;text-decoration:none;letter-spacing:-.02em}
.langmenu{position:relative}
.langmenu summary{list-style:none;cursor:pointer;font-size:14px;font-weight:500;background:var(--surface);border-radius:999px;padding:7px 14px}
.langmenu summary::-webkit-details-marker{display:none}
.langmenu ul{position:absolute;right:0;top:calc(100% + 6px);z-index:20;margin:0;padding:6px;list-style:none;background:var(--surface);border-radius:14px;box-shadow:var(--thumb-shadow);min-width:150px}
.langmenu a{display:block;padding:8px 12px;border-radius:9px;text-decoration:none;font-size:14px}
.langmenu a:hover{background:var(--track)}
.langmenu a[aria-current]{font-weight:600;color:var(--acc)}
.suggest{margin:0 0 20px;padding:10px 14px;border-radius:12px;background:var(--surface);font-size:14px;color:var(--muted)}
.suggest a{color:var(--acc);font-weight:600;margin-left:6px}
.panel[hidden],section.field[hidden]{display:none}
.when{margin:24px 0 0;font-size:13px;color:var(--muted)}
.filters .plats{margin-left:auto}
.slot:empty{display:none}
.crumbs{font-size:13px;color:var(--muted);margin-bottom:16px}
.crumbs a{text-decoration:none}
.crumbs a:hover{color:var(--acc)}
.issue{background:var(--surface);border-radius:24px;padding:clamp(24px,4.4vw,48px);max-width:760px}
.issue h1{font-size:clamp(28px,4.6vw,42px);line-height:1.15;margin:12px 0 8px}
.issue h2{font-family:var(--display);font-size:21px;letter-spacing:-.02em;margin:32px 0 8px}
.issue p{font-size:17px;line-height:1.7;margin:0 0 12px}
.issue .dek{color:var(--muted);font-size:19px;line-height:1.55;margin-top:20px}
.issue .score{display:flex;align-items:center;gap:24px;margin-top:16px}
.issue .score .critrow{flex:1;max-width:420px}
.pager{display:flex;justify-content:space-between;margin-top:40px;font-size:15px;font-weight:500}
.pager a{color:var(--acc);text-decoration:none}
.disclaimer{grid-column:1/-1;font-size:12px;color:var(--muted);margin:8px 0 0}
.cmeta{display:flex;flex-direction:column;gap:8px}
```

`footer.method`가 grid인지 `grep -n "footer.method\|\.method" static/styles.css`로 확인한다. grid가 아니면 `.disclaimer`의 `grid-column` 줄은 지운다.

- [ ] **Step 3: `static/app.js` 쓰기**

```js
// 탭 전환, 분야 필터, 고른 언어 기억, 내 시간 기준 갱신 시각, 루트에서 언어 안내. 스크립트가 없어도 페이지는 읽힙니다.
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
                  set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };

  const app = $("#app"), tabs = $$(".seg a[data-k]");
  function show(k) {
    const p = $("#p-" + k);
    if (!p) return false;
    $$(".panel").forEach(x => { x.hidden = x !== p; });
    tabs.forEach(t => t.setAttribute("aria-selected", String(t.dataset.k === k)));
    app.dataset.c = p.dataset.accent;
    return true;
  }
  tabs.forEach(t => t.addEventListener("click", e => {
    if (!show(t.dataset.k)) return;          // 날짜 페이지 등 패널이 없으면 모음 페이지로 이동
    e.preventDefault();
    history.replaceState(null, "", "#" + t.dataset.k);
    store.set("issue-tab", t.dataset.k);
  }));
  const h = location.hash.slice(1);
  if (!(h && show(h))) { const s = store.get("issue-tab"); if (s) show(s); }

  document.addEventListener("click", e => {
    const b = e.target.closest(".chip[data-f]");
    if (!b) return;
    const panel = b.closest(".panel");
    $$(".chip[data-f]", panel).forEach(c => c.setAttribute("aria-pressed", String(c === b)));
    $$("section.field[data-f]", panel).forEach(s => { s.hidden = b.dataset.f !== "all" && s.dataset.f !== b.dataset.f; });
  });

  $$(".langmenu a[data-lang]").forEach(a => a.addEventListener("click", () => store.set("lang", a.dataset.lang)));

  const u = $("[data-updated]");
  if (u) {
    try {
      const d = new Date(u.dataset.updated);
      const hours = Math.max(0, Math.round((Date.now() - d) / 36e5));
      const time = new Intl.DateTimeFormat(document.documentElement.lang, { dateStyle: "medium", timeStyle: "short" }).format(d);
      u.textContent = u.dataset.tpl.replace("{time}", time).replace("{n}", hours);
    } catch (e) {}                            // 실패하면 서버에서 넣은 서울 시각 문구가 그대로 남습니다
  }

  const sug = $("#lang-suggest");
  if (sug) {
    const want = store.get("lang") || (navigator.language || "").slice(0, 2).toLowerCase();
    const a = $(`a[data-lang="${want}"]`, sug);
    if (a) { a.hidden = false; sug.hidden = false; }
  }
})();
```

- [ ] **Step 4: 커밋 (화면 확인은 Task 9에서 실제 사이트를 만든 뒤 한다)**

```bash
git add static
git commit -m "v2: 스타일을 static/으로 옮기고 언어 메뉴·페이지 스타일, 브라우저 스크립트 추가"
```

---

### Task 9: `build.py` 진입점과 전체 생성

**Files:**
- Modify (다시 씀): `build.py`
- Create: `tests/test_build.py`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: Task 1~8의 모든 공개 함수
- Produces:
  - `python3 build.py [--data DIR] [--out DIR]` — `DIR/latest.json` 검사 → 누적 → `site/` 생성. 종료 코드 0/1
  - `python3 build.py --check FILE [--langs ko]` — 검사만
  - `python3 build.py --list-ids` — 최근 이슈 `id  나라  한국어 제목` 200줄
  - `build.main(argv) -> int`

- [ ] **Step 1: 실패하는 테스트 쓰기**

`tests/test_build.py`:

```python
import json, re, tempfile, pathlib, unittest
import xml.etree.ElementTree as ET
import build
from tests.helpers import make_latest

NS = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}


class BuildTest(unittest.TestCase):
    def setUp(self):
        self.tmp = pathlib.Path(tempfile.mkdtemp())
        self.data, self.out = self.tmp / "data", self.tmp / "site"
        self.data.mkdir()

    def write(self, d, name="latest.json"):
        (self.data / name).write_text(json.dumps(d, ensure_ascii=False), encoding="utf-8")

    def run_build(self, *extra):
        return build.main(["--data", str(self.data), "--out", str(self.out), *extra])

    def test_full_build(self):
        self.write(make_latest())
        self.assertEqual(self.run_build(), 0)
        for f in ["index.html", "en/index.html", "zh/issue/korea-one/index.html", "ko/korea/index.html",
                  "ja/tech/index.html", "en/2026-10-17/index.html", "en/github/index.html",
                  "sitemap.xml", "robots.txt", "en/feed.xml", "feed.json", "static/app.js", "og/ko-korea.png", ".nojekyll"]:
            self.assertTrue((self.out / f).exists(), f)

    def test_every_sitemap_url_is_a_file(self):
        self.write(make_latest())
        self.run_build()
        base = "https://tking-creator.github.io/world-issues/"
        for sm in self.out.glob("sitemap-*.xml"):
            for loc in ET.parse(sm).getroot().findall("s:url/s:loc", NS):
                rel = loc.text.removeprefix(base)
                self.assertTrue((self.out / rel / "index.html").exists(), rel)

    def test_internal_links_resolve(self):
        self.write(make_latest())
        self.run_build()
        html = (self.out / "en/index.html").read_text(encoding="utf-8")
        for path in set(re.findall(r'href="/world-issues/([^"#]*)"', html)):
            target = self.out / path
            self.assertTrue((target / "index.html").exists() or target.is_file(), path)

    def test_invalid_latest_leaves_site_and_store(self):
        self.write(make_latest())
        self.run_build()
        before = (self.out / "en/index.html").read_text(encoding="utf-8")
        issues_before = sorted(p.name for p in (self.data / "issues").glob("*.json"))
        bad = make_latest("2026-10-18T06:00:00+09:00")
        bad["countries"]["korea"]["items"][0]["id"] = "new-issue"
        bad["countries"]["korea"]["items"][0]["text"].pop("ja")
        self.write(bad)
        self.assertEqual(self.run_build(), 1)
        self.assertEqual((self.out / "en/index.html").read_text(encoding="utf-8"), before)
        self.assertEqual(sorted(p.name for p in (self.data / "issues").glob("*.json")), issues_before)
        self.assertFalse((self.data / "archive" / "2026-10-18.json").exists())

    def test_draft_is_never_published(self):
        self.write(make_latest(), name="draft.json")
        self.assertEqual(self.run_build(), 1)   # latest.json이 없으면 실패
        self.assertFalse(self.out.exists())

    def test_check_ko_draft(self):
        d = make_latest()
        for c in d["countries"].values():
            for x in c["items"]:
                x["text"] = {"ko": x["text"]["ko"]}
            c["cut"] = [{"ko": "뺌"}]
        for g in d["github"]["items"]:
            g["desc"] = {"ko": "설명"}
        self.write(d, name="draft.json")
        f = str(self.data / "draft.json")
        self.assertEqual(build.main(["--check", f, "--langs", "ko"]), 0)
        self.assertEqual(build.main(["--check", f]), 1)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: 실패 확인**

Run: `python3 -m unittest tests.test_build -v`
Expected: FAIL — 옛 `build.py`에는 `main`이 없음 (`AttributeError` 또는 옛 검사 실행)

- [ ] **Step 3: `build.py` 다시 쓰기**

```python
# 사이트 만들기: data/latest.json 검사 → data/issues·archive 누적 → site/에 전체 페이지 생성
# 검사에 실패하면 누적 기록과 site/를 건드리지 않고 종료 코드 1로 끝납니다.
import argparse, json, pathlib, shutil, sys
from gen import config as C
from gen import feeds, og, pages, store
from gen.model import has_body, validate

ROOT = pathlib.Path(__file__).resolve().parent


def load(p):
    return json.loads(pathlib.Path(p).read_text(encoding="utf-8"))


def write_site(out, latest, issues, archives):
    tmp = out.with_name(out.name + ".tmp")
    shutil.rmtree(tmp, ignore_errors=True)
    ps = pages.all_pages(latest, issues, archives)
    for p in ps:
        f = tmp / ("index.html" if p.lang is None else f"{p.lang}/{p.path}index.html")
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_text(p.html, encoding="utf-8")
    for name, xml in feeds.sitemap(ps).items():
        (tmp / name).write_text(xml, encoding="utf-8")
    (tmp / "robots.txt").write_text(feeds.robots(), encoding="utf-8")
    for lang in C.LANGS:
        (tmp / lang / "feed.xml").write_text(feeds.rss(lang, issues), encoding="utf-8")
    (tmp / "feed.json").write_text(feeds.feed_json(latest), encoding="utf-8")
    (tmp / ".nojekyll").write_text("", encoding="utf-8")
    shutil.copytree(ROOT / "static", tmp / "static")
    og.build_og(tmp / "og", latest)
    shutil.rmtree(out, ignore_errors=True)
    tmp.rename(out)
    return ps


def report(err):
    print("검사 실패:\n- " + "\n- ".join(err), file=sys.stderr)


def main(argv=None):
    ap = argparse.ArgumentParser(description="오늘의 세계 이슈판 사이트 만들기")
    ap.add_argument("--data", type=pathlib.Path, default=ROOT / "data")
    ap.add_argument("--out", type=pathlib.Path, default=ROOT / "site")
    ap.add_argument("--check", metavar="FILE", help="검사만 합니다")
    ap.add_argument("--langs", default=",".join(C.LANGS), help="--check와 함께: 검사할 언어(쉼표로 구분)")
    ap.add_argument("--list-ids", action="store_true", help="최근 이슈 id 목록")
    a = ap.parse_args(argv)

    if a.list_ids:
        for r in store.load_issues(a.data)[:200]:
            print(r["item"]["id"], r["country"], r["item"]["text"]["ko"]["title"], sep="\t")
        return 0
    if a.check:
        err = validate(load(a.check), langs=a.langs.split(","))
        if err:
            report(err)
            return 1
        print(f"검사 통과: {a.check}")
        return 0

    latest_p = a.data / "latest.json"
    if not latest_p.exists():
        print(f"{latest_p} 가 없습니다", file=sys.stderr)
        return 1
    latest = load(latest_p)
    err = validate(latest)
    if err:
        report(err)
        return 1
    store.merge(latest, a.data)
    issues, archives = store.load_issues(a.data), store.load_archives(a.data)
    ps = write_site(a.out, latest, issues, archives)
    skipped = [x["id"] for c in latest["countries"].values() for x in c["items"] if not has_body(x)]
    print(f"검사 통과 ({latest['updated']}) · 페이지 {len(ps)}개 · 이슈 기록 {len(issues)}개")
    if skipped:
        print(f"본문 네 단락이 없어 개별 페이지를 건너뛴 이슈 {len(skipped)}개: {', '.join(skipped)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

`.gitignore`에 두 줄을 추가한다(`dist/`는 더 이상 만들지 않지만 남아 있는 폴더가 올라가지 않도록 그대로 둔다):

```
site.tmp/
data/draft.json
```

- [ ] **Step 4: 전체 테스트 통과 확인**

Run: `python3 -m unittest discover -s tests -t . -v`
Expected: 모든 테스트 OK

- [ ] **Step 5: 화면 확인 (테스트 데이터로)**

```bash
mkdir -p /private/tmp/claude-501/wi-preview/data
python3 -I -c "import json,sys; sys.path.insert(0,'.'); from tests.helpers import make_latest; json.dump(make_latest(), open('/private/tmp/claude-501/wi-preview/data/latest.json','w'), ensure_ascii=False)"
SITE_URL=http://localhost:8765 python3 build.py --data /private/tmp/claude-501/wi-preview/data --out /private/tmp/claude-501/wi-preview/site
python3 -m http.server 8765 --directory /private/tmp/claude-501/wi-preview/site
```

(`python3 -I`는 현재 폴더를 import 경로에 넣지 않으므로 `sys.path.insert`로 넣는다.) 브라우저(Claude in Chrome 또는 내장 브라우저)로 `http://localhost:8765/`를 열고 확인한다:
- 루트에서 영어판이 보이고, 브라우저 언어가 한국어면 위에 "Read this page in: 한국어" 안내가 뜬다
- 오른쪽 위 언어 메뉴로 ko/ja/zh에 같은 페이지로 이동한다
- 나라 탭 전환, 분야 필터, "내 시간 기준 … · N시간 전" 표시
- 이슈 제목 → 개별 페이지(네 단락, 관련 이슈, 경로 표시)
- 폭 375px에서 가로 스크롤이 없다, 다크 모드에서 글자가 보인다

이상이 있으면 해당 Task 파일을 고치고 테스트를 다시 돌린 뒤 이 단계를 반복한다.

- [ ] **Step 6: 커밋**

```bash
git add build.py tests/test_build.py .gitignore
git commit -m "v2: build.py 진입점(검사·누적·전체 생성, --check, --list-ids)"
```

---

### Task 10: 갱신 프롬프트, 실행 스크립트, 06:00 예약, 배포, 문서

**Files:**
- Modify (다시 씀): `refresh-prompt.md`, `refresh.sh`
- Create: `translate-prompt.md`, `.github/workflows/pages.yml`
- Modify: `CLAUDE.md`, `README.md`, `docs/superpowers/specs/2026-10-17-world-issues-v2-design.md`
- Modify (저장소 밖): `~/Library/LaunchAgents/local.world-issues.refresh.plist`

**Interfaces:**
- Consumes: `python3 build.py`, `--check FILE --langs ko`, `--list-ids`
- Produces: 매일 06:00 KST 자동 갱신 → `data/`, `site/` 커밋·푸시 → GitHub Actions가 `site/`를 Pages에 배포

- [ ] **Step 1: `refresh-prompt.md` 다시 쓰기**

````markdown
지금은 {{NOW}} (한국 시간)입니다. "오늘의 세계 이슈판"의 오늘 원고를 한국어로 씁니다. 번역과 게시는 다음 단계가 따로 합니다. 사람이 지켜보지 않는 자동 실행이므로 질문하지 말고 끝까지 진행합니다.

## 먼저 할 것
- `CLAUDE.md`와 `README.md`를 읽습니다. 점수 규칙, 나라별 기준 플랫폼, 10~20대 트렌드 기준이 있습니다.
- `python3 build.py --list-ids`로 최근 이슈 id와 제목을 봅니다. 같은 이슈가 이어지면 **반드시 같은 id**를 씁니다.

## 할 일
1. 나라 `korea`, `usa`, `japan`, `china`, `world`(유럽·영국·중동)별로 웹 검색으로 최근 24시간 화제 이슈를 모읍니다. 분야는 `tech`(기술·경제), `politics`, `culture`(문화·사회), `incidents`(사건사고)입니다.
2. 화제성·파급력·시의성·지속성을 각 10점으로 매기고 평균 5.0 미만은 `cut`으로 보냅니다. 분야별 최대 10개입니다.
3. 이슈마다 한국어로 씁니다.
   - `title`: 검색하는 사람이 쓸 만한 구체적인 말을 넣은 제목(40자 안팎). 낚시성 표현 금지.
   - `summary`: 2~3문장 요약.
   - `body`: 정확히 네 단락. ① 무슨 일인지(누가, 언제, 숫자) ② 왜 화제인지 ③ 반응(확인된 반응만, 지어내지 않음) ④ 앞으로 볼 점(예정된 일정 등). 단락마다 2~4문장. 확인된 사실이 부족해 네 단락을 채울 수 없으면 `body`를 빈 목록으로 둡니다.
4. 모든 이슈에 실제로 확인한 기사 출처를 `source`에 넣습니다. 확인하지 못한 내용은 쓰지 않습니다.
5. 깃허브: `curl -sL -A "Mozilla/5.0" "https://github.com/trending?since=daily"`로 받아 상위 10개를 순서대로 넣고, 설명을 한국어로 옮깁니다. 별 숫자는 페이지 그대로 씁니다.
6. 결과를 `data/draft.json`으로 씁니다. 형식:

```json
{
  "updated": "{{NOW}}",
  "countries": {
    "korea": {
      "items": [{
        "id": "kospi-rebound-oct-2026",
        "field": "tech",
        "scores": [8, 8, 9, 6],
        "youth": false,
        "links": [{"p": "naver", "q": "코스피 반등"}, {"p": "th", "q": "코스피"}],
        "source": {"name": "Korea Herald 10/16", "url": "https://..."},
        "text": {"ko": {"title": "...", "summary": "...", "body": ["...", "...", "...", "..."]}}
      }],
      "cut": [{"ko": "뺀 이슈 제목 (4.5)"}]
    }
  },
  "github": {"date": "YYYY-MM-DD", "items": [
    {"repo": "owner/name", "language": "Python", "stars": 1234, "today": 56, "desc": {"ko": "..."}}
  ]}
}
```

   - `id`: 새 이슈는 영어 소문자·숫자·하이픈으로, 내용을 알 수 있게 짓습니다(60자 이하, 예: `bts-spotify-10-billion-streams`).
   - `links[].p`: `ig`, `naver`, `x`, `rd`, `th`, `tt`, `wb` 중 하나. `q`는 그 나라 사람들이 실제로 검색할 말(현지어)입니다. 첫 번째 링크가 대표 링크입니다.
   - 문화·사회에서 10~20대 사이에 막 뜨는 유행은 `youth`를 true로 둡니다.
7. `python3 build.py --check data/draft.json --langs ko`를 실행하고, 실패하면 고쳐서 통과할 때까지 반복합니다.

## 지킬 것
- `data/draft.json` 외의 파일은 고치지 않습니다. git 명령은 쓰지 않습니다.
- 점수를 실제 SNS 언급량처럼 표현하지 않습니다.
- 마지막에 나라별 항목 수와 본문을 비워 둔 이슈 수를 한국어로 짧게 요약합니다.
````

- [ ] **Step 2: `translate-prompt.md` 쓰기**

```markdown
"오늘의 세계 이슈판"의 한국어 원고 `data/draft.json`을 영어(en), 일본어(ja), 중국어 간체(zh)로 옮겨 `data/latest.json`을 씁니다. 사람이 지켜보지 않는 자동 실행이므로 질문하지 말고 끝까지 진행합니다.

## 할 일
1. `data/draft.json`을 읽고, 구조와 값(`id`, `field`, `scores`, `youth`, `links`, `source`, 깃허브 숫자)은 그대로 둔 채 글만 더합니다.
   - 각 이슈 `text`에 `en`, `ja`, `zh`를 추가합니다. `title`, `summary`, `body`(네 단락, 한국어가 빈 목록이면 빈 목록)를 모두 옮깁니다.
   - 각 나라 `cut` 항목에 `en`, `ja`, `zh`를 추가합니다.
   - 깃허브 `desc`에 `en`, `ja`, `zh`를 추가합니다.
2. 번역 원칙
   - 직역하지 말고 그 언어 뉴스 문장처럼 자연스럽게 씁니다. 사실, 숫자, 날짜는 바꾸지 않습니다.
   - 인명·지명·회사명은 그 언어에서 통용되는 표기를 씁니다(예: 이재명 → Lee Jae-myung / 李在明).
   - 제목은 그 언어 사용자가 검색할 만한 말로 씁니다.
   - `links[].q`(SNS 검색어)는 번역하지 않습니다.
3. 결과를 `data/latest.json`으로 씁니다.
4. `python3 build.py --check data/latest.json`을 실행하고, 실패하면 고쳐서 통과할 때까지 반복합니다.

## 지킬 것
- `data/latest.json` 외의 파일은 고치지 않습니다. git 명령은 쓰지 않습니다.
- 마지막에 옮긴 이슈 수를 한국어로 한 줄 요약합니다.
```

- [ ] **Step 3: `refresh.sh` 다시 쓰기**

```zsh
#!/bin/zsh
# 매일 06:00(KST)에 launchd가 실행합니다. ① 조사·한국어 원고 → ② 번역(실패하면 한 번 더) → ③ 검사·사이트 생성 → ④ GitHub에 올리기
# 검사에 실패하면 이번 결과를 버리고 이전 data/latest.json과 site/를 그대로 둡니다. NO_PUSH=1이면 올리지 않습니다.
set -u
cd "${0:A:h}"
export PATH="/opt/homebrew/bin:$HOME/.local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
mkdir -p logs data

STAMP=$(date +%Y-%m-%d-%H%M)
LOG="logs/$STAMP.log"
NOW=$(TZ=Asia/Seoul date +%Y-%m-%dT%H:%M:00+09:00)
TOOLS=("Read" "Write" "Edit" "Glob" "Grep" "WebSearch" "WebFetch" "Bash(curl -sL:*)" "Bash(python3 build.py:*)" "Bash(python3 -I:*)")
PREV="logs/$STAMP-prev-latest.json"
echo "== 시작 $(date)" >> "$LOG"
[ -f data/latest.json ] && cp data/latest.json "$PREV"

step() {
  claude -p "$(sed "s/{{NOW}}/$NOW/g" "$1")" --allowedTools "${TOOLS[@]}" >> "$LOG" 2>&1
  echo "== $1 종료 코드 $?" >> "$LOG"
}
finish() { echo "== 끝 $(date)" >> "$LOG"; exit "$1"; }
restore() {
  if [ -f "$PREV" ]; then cp "$PREV" data/latest.json; else rm -f data/latest.json; fi
  echo "== 실패: $1. 이전 데이터와 사이트를 그대로 둡니다" >> "$LOG"
  finish 1
}

rm -f data/draft.json
step refresh-prompt.md
python3 build.py --check data/draft.json --langs ko >> "$LOG" 2>&1 || restore "한국어 원고 검사 실패"

ok=0
for try in 1 2; do
  step translate-prompt.md
  if python3 build.py >> "$LOG" 2>&1; then ok=1; break; fi
  echo "== 번역본 검사 또는 생성 실패 (${try}회차)" >> "$LOG"
done
[ $ok = 1 ] || restore "번역 단계 실패"
rm -f data/draft.json

if [ "${NO_PUSH:-0}" = 1 ]; then echo "== NO_PUSH=1이라 올리지 않았습니다" >> "$LOG"; finish 0; fi
git add data site >> "$LOG" 2>&1
if git diff --cached --quiet; then
  echo "== 바뀐 내용이 없어 올리지 않았습니다" >> "$LOG"
elif git commit -q -m "자동 갱신 $NOW" >> "$LOG" 2>&1 && git push -q origin main >> "$LOG" 2>&1; then
  echo "== GitHub에 올렸습니다" >> "$LOG"
else
  echo "== 실패: GitHub에 올리지 못했습니다" >> "$LOG"
fi
finish 0
```

`claude -p`가 `{{NOW}}` 외의 중괄호를 건드리지 않는지: `sed`는 `{{NOW}}`만 바꾸므로 프롬프트의 JSON 예시는 그대로 전달된다.

- [ ] **Step 4: GitHub Actions 배포 파일 쓰기**

`.github/workflows/pages.yml`:

```yaml
name: Deploy site
on:
  push:
    branches: [main]
    paths: ["site/**"]
  workflow_dispatch: {}
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deploy.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: site
      - id: deploy
        uses: actions/deploy-pages@v4
```

- [ ] **Step 5: 문서 고치기**

`CLAUDE.md`를 아래로 바꾼다:

```markdown
# CLAUDE.md

Multilingual static site generator. Read README.md first; it has the data format, scoring rules, platforms per country and known limits.

- User-facing text is Korean. Reply to the user in Korean.
- Daily content lives in `data/latest.json` (4 languages), built from `data/draft.json` (Korean). `data/issues/` and `data/archive/` are written only by `build.py`.
- Page HTML is generated by `gen/` (pure functions returning strings); browser JS in `static/app.js` only handles tabs, filters, language memory and relative time.
- Fixed UI text lives in `i18n/{en,ko,ja,zh}.json`; every key must exist in all four files.
- Colors are tokens on `:root` with dark-mode overrides under `prefers-color-scheme` and `[data-theme]`; add new colors as tokens in all three blocks.
- Scoring: 화제성/파급력/시의성/지속성 each /10, averaged; drop items under 5.0 into the country's `cut` list. Max 10 per field.
- Never present scores as measured SNS volume; they are judgments based on cited sources. Every item needs `source.url`.
- Keep an issue's `id` when it continues on a later day; issue pages live at `/{lang}/issue/{id}/`.
- 문화·사회 should favor what 10~20대 are just starting to like (KR: Reels/Threads, JP: X/TikTok) and set `youth: true` for those.
- Tests: `python3 -m unittest discover -s tests -t .`
```

`README.md`: "실행", "파일 구성", "자동 갱신", "데이터 형식", "점수 규칙"(6.0 → 5.0) 절을 새 구조로 바꾼다. 내용은 이 계획의 File Structure 표, `refresh.sh` 흐름(06:00 하루 한 번, 2단계), `refresh-prompt.md`의 JSON 형식을 그대로 옮긴다. "나라별 기준 플랫폼", "알려진 한계"는 유지하고, claude.ai 게시본과 `dist/` 이야기는 지운다. "다음에 할 만한 일"의 2번(날짜별 보관)은 끝났으므로 지운다.

설계 문서 고치기(`docs/superpowers/specs/2026-10-17-world-issues-v2-design.md`):
- 3절 `latest.json` 예시에서 `"platforms"` 줄을 지우고, "나라별 분석 플랫폼은 `gen/config.py`에 둔다"를 추가
- 4절 "다음 실행은 draft가 번역되지 않은 채 남아 있으면 번역부터 다시 한다"를 "번역 검사에 실패하면 같은 실행 안에서 번역을 한 번 더 한다(하루 한 번 갱신이라 다음 실행까지 미루지 않는다)"로 바꿈
- 7절 `templates/` 줄을 "`gen/html.py` 함수로 HTML을 만든다(템플릿 엔진 없음)"로 바꿈

- [ ] **Step 6: 실제 갱신 한 번 돌리기 (올리지 않음)**

```bash
cd ~/Desktop/world-issues && chmod +x refresh.sh && time NO_PUSH=1 ./refresh.sh; tail -30 "$(ls -t logs/*.log | head -1)"
```

Expected: 로그에 "검사 통과 … 페이지 N개"와 "NO_PUSH=1이라 올리지 않았습니다". 걸린 시간을 기록한다. 실패하면 로그를 보고 프롬프트를 고친 뒤 다시 돌린다.

그다음 Task 9 Step 5와 같은 방법으로 실제 데이터 사이트를 띄워 확인한다:

```bash
SITE_URL=http://localhost:8765 python3 build.py --out /private/tmp/claude-501/wi-preview/real
python3 -m http.server 8765 --directory /private/tmp/claude-501/wi-preview/real
```

주의: 위 명령은 `data/`에 누적 기록을 다시 쓰지만 같은 날짜라 결과가 같다(Task 3의 `test_rerun_same_day_is_idempotent`).

확인할 것: 4개 언어 번역이 자연스러운지, 본문 네 단락이 채워졌는지, 건너뛴 이슈가 몇 개인지. 결과를 사용자에게 보여 준다.

- [ ] **Step 7: 사용자 확인 후 06:00 예약으로 바꾸기**

사용자에게 실제 결과를 보여 주고 "06:00 예약으로 바꾸고 GitHub에 올려도 되는지" 확인받은 뒤 진행한다.

`~/Library/LaunchAgents/local.world-issues.refresh.plist`의 `StartCalendarInterval`을 06:00 하나로 바꾼다:

```xml
  <key>StartCalendarInterval</key>
  <dict><key>Hour</key><integer>6</integer><key>Minute</key><integer>0</integer></dict>
```

```bash
launchctl bootout gui/$(id -u)/local.world-issues.refresh
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/local.world-issues.refresh.plist
launchctl print gui/$(id -u)/local.world-issues.refresh | grep -A4 "calendar"
```

Expected: Hour 6, Minute 0 하나만 보인다.

- [ ] **Step 8: 사용자 확인 후 배포 방식 바꾸고 올리기**

```bash
git add refresh-prompt.md translate-prompt.md refresh.sh .github CLAUDE.md README.md docs data site
git commit -m "v2: 2단계 갱신(06:00), GitHub Actions 배포, 문서 갱신"
gh api -X PUT repos/TKING-CREATOR/world-issues/pages -f build_type=workflow
git push origin main
gh run watch "$(gh run list --workflow pages.yml --limit 1 --json databaseId -q '.[0].databaseId')"
curl -sI https://tking-creator.github.io/world-issues/ | head -1
curl -s https://tking-creator.github.io/world-issues/ja/ | grep -o "<title>[^<]*</title>"
curl -s https://tking-creator.github.io/world-issues/sitemap.xml | head -c 300
```

Expected: 배포 작업 성공, 루트 200, 일본어 제목, 사이트 지도 색인이 보인다.

- [ ] **Step 9: 커밋 확인**

`git status --short`가 비어 있는지 확인한다(`logs/`, `history/`, `dist/`, `data/draft.json`은 무시됨).

---

## 자체 점검 메모

- 설계 문서 대응: 1절 페이지 구성 → Task 5, 언어 메뉴·루트 안내 → Task 4·8, 광고 자리 → Task 4 `slot`; 2절 시각 표시 → Task 2·5·8; 3절 데이터 → Task 1·3; 4절 갱신 흐름 → Task 10; 5절 검사 → Task 1·9; 6절 검색 장치 → Task 4(메타·hreflang·JSON-LD)·5(NewsArticle·ItemList)·6(사이트 지도·RSS·feed)·7(공유 이미지); 8절 확인 방법 → 각 Task 테스트, Task 9 Step 5, Task 10 Step 6. IndexNow와 검색엔진 등록은 설계대로 2번 덩어리.
- 함수 이름 일치: `has_body`, `avg`, `link`, `validate`, `Page`, `kst_date`, `seoul`, `country_line`, `fmt_date`, `T`, `href`, `abs_url`, `ld`, `crumbs`, `shell`, `card`, `slot`, `related`, `build_og`, `sitemap`, `rss`, `feed_json`, `robots`, `main`을 정의한 Task와 쓰는 Task에서 같은 이름으로 썼다.
