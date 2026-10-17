# 나라별 최신 기사 목록 모으기: 언론사·구글 뉴스·구글 트렌드의 공개 RSS를 읽어 data/feeds.json을 만듭니다.
# 갱신 프롬프트는 이 목록에서 이슈 후보를 고릅니다. 로그인이나 화면 긁기 없이 공개 피드만 씁니다.
import datetime as dt
import email.utils
import html
import re
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor

# (나라, 이름, 주소, 종류) — 종류 news: 기사 목록, trends: 구글 트렌드 급상승 검색어
FEEDS = [
    ("korea", "연합뉴스", "https://www.yna.co.kr/rss/news.xml", "news"),
    ("korea", "조선일보", "https://www.chosun.com/arc/outboundfeeds/rss/?outputType=xml", "news"),
    ("korea", "매일경제", "https://www.mk.co.kr/rss/30000001/", "news"),
    ("korea", "SBS", "https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=01", "news"),
    ("korea", "Google News KR", "https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko", "news"),
    ("korea", "Google Trends KR", "https://trends.google.com/trending/rss?geo=KR", "trends"),
    ("usa", "NYT", "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml", "news"),
    ("usa", "CBS News", "https://www.cbsnews.com/latest/rss/main", "news"),
    ("usa", "NPR", "https://feeds.npr.org/1001/rss.xml", "news"),
    ("usa", "Reddit r/news", "https://www.reddit.com/r/news/top/.rss?t=day", "news"),
    ("usa", "Google News US", "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en", "news"),
    ("usa", "Google Trends US", "https://trends.google.com/trending/rss?geo=US", "trends"),
    ("japan", "Yahoo!ニュース", "https://news.yahoo.co.jp/rss/topics/top-picks.xml", "news"),
    ("japan", "Google News JP", "https://news.google.com/rss?hl=ja&gl=JP&ceid=JP:ja", "news"),
    ("japan", "Google Trends JP", "https://trends.google.com/trending/rss?geo=JP", "trends"),
    ("china", "SCMP China", "https://www.scmp.com/rss/4/feed", "news"),
    ("china", "Google News CN", "https://news.google.com/rss?hl=zh-CN&gl=CN&ceid=CN:zh-Hans", "news"),
    ("china", "What's on Weibo", "https://www.whatsonweibo.com/feed/", "news"),
    ("world", "BBC World", "https://feeds.bbci.co.uk/news/world/rss.xml", "news"),
    ("world", "Guardian World", "https://www.theguardian.com/world/rss", "news"),
    ("world", "Euronews", "https://www.euronews.com/rss", "news"),
    ("world", "DW", "https://rss.dw.com/rdf/rss-en-all", "news"),
    ("world", "Al Jazeera", "https://www.aljazeera.com/xml/rss/all.xml", "news"),
    ("world", "Google Trends GB", "https://trends.google.com/trending/rss?geo=GB", "trends"),
]
HOURS = 36            # 이 시간 안의 기사만 남깁니다
PER_FEED = 40
UA = "Mozilla/5.0 (compatible; gtdaily-feeds/1.0; +https://gtdaily.news)"


def _local(tag):
    return tag.rsplit("}", 1)[-1]


def _child(el, name):
    return next((c for c in el if _local(c.tag) == name), None)


def _text(el, name):
    c = _child(el, name)
    return (c.text or "").strip() if c is not None else ""


def _time(el):
    for name in ("pubDate", "published", "updated", "date"):
        s = _text(el, name)
        if not s:
            continue
        try:
            d = email.utils.parsedate_to_datetime(s) if name == "pubDate" else dt.datetime.fromisoformat(s.replace("Z", "+00:00"))
        except (TypeError, ValueError):
            return None
        if d.tzinfo is None:
            d = d.replace(tzinfo=dt.timezone.utc)
        return d.astimezone(dt.timezone.utc).isoformat()
    return None


def _clean(s, n=200):
    s = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html.unescape(s))).strip()
    return s[:n]


def parse(body, kind="news"):
    root = ET.fromstring(body)
    out = []
    for el in root.iter():
        if _local(el.tag) not in ("item", "entry"):
            continue
        link = _child(el, "link")
        url = ((link.get("href") or link.text or "").strip()) if link is not None else ""
        x = {"title": _clean(_text(el, "title"), 300), "url": url, "time": _time(el)}
        if kind == "trends":
            x["traffic"] = _text(el, "approx_traffic")
            x["news"] = [{"title": _clean(_text(n, "news_item_title"), 300), "url": _text(n, "news_item_url"),
                          "source": _text(n, "news_item_source")} for n in el if _local(n.tag) == "news_item"]
        else:
            x["desc"] = _clean(_text(el, "description") or _text(el, "summary"))
        out.append(x)
    return out


def collect(fetch, now, feeds=FEEDS):
    since = now - dt.timedelta(hours=HOURS)
    res = {"collected": now.isoformat(), "countries": {c: {"news": [], "trends": []} for c in dict.fromkeys(f[0] for f in feeds)}, "errors": []}

    def one(f):
        try:
            return f, parse(fetch(f[2]), f[3])
        except Exception:
            return f, None

    seen = set()
    with ThreadPoolExecutor(8) as ex:
        for (country, name, _url, kind), items in ex.map(one, feeds):
            if items is None:
                res["errors"].append(name)
                continue
            keep = []
            for x in items:
                key = (country, kind, x["title"] if kind == "trends" else x["url"])  # 트렌드 항목은 주소가 모두 같아 검색어로 구분
                if not x["time"] or dt.datetime.fromisoformat(x["time"]) < since or not x["url"] or key in seen:
                    continue
                seen.add(key)
                keep.append({"source": name, **x})
            res["countries"][country][kind] += keep[:PER_FEED]
    for c in res["countries"].values():
        c["news"].sort(key=lambda x: x["time"], reverse=True)
    return res


def fetch_url(url):
    import urllib.request
    return urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=20).read()
