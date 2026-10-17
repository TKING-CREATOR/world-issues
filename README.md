# 오늘의 세계 이슈판

한국, 미국, 일본, 중국, 유럽에서 그날 SNS에서 화제가 된 이슈를 기술·경제, 정치, 문화·사회, 사건사고로 나눠 점수순으로 보여주는 다국어(영어·한국어·일본어·중국어) 사이트입니다. 깃허브 트렌딩 상위 10개도 함께 보여줍니다.

- 사이트: https://tking-creator.github.io/world-issues/ (영어 기본, `/ko/`, `/ja/`, `/zh/`)
- 저장소: https://github.com/TKING-CREATOR/world-issues
- 설계: `docs/superpowers/specs/2026-10-17-world-issues-v2-design.md`(1단계), `docs/superpowers/specs/2026-10-17-world-issues-cloudflare-design.md`(2단계: Cloudflare·클라우드 갱신)
- 새 주소(연결 예정): https://gtdaily.news

## 실행

```bash
python3 build.py                          # data/latest.json → 검사 → data/issues·archive 누적 → site/ 생성
python3 -m http.server 8000 --directory site
python3 -m unittest discover -s tests -t .   # 테스트
node --test worker/test/                    # Worker 테스트
```

- `python3 build.py --check FILE [--langs ko]`: 검사만 합니다
- `python3 build.py --list-ids`: 최근 이슈 id 목록(갱신할 때 같은 이슈의 id를 이어 쓰기 위해)
- `python3 build.py --render-only --out DIR`: 누적 기록을 바꾸지 않고 페이지만 만듭니다
- 내부 링크와 사이트 지도 주소는 `SITE_URL` 환경변수로 바꿉니다(기본 `https://tking-creator.github.io/world-issues`)
- 공유 이미지에 Pillow가 필요합니다

## 파일 구성

| 파일 | 역할 |
|---|---|
| `build.py` | 진입점. 검사, 누적 기록 갱신, 사이트 생성 |
| `gen/config.py` | 사이트 주소, 언어, 나라(시간대·분석 플랫폼), 분야, 기준값 |
| `gen/model.py` | 점수 평균, SNS 검색 링크, 본문 유무, 데이터 검사 |
| `gen/store.py` | `data/issues/{id}.json`(이슈별), `data/archive/{날짜}.json`(그날 갱신분) |
| `gen/timefmt.py` | 언어별 날짜·시각, 나라별 현지 갱신 시각 |
| `gen/html.py`, `gen/pages.py` | 페이지 틀과 페이지 종류별 생성 |
| `gen/feeds.py`, `gen/og.py` | 사이트 지도·robots·RSS·feed.json, 공유 이미지 |
| `i18n/{en,ko,ja,zh}.json` | 화면 고정 문구 |
| `static/` | `styles.css`(디자인), `app.js`(탭·필터·언어 기억·내 시간 표시) |
| `data/` | `latest.json`(최신, 4개 언어), `issues/`, `archive/` |
| `site/` | 만들어진 사이트. 저장소에 넣지 않습니다(Actions가 만듭니다) |
| `gen/redirect.py` | 도메인 이전 뒤 옛 github.io 주소용 넘겨주기 페이지 |
| `deploy/sync.py` | `site/`를 R2 버킷 `gtdaily-site`에 맞춤(바뀐 파일만, 목록·사이트맵은 마지막) |
| `worker/` | Cloudflare Worker `gtdaily`: R2에서 페이지를 꺼내 보여 줌 |
| `.github/workflows/deploy.yml` | 생성·누적 기록 커밋·R2·Worker·GitHub Pages 배포 |
| `routine-prompt.md` | Claude 클라우드 루틴용 지시문 |

## 페이지

| 페이지 | 주소 |
|---|---|
| 첫 화면 | `/{lang}/` (루트 `/`는 영어판) |
| 이슈 개별 | `/{lang}/issue/{id}/` (4개 언어 본문 네 단락이 있을 때만) |
| 날짜별 기록 | `/{lang}/{YYYY-MM-DD}/` |
| 나라별·분야별 모음 | `/{lang}/korea/` 등, `/{lang}/tech/` 등 (30개씩 쪽 나눔) |
| 깃허브 트렌딩 | `/{lang}/github/`, `/{lang}/github/{YYYY-MM-DD}/` |

## 자동 갱신과 배포

1. **매일 06:00 KST(UTC 21:00) Claude 클라우드 루틴**이 `routine-prompt.md`대로 `refresh-prompt.md`(한국어 원고 `data/draft.json`) → `translate-prompt.md`(4개 언어 `data/latest.json`) → 검사를 하고, 통과하면 `data/latest.json` 하나만 main에 올립니다.
2. **GitHub Actions `deploy.yml`**이 `data/latest.json` 변경을 받아 `build.py`로 누적 기록(`data/issues`, `data/archive`)을 갱신·커밋하고 사이트를 만든 뒤, R2 동기화 → Worker 배포 → GitHub Pages 배포를 합니다. 실패하면 아무것도 바꾸지 않고 GitHub가 실패 메일을 보냅니다.

저장소 변수 `SITE_URL`(Settings › Secrets and variables › Actions › Variables)로 동작이 갈립니다.

| `SITE_URL` | R2·Worker | GitHub Pages(옛 주소) |
|---|---|---|
| 비어 있음 | 건너뜀 | github.io 사이트 |
| `https://gtdaily.<하위주소>.workers.dev` | 테스트 주소로 배포(`noindex`) | github.io 사이트 |
| `https://gtdaily.news` | 도메인으로 배포 | 같은 경로의 새 주소로 넘겨주기 |

필요한 비밀 값(Secrets): `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`. 하나라도 없으면 R2·Worker 단계를 건너뜁니다.

**맥북 대체 실행:** `refresh.sh`가 같은 일을 맥에서 합니다(검사는 `--render-only`로 임시 폴더에, 올리는 것은 `data/latest.json`만). launchd plist는 `~/Library/LaunchAgents/local.world-issues.refresh.plist`(매일 06:00). 루틴이 자리 잡으면 `launchctl bootout gui/$(id -u)/local.world-issues.refresh`로 끄고, 다시 켤 때는 `launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/local.world-issues.refresh.plist`. 실행 기록은 `logs/`.

**도메인 연결 순서:** `worker/wrangler.toml`의 `routes` 주석 풀기 → `SITE_URL`을 `https://gtdaily.news`로 → 배포 확인 → Search Console에 `https://gtdaily.news/sitemap.xml` 제출.

## 후원·광고·연락처

- 후원: Ko-fi `https://ko-fi.com/tk9966`. 모든 페이지 바닥글과 이슈 페이지 끝에 버튼(`gen/config.py`의 `KOFI_URL`).
- 연락처: `hello@gtdaily.news`(Cloudflare Email Routing으로 Gmail에 전달, `CONTACT_EMAIL`). 개인 주소는 사이트에 쓰지 않습니다.
- 안내 페이지: `/{lang}/about/`, `/{lang}/privacy/`, `/{lang}/contact/`(문구는 `i18n/*.json`의 `info`). 광고를 넣지 않습니다.
- 광고: 저장소 변수 `ADSENSE_CLIENT`(`ca-pub-` + 숫자 16자리)를 넣으면 일반 페이지 `<head>`에 애드센스 **자동 광고** 코드와 루트 `ads.txt`가 생깁니다(광고 위치는 구글이 정함, 애드센스 화면에서 자동 광고를 켜야 함). 비어 있거나 형식이 틀리면 아무것도 나가지 않습니다. `SITE_URL`이 비어 있을 때와 옛 주소(GitHub Pages) 사본에는 넣지 않습니다. `.slot` 칸은 나중에 수동 광고 단위를 넣을 자리로만 남겨 둡니다.
- 사용자가 할 일: ① Cloudflare → gtdaily.news → Email Routing에서 `hello@` 전달 켜기 ② 페이지가 쌓인 뒤 애드센스 신청, 받은 번호를 `ADSENSE_CLIENT`에 ③ 승인 뒤 애드센스 "개인정보 보호 및 메시지"에서 유럽 동의 메시지 게시.

## 알려진 한계

- **SNS를 직접 읽지 못했습니다.** 인스타그램, 쓰레드, X, 틱톡, 웨이보 모두 로그인하지 않으면 게시물을 보여주지 않고, 클라우드에서의 자동 접속도 막혀 있습니다(틱톡 크리에이티브 센터 포함). 그래서 현재 데이터는 뉴스 기사와 트렌드 매체를 근거로 했습니다.
  - 뉴스: SBS, Korea Pro, PBS, Japan Today, Euronews, 시나 연예, What's on Weibo 등
  - 10~20대 트렌드: 캐릿(careet.net), 세계일보, 시부야 트렌드리서치(일본 고교생 설문)
- **점수는 Claude의 판단입니다.** 실제 SNS 언급량을 집계한 값이 아닙니다.
- **링크는 검색 페이지입니다.** 개별 게시글이 아니라 해당 키워드의 SNS 검색·해시태그 페이지로 연결됩니다.
- 일본·중국 탭은 10/16 기준으로 확인된 사건사고가 없어 그 분야가 비어 있습니다.

## 다음에 할 만한 일

1. **실제 SNS 데이터 연결:** 로그인된 브라우저(Claude in Chrome)나 컴퓨터 사용으로 X 트렌드, 웨이보 핫검색, 릴스·틱톡 화면을 읽기. 또는 공식 API(쓰레드 키워드 검색, 유료 X API) 검토
2. **크롬 확장** (4단계)
