# 게시본용 한 파일 만들기: index.html에 styles.css, data.js, app.js를 넣어 dist/world-issues.html로 저장합니다.
# 합치기 전에 data.js가 형식에 맞는지 node로 검사하고, 문제가 있으면 멈춥니다.
import pathlib, subprocess, sys

root = pathlib.Path(__file__).resolve().parent
read = lambda n: (root / n).read_text(encoding="utf-8")

CHECK = r"""
const fs = require("fs");
eval(fs.readFileSync(process.argv[1], "utf8") + ";globalThis.__d={UPDATED,DATA,S,GH,FIELDS,CRIT};");
const {UPDATED,DATA,S,GH} = globalThis.__d, err = [];
if (!UPDATED) err.push("UPDATED 없음");
for (const k of ["kr","us","jp","cn","etc"]) {
  const c = DATA[k];
  if (!c || !c.items || !c.items.length) { err.push(k + ": 항목 없음"); continue; }
  for (const x of c.items) {
    const avg = x.s.reduce((a,b)=>a+b,0) / x.s.length;
    if (x.s.length !== 4) err.push(k + ": 점수 4개 아님 - " + x.t);
    if (avg < 6) err.push(k + ": 6.0 미만 - " + x.t);
    if (!S[x.src]) err.push(k + ": 출처 키 없음 - " + x.t);
    if (!x.l || !x.l.length) err.push(k + ": 링크 없음 - " + x.t);
  }
  for (const f of ["tech","pol","cul","acc"]) if (c.items.filter(x=>x.f===f).length > 10) err.push(k + ": " + f + " 10개 초과");
}
if (!GH || GH.items.length !== 10) err.push("GH 항목이 10개가 아님");
if (err.length) { console.error(err.join("\n")); process.exit(1); }
console.log("data.js 검사 통과 (" + UPDATED + ")");
"""
r = subprocess.run(["node", "-e", CHECK, str(root / "data.js")])
if r.returncode: sys.exit("data.js 검사 실패")

html = read("index.html")
html = html.replace('<link rel="stylesheet" href="styles.css">', "<style>\n" + read("styles.css") + "</style>")
html = html.replace('<script src="data.js"></script>\n<script src="app.js"></script>',
                    "<script>\n" + read("data.js") + "\n" + read("app.js") + "</script>")
assert 'href="styles.css"' not in html and 'src="data.js"' not in html, "index.html 구조가 바뀌어 합치지 못했습니다"
out = root / "dist" / "world-issues.html"
out.parent.mkdir(exist_ok=True)
out.write_text(html, encoding="utf-8")
print("만듦:", out)
