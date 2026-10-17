#!/bin/zsh
# 매일 06:00(KST)에 launchd가 실행합니다. ① 조사·한국어 원고 → ② 번역(실패하면 한 번 더) → ③ 검사·사이트 생성 → ④ GitHub에 올리기
# 검사에 실패하면 이번 결과를 버리고 이전 data/latest.json과 site/를 그대로 둡니다. NO_PUSH=1이면 올리지 않습니다.
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
[ -f data/latest.json ] && cp data/latest.json "$PREV"

step() {
  claude -p "$(sed "s/{{NOW}}/$NOW/g" "$1")" --allowedTools "${TOOLS[@]}" >> "$LOG" 2>&1
  echo "== $1 종료 코드 $?" >> "$LOG"
}
finish() { echo "== 끝 $(date)" >> "$LOG"; exit "$1"; }
restore() {
  if [ -f "$PREV" ]; then cp "$PREV" data/latest.json; else rm -f data/latest.json; fi
  echo "== 실패: $1. 이전 데이터와 사이트를 그대로 둡니다" >> "$LOG"
  finish 1
}

rm -f data/draft.json
step refresh-prompt.md
python3 build.py --check data/draft.json --langs ko >> "$LOG" 2>&1 || restore "한국어 원고 검사 실패"

ok=0
for try in 1 2; do
  step translate-prompt.md
  if python3 build.py >> "$LOG" 2>&1; then ok=1; break; fi
  echo "== 번역본 검사 또는 생성 실패 (${try}회차)" >> "$LOG"
done
[ $ok = 1 ] || restore "번역 단계 실패"
rm -f data/draft.json

if [ "${NO_PUSH:-0}" = 1 ]; then echo "== NO_PUSH=1이라 올리지 않았습니다" >> "$LOG"; finish 0; fi
git add data site >> "$LOG" 2>&1
if git diff --cached --quiet; then
  echo "== 바뀐 내용이 없어 올리지 않았습니다" >> "$LOG"
elif git commit -q -m "자동 갱신 $NOW" >> "$LOG" 2>&1 && git push -q origin main >> "$LOG" 2>&1; then
  echo "== GitHub에 올렸습니다" >> "$LOG"
else
  echo "== 실패: GitHub에 올리지 못했습니다" >> "$LOG"
fi
finish 0
