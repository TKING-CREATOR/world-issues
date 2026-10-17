// 서비스 워커: 한 시간마다 feed.json을 확인해 조건에 맞는 새 이슈를 알리고 아이콘 숫자를 갱신합니다.
import { FEED_URL, DEFAULTS, pickLang, validFeed, pickAlerts, remember, badgeCount } from "./lib/core.js";
import { STR } from "./lib/strings.js";

async function getSettings() {
  const { settings } = await chrome.storage.local.get("settings");
  return { ...DEFAULTS, lang: pickLang(chrome.i18n.getUILanguage()), ...(settings || {}) };
}

async function fetchFeed() {
  try {
    const r = await fetch(FEED_URL, { cache: "no-store" });
    if (!r.ok) return null;
    const f = await r.json();
    return validFeed(f) ? f : null;
  } catch (e) {
    return null;                       // 네트워크 오류·형식 오류는 조용히 넘기고 다음 확인을 기다립니다
  }
}

async function check({ seed = false } = {}) {
  const f = await fetchFeed();
  if (!f) return;
  const s = await getSettings();
  const { notified = [], seen = [] } = await chrome.storage.local.get(["notified", "seen"]);
  await chrome.storage.local.set({ cache: f });
  // 설치 직후에는 지금 있는 이슈를 알린 것으로만 기록해, 처음부터 알림이 쏟아지지 않게 합니다.
  const r = pickAlerts(f, seed ? { ...s, notify: true, quiet: null } : s, notified, new Date());
  if (!seed) {
    const t = STR[s.lang];
    for (const a of r.alerts) {
      chrome.notifications.create("issue:" + a.url, {
        type: "basic", iconUrl: "icons/128.png", priority: 1, message: a.title,
        title: t.notif_title.replace("{country}", t.countries[a.country]).replace("{score}", a.score.toFixed(1)),
      });
    }
    if (r.more) {
      chrome.notifications.create("board:" + Date.now(), { type: "basic", iconUrl: "icons/128.png", priority: 0,
        title: t.more_title.replace("{n}", r.more), message: t.site });
    }
  }
  if (r.record.length) await chrome.storage.local.set({ notified: remember(notified, r.record) });
  const n = badgeCount(f, s, seed ? [...seen, ...r.record] : seen);
  if (seed) await chrome.storage.local.set({ seen: remember(seen, r.record) });
  await chrome.action.setBadgeBackgroundColor({ color: "#0071e3" });
  await chrome.action.setBadgeText({ text: n ? String(n) : "" });
}

function schedule() {
  chrome.alarms.create("check", { periodInMinutes: 60, delayInMinutes: 1 });
}

chrome.runtime.onInstalled.addListener(({ reason }) => {
  schedule();
  if (reason === "install") {
    chrome.runtime.openOptionsPage();
    check({ seed: true });
  } else {
    check();
  }
});
chrome.runtime.onStartup.addListener(() => { schedule(); check(); });
chrome.alarms.onAlarm.addListener(a => { if (a.name === "check") check(); });
chrome.notifications.onClicked.addListener(id => {
  chrome.tabs.create({ url: id.startsWith("issue:") ? id.slice(6) : chrome.runtime.getURL("board.html") });
  chrome.notifications.clear(id);
});
chrome.runtime.onMessage.addListener(msg => { if (msg === "check") check(); });
