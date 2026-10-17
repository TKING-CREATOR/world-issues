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
    # 애드센스 번호가 있을 때만 광고 칸을 채웁니다. 없으면 빈 칸이라 CSS(.slot:empty)로 숨겨집니다.
    ad = (f'<ins class="adsbygoogle" style="display:block" data-ad-client="{C.ADSENSE_CLIENT}" data-ad-format="auto"'
          ' data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({});</script>') if C.ADSENSE_CLIENT else ""
    return f'<div class="slot" data-slot="{name}">{ad}</div>'


def support(lang):
    return f'<a class="kofi" href="{C.KOFI_URL}" target="_blank" rel="noopener">☕ {esc(T(lang)["support"])}</a>'


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
    nav = "".join(f'<a href="{href(lang, k + "/")}">{esc(v)}</a>' for k, v in t["info_nav"].items())
    return (f'<footer class="method">{cols}<p class="disclaimer">{esc(t["disclaimer"])}</p>'
            f'<div class="footbar"><nav class="footlinks">{nav}</nav>{support(lang)}</div></footer>')


def shell(lang, path, title, desc, body, *, accent="kr", og="home", data=(), root=False, og_type="website", ads=True):
    t = T(lang)
    can = abs_url(lang, path)
    alts = "".join(f'<link rel="alternate" hreflang="{LANG_TAG[l]}" href="{abs_url(l, path)}">' for l in C.LANGS)
    alts += f'<link rel="alternate" hreflang="x-default" href="{abs_url("en", path)}">'
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
            + (f'<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client={C.ADSENSE_CLIENT}" crossorigin="anonymous"></script>'
               if ads and C.ADSENSE_CLIENT else "")
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
