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
    # 누적 기록은 복사본에 먼저 합치고, 사이트를 다 만든 뒤에만 바꿔 넣습니다.
    # 화면 생성 중 오류가 나도 data/issues·archive가 망가지지 않게 하기 위해서입니다.
    work = a.data / ".work"
    shutil.rmtree(work, ignore_errors=True)
    for sub in ("issues", "archive"):
        if (a.data / sub).exists():
            shutil.copytree(a.data / sub, work / sub)
    store.merge(latest, work)
    issues, archives = store.load_issues(work), store.load_archives(work)
    ps = write_site(a.out, latest, issues, archives)
    for sub in ("issues", "archive"):
        shutil.rmtree(a.data / sub, ignore_errors=True)
        (work / sub).rename(a.data / sub)
    shutil.rmtree(work)
    skipped = [x["id"] for c in latest["countries"].values() for x in c["items"] if not has_body(x)]
    print(f"검사 통과 ({latest['updated']}) · 페이지 {len(ps)}개 · 이슈 기록 {len(issues)}개")
    if skipped:
        print(f"본문 네 단락이 없어 개별 페이지를 건너뛴 이슈 {len(skipped)}개: {', '.join(skipped)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
