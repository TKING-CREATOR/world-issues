# 4단계: 크롬 확장 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 툴바 팝업·전체 보기·조건부 시스템 알림을 갖춘 MV3 크롬 확장과 웹스토어 제출물을 만든다.

**Architecture:** 빌드 없는 MV3. 판단 로직은 `extension/lib/core.js`(ES 모듈, 순수 함수)에 모아 `node --test`로 검사하고, `background.js`(서비스 워커)·`popup.js`·`options.js`는 core를 불러 크롬 API와 화면만 다룬다. 데이터는 사이트의 `feed.json`(나라별 상위 10개로 확대).

**Tech Stack:** Chrome Extension MV3(alarms, notifications, storage, action), 바닐라 JS ES 모듈, node:test, Python(feed.json·아이콘 생성).

**Spec:** `docs/superpowers/specs/2026-10-17-world-issues-extension-design.md`

## Global Constraints

- 권한은 `alarms`, `notifications`, `storage`와 호스트 `https://gtdaily.news/*`뿐. 원격 코드 실행·eval 금지(MV3 정책).
- 기본 설정: 알림 켜짐, 기준 8.5, 분야 4개·나라 5개 전부, 방해 금지 없음, 언어는 브라우저 언어(ko/ja/zh 접두사, 그 외 en).
- 한 번 확인에 알림 최대 3개(4개 이상이면 상위 2개 + "외 N건" 1개). 같은 id는 한 번만. 방해 금지 중에는 보내지 않고 `notified`에도 넣지 않는다.
- 사이트와 같은 색 토큰·나라 색, 밝은/어두운 모드.
- 테스트: `python3 -m unittest discover -s tests -t .`, `node --test tests/ worker/test/ extension/test/`.

## Review Focus

1. 방해 금지 경계(23:00 시작 포함, 07:00 끝 제외)와 자정을 넘는 구간 → Task 2 `quiet hours boundaries`.
2. `feed.json`을 못 받거나 형식이 깨졌을 때 서비스 워커가 죽지 않고 배지·알림을 건드리지 않음 → Task 3 `bad feed is ignored`(core의 `validFeed`).
3. 알린 id 목록이 무한히 커지지 않음(최근 300개) → Task 2 `notified list is capped`.
4. 4개 언어 `_locales` 키가 모두 같음 → Task 3 `locales have same keys`.
5. 개인정보처리방침에 확장 단락이 4개 언어로 있음 → Task 5 `privacy mentions extension`.

---

### Task 1: feed.json 나라별 상위 10개
- `tests/test_feeds.py`: 나라에 이슈 12개를 넣으면 `feed_json` 결과가 10개인지(RED) → `gen/feeds.py` `[:5]`→`[:10]` → 전체 테스트 → 커밋.

### Task 2: `extension/lib/core.js`
**Produces:** `pickLang(uiLang) -> "en"|"ko"|"ja"|"zh"`, `DEFAULTS`, `validFeed(x) -> bool`, `inQuiet(date, quiet) -> bool`(quiet: `null` 또는 `[startHour, endHour]`, 로컬 시각), `pickAlerts(feed, settings, notified, now) -> {alerts: [{id,title,url,score,country}], more: n, record: [ids]}`, `remember(notified, ids, cap=300) -> ids`, `badgeCount(feed, settings, seenIds) -> n`.
- `extension/test/core.test.mjs`를 먼저 쓰고 RED 확인 → 구현 → GREEN → 커밋.

### Task 3: manifest·로케일·서비스 워커
- `manifest.json`(MV3, `"background": {"service_worker": "background.js", "type": "module"}`, action popup, options_page, icons, default_locale en), `_locales/{en,ko,ja,zh_CN}/messages.json`(이름·설명·화면 문구), `background.js`(onInstalled: 기본 설정 저장·알람 60분·옵션 열기 / onAlarm·onStartup: 확인 / notifications.onClicked: 탭 열기 / 배지).
- 테스트: `locales have same keys`, `manifest permissions are minimal`(파이썬 `tests/test_extension.py`), `bad feed is ignored`(core).

### Task 4: 팝업·전체 보기·설정 화면
- `popup.html/js/css`, `board.html`(popup.js를 `?full=1`로 재사용), `options.html/js`. 문구는 `chrome.i18n`이 아니라 고른 언어를 따르도록 `lib/strings.js`(4개 언어 객체, 키 같음 테스트).
- 확인: 로컬 서버에서 `chrome` 대체 객체를 넣은 미리보기로 화면을 직접 보고 스크린샷.

### Task 5: 아이콘·웹스토어 자료·개인정보
- `tools/make_icons.py`(Pillow)로 16/32/48/128 아이콘, `store/listing.md`(4개 언어 짧은·긴 설명, 권한 설명), `store/screenshots/*.png`(1280x800), 사이트 개인정보처리방침에 확장 단락(4개 언어) + 테스트, `README.md` 확장 절, `gtdaily-extension.zip` 만드는 명령.

### Task 6: 검토·배포
- 전체 테스트, 최종 검토(서브에이전트), 반영, main 병합·push(사이트 쪽 feed.json·개인정보 변경 배포).
