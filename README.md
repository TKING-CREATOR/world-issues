# 오늘의 세계 이슈판

한국, 미국, 일본, 중국, 유럽에서 그날 SNS에서 화제가 된 이슈를 기술·경제, 정치, 문화·사회, 사건사고로 나눠 점수순으로 보여주는 다국어(영어·한국어·일본어·중국어) 사이트입니다. 깃허브 트렌딩 상위 10개도 함께 보여줍니다.

- 사이트: https://tking-creator.github.io/world-issues/ (영어 기본, `/ko/`, `/ja/`, `/zh/`)
- 저장소: https://github.com/TKING-CREATOR/world-issues
- 설계: `docs/superpowers/specs/2026-10-17-world-issues-v2-design.md`

## 실행

```bash
python3 build.py                          # data/latest.json → 검사 → data/issues·archive 누적 → site/ 생성
python3 -m http.server 8000 --directory site
python3 -m unittest discover -s tests -t .   # 테스트
```

- `python3 build.py --check FILE [--langs ko]`: 검사만 합니다
- `python3 build.py --list-ids`: 최근 이슈 id 목록(갱신할 때 같은 이슈의 id를 이어 쓰기 위해)
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
| `site/` | 만들어진 사이트. GitHub Actions(`.github/workflows/pages.yml`)가 Pages에 올립니다 |

## 페이지

| 페이지 | 주소 |
|---|---|
| 첫 화면 | `/{lang}/` (루트 `/`는 영어판) |
| 이슈 개별 | `/{lang}/issue/{id}/` (4개 언어 본문 네 단락이 있을 때만) |
| 날짜별 기록 | `/{lang}/{YYYY-MM-DD}/` |
| 나라별·분야별 모음 | `/{lang}/korea/` 등, `/{lang}/tech/` 등 (30개씩 쪽 나눔) |
| 깃허브 트렌딩 | `/{lang}/github/`, `/{lang}/github/{YYYY-MM-DD}/` |

## 자동 갱신

맥의 launchd가 `refresh.sh`를 실행합니다(`~/Library/LaunchAgents/local.world-issues.refresh.plist`).

1. Claude가 `refresh-prompt.md`대로 이슈를 모아 한국어 원고 `data/draft.json`을 씁니다. 검사(`--check --langs ko`)에 실패하면 멈춥니다
2. Claude가 `translate-prompt.md`대로 영어·일본어·중국어로 옮겨 `data/latest.json`을 씁니다
3. `build.py`가 검사하고 사이트를 만듭니다. 실패하면 번역을 한 번 더 하고, 그래도 실패하면 이전 `latest.json`으로 되돌립니다
4. `data/`와 `site/`를 커밋해 GitHub에 올립니다(`NO_PUSH=1`이면 올리지 않음)

- 실행 기록은 `logs/`에 남습니다
- 맥이 잠자기 상태면 깨어날 때 실행되고, 꺼져 있으면 그 회차는 건너뜁니다
- 지금 바로 한 번 돌리려면: `launchctl kickstart gui/$(id -u)/local.world-issues.refresh`

## 데이터 형식

`refresh-prompt.md`에 `draft.json` 예시가 있습니다. `latest.json`은 같은 구조에서 `text`, `cut`, 깃허브 `desc`에 `en`, `ja`, `zh`가 더해진 것입니다.

- `links[].p`: `ig`(인스타 해시태그), `th`(쓰레드), `naver`, `x`, `rd`(레딧), `tt`(틱톡), `wb`(웨이보)
- `id`: 영어 소문자·숫자·하이픈, 60자 이하. 같은 이슈가 이어지면 같은 id를 씁니다

## 점수 규칙

화제성, 파급력, 시의성, 지속성을 각 10점으로 매겨 평균을 냅니다. 평균 5.0 미만은 빼고 `cut`에 적습니다. 분야별 최대 10개입니다.

## 나라별 기준 플랫폼

| 탭 | 플랫폼 |
|---|---|
| 한국 | 인스타그램, 쓰레드, 네이버 검색량 |
| 미국 | 인스타그램, 레딧, X |
| 일본 | X, 틱톡 |
| 중국 | 웨이보 |
| 그 외 | X, 레딧 (r/europe, r/worldnews) |

문화·사회 분야는 10~20대에서 막 뜨기 시작한 유행 위주로 고릅니다. 한국은 릴스·쓰레드, 일본은 X·틱톡이 기준입니다.

## 알려진 한계

- **SNS를 직접 읽지 못했습니다.** 인스타그램, 쓰레드, X, 틱톡, 웨이보 모두 로그인하지 않으면 게시물을 보여주지 않고, 클라우드에서의 자동 접속도 막혀 있습니다(틱톡 크리에이티브 센터 포함). 그래서 현재 데이터는 뉴스 기사와 트렌드 매체를 근거로 했습니다.
  - 뉴스: SBS, Korea Pro, PBS, Japan Today, Euronews, 시나 연예, What's on Weibo 등
  - 10~20대 트렌드: 캐릿(careet.net), 세계일보, 시부야 트렌드리서치(일본 고교생 설문)
- **점수는 Claude의 판단입니다.** 실제 SNS 언급량을 집계한 값이 아닙니다.
- **링크는 검색 페이지입니다.** 개별 게시글이 아니라 해당 키워드의 SNS 검색·해시태그 페이지로 연결됩니다.
- 일본·중국 탭은 10/16 기준으로 확인된 사건사고가 없어 그 분야가 비어 있습니다.

## 다음에 할 만한 일

1. **실제 SNS 데이터 연결:** 로그인된 브라우저(Claude in Chrome)나 컴퓨터 사용으로 X 트렌드, 웨이보 핫검색, 릴스·틱톡 화면을 읽기. 또는 공식 API(쓰레드 키워드 검색, 유료 X API) 검토
2. **개인 도메인과 Cloudflare 이전, 클라우드 갱신** (설계 문서의 2번 덩어리)
