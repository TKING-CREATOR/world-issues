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
            f'{esc(t["updated_kst"].format(time=seoul(up, lang)))}</div>'
            f'<div class="next" data-next data-hour="{C.REFRESH_HOUR_KST}" data-since="{up}" data-tpl="{esc(t["next_in"])}"'
            f' data-running="{esc(t["next_running"])}"><span class="next-txt">{esc(t["next_static"])}</span>'
            f'<span class="next-bar" aria-hidden="true"><i></i></span></div><h1>{esc(h1)}</h1><p>{esc(intro)}</p></div>'
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
