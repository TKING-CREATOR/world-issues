// static/app.js의 nextRefresh()를 브라우저 없이 확인합니다.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const doc = { documentElement: { lang: "ko" }, querySelector: () => null, querySelectorAll: () => [], addEventListener() {} };
const ctx = vm.createContext({ document: doc, location: { hash: "" }, history: {}, navigator: {}, localStorage: null, setInterval() {} });
vm.runInContext(readFileSync(new URL("../static/app.js", import.meta.url), "utf8"), ctx);
const H = 36e5, at = s => Date.parse(s);

test("next 06:00 KST later the same day", () => {
  const r = ctx.nextRefresh(at("2026-10-17T19:30:00+09:00"), at("2026-10-17T18:00:00+09:00"), [6, 18]);
  assert.equal(r.next, at("2026-10-18T06:00:00+09:00"));
  assert.equal(r.left, 10.5 * H);
  assert.equal(r.running, false);
  assert.ok(Math.abs(r.progress - 1.5 / 12) < 1e-9);
});

test("just before 06:00 KST", () => {
  const r = ctx.nextRefresh(at("2026-10-18T05:59:00+09:00"), at("2026-10-17T18:00:00+09:00"), [6, 18]);
  assert.equal(r.next, at("2026-10-18T06:00:00+09:00"));
  assert.equal(r.running, false);
});

test("after 06:00 with yesterday's data means updating", () => {
  const r = ctx.nextRefresh(at("2026-10-18T06:20:00+09:00"), at("2026-10-17T18:05:00+09:00"), [6, 18]);
  assert.equal(r.running, true);
  assert.equal(r.next, at("2026-10-18T18:00:00+09:00"));
});

test("stale data long after 06:00 is not shown as updating forever", () => {
  const r = ctx.nextRefresh(at("2026-10-18T12:00:00+09:00"), at("2026-10-17T18:05:00+09:00"), [6, 18]);
  assert.equal(r.running, false);
});

test("morning update counts down to the evening one", () => {
  const r = ctx.nextRefresh(at("2026-10-18T09:00:00+09:00"), at("2026-10-18T06:10:00+09:00"), [6, 18]);
  assert.equal(r.next, at("2026-10-18T18:00:00+09:00"));
  assert.equal(r.running, false);
});
