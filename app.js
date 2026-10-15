// 화면 렌더링: 탭, 1위 리드 카드, 분야 필터, 이슈 카드
const CODES = {kr:"KR",us:"US",jp:"JP",cn:"CN",etc:"EU+",gh:"GH"};
const FLAGS = {kr:"🇰🇷",us:"🇺🇸",jp:"🇯🇵",cn:"🇨🇳",etc:"🌍",gh:"💻"};
const avg = s => s.reduce((a,b)=>a+b,0)/s.length;
const app = document.getElementById("app"), tabs = document.getElementById("tabs"), panel = document.getElementById("panel");
const keys = Object.keys(DATA), TABS = [...keys,"gh"];
let cur = "kr", filter = "all";
try{ const h = location.hash.slice(1); if(TABS.includes(h)) cur = h; else { const s = localStorage.getItem("issue-tab"); if(TABS.includes(s)) cur = s; } }catch(e){}
const esc = s => String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fcol = k => `var(${FIELDS.find(f=>f[0]===k)[2]})`;
const fname = k => FIELDS.find(f=>f[0]===k)[1];

document.getElementById("updated").textContent = "Daily Briefing · " + UPDATED;
const total = keys.reduce((n,k)=>n+DATA[k].items.length,0);
document.getElementById("stats").innerHTML =
  `<div><b>5</b><span>지역</span></div><div><b>${total}</b><span>선정 이슈</span></div><div><b>6.0</b><span>최저 기준점</span></div>`;

const ring = (v,cls="") => `<div class="ring ${cls}" style="--v:${(v*10).toFixed(0)}"><div class="in"><b>${v.toFixed(1)}</b><small>/ 10</small></div></div>`;
const crit = s => `<div class="critrow">${CRIT.map((k,j)=>`<div><span>${k}<em>${s[j]}</em></span><u><i style="width:${s[j]*10}%"></i></u></div>`).join("")}</div>`;
const pills = l => `<div class="pills">${l.map(x=>`<a class="pill ${x.c}" href="${x.url}" target="_blank" rel="noopener"><b>${x.p}</b><span>${esc(x.q)}</span></a>`).join("")}</div>`;
const srcLink = k => S[k] ? `<a class="src" href="${S[k][1]}" target="_blank" rel="noopener">출처 · ${esc(S[k][0])} ↗</a>` : "";

function renderTabs(){
  tabs.innerHTML = TABS.map(k=>`<button role="tab" id="tab-${k}" aria-selected="${k===cur}" data-k="${k}"><span class="code">${CODES[k]}</span><span class="flag" aria-hidden="true">${FLAGS[k]}</span>${k==="gh"?"깃허브":DATA[k].name}</button>`).join("");
  app.dataset.c = cur;
}
function renderGH(){
  const [top,...rest] = GH.items;
  const n = v => v.toLocaleString("ko-KR");
  const name = x => { const [o,r] = x.repo.split("/"); return `<a href="https://github.com/${x.repo}" target="_blank" rel="noopener"><span class="owner">${esc(o)} /</span> ${esc(r)}</a>`; };
  const meta = x => `<div class="ghmeta">${x.lang?`<span><i></i>${esc(x.lang)}</span>`:""}<span>★ ${n(x.stars)}</span><span class="up">+${n(x.today)} 오늘</span></div>`;
  let h = `<article class="lead rise">
    <div class="body">
      <div class="tagrow"><span class="crown">오늘 ${FLAGS.gh} 깃허브 트렌딩 1위</span></div>
      <h2>${name(top)}</h2>
      <p>${esc(top.d)}</p>
      ${meta(top)}
    </div>
    <div class="ghbig"><b>+${n(top.today)}</b><small>오늘 받은 별</small></div>
  </article>`;
  h += `<div class="filters"><span class="lbl">${GH.date} 기준 · 전체 언어 · GitHub 트렌딩 순서 그대로이며 점수는 매기지 않았습니다</span>` +
    `<span class="lbl" style="margin-left:auto">출처 · <a href="${GH.url}" target="_blank" rel="noopener">GitHub Trending</a></span></div>`;
  h += `<section class="field" style="--fc:var(--acc)"><div class="fhead"><h3>2~10위</h3><span>${rest.length}개</span></div><div class="grid">` +
    rest.map((x,i)=>`<article class="card rise" style="--fc:var(--acc);animation-delay:${i*40}ms">
      <span class="rank">${i+2}위</span>
      <h4>${name(x)}</h4>
      <p>${esc(x.d)}</p>
      ${meta(x)}
    </article>`).join("") + `</div></section>`;
  panel.innerHTML = h;
  panel.setAttribute("role","tabpanel"); panel.setAttribute("aria-labelledby","tab-gh");
}
function renderPanel(){
  if(cur==="gh") return renderGH();
  const c = DATA[cur];
  const sorted = [...c.items].sort((a,b)=>avg(b.s)-avg(a.s));
  const top = sorted[0];
  let h = `<article class="lead rise" style="--fc:${fcol(top.f)}">
    <div class="body">
      <div class="tagrow"><span class="crown">오늘 ${FLAGS[cur]} ${c.name}${c.sub?" ("+c.sub+")":""} 1위</span><span class="ftag" style="--fc:${fcol(top.f)}">${fname(top.f)}</span>${top.y?`<span class="youth">10~20대 트렌드</span>`:""}</div>
      <h2><a href="${top.l[0].url}" target="_blank" rel="noopener">${esc(top.t)}</a></h2>
      <p>${esc(top.d)}</p>
      ${pills(top.l)}
      ${crit(top.s)}
    </div>
    ${ring(avg(top.s))}
  </article>`;
  h += `<div class="filters" role="group" aria-label="분야 필터"><span class="lbl">분야</span>` +
    `<button class="chip" data-f="all" aria-pressed="${filter==="all"}">전체 <small>${c.items.length}</small></button>` +
    FIELDS.map(([k,n,v])=>`<button class="chip" data-f="${k}" aria-pressed="${filter===k}" style="--fc:var(${v})"><i></i>${n} <small>${c.items.filter(x=>x.f===k).length}</small></button>`).join("") +
    `<span class="lbl" style="margin-left:auto">분석 플랫폼 · ${c.plats.map(p=>`<a href="${p[1]}" target="_blank" rel="noopener">${p[0]}</a>`).join(", ")}</span></div>`;
  for(const [fk,fn,fv] of FIELDS){
    if(filter!=="all" && filter!==fk) continue;
    const list = sorted.filter(x=>x.f===fk);
    h += `<section class="field" style="--fc:var(${fv})"><div class="fhead"><h3>${fn}</h3><span>${list.length}건</span><hr></div>`;
    if(!list.length){ h += `<div class="empty">오늘 6.0점을 넘는 ${fn} 이슈를 찾지 못했습니다.</div></section>`; continue; }
    h += `<div class="grid">` + list.map((x,n)=>`<article class="card rise" style="animation-delay:${n*40}ms">
      <div class="ctop"><div style="display:flex;flex-direction:column;gap:8px"><span class="rank">${fn} ${n+1}위</span><span class="tagline"><span class="ftag">${fn}</span>${x.y?`<span class="youth">10~20대 트렌드</span>`:""}</span></div>${ring(avg(x.s))}</div>
      <h4><a href="${x.l[0].url}" target="_blank" rel="noopener">${esc(x.t)}</a></h4>
      <p>${esc(x.d)}</p>
      ${crit(x.s)}
      ${pills(x.l)}
      ${srcLink(x.src)}
    </article>`).join("") + `</div></section>`;
  }
  if(c.cut && c.cut.length) h += `<details class="cut"><summary>점수 미달로 뺀 항목 ${c.cut.length}개 보기</summary><ul>${c.cut.map(t=>`<li>${esc(t)}</li>`).join("")}</ul></details>`;
  panel.innerHTML = h;
  panel.setAttribute("role","tabpanel"); panel.setAttribute("aria-labelledby","tab-"+cur);
}
tabs.addEventListener("click",e=>{const b=e.target.closest("button"); if(!b) return; cur=b.dataset.k; filter="all"; try{localStorage.setItem("issue-tab",cur)}catch(_){} renderTabs(); renderPanel();});
panel.addEventListener("click",e=>{const b=e.target.closest(".chip"); if(!b) return; filter=b.dataset.f; renderPanel();});
renderTabs(); renderPanel();
