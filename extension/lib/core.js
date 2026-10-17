// 확장의 판단 로직(순수 함수). 크롬 API를 쓰지 않아 node --test로 검사합니다.

export const FEED_URL = "https://gtdaily.news/feed.json";
export const FIELDS = ["tech", "politics", "culture", "incidents"];
export const COUNTRIES = ["korea", "usa", "japan", "china", "world"];
export const DEFAULTS = { lang: null, notify: true, minScore: 8.5, fields: FIELDS, countries: COUNTRIES, quiet: null };

export function pickLang(ui) {
  const p = String(ui || "").toLowerCase().slice(0, 2);
  return ["ko", "ja", "zh"].includes(p) ? p : "en";
}

const SITE = "https://gtdaily.news/";

// 사이트 주소가 아니면 첫 화면으로 바꿉니다(javascript:·다른 도메인 링크 차단).
export function safeUrl(u) {
  return typeof u === "string" && u.startsWith(SITE) ? u : SITE;
}

export function validFeed(f) {
  if (!f || typeof f !== "object" || typeof f.updated !== "string" || Number.isNaN(Date.parse(f.updated))) return false;
  if (!f.countries || typeof f.countries !== "object" || Array.isArray(f.countries)) return false;
  return Object.values(f.countries).every(list => Array.isArray(list) && list.every(x =>
    x && typeof x.id === "string" && typeof x.score === "number" && FIELDS.includes(x.field)
    && x.title && typeof x.title.en === "string" && x.url && typeof x.url.en === "string" && x.url.en.startsWith(SITE)));
}

// quiet: null 또는 [시작 시, 끝 시](기기 현지 시각). 시작은 포함, 끝은 제외. 자정을 넘을 수 있습니다.
export function inQuiet(date, quiet) {
  if (!quiet) return false;
  const [a, b] = quiet, h = date.getHours();
  return a <= b ? h >= a && h < b : h >= a || h < b;
}

function matches(f, s) {
  const out = [];
  for (const [country, list] of Object.entries(f.countries)) {
    if (!s.countries.includes(country)) continue;
    for (const x of list) if (x.score >= s.minScore && s.fields.includes(x.field)) out.push({ ...x, country });
  }
  return out.sort((a, b) => b.score - a.score);
}

export function pickAlerts(f, s, notified, now) {
  const none = { alerts: [], more: 0, record: [] };
  if (!validFeed(f)) return none;
  const fresh = matches(f, s).filter(x => !notified.includes(x.id));
  // 알림을 꺼 둔 동안 나온 이슈도 기록해, 나중에 켰을 때 지난 이슈가 몰려오지 않게 합니다.
  if (!s.notify) return { ...none, record: fresh.map(x => x.id) };
  if (inQuiet(now, s.quiet)) return none;
  const lang = s.lang || "en";
  const shown = fresh.length > 3 ? fresh.slice(0, 2) : fresh;
  return {
    alerts: shown.map(x => ({ id: x.id, title: x.title[lang] || x.title.en, url: safeUrl(x.url[lang] || x.url.en), score: x.score, country: x.country })),
    more: fresh.length - shown.length,
    record: fresh.map(x => x.id),
  };
}

export function remember(notified, ids, cap = 300) {
  const merged = [...notified.filter(x => !ids.includes(x)), ...ids];
  return merged.slice(-cap);
}

export function badgeCount(f, s, seenIds) {
  if (!validFeed(f)) return 0;
  return matches(f, s).filter(x => !seenIds.includes(x.id)).length;
}
