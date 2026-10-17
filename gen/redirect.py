# 도메인을 옮긴 뒤 GitHub Pages(옛 주소)에 올리는 넘겨주기 페이지.
# GitHub Pages는 서버 쪽 301을 못 하므로, 같은 경로·쿼리·해시를 붙여 새 주소로 바로 보냅니다.
import json, pathlib, sys
from html import escape


def page(new_base, old_prefix):
    b = new_base.rstrip("/")
    js = lambda s: json.dumps(s).replace("<", "\\u003c")
    u = escape(b + "/", quote=True)
    return ("<!doctype html><html><head><meta charset=\"utf-8\">"
            "<meta name=\"robots\" content=\"noindex\">"
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
