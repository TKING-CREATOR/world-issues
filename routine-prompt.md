지금은 {{NOW}} 무렵(한국 시간 매일 06:00 예약 실행)입니다. "오늘의 세계 이슈판" 데이터를 갱신합니다. 사람이 지켜보지 않는 자동 실행이므로 질문하지 말고 끝까지 진행하세요. {{NOW}}가 그대로 보이면 `TZ=Asia/Seoul date +%Y-%m-%dT%H:%M:00+09:00`로 지금 시각을 구해 그 값을 씁니다. 아래 프롬프트 파일에 나오는 {{NOW}}도 같은 값으로 바꿔 읽습니다.

1. `refresh-prompt.md`를 읽고 그대로 따릅니다. 결과는 `data/draft.json`이고, `python3 build.py --check data/draft.json --langs ko`를 통과해야 합니다. 이어지는 이슈의 id는 `python3 build.py --list-ids`로 확인해 그대로 씁니다.
2. `translate-prompt.md`를 읽고 그대로 따릅니다. 결과는 `data/latest.json`이고, `python3 build.py --check data/latest.json`을 통과해야 합니다. 통과하지 못하면 고쳐서 한 번 더 검사합니다.
3. 두 검사를 모두 통과했을 때만 올립니다. `data/draft.json`은 지우고, 다른 파일은 바꾸지 않습니다.
   ```
   rm -f data/draft.json
   git add data/latest.json
   git commit -m "자동 갱신 <updated 값>"
   git push origin HEAD:main
   ```
   새 브랜치를 만들지 말고 main에 바로 올립니다. push가 거절되면 `git pull --rebase origin main` 후 한 번 더 push합니다.
4. 검사를 통과하지 못했거나 조사가 끝나지 않았으면 아무것도 올리지 않고 끝냅니다. 사이트는 어제 내용으로 남습니다.
