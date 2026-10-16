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
