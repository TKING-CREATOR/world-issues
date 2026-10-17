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
        x_default = abs_url("en", path)
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
        top = sorted(c["items"], key=lambda x: -avg(x["scores"]))[:10]  # 크롬 확장 알림 후보까지
        out["countries"][slug] = [{
            "id": x["id"], "field": x["field"], "score": round(avg(x["scores"]), 1),
            "title": {l: x["text"][l]["title"] for l in C.LANGS},
            "url": {l: abs_url(l, f"issue/{x['id']}/") if has_body(x) else abs_url(l) for l in C.LANGS},
        } for x in top]
    return json.dumps(out, ensure_ascii=False)
