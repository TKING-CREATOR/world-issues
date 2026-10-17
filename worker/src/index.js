// gtdaily.news: R2 버킷(SITE)에 올린 정적 사이트를 꺼내 보여 줍니다.
// 주소 → 파일 이름 규칙은 resolve()에 모아 두고 테스트합니다.

export function resolve(pathname) {
  let p;
  try { p = decodeURIComponent(pathname); } catch { return { notFound: true }; }
  const parts = p.split("/").slice(1);
  const dir = parts.length > 0 && parts[parts.length - 1] === "";
  const segs = dir ? parts.slice(0, -1) : parts;
  if (segs.some((s) => s === "" || s === "." || s === ".." || s.includes("\\"))) return { notFound: true };
  const key = segs.join("/");
  if (key === "_manifest.json") return { notFound: true };
  if (dir) return { key: key ? `${key}/index.html` : "index.html" };
  if (!segs[segs.length - 1].includes(".")) return { redirect: `/${key}/` };
  return { key };
}

export function cacheControl(key) {
  return /^(static|og)\//.test(key) ? "public, max-age=86400" : "public, max-age=300";
}

export function isPreview(host) {
  return host.endsWith(".workers.dev");
}

export default {
  async fetch(request, env) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405, headers: { allow: "GET, HEAD" } });
    }
    const url = new URL(request.url);
    const r = resolve(url.pathname);
    const headers = new Headers();
    if (isPreview(url.hostname)) headers.set("x-robots-tag", "noindex");
    if (r.redirect) {
      headers.set("location", `${url.origin}${r.redirect}${url.search}`);
      return new Response(null, { status: 301, headers });
    }
    const obj = r.key ? await env.SITE.get(r.key) : null;
    if (!obj) {
      headers.set("content-type", "text/plain; charset=utf-8");
      return new Response("404 Not Found", { status: 404, headers });
    }
    headers.set("content-type", obj.httpMetadata?.contentType || "application/octet-stream");
    headers.set("cache-control", cacheControl(r.key));
    if (obj.httpEtag) headers.set("etag", obj.httpEtag);
    return new Response(request.method === "HEAD" ? null : obj.body, { status: 200, headers });
  },
};
