지금은 {{NOW}} 무렵(한국 시간 매일 06:00 예약 실행)입니다. "오늘의 세계 이슈판" 데이터를 갱신합니다. 사람이 지켜보지 않는 자동 실행이므로 질문하지 말고 끝까지 진행하세요. {{NOW}}가 그대로 보이면 `TZ=Asia/Seoul date +%Y-%m-%dT%H:%M:00+09:00`로 지금 시각을 구해 그 값을 씁니다. 아래 프롬프트 파일에 나오는 {{NOW}}도 같은 값으로 바꿔 읽습니다.

## 검색 요령

- **먼저 `data/feeds.json`을 봅니다.** GitHub Actions가 매일 05:20 KST에 나라별 언론사·구글 뉴스·구글 트렌드 피드에서 모은 최근 36시간 기사 목록입니다. 클라우드 환경에서는 언론사 사이트 접속(WebFetch)이 막힐 수 있으니, 이 목록과 웹 검색을 주로 씁니다.
- 검색어에 날짜(예: "October 17 2026")를 넣으면 엉뚱한 결과가 나옵니다. 날짜 없이 "나라 + 분야 + latest/오늘" 식으로 찾고, 기사 날짜는 열어서 직접 확인합니다.
- 검색 결과가 부실하면 언론사 첫 화면이나 속보 목록을 WebFetch로 직접 엽니다.
  - 한국: https://www.yna.co.kr/news , https://news.kbs.co.kr
  - 미국: https://apnews.com , https://www.reuters.com/world/us/
  - 일본: https://www3.nhk.or.jp/news/ , https://japantoday.com
  - 중국: https://www.whatsonweibo.com , https://www.scmp.com/news/china
  - 유럽·중동: https://www.bbc.com/news/world , https://www.euronews.com
  - 깃허브 트렌딩: https://github.com/trending
- 검색 몇 번이 실패했다고 멈추지 않습니다. 출처를 확인한 이슈가 나라마다 적어도 2개, 전체 12개 이상 모일 때까지 방법을 바꿔 계속합니다. 이 작업은 보통 20~30분 걸립니다.
- 검색과 WebFetch가 모두 오류를 내는 등 정말로 출처를 확인할 방법이 없을 때만 아무것도 올리지 않고 끝냅니다. 확인하지 못한 내용을 지어내지 않습니다.
- `python3 build.py --check`와 `--list-ids`는 Pillow 없이 돕니다. 따로 설치하지 않아도 됩니다.

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
