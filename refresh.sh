#!/bin/zsh
# 정오·자정에 launchd가 실행합니다. Claude가 data.js를 새로 쓰면, 검사를 통과한 경우에만 GitHub에 올려 Pages 사이트를 갱신합니다.
# 실행 전 data.js를 history/에 보관하고, 검사에 실패하면 그 파일로 되돌립니다.
set -u
cd "${0:A:h}"
export PATH="/opt/homebrew/bin:$HOME/.local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
mkdir -p logs history

STAMP=$(date +%Y-%m-%d-%H%M)
LOG="logs/$STAMP.log"
NOW=$(LC_ALL=C date "+%Y.%m.%d %a %H:%M" | tr a-z A-Z)
cp data.js "history/$STAMP.js"
echo "== 시작 $(date)" >> "$LOG"

claude -p "$(sed "s/{{NOW}}/$NOW/g" refresh-prompt.md)" \
  --allowedTools "Read" "Write" "Edit" "Glob" "Grep" "WebSearch" "WebFetch" \
    "Bash(curl -sL:*)" "Bash(python3 build.py)" "Bash(python3 -I:*)" "Bash(node:*)" \
  >> "$LOG" 2>&1
echo "== Claude 종료 코드 $?" >> "$LOG"

if python3 build.py >> "$LOG" 2>&1; then
  git add data.js README.md >> "$LOG" 2>&1
  if git diff --cached --quiet; then
    echo "== 바뀐 내용이 없어 올리지 않았습니다" >> "$LOG"
  elif git commit -q -m "자동 갱신 $NOW" >> "$LOG" 2>&1 && git push -q origin main >> "$LOG" 2>&1; then
    echo "== GitHub에 올렸습니다" >> "$LOG"
  else
    echo "== 실패: GitHub에 올리지 못했습니다" >> "$LOG"
  fi
else
  cp "history/$STAMP.js" data.js
  python3 build.py >> "$LOG" 2>&1
  echo "== 실패: data.js를 실행 전 상태로 되돌렸습니다" >> "$LOG"
fi
echo "== 끝 $(date)" >> "$LOG"
