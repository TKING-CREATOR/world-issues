#!/bin/zsh
# 매일 06:00·18:00(KST) 갱신. 06:00은 전체 새로 쓰기, 18:00은 추가분만(update-prompt.md). ① 한국어 원고 → ② 번역(실패하면 한 번 더) → ③ 검사 → ④ data/latest.json만 GitHub에 올리기. 사이트 생성·배포는 GitHub Actions가 합니다.
# 검사에 실패하면 이번 결과를 버리고 이전 data/latest.json을 그대로 둡니다. NO_PUSH=1이면 올리지 않습니다.
set -u
cd "${0:A:h}"
export PATH="/opt/homebrew/bin:$HOME/.local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
mkdir -p logs data

STAMP=$(date +%Y-%m-%d-%H%M)
LOG="logs/$STAMP.log"
NOW=$(TZ=Asia/Seoul date +%Y-%m-%dT%H:%M:00+09:00)
TOOLS=("Read" "Write" "Edit" "Glob" "Grep" "WebSearch" "WebFetch" "Bash(curl -sL:*)" "Bash(python3 build.py:*)" "Bash(python3 -I:*)")
PREV="logs/$STAMP-prev-latest.json"
echo "== 시작 $(date)" >> "$LOG"

step() {
  claude -p "$(sed "s/{{NOW}}/$NOW/g" "$1")" --allowedTools "${TOOLS[@]}" >> "$LOG" 2>&1
  echo "== $1 종료 코드 $?" >> "$LOG"
}
# 맥에서 모은 기사 목록은 커밋하지 않습니다(저장소의 목록은 GitHub Actions가 매일 05:20 KST에 갱신).
finish() { git checkout -q -- data/feeds.json 2>/dev/null || rm -f data/feeds.json; echo "== 끝 $(date)" >> "$LOG"; exit "$1"; }
restore() {
  if [ -f "$PREV" ]; then cp "$PREV" data/latest.json; else rm -f data/latest.json; fi
  echo "== 실패: $1. 이전 데이터를 그대로 둡니다" >> "$LOG"
  finish 1
}

git pull -q --rebase origin main >> "$LOG" 2>&1 || { git rebase --abort 2>/dev/null; echo "== 실패: 최신 내용을 받지 못했습니다" >> "$LOG"; finish 1; }
# 되돌릴 기준은 받아 온 최신 latest.json입니다(그래야 실패해도 작업 트리가 main과 같습니다).
[ -f data/latest.json ] && cp data/latest.json "$PREV"
python3 build.py --feeds >> "$LOG" 2>&1 || echo "== 기사 목록을 새로 모으지 못해 저장소의 목록을 씁니다" >> "$LOG"
if [ "$(TZ=Asia/Seoul date +%H)" -ge 12 ]; then
  # 저녁(18:00) 실행: 아침 이후 새로 뜬 큰 이슈만 4개 언어로 바로 더합니다(번역 단계 없음).
  step update-prompt.md
  if python3 build.py --render-only --out "logs/$STAMP-site" >> "$LOG" 2>&1; then rm -rf "logs/$STAMP-site"; else restore "저녁 추가분 검사 실패"; fi
else
  rm -f data/draft.json
  step refresh-prompt.md
  python3 build.py --check data/draft.json --langs ko >> "$LOG" 2>&1 || restore "한국어 원고 검사 실패"

  ok=0
  for try in 1 2; do
    step translate-prompt.md
    if python3 build.py --render-only --out "logs/$STAMP-site" >> "$LOG" 2>&1; then rm -rf "logs/$STAMP-site"; ok=1; break; fi
    echo "== 번역본 검사 또는 생성 실패 (${try}회차)" >> "$LOG"
  done
  [ $ok = 1 ] || restore "번역 단계 실패"
  rm -f data/draft.json
fi

if [ "${NO_PUSH:-0}" = 1 ]; then echo "== NO_PUSH=1이라 올리지 않았습니다" >> "$LOG"; finish 0; fi
git add data/latest.json >> "$LOG" 2>&1
if git diff --cached --quiet; then
  echo "== 바뀐 내용이 없어 올리지 않았습니다" >> "$LOG"
elif git commit -q -m "자동 갱신 $NOW" >> "$LOG" 2>&1 && git push -q origin HEAD:main >> "$LOG" 2>&1; then
  echo "== GitHub에 올렸습니다" >> "$LOG"
else
  echo "== 실패: GitHub에 올리지 못했습니다" >> "$LOG"
fi
finish 0
