# 오늘의 세계 이슈판 3단계 설계: 후원과 광고

작성일: 2026-10-17 · 앞 문서: `2026-10-17-world-issues-v2-design.md`(1단계), `2026-10-17-world-issues-cloudflare-design.md`(2단계)

## 목표

`https://gtdaily.news`에서 후원(Ko-fi)을 바로 받고, 구글 애드센스 승인에 필요한 페이지와 광고 자리를 미리 갖춰 둔다. 승인 번호만 넣으면 광고가 켜지게 한다.

성공 기준:
- 모든 페이지 아래쪽과 이슈 개별 페이지 끝에 Ko-fi 후원 버튼(`https://ko-fi.com/tk9966`)이 있다.
- 4개 언어로 소개(`/{lang}/about/`), 개인정보처리방침(`/{lang}/privacy/`), 연락처(`/{lang}/contact/`) 페이지가 있고 사이트맵에 들어간다.
- 저장소 변수 `ADSENSE_CLIENT`가 비어 있으면 광고 코드도 `ads.txt`도 없다. 값(`ca-pub-…`)을 넣으면 모든 페이지 `<head>`에 애드센스 코드가, 정해진 자리에 광고 칸이, 루트에 `ads.txt`가 생긴다.
- 연락 주소는 `hello@gtdaily.news`(Cloudflare 이메일 전달 → 사용자 Gmail). 개인 Gmail 주소는 사이트에 쓰지 않는다.

하지 않는 것: 방문자 분석 도구 추가, 유료 구독, 광고 개수 최적화 실험, 동의 창 직접 구현.

## 1. 결정 사항

| 항목 | 결정 | 이유 |
|---|---|---|
| 후원 | Ko-fi `tk9966` | 수수료 0%, 해외 방문자에게 익숙, PayPal로 한국 정산 |
| 연락처 | `hello@gtdaily.news` | Cloudflare 무료 이메일 전달. 개인 주소를 숨긴다 |
| 광고 | 구글 애드센스 | 승인 전에는 아무것도 보이지 않게 준비만 한다 |
| 동의 창 | 애드센스 "개인정보 보호 및 메시지"의 구글 인증 동의 창 | 유럽·영국·스위스 방문자에게 필요. 광고 코드가 알아서 띄우므로 사이트 코드는 없다 |

## 2. 페이지

`gen/pages.py`에 `info_pages()`를 더하고 `all_pages()`에 넣는다. 본문 문구는 `i18n/{lang}.json`의 `info` 아래에 둔다(네 언어 키가 같아야 한다는 기존 규칙을 따른다).

| 페이지 | 내용 |
|---|---|
| 소개 `/{lang}/about/` | 무엇을 보여 주는지, 매일 06:00 KST 갱신, 이슈를 고르는 방식(AI가 공개 기사를 근거로 고르고 4개 기준으로 점수를 매김), 한계(실제 SNS 언급량이 아님, 오류 가능), 정정 요청은 연락처로 |
| 개인정보처리방침 `/{lang}/privacy/` | 회원가입·댓글 없음, 저장하는 정보(브라우저에 고른 탭·언어만 로컬 저장), 광고(구글 등 외부 업체가 쿠키로 맞춤 광고를 보여 줄 수 있음, `https://www.google.com/settings/ads`에서 끄기, `https://policies.google.com/technologies/partner-sites` 안내), 후원(Ko-fi 외부 결제, 이 사이트는 결제 정보를 받지 않음), 호스팅(Cloudflare 접속 기록), 문의처, 시행일 |
| 연락처 `/{lang}/contact/` | `hello@gtdaily.news`(`mailto:`), 정정·제보·광고 문의 안내, Ko-fi 링크 |

- 세 페이지는 일반 페이지 틀(`shell`)을 쓰고, 대표 주소·hreflang·빵부스러기 경로를 다른 페이지와 같게 넣는다. 사이트맵에 넣는다.
- 영어 원문을 기준으로 쓰고 나머지 세 언어는 같은 뜻으로 옮긴다. 법률 자문을 대신하지 않는 일반 방침 문구로 쓴다.

## 3. 후원 버튼

- 바닥글(모든 페이지): 기존 방법·면책 문구 아래에 `☕ {support}` 버튼과 소개·개인정보·연락처 링크 줄.
- 이슈 개별 페이지: 본문과 관련 이슈 사이에 한 줄 안내(`support_line`)와 버튼.
- 링크는 `https://ko-fi.com/tk9966`, `target="_blank" rel="noopener"`. 주소는 `gen/config.py`의 `KOFI_URL` 한 곳에 둔다.
- 색은 기존 토큰(`--acc`, `--track`)만 쓴다. 새 색이 필요하면 `:root`와 다크 모드 두 곳에 함께 추가한다.

## 4. 광고

- `gen/config.py`: `ADSENSE_CLIENT = os.environ.get("ADSENSE_CLIENT") or ""`. 형식 `ca-pub-` + 숫자 16자리가 아니면 빈 값으로 본다(잘못된 값으로 코드가 나가지 않게).
- 값이 있을 때만:
  - 모든 페이지 `<head>`에 `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client={ADSENSE_CLIENT}" crossorigin="anonymous"></script>`
  - 광고 칸 `slot(name)`: `<ins class="adsbygoogle" style="display:block" data-ad-client="…" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({});</script>`. 자동 크기 단위라 광고 단위 번호 없이 시작한다.
  - 루트 `ads.txt`: `google.com, pub-{숫자}, DIRECT, f08c47fec0942fa0`
- 광고 자리(페이지당 최대 3곳):
  - 첫 화면·나라·분야·날짜 페이지: 각 나라 패널의 두 번째 분야 묶음 뒤 1곳
  - 이슈 개별 페이지: 본문 두 번째 단락 뒤 1곳, 관련 이슈 앞 1곳
  - 소개·개인정보·연락처 페이지에는 넣지 않는다.
- 값이 없으면 `slot()`은 지금처럼 내용 없는 `<div class="slot">`만 돌려주고(CSS `slot:empty`로 숨김), `<head>`에도 `ads.txt`도 없다.
- `deploy.yml`의 사이트 생성 단계에 `ADSENSE_CLIENT: ${{ vars.ADSENSE_CLIENT }}`를 넘긴다. GitHub Pages(옛 주소) 사본에는 넘기지 않는다.
- `deploy/sync.py`의 Content-Type 표에 `ads.txt`는 이미 `.txt`로 들어 있다.

## 5. 사용자가 할 일

1. Cloudflare → gtdaily.news → Email → Email Routing 켜기 → 규칙 `hello@gtdaily.news` → 받을 Gmail 주소 → Gmail에 온 확인 메일 누르기.
2. 페이지가 2~4주 쌓인 뒤 `https://adsense.google.com`에서 사이트 `gtdaily.news` 추가·신청. 받은 `ca-pub-…`를 알려 주면 저장소 변수 `ADSENSE_CLIENT`에 넣는다(또는 직접 Settings › Variables).
3. 애드센스 승인 뒤 "개인정보 보호 및 메시지"에서 유럽 규정(GDPR) 메시지를 만들어 게시.

## 6. 테스트

- `info_pages()`가 4개 언어 × 3쪽을 만들고, 각 페이지에 canonical·hreflang이 있고, 사이트맵에 들어가는지.
- 바닥글과 이슈 페이지에 Ko-fi 링크(`https://ko-fi.com/tk9966`, `rel="noopener"`)가 있는지.
- `ADSENSE_CLIENT` 빈 값·잘못된 값: 어느 페이지에도 `adsbygoogle`가 없고 `ads.txt`가 없다.
- 올바른 값: 모든 일반 페이지 `<head>`에 스크립트 1개, 이슈 페이지 광고 칸 2개, 첫 화면 패널마다 1개, 소개·개인정보·연락처에는 0개, `ads.txt` 내용 일치.
- 개인정보처리방침에 구글 광고 설정 링크와 `hello@gtdaily.news`가 있는지.
- i18n 네 파일의 키가 같은지(기존 테스트).
