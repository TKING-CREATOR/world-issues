# 데이터 규칙: 점수 평균, SNS 검색 링크, 본문 유무, latest.json 검사
import re
from collections import namedtuple
from urllib.parse import quote
from . import config as C

Page = namedtuple("Page", "lang path html lastmod")  # lang이 None이면 루트(/) 페이지

ID_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
REPO_RE = re.compile(r"^[\w.-]+/[\w.-]+$")
URL_RE = re.compile(r"^https?://\S+$")
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
        if not isinstance(body, list) or len(body) != 4 or not all(isinstance(x, str) and x.strip() for x in body):
            return False
    return True


def validate(d, langs=C.LANGS):
    err, seen = [], set()
    if not UPDATED_RE.match(str(d.get("updated", ""))):
        err.append(f"updated 형식이 틀렸습니다(예: 2026-10-17T06:00:00+09:00): {d.get('updated')!r}")
    countries = d.get("countries") or {}
    for k in countries:
        if k not in C.COUNTRIES:
            err.append(f"알 수 없는 나라 키: {k}")
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
            elif not all(isinstance(v, (int, float)) and not isinstance(v, bool) and 0 <= v <= 10 for v in s):
                err.append(f"{k}: 점수 범위(0~10 숫자) 틀림 - {name}")
            elif avg(s) < C.MIN_SCORE:
                err.append(f"{k}: {C.MIN_SCORE} 미만 - {name}")
            if x.get("field") not in C.FIELDS:
                err.append(f"{k}: 분야 키 틀림 - {name}")
            src = x.get("source") or {}
            if not isinstance(src.get("name"), str) or not src["name"].strip() or not URL_RE.match(str(src.get("url", ""))):
                err.append(f"{k}: 출처 없음 또는 이름·http 주소 틀림 - {name}")
            links = x.get("links") or []
            if not links or any(not isinstance(l, dict) or l.get("p") not in PLATFORMS or not isinstance(l.get("q"), str) or not l["q"].strip() for l in links):
                err.append(f"{k}: 링크 없음 또는 플랫폼 키 틀림 - {name}")
            if not isinstance(name, str) or len(name) > 60 or not ID_RE.match(name):
                err.append(f"{k}: id 형식 틀림 - {name}")
            elif name in seen:
                err.append(f"{k}: id 중복 - {name}")
            else:
                seen.add(name)
            for l in langs:
                t = (x.get("text") or {}).get(l) or {}
                if not isinstance(t.get("title"), str) or not t["title"].strip() or not isinstance(t.get("summary"), str) or not t["summary"].strip():
                    err.append(f"{k}: {l} 제목/요약 없음 - {name}")
        for f in C.FIELDS:
            if sum(1 for x in c["items"] if x.get("field") == f) > C.MAX_PER_FIELD:
                err.append(f"{k}: {f} {C.MAX_PER_FIELD}개 초과")
        for cut in c.get("cut") or []:
            if not isinstance(cut, dict):
                err.append(f"{k}: 뺀 항목 형식 틀림(언어별 객체여야 함)")
                continue
            for l in langs:
                if not isinstance(cut.get(l), str) or not cut[l]:
                    err.append(f"{k}: 뺀 항목에 {l} 문구 없음")
    gh = d.get("github") or {}
    items = gh.get("items") or []
    if not gh.get("date"):
        err.append("github: date 없음")
    if len(items) != 10:
        err.append(f"github 항목이 10개가 아님({len(items)}개)")
    for g in items:
        if not REPO_RE.match(str(g.get("repo", ""))):
            err.append(f"github: repo 형식 틀림(owner/name) - {g.get('repo')}")
        if not all(isinstance(g.get(f), int) and not isinstance(g.get(f), bool) for f in ("stars", "today")):
            err.append(f"github: 숫자(stars, today)는 정수여야 함 - {g.get('repo')}")
        for l in langs:
            if not (g.get("desc") or {}).get(l):
                err.append(f"github: {l} 설명 없음 - {g.get('repo')}")
    return err
