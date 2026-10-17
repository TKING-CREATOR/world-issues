# 오늘의 세계 이슈판 2단계 설계: 도메인, Cloudflare 이전, 클라우드 자동 갱신

작성일: 2026-10-17 · 앞 문서: `2026-10-17-world-issues-v2-design.md`(1단계)

## 목표

맥북이 꺼져 있어도 매일 06:00 KST에 갱신되고, 개인 도메인 `gtdaily.news`에서 몇 년 치 페이지를 지우지 않고 계속 쌓을 수 있게 한다.

성공 기준:
- 맥북을 끈 상태에서도 다음 날 06:00 갱신분이 사이트에 반영된다.
- 사이트가 Cloudflare Worker + R2에서 열리고, 파일 수가 2만 개를 넘어도 문제가 없다.
- 도메인 연결 뒤 대표 주소(canonical), 사이트맵, 피드, 공유 이미지가 모두 `https://gtdaily.news`를 가리킨다.
- 옛 주소 `tking-creator.github.io/world-issues/...`로 들어오면 같은 경로의 새 주소로 넘어간다.
- 저장소에 `site/`를 더 이상 커밋하지 않는다.

하지 않는 것: 후원·광고(3단계), 크롬 확장(4단계), 페이지 디자인 변경.

## 왜 Cloudflare Pages가 아니라 Worker + R2인가

Cloudflare Pages 무료는 사이트당 파일 2만 개(유료 10만 개)까지다. 지금 구조는 하루 200개 넘게 늘어서 몇 달 안에 넘는다. 오래된 페이지를 지우면 검색 유입이 줄어든다. R2(파일 저장소)에 페이지를 넣고 Worker가 꺼내 보여 주면 파일 수 제한이 사실상 없다. 무료 한도는 저장 10GB, R2 쓰기 월 100만 회, 읽기 월 1,000만 회, Worker 요청 하루 10만 건이다. 넘으면 Workers 유료($5/월)로 올린다.

## 1. 전체 흐름

```
06:00 KST  Claude 클라우드 루틴 ── 조사·한국어 원고·번역·검사 ──▶ data/latest.json 커밋, main에 push
                                                                     │
                                         (data/latest.json 변경이 트리거)
                                                                     ▼
           GitHub Actions deploy.yml ── build.py(누적 기록 갱신 + 사이트 생성)
                                     ├─ data/issues, data/archive 커밋 (트리거 경로가 아니라 다시 돌지 않음)
                                     ├─ deploy/sync.py ──▶ R2 버킷 gtdaily-site
                                     ├─ wrangler deploy ──▶ Worker gtdaily
                                     └─ GitHub Pages: 도메인 전엔 사이트 사본, 도메인 뒤엔 넘겨주기 페이지
```

### 1-1. 클라우드 루틴 (조사·번역)

- `routine-prompt.md` 하나에 지금의 `refresh-prompt.md`(한국어 원고)와 `translate-prompt.md`(번역) 순서를 이어 쓴다. 두 파일은 맥북 대체 실행용으로 남긴다.
- 루틴이 하는 일: `python3 build.py --list-ids`로 이어지는 이슈 id 확인 → `data/draft.json` 작성 → `python3 build.py --check data/draft.json --langs ko` → 번역해 `data/latest.json` 작성 → `python3 build.py --check data/latest.json` 통과 시에만 `data/latest.json` 하나만 커밋해 **main에 push**한다. 루틴은 기본이 `claude/` 브랜치라서 프롬프트에 main을 명시한다.
- 검사에는 파이썬 표준 라이브러리만 쓰므로 클라우드 환경에 따로 설치할 것이 없다.
- 일정: 매일 06:00 KST(UTC 21:00). 사용량은 지금처럼 구독 사용량에서 나간다.

### 1-2. GitHub Actions `deploy.yml` (생성·배포)

- 트리거: main에 `data/latest.json`, `gen/**`, `static/**`, `i18n/**`, `worker/**`, `deploy/**`, `build.py`가 바뀐 push, 그리고 수동 실행. `concurrency: deploy`, `cancel-in-progress: false`.
- 단계:
  1. 파이썬 3.12+, Pillow, boto3 설치. `fonts-noto-cjk` 설치(공유 이미지의 일본어·중국어 글꼴. `gen/og.py`는 이미 Noto CJK로 대체한다).
  2. `SITE_URL=${{ vars.SITE_URL }} python3 build.py` → `site/` 생성, `data/issues`·`data/archive` 갱신.
  3. 누적 기록이 바뀌었으면 `github-actions[bot]` 이름으로 커밋·push. 이 경로는 트리거에 없어서 다시 돌지 않는다.
  4. `python3 deploy/sync.py site gtdaily-site` → R2 동기화(2절).
  5. `wrangler deploy` → Worker 갱신(`worker/` 안 바뀌어도 매번 해도 무방).
  6. GitHub Pages 배포(3절).
- 저장소 변수 `SITE_URL`: 도메인 전엔 Worker 테스트 주소(`https://gtdaily.<계정>.workers.dev`), 도메인 연결 뒤 `https://gtdaily.news`. 이 값 하나로 대표 주소, 사이트맵, 공유 이미지 글씨, GitHub Pages 동작이 함께 바뀐다.
- 기존 `pages.yml`은 지운다(`site/`를 커밋하지 않으므로 더는 동작하지 않는다). `.gitignore`에 `site/`를 넣고 저장소에서 `site/`를 뺀다(`git rm -r --cached site`).

### 1-3. R2 동기화 `deploy/sync.py`

- R2에 `_manifest.json`({경로: sha256})을 둔다. 새 `site/`의 해시와 비교해 **바뀐 파일만** 올린다(S3 호환 API, boto3).
- 올리는 순서: ① 새로 생기거나 바뀐 파일 중 아래 "마지막 묶음"이 아닌 것 → ② 마지막 묶음(`index.html` 중 첫 화면·목록·날짜 모음, `sitemap*.xml`, `*/feed.xml`, `feed.json`, `robots.txt`) → ③ 새 `_manifest.json` → ④ 새 사이트에 없는 파일 삭제. 중간에 끊겨도 아직 없는 이슈 페이지를 가리키는 첫 화면이 먼저 올라가지 않는다. 다음 실행 때 해시 비교로 다시 맞춰진다.
  - 마지막 묶음 판별: 경로가 `{lang}/issue/` 아래가 아닌 HTML, 그리고 위 피드·사이트맵 파일. 판별은 순수 함수 `plan(old, new) -> (first, last, deletes)`로 두고 테스트한다.
- 파일 종류(Content-Type)는 확장자로 정한다: html, css, js, json, xml, png, txt.
- 필요한 비밀 값(GitHub Secrets): `CLOUDFLARE_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`.

### 1-4. Worker `worker/`

- `wrangler.toml`: 이름 `gtdaily`, R2 바인딩 `SITE` → 버킷 `gtdaily-site`. 도메인 연결 때 `routes = [{ pattern = "gtdaily.news", custom_domain = true }]`를 넣는다.
- 주소 처리(순수 함수 `resolve(pathname)`로 두고 `node --test`로 테스트):
  - `/` → `index.html`, `/ko/` → `ko/index.html`, `/ko/issue/x/` → `ko/issue/x/index.html`
  - 확장자 없는 경로이고 끝에 `/`가 없으면(`/ko`) → `/ko/`로 301
  - `..`, 빈 조각, `_manifest.json` → 404
  - R2에 없으면 `404.html`(없으면 짧은 글)과 상태 404
- 캐시: HTML·피드·사이트맵 `max-age=300`, `static/`·`og/` `max-age=86400`. `GET`·`HEAD`만 받는다.
- 도메인 연결 전 테스트 주소(`*.workers.dev`)로 들어온 요청에는 `X-Robots-Tag: noindex`를 붙여 검색엔진에 중복 사이트로 잡히지 않게 한다.
- 버킷은 첫 배포 때 `wrangler r2 bucket create gtdaily-site`(이미 있으면 통과)로 만든다. 비밀 값: `CLOUDFLARE_API_TOKEN`.

## 2. 옛 주소 넘겨주기 (GitHub Pages)

- 도메인 전(`SITE_URL`이 workers.dev): GitHub Pages에는 지금처럼 github.io용 사이트를 그대로 올린다. 같은 Actions에서 `SITE_URL=https://tking-creator.github.io/world-issues python3 build.py --render-only --out site-gh`로 한 번 더 만든다. `--render-only`는 누적 기록을 다시 쓰지 않고 페이지만 만든다.
- 도메인 뒤(`SITE_URL`이 `https://gtdaily.news`): GitHub Pages에는 `index.html`과 `404.html` 두 장만 올린다. 둘 다 `location.replace(새 주소 + 같은 경로·쿼리·해시)`로 넘기고, 자바스크립트가 꺼진 경우를 위해 `<meta http-equiv="refresh">`, `<link rel="canonical">`, 새 주소 링크를 함께 둔다. GitHub Pages는 서버 쪽 301을 지원하지 않으므로 이 방식이 최선이다.

## 3. 맥북 쪽 처리

- `refresh.sh`는 맥북 대체 실행용으로 남기되, 끝에서 `data/latest.json` 하나만 커밋해 push하도록 바꾼다(생성·배포는 Actions가 한다). 사이트 생성 검사는 지금처럼 로컬에서 먼저 돌려 본다(`--out` 임시 폴더).
- 클라우드 루틴을 만들고 **수동 실행 1회가 성공해 사이트에 반영되는 것을 확인하면** 맥북 예약(launchd)을 끈다(`launchctl bootout`, plist 파일은 남김). 1단계 대화에서는 3일 동안 둘 다 두기로 했으나, 맥북 쪽이 올리지 않는 상태로 돌면 사용량만 두 배로 쓰므로 바꾼다. 루틴이 실패하는 날이 생기면 plist로 다시 켠다.

## 4. 실패했을 때

| 상황 | 결과 |
|---|---|
| 루틴이 사용 한도·검색 실패로 끝나지 못함 | `latest.json`을 올리지 않는다. 사이트는 어제 내용 그대로 |
| 루틴 원고가 `--check` 실패 | 올리지 않는다 |
| Actions의 `build.py` 실패 | 누적 기록 커밋·R2·Pages 모두 건너뛴다. GitHub가 실패 메일을 보낸다 |
| R2 동기화 중간 끊김 | 첫 화면·목록이 마지막이라 깨진 링크가 없다. 다음 실행 때 맞춰진다 |
| 누적 기록 커밋 push 충돌(같은 시각 다른 push) | `git pull --rebase` 후 한 번 다시 시도, 그래도 실패하면 실패 처리 |
| 같은 날 두 번 실행 | 같은 id는 덮어쓴다. 중복 없음 |

## 5. 테스트

- `tests/test_sync.py`: `plan()`이 바뀐 파일만 고르고, 이슈 페이지를 먼저·첫 화면/사이트맵/피드를 나중에, 삭제를 맨 끝에 두는지. Content-Type 매핑.
- `worker/test/resolve.test.mjs`(`node --test`): 위 주소 처리 규칙 전부, `..`·`_manifest.json` 차단, workers.dev noindex 판정.
- `tests/test_build.py`: `--render-only`가 `data/issues`·`data/archive`를 건드리지 않는지. 넘겨주기 페이지 생성(`gen/redirect.py`)이 경로를 보존하는 스크립트와 canonical을 넣는지.
- 배포 뒤 확인: 테스트 주소에서 전체 내부 링크를 훑어 깨진 링크 0개, 404 페이지 상태 404, `X-Robots-Tag` 확인.

## 6. 사용자가 직접 할 일

1. Cloudflare 가입, Registrar에서 `gtdaily.news` 구입(결제).
2. Cloudflare에서 API 토큰 발급(권한: Account › Workers Scripts › Edit, Account › Workers R2 Storage › Edit, Zone › Workers Routes › Edit(도메인 뒤)), R2 API 토큰(Object Read & Write) 발급.
3. GitHub 저장소 Settings › Secrets and variables › Actions에 `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` 넣기. 값은 대화에 붙이지 않는다.
4. 클라우드 루틴 생성 때 GitHub 접근 허락.

1~3이 없어도 코드·테스트·문서는 먼저 만들 수 있다. 배포 단계(실제 R2·Worker·루틴)는 1~4가 끝난 뒤 사용자 확인을 받고 한다.

## 7. 작업 순서

1. 코드: `deploy/sync.py`, `worker/`, `gen/redirect.py`, `build.py --render-only`, `deploy.yml`, `routine-prompt.md`, `refresh.sh` 변경, 문서 갱신 — 모두 테스트와 함께. (사용자 없이 가능)
2. 비밀 값이 들어오면: 수동 실행으로 R2·Worker 첫 배포 → 테스트 주소 확인.
3. 루틴 생성 → 수동 실행 1회 → 사이트 반영 확인 → 맥북 예약 끄기.
4. 도메인 연결: `wrangler.toml`에 도메인 추가, 변수 `SITE_URL=https://gtdaily.news` → 대표 주소·사이트맵 전환, GitHub Pages는 넘겨주기 페이지로 → Search Console에 새 사이트맵 제출(사용자).
