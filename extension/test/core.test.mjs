import { test } from "node:test";
import assert from "node:assert/strict";
import { pickLang, DEFAULTS, validFeed, inQuiet, pickAlerts, remember, badgeCount } from "../lib/core.js";

const it = (id, score, field = "tech") => ({ id, field, score, title: { en: id + " en", ko: id + " ko", ja: id, zh: id },
  url: { en: `https://gtdaily.news/en/issue/${id}/`, ko: `https://gtdaily.news/ko/issue/${id}/`, ja: "", zh: "" } });
const feed = (countries) => ({ updated: "2026-10-18T06:00:00+09:00", site: {}, countries });
const S = (o = {}) => ({ ...DEFAULTS, ...o });
const noon = new Date(2026, 9, 18, 12, 0);

test("language from browser", () => {
  assert.equal(pickLang("ko-KR"), "ko");
  assert.equal(pickLang("ja"), "ja");
  assert.equal(pickLang("zh-TW"), "zh");
  assert.equal(pickLang("fr-FR"), "en");
  assert.equal(pickLang(""), "en");
});

test("defaults", () => {
  assert.equal(DEFAULTS.notify, true);
  assert.equal(DEFAULTS.minScore, 8.5);
  assert.deepEqual(DEFAULTS.fields, ["tech", "politics", "culture", "incidents"]);
  assert.deepEqual(DEFAULTS.countries, ["korea", "usa", "japan", "china", "world"]);
  assert.equal(DEFAULTS.quiet, null);
});

test("bad feed is ignored", () => {
  assert.equal(validFeed(feed({ korea: [it("a", 9)] })), true);
  for (const bad of [null, {}, { countries: [] }, { updated: "x", countries: { korea: [{ id: 1 }] } }, "text"]) {
    assert.equal(validFeed(bad), false, JSON.stringify(bad));
  }
});

test("quiet hours boundaries", () => {
  const at = h => new Date(2026, 9, 18, Math.floor(h), Math.round((h % 1) * 60));
  assert.equal(inQuiet(at(23), [23, 7]), true);
  assert.equal(inQuiet(at(6.98), [23, 7]), true);
  assert.equal(inQuiet(at(7), [23, 7]), false);
  assert.equal(inQuiet(at(22.98), [23, 7]), false);
  assert.equal(inQuiet(at(3), null), false);
  assert.equal(inQuiet(at(13), [12, 14]), true);   // 자정을 넘지 않는 구간
  assert.equal(inQuiet(at(14), [12, 14]), false);
});

test("alerts filter by score, field, country and history", () => {
  const f = feed({ korea: [it("k1", 9.0), it("k2", 8.0), it("k3", 8.75, "politics")], usa: [it("u1", 9.5)] });
  let r = pickAlerts(f, S(), [], noon);
  assert.deepEqual(r.alerts.map(a => a.id), ["u1", "k1", "k3"]);
  assert.equal(r.more, 0);
  assert.equal(r.alerts[1].title, "k1 en");
  assert.equal(r.alerts[1].country, "korea");
  r = pickAlerts(f, S({ lang: "ko", fields: ["politics"] }), [], noon);
  assert.deepEqual(r.alerts.map(a => [a.id, a.title]), [["k3", "k3 ko"]]);
  r = pickAlerts(f, S({ countries: ["korea"] }), ["k1"], noon);
  assert.deepEqual(r.alerts.map(a => a.id), ["k3"]);
  assert.deepEqual(pickAlerts(f, S({ notify: false }), [], noon), { alerts: [], more: 0, record: ["u1", "k1", "k3"] });
});

test("more than three are grouped", () => {
  const f = feed({ korea: [it("a", 9.4), it("b", 9.3), it("c", 9.2), it("d", 9.1), it("e", 9.0)] });
  const r = pickAlerts(f, S(), [], noon);
  assert.deepEqual(r.alerts.map(a => a.id), ["a", "b"]);
  assert.equal(r.more, 3);
  assert.deepEqual(r.record.sort(), ["a", "b", "c", "d", "e"]);
});

test("quiet hours hold alerts without recording them", () => {
  const f = feed({ korea: [it("a", 9.4)] });
  const r = pickAlerts(f, S({ quiet: [23, 7] }), [], new Date(2026, 9, 18, 2, 0));
  assert.deepEqual(r, { alerts: [], more: 0, record: [] });
});

test("notified list is capped", () => {
  const old = Array.from({ length: 300 }, (_, i) => "o" + i);
  const r = remember(old, ["n1", "n2"]);
  assert.equal(r.length, 300);
  assert.deepEqual(r.slice(-2), ["n1", "n2"]);
  assert.equal(r[0], "o2");
  assert.deepEqual(remember(["a"], ["a", "b"]), ["a", "b"]);
});

test("badge counts unseen matching issues", () => {
  const f = feed({ korea: [it("a", 9), it("b", 8)], usa: [it("c", 8.6)] });
  assert.equal(badgeCount(f, S(), []), 2);
  assert.equal(badgeCount(f, S(), ["a"]), 1);
  assert.equal(badgeCount(f, S({ notify: false }), []), 2);   // 배지는 알림을 꺼도 보여 줍니다
  assert.equal(badgeCount(null, S(), []), 0);
});

test("screen strings have the same keys in every language", async () => {
  const { STR } = await import("../lib/strings.js");
  const keys = l => Object.keys(STR[l]).sort().join();
  assert.deepEqual(Object.keys(STR).sort(), ["en", "ja", "ko", "zh"]);
  for (const l of ["ko", "ja", "zh"]) assert.equal(keys(l), keys("en"), l);
});

test("alerts off still records matches so turning on later does not replay them", () => {
  const f = feed({ korea: [it("a", 9.4), it("b", 7)] });
  assert.deepEqual(pickAlerts(f, S({ notify: false }), [], noon), { alerts: [], more: 0, record: ["a"] });
});

test("feed validation rejects bad dates, titles and foreign links", () => {
  const ok = feed({ korea: [it("a", 9)] });
  assert.equal(validFeed(ok), true);
  assert.equal(validFeed({ ...ok, updated: "not a date" }), false);
  assert.equal(validFeed(feed({ korea: [{ ...it("a", 9), title: {} }] })), false);
  assert.equal(validFeed(feed({ korea: [{ ...it("a", 9), url: { en: "javascript:alert(1)" } }] })), false);
  assert.equal(validFeed(feed({ korea: [{ ...it("a", 9), url: { en: "https://evil.test/" } }] })), false);
});

test("only site links are opened", async () => {
  const { safeUrl } = await import("../lib/core.js");
  assert.equal(safeUrl("https://gtdaily.news/ko/issue/x/"), "https://gtdaily.news/ko/issue/x/");
  for (const bad of ["javascript:alert(1)", "https://gtdaily.news.evil.test/", "file:///etc/passwd", "", undefined]) {
    assert.equal(safeUrl(bad), "https://gtdaily.news/", String(bad));
  }
});
