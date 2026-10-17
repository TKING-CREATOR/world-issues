# 크롬 웹스토어 등록 자료

올릴 파일: `gtdaily-extension.zip` (저장소 루트에서 `zip -r gtdaily-extension.zip extension -x 'extension/test/*' 'extension/package.json'`)
스크린샷: `store/screenshots/1-popup.png`, `store/screenshots/2-full-view.png` (1280x800)
아이콘: `extension/icons/128.png`
카테고리: News & Weather · 개인정보처리방침 주소: https://gtdaily.news/en/privacy/ · 홈페이지: https://gtdaily.news/

## 짧은 설명 (확장 안 `_locales`에 들어 있음, 132자 이하)
- en: Today's top trending issues in Korea, the US, Japan, China and Europe, with alerts for the big ones.
- ko: 한국·미국·일본·중국·유럽에서 오늘 화제인 이슈를 점수순으로 보고, 큰 이슈는 알림으로 받아요.
- ja: 韓国・米国・日本・中国・欧州で今日話題の出来事をスコア順に表示。大きな話題は通知でお知らせ。
- zh_CN: 按评分查看韩国、美国、日本、中国和欧洲今日热点，重大话题即时通知。

## 긴 설명

### en
See what people in Korea, the United States, Japan, China and Europe are talking about today — right from your toolbar.

• Top issues by country, scored for buzz, impact, timeliness and staying power
• Each issue links to a full explainer on gtdaily.news, in English, Korean, Japanese or Chinese
• Alerts when a big issue appears (8.5+ by default). Choose the fields (tech & economy, politics, culture & society, incidents) and countries you care about, set quiet hours, or turn alerts off with one switch
• "Full view" shows all five countries on one page
• Updated twice a day (6 AM and 6 PM Korea time)

Privacy: no account, no tracking. Settings stay in your browser. The extension only downloads https://gtdaily.news/feed.json about once an hour.

### ko
한국, 미국, 일본, 중국, 유럽에서 오늘 무엇이 화제인지 툴바에서 바로 확인하세요.

• 나라별 상위 이슈를 화제성·파급력·시의성·지속성 점수로 정리
• 이슈를 누르면 gtdaily.news의 해설 페이지가 열려요(한국어·영어·일본어·중국어)
• 큰 이슈(기본 8.5점 이상)가 뜨면 알림. 받을 분야(기술·경제, 정치, 문화·사회, 사건사고)와 나라를 고르고, 방해 금지 시간을 정하거나 스위치 하나로 끌 수 있어요
• "전체 보기"로 5개 나라를 한 화면에
• 하루 두 번(한국 시간 오전 6시·오후 6시) 갱신

개인정보: 계정도 추적도 없어요. 설정은 브라우저에만 저장되고, 한 시간에 한 번쯤 https://gtdaily.news/feed.json 만 받아 와요.

### ja
韓国・米国・日本・中国・欧州で今日話題になっていることを、ツールバーからすぐに確認できます。

• 国ごとの上位の話題を、話題性・影響力・速報性・持続性でスコア化
• 話題をクリックすると gtdaily.news の解説ページが開きます(日本語・英語・韓国語・中国語)
• 大きな話題(初期設定は8.5点以上)を通知。分野(テクノロジー・経済、政治、文化・社会、事件・事故)と国を選べ、おやすみ時間の設定やワンタッチでの通知オフも可能
• 「すべて表示」で5か国を1画面に
• 1日2回(韓国時間の午前6時・午後6時)更新

プライバシー: アカウントもトラッキングもありません。設定はブラウザ内にだけ保存され、1時間に1回ほど https://gtdaily.news/feed.json を取得するだけです。

### zh_CN
在工具栏中随时查看韩国、美国、日本、中国和欧洲今天的热门话题。

• 按国家列出热门话题，并从热度、影响力、时效性和持续性四方面评分
• 点击话题即可打开 gtdaily.news 的解读页面（中文、英语、韩语、日语）
• 出现重大热点（默认 8.5 分以上）时通知。可选择领域（科技·经济、政治、文化·社会、事件·事故）和国家，设置免打扰时间，或一键关闭通知
• “全部查看”在一个页面显示五个国家
• 每天更新两次（韩国时间早上 6 点和晚上 6 点）

隐私：无需账号，不做追踪。设置只保存在浏览器中，扩展程序大约每小时只请求一次 https://gtdaily.news/feed.json 。

## 권한 설명(심사 양식)
- alarms: 한 시간마다 새 이슈를 확인하기 위해 / Check for new issues once an hour.
- notifications: 고른 조건에 맞는 큰 이슈를 알리기 위해 / Alert the user about big issues matching their settings.
- storage: 사용자 설정과 이미 알린 이슈를 기기 안에 저장하기 위해 / Keep settings and already-notified IDs on the device.
- host https://gtdaily.news/*: 이슈 목록(feed.json)을 받기 위해 / Download the issue list (feed.json).
- 원격 코드: 사용하지 않음 / No remote code. 데이터 수집: 없음 / No user data collected.
