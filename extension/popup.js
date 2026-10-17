// 팝업(popup.html)과 전체 보기(board.html)가 함께 씁니다. 전체 보기는 나라 5개를 한 화면에 놓습니다.
import { FEED_URL, DEFAULTS, COUNTRIES, pickLang, validFeed, remember } from "./lib/core.js";
import { STR } from "./lib/strings.js";

const $ = s => document.querySelector(s);
const full = document.body.classList.contains("full");
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
let S, t, feed, tab = "korea";

function open(url) { chrome.tabs.create({ url }); if (!full) window.close(); }

function list(items, country) {
  if (!items || !items.length) return `<p class="note">${esc(t.empty)}</p>`;
  return `<ul class="list">` + items.map(x => `<li class="${x.score >= S.minScore ? "hot" : ""}"><a href="#" data-url="${esc(x.url[S.lang] || x.url.en)}">
    <span class="score" style="--v:${x.score * 10}"><b>${x.score.toFixed(1)}</b></span>
    <span class="meta"><small style="--fc:var(--f-${esc(x.field)})"><i></i>${esc(t.fields[x.field] || x.field)}</small>
    <span>${esc(x.title[S.lang] || x.title.en)}</span></span></a></li>`).join("") + `</ul>`;
}

function render() {
  if (!feed) { $("#body").innerHTML = `<p class="note">${esc(t.loading)}</p>`; return; }
  const when = new Intl.DateTimeFormat(S.lang === "zh" ? "zh-CN" : S.lang, { dateStyle: "medium", timeStyle: "short" }).format(new Date(feed.updated));
  $("#when").textContent = t.updated.replace("{time}", when);
  if (full) {
    $("#body").innerHTML = `<div class="cols">` + COUNTRIES.map(c => `<section><h2 style="--ac:var(--a-${c})"><i></i>${esc(t.countries[c])}</h2>${list(feed.countries[c], c)}</section>`).join("") + `</div>`;
  } else {
    $("#tabs").innerHTML = COUNTRIES.map(c => `<button data-c="${c}" aria-selected="${c === tab}">${esc(t.countries[c])}</button>`).join("");
    $("#body").innerHTML = list(feed.countries[tab], tab);
  }
}

async function main() {
  const st = await chrome.storage.local.get(["settings", "cache", "seen"]);
  S = { ...DEFAULTS, lang: pickLang(chrome.i18n.getUILanguage()), ...(st.settings || {}) };
  t = STR[S.lang];
  document.documentElement.lang = S.lang === "zh" ? "zh-Hans" : S.lang;
  $("#site").firstChild.textContent = t.site;
  $("#notify-label").textContent = t.notify;
  $("#notify").checked = S.notify;
  $("#board").textContent = t.board;
  $("#site-btn").textContent = t.open_site;
  $("#opts").title = t.settings;
  feed = validFeed(st.cache) ? st.cache : null;
  render();
  try {
    const r = await fetch(FEED_URL, { cache: "no-store" });
    const f = await r.json();
    if (!validFeed(f)) throw new Error("bad feed");
    feed = f;
    chrome.storage.local.set({ cache: f });
  } catch (e) {
    if (feed) { $("#note").textContent = t.offline; $("#note").hidden = false; }
  }
  render();
  if (feed) {   // 팝업을 열었으면 지금 목록은 본 것으로 치고 아이콘 숫자를 지웁니다.
    const ids = Object.values(feed.countries).flat().map(x => x.id);
    chrome.storage.local.set({ seen: remember(st.seen || [], ids) });
    chrome.action.setBadgeText({ text: "" });
  }
}

document.addEventListener("click", e => {
  const a = e.target.closest("a[data-url]");
  if (a) { e.preventDefault(); open(a.dataset.url); return; }
  const b = e.target.closest("#tabs button");
  if (b) { tab = b.dataset.c; render(); }
});
$("#notify").addEventListener("change", async e => {
  S.notify = e.target.checked;
  await chrome.storage.local.set({ settings: S });
  chrome.runtime.sendMessage("check");
});
$("#opts").addEventListener("click", () => chrome.runtime.openOptionsPage());
$("#board").addEventListener("click", () => open(chrome.runtime.getURL("board.html")));
$("#site-btn").addEventListener("click", () => open(feed?.site?.[S.lang] || "https://gtdaily.news/"));
main();
