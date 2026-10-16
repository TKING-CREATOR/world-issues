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
