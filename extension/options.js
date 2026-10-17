// 설정: 바꾸는 즉시 저장하고 배경에서 다시 확인하게 합니다.
import { DEFAULTS, FIELDS, COUNTRIES, pickLang } from "./lib/core.js";
import { STR } from "./lib/strings.js";

const $ = s => document.querySelector(s);
const QUIET = { none: null, "23-7": [23, 7], "22-8": [22, 8] };
let S;

function paint() {
  const t = STR[S.lang], f = $("#f");
  document.documentElement.lang = S.lang === "zh" ? "zh-Hans" : S.lang;
  document.title = t.opt_title;
  $("#title").textContent = t.opt_title;
  $("#welcome").textContent = t.opt_welcome;
  for (const [id, k] of [["l-lang", "opt_lang"], ["l-notify", "opt_notify"], ["l-min", "opt_min"], ["l-fields", "opt_fields"], ["l-countries", "opt_countries"], ["l-quiet", "opt_quiet"]]) $("#" + id).textContent = t[k];
  f.lang.value = S.lang;
  f.notify.checked = S.notify;
  f.minScore.innerHTML = [7.5, 8, 8.5, 9, 9.5].map(v => `<option value="${v}">${v.toFixed(1)}+</option>`).join("");
  f.minScore.value = String(S.minScore);
  $("#fields").innerHTML = FIELDS.map(k => `<label><input type="checkbox" name="field" value="${k}" ${S.fields.includes(k) ? "checked" : ""}>${t.fields[k]}</label>`).join("");
  $("#countries").innerHTML = COUNTRIES.map(k => `<label><input type="checkbox" name="country" value="${k}" ${S.countries.includes(k) ? "checked" : ""}>${t.countries[k]}</label>`).join("");
  f.quiet.innerHTML = `<option value="none">${t.quiet_none}</option><option value="23-7">${t.quiet_23_7}</option><option value="22-8">${t.quiet_22_8}</option>`;
  f.quiet.value = Object.keys(QUIET).find(k => JSON.stringify(QUIET[k]) === JSON.stringify(S.quiet)) || "none";
  $("#privacy").textContent = t.privacy;
  $("#privacy").href = `https://gtdaily.news/${S.lang}/privacy/`;
}

async function save() {
  const f = $("#f");
  S = { ...S, lang: f.lang.value, notify: f.notify.checked, minScore: Number(f.minScore.value), quiet: QUIET[f.quiet.value],
        fields: [...f.querySelectorAll("input[name=field]:checked")].map(x => x.value),
        countries: [...f.querySelectorAll("input[name=country]:checked")].map(x => x.value) };
  await chrome.storage.local.set({ settings: S });
  chrome.runtime.sendMessage("check");
  paint();
  $("#status").textContent = STR[S.lang].saved;
}

(async () => {
  const st = await chrome.storage.local.get(["settings", "welcomed"]);
  S = { ...DEFAULTS, lang: pickLang(chrome.i18n.getUILanguage()), ...(st.settings || {}) };
  if (!st.welcomed) { $("#welcome").hidden = false; chrome.storage.local.set({ welcomed: true }); }
  paint();
  $("#f").addEventListener("change", save);
})();
