// 탭 전환, 분야 필터, 고른 언어 기억, 내 시간 기준 갱신 시각, 루트에서 언어 안내. 스크립트가 없어도 페이지는 읽힙니다.
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
                  set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };

  const app = $("#app"), tabs = $$(".seg a[data-k]");
  function show(k) {
    const p = $("#p-" + k);
    if (!p) return false;
    $$(".panel").forEach(x => { x.hidden = x !== p; });
    tabs.forEach(t => t.setAttribute("aria-selected", String(t.dataset.k === k)));
    app.dataset.c = p.dataset.accent;
    return true;
  }
  tabs.forEach(t => t.addEventListener("click", e => {
    if (!show(t.dataset.k)) return;          // 날짜 페이지 등 패널이 없으면 모음 페이지로 이동
    e.preventDefault();
    history.replaceState(null, "", "#" + t.dataset.k);
    store.set("issue-tab", t.dataset.k);
  }));
  const h = location.hash.slice(1);
  if (!(h && show(h))) { const s = store.get("issue-tab"); if (s) show(s); }

  document.addEventListener("click", e => {
    const b = e.target.closest(".chip[data-f]");
    if (!b) return;
    const panel = b.closest(".panel");
    $$(".chip[data-f]", panel).forEach(c => c.setAttribute("aria-pressed", String(c === b)));
    $$("section.field[data-f]", panel).forEach(s => { s.hidden = b.dataset.f !== "all" && s.dataset.f !== b.dataset.f; });
  });

  $$(".langmenu a[data-lang]").forEach(a => a.addEventListener("click", () => store.set("lang", a.dataset.lang)));

  const u = $("[data-updated]");
  if (u) {
    try {
      const d = new Date(u.dataset.updated);
      const hours = Math.max(0, Math.round((Date.now() - d) / 36e5));
      const time = new Intl.DateTimeFormat(document.documentElement.lang, { dateStyle: "medium", timeStyle: "short" }).format(d);
      u.textContent = u.dataset.tpl.replace("{time}", time).replace("{n}", hours);
    } catch (e) {}                            // 실패하면 서버에서 넣은 서울 시각 문구가 그대로 남습니다
  }

  const sug = $("#lang-suggest");
  if (sug) {
    const want = store.get("lang") || (navigator.language || "").slice(0, 2).toLowerCase();
    const a = $(`a[data-lang="${want}"]`, sug);
    if (a) { a.hidden = false; sug.hidden = false; }
  }
})();
