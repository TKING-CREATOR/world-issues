import { test } from "node:test";
import assert from "node:assert/strict";
import worker, { resolve, cacheControl, isPreview } from "../src/index.js";

test("maps directories to index.html", () => {
  assert.deepEqual(resolve("/"), { key: "index.html" });
  assert.deepEqual(resolve("/ko/"), { key: "ko/index.html" });
  assert.deepEqual(resolve("/ko/issue/x-y/"), { key: "ko/issue/x-y/index.html" });
  assert.deepEqual(resolve("/static/app.js"), { key: "static/app.js" });
  assert.deepEqual(resolve("/sitemap-1.xml"), { key: "sitemap-1.xml" });
});

test("adds trailing slash to extensionless paths", () => {
  assert.deepEqual(resolve("/ko"), { redirect: "/ko/" });
  assert.deepEqual(resolve("/en/issue/abc"), { redirect: "/en/issue/abc/" });
});

test("decodes percent-encoding", () => {
  assert.deepEqual(resolve("/ko/issue/%61bc/"), { key: "ko/issue/abc/index.html" });
});

test("blocks traversal and manifest", () => {
  for (const p of ["/../x", "/ko/../_manifest.json", "/_manifest.json", "//etc", "/%2e%2e/x", "/a/./b", "/%zz"]) {
    assert.deepEqual(resolve(p), { notFound: true }, p);
  }
});

test("cache times", () => {
  assert.equal(cacheControl("ko/index.html"), "public, max-age=300");
  assert.equal(cacheControl("sitemap.xml"), "public, max-age=300");
  assert.equal(cacheControl("static/styles.css"), "public, max-age=86400");
  assert.equal(cacheControl("og/en-home.png"), "public, max-age=86400");
});

test("preview host detection", () => {
  assert.equal(isPreview("gtdaily.abc.workers.dev"), true);
  assert.equal(isPreview("gtdaily.news"), false);
});

const bucket = (files) => ({
  async get(key) {
    if (!(key in files)) return null;
    return { body: files[key], httpMetadata: { contentType: "text/html; charset=utf-8" }, httpEtag: '"e"' };
  },
});

test("fetch serves files, 404s, redirects, noindex on preview", async () => {
  const env = { SITE: bucket({ "ko/index.html": "<p>ko</p>" }) };
  let r = await worker.fetch(new Request("https://gtdaily.news/ko/"), env);
  assert.equal(r.status, 200);
  assert.equal(await r.text(), "<p>ko</p>");
  assert.equal(r.headers.get("cache-control"), "public, max-age=300");
  assert.equal(r.headers.get("x-robots-tag"), null);
  r = await worker.fetch(new Request("https://gtdaily.news/ko?x=1"), env);
  assert.equal(r.status, 301);
  assert.equal(r.headers.get("location"), "https://gtdaily.news/ko/?x=1");
  r = await worker.fetch(new Request("https://gtdaily.news/nope/"), env);
  assert.equal(r.status, 404);
  r = await worker.fetch(new Request("https://gtdaily.news/ko/", { method: "POST" }), env);
  assert.equal(r.status, 405);
  r = await worker.fetch(new Request("https://gtdaily.a.workers.dev/ko/"), env);
  assert.equal(r.headers.get("x-robots-tag"), "noindex");
  r = await worker.fetch(new Request("https://gtdaily.news/ko/", { method: "HEAD" }), env);
  assert.equal(r.status, 200);
  assert.equal(await r.text(), "");
});
