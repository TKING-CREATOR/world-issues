# site/를 Cloudflare R2 버킷에 맞춥니다. 바뀐 파일만 올리고, 첫 화면·목록·피드·사이트맵은 마지막에,
# 지울 파일은 맨 끝에 지웁니다. 중간에 끊겨도 아직 없는 이슈 페이지를 가리키는 목록이 먼저 올라가지 않게 하기 위해서입니다.
import hashlib, json, os, pathlib, sys

MANIFEST = "_manifest.json"
_TYPES = {".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json",
          ".xml": "application/xml", ".txt": "text/plain", ".png": "image/png"}
_LAST_FILES = {"feed.json", "robots.txt"}


def hash_tree(root):
    root = pathlib.Path(root)
    return {p.relative_to(root).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in sorted(root.rglob("*")) if p.is_file() and p.name != ".nojekyll"}


def is_last(path):
    name = path.rsplit("/", 1)[-1]
    if path.endswith(".html"):
        return "/issue/" not in path
    return name in _LAST_FILES or name.endswith("feed.xml") or name.startswith("sitemap")


def plan(old, new):
    changed = sorted(p for p, h in new.items() if old.get(p) != h)
    return ([p for p in changed if not is_last(p)], [p for p in changed if is_last(p)],
            sorted(p for p in old if p not in new))


def content_type(path):
    if path.endswith("feed.xml"):
        return "application/rss+xml; charset=utf-8"
    t = _TYPES.get(pathlib.PurePosixPath(path).suffix, "application/octet-stream")
    return t + "; charset=utf-8" if t.startswith(("text/", "application/j", "application/x")) else t


def main(argv=None):
    import boto3
    site, bucket = argv or sys.argv[1:3]
    s3 = boto3.client("s3", region_name="auto",
                      endpoint_url=f"https://{os.environ['CLOUDFLARE_ACCOUNT_ID']}.r2.cloudflarestorage.com",
                      aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
                      aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"])
    try:
        old = json.loads(s3.get_object(Bucket=bucket, Key=MANIFEST)["Body"].read())
    except s3.exceptions.NoSuchKey:
        old = {}
    new = hash_tree(site)
    first, last, deletes = plan(old, new)
    for p in first + last:
        s3.upload_file(str(pathlib.Path(site) / p), bucket, p, ExtraArgs={"ContentType": content_type(p)})
    s3.put_object(Bucket=bucket, Key=MANIFEST, Body=json.dumps(new).encode(), ContentType="application/json")
    for i in range(0, len(deletes), 1000):
        s3.delete_objects(Bucket=bucket, Delete={"Objects": [{"Key": k} for k in deletes[i:i + 1000]]})
    print(f"R2 동기화: 올림 {len(first) + len(last)}개 · 지움 {len(deletes)}개 · 전체 {len(new)}개")
    return 0


if __name__ == "__main__":
    sys.exit(main())
