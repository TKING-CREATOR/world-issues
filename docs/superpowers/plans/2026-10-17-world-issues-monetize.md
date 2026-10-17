# 3단계: 후원과 광고 준비 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ko-fi 후원 버튼, 4개 언어 소개·개인정보처리방침·연락처 페이지, `ADSENSE_CLIENT` 한 값으로 켜지는 애드센스 코드·광고 칸·`ads.txt`를 만든다.

**Architecture:** `gen/config.py`에 `KOFI_URL`, `CONTACT_EMAIL`, 검증된 `ADSENSE_CLIENT`를 둔다. `gen/html.py`의 `slot()`·`shell()`·`_footer()`가 광고 코드와 후원·안내 링크를 넣는다. `gen/pages.py`에 `info_pages()`를 더한다. `build.py`가 값이 있을 때만 `ads.txt`를 쓴다. `deploy.yml`은 R2용 생성에만 `ADSENSE_CLIENT`를 넘긴다.

**Tech Stack:** Python 3 표준 라이브러리(기존), unittest.

**Spec:** `docs/superpowers/specs/2026-10-17-world-issues-monetize-design.md`

## Global Constraints

- 후원 주소 `https://ko-fi.com/tk9966`, 연락 주소 `hello@gtdaily.news`. 개인 Gmail 주소는 어디에도 쓰지 않는다.
- `ADSENSE_CLIENT`는 `^ca-pub-\d{16}$`일 때만 유효. 아니면 빈 값과 같다.
- 광고는 페이지당 최대 3칸, 소개·개인정보·연락처 페이지에는 0칸.
- i18n 네 파일의 키 구조가 같아야 한다(기존 테스트 `tests/test_timefmt.py`).
- 새 색은 만들지 않는다(기존 토큰만).
- 테스트: `python3 -m unittest discover -s tests -t .`, `node --test tests/ worker/test/`.

## Review Focus

1. 잘못된 `ADSENSE_CLIENT`(공백, `pub-…`만, 따옴표 포함) → 광고 코드가 하나도 나가지 않아야 한다 → Task 1 `test_invalid_client_disables_ads`.
2. 광고 칸이 소개·개인정보·연락처에 들어가면 애드센스 정책상 문제 → Task 2 `test_info_pages_have_no_ad_slots`.
3. 옛 주소(GitHub Pages) 사본에 광고 코드가 들어가면 승인 도메인이 아닌 곳에 광고 → Task 4 `test_pages_copy_has_no_adsense`.
4. 개인정보처리방침이 4개 언어 모두 구글 광고 설정 링크와 연락 주소를 담아야 한다 → Task 2 `test_privacy_has_required_links`.
5. 사이트맵에 새 페이지가 빠지면 검색에 안 잡힌다 → Task 2 `test_info_pages_in_sitemap`.

---

### Task 1: 설정과 공통 틀(광고 코드·광고 칸·바닥글 후원/안내 링크)

**Files:** Modify `gen/config.py`, `gen/html.py`, `static/styles.css`, `i18n/*.json`; Test `tests/test_html.py`

**Interfaces — Produces:**
- `config.KOFI_URL = "https://ko-fi.com/tk9966"`, `config.CONTACT_EMAIL = "hello@gtdaily.news"`, `config.ADSENSE_CLIENT: str`(검증 후, 무효면 `""`), `config.adsense_client(raw: str|None) -> str`
- `html.slot(name)`: 클라이언트가 있으면 `<div class="slot" data-slot="{name}"><ins class="adsbygoogle" …></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({});</script></div>`, 없으면 지금처럼 빈 `div`.
- `html.shell(..., ads=True)`: `ads and ADSENSE_CLIENT`일 때 `<head>`에 애드센스 스크립트 1개.
- `html.support(lang) -> str`: Ko-fi 버튼 `<a class="kofi" href="https://ko-fi.com/tk9966" target="_blank" rel="noopener">☕ {t["support"]}</a>`
- 바닥글: 기존 내용 + `<nav class="footlinks">` 소개·개인정보·연락처 링크 + `support(lang)`.
- i18n 새 키: `support`, `support_line`, `info`{`about`,`privacy`,`contact`: 제목}, 그리고 Task 2의 본문 키.

- [ ] Step 1: `tests/test_html.py`에 테스트 추가 — `adsense_client()`가 `"ca-pub-1234567890123456"`만 통과하고 `""`, `" ca-pub-1234567890123456"`, `"pub-1234567890123456"`, `"ca-pub-123"`, `'ca-pub-1234567890123456"'`는 `""`; `ADSENSE_CLIENT`를 바꿔 `slot()`/`shell()` 결과 확인(`mock.patch.object(C, "ADSENSE_CLIENT", …)`); 바닥글에 Ko-fi 링크와 세 안내 링크.
- [ ] Step 2: 실행 → FAIL 확인
- [ ] Step 3: 구현
- [ ] Step 4: 전체 테스트 PASS
- [ ] Step 5: 커밋 "공통 틀: Ko-fi 후원·안내 링크, 애드센스 코드와 광고 칸(값이 있을 때만)"

### Task 2: 소개·개인정보처리방침·연락처 페이지

**Files:** Modify `gen/pages.py`, `i18n/*.json`; Test `tests/test_pages.py`, `tests/test_feeds.py`

**Interfaces — Produces:** `pages.info_pages() -> list[Page]` — 4개 언어 × `about/`, `privacy/`, `contact/`. `shell(..., ads=False)`로 만들고 `slot()`을 쓰지 않는다. `all_pages()`에 포함.

i18n `info` 구조(네 언어 같은 키):
```json
"info": {
  "about":   {"title": "...", "desc": "...", "sections": [["제목", "문단"], ...]},
  "privacy": {"title": "...", "desc": "...", "sections": [...], "effective": "Effective {date}"},
  "contact": {"title": "...", "desc": "...", "sections": [...]}
}
```
본문 안의 `{email}`, `{kofi}`, `{ads_settings}`, `{partners}`는 생성 때 링크로 바꾼다(문구는 이스케이프한 뒤 자리표시만 `<a>`로 치환). 개인정보처리방침 시행일은 2026-10-17.

- [ ] Step 1: 테스트 — 12쪽 생성, 각 쪽 canonical/hreflang, `adsbygoogle`·`class="slot"` 없음(ADSENSE_CLIENT 있어도), 개인정보처리방침 4개 언어에 `https://www.google.com/settings/ads`·`https://policies.google.com/technologies/partner-sites`·`mailto:hello@gtdaily.news`, 연락처에 `mailto:`와 Ko-fi, 빌드 결과 사이트맵에 `/en/about/` 등 포함.
- [ ] Step 2: FAIL 확인
- [ ] Step 3: 구현(+ 네 언어 문구)
- [ ] Step 4: PASS
- [ ] Step 5: 커밋 "소개·개인정보처리방침·연락처 페이지(4개 언어)"

### Task 3: 광고 자리와 이슈 페이지 후원 줄

**Files:** Modify `gen/pages.py`; Test `tests/test_pages.py`

- 이슈 페이지: `issue-top`을 요약 뒤에서 **본문 두 번째 단락 뒤**로 옮긴다. `issue-bottom`은 그대로(글 끝, 관련 이슈 앞). 출처 줄 뒤에 `<p class="support">{support_line} {support(lang)}</p>`.
- 첫 화면·날짜 페이지 나라 패널: 두 번째 분야 묶음(`politics`) 뒤에 `slot("panel")` 1칸.
- 나라·분야 모음 페이지: 기존 `hub-top` 유지.

- [ ] Step 1: 테스트 — 클라이언트 있을 때 이슈 페이지 `adsbygoogle` 칸 2개이고 첫 칸이 두 번째 `<h2>`의 문단 뒤, 나라 패널마다 칸 1개, 이슈 페이지에 Ko-fi 링크.
- [ ] Step 2: FAIL 확인 → Step 3 구현 → Step 4 PASS → Step 5 커밋 "광고 자리 조정과 이슈 페이지 후원 줄"

### Task 4: `ads.txt`와 배포 설정

**Files:** Modify `build.py`, `.github/workflows/deploy.yml`; Test `tests/test_build.py`, `tests/test_workflow.py`

- `write_site`: `C.ADSENSE_CLIENT`가 있으면 `ads.txt` = `google.com, pub-{숫자16}, DIRECT, f08c47fec0942fa0\n`.
- `deploy.yml`: "사이트 생성과 누적 기록 갱신" 단계에만 `env: ADSENSE_CLIENT: ${{ vars.ADSENSE_CLIENT }}`. GitHub Pages 사본(`--render-only --out site-gh`)에는 넘기지 않는다.

- [ ] Step 1: 테스트 — 값 없으면 `ads.txt` 없음, 있으면 내용 일치(서브프로세스로 환경 변수 주고 빌드); 워크플로에서 `ADSENSE_CLIENT`가 정확히 한 번, 사이트 생성 단계 안에만 나온다(`test_pages_copy_has_no_adsense`).
- [ ] Step 2: FAIL → Step 3 구현 → Step 4 PASS → Step 5 커밋 "ads.txt와 배포 설정"

### Task 5: 문서와 배포

- [ ] README에 후원·광고·연락처 절, `ADSENSE_CLIENT` 변수 설명, 사용자 할 일(이메일 전달, 애드센스 신청, 동의 메시지).
- [ ] 전체 테스트, 로컬 미리보기로 바닥글·안내 페이지 확인.
- [ ] main에 병합·push → Actions 성공 → `https://gtdaily.news/en/about/` 등 200, 사이트맵에 포함 확인.
