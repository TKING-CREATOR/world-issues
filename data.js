// 이슈 데이터. 매일 갱신할 때는 이 파일만 바꾸면 됩니다.
// i(분야, 제목, 요약, [화제성,파급력,시의성,지속성], [SNS 링크], 출처키, 10~20대트렌드여부)
const UPDATED = "2026.10.16 FRI 12:00";   // 페이지 상단에 표시되는 갱신 시각
const L = {
  ig: t => ({p:"Instagram", c:"ig", q:"#"+t, url:"https://www.instagram.com/explore/tags/"+encodeURIComponent(t)+"/"}),
  naver: q => ({p:"네이버", c:"nv", q, url:"https://search.naver.com/search.naver?query="+encodeURIComponent(q)}),
  x: q => ({p:"X", c:"x", q, url:"https://x.com/search?q="+encodeURIComponent(q)+"&f=live"}),
  rd: q => ({p:"Reddit", c:"rd", q, url:"https://www.reddit.com/search/?q="+encodeURIComponent(q)+"&sort=hot&t=day"}),
  th: q => ({p:"Threads", c:"th", q, url:"https://www.threads.com/search?q="+encodeURIComponent(q)+"&serp_type=default"}),
  tt: q => ({p:"TikTok", c:"tt", q, url:"https://www.tiktok.com/search?q="+encodeURIComponent(q)}),
  wb: q => ({p:"웨이보", c:"wb", q:"#"+q+"#", url:"https://s.weibo.com/weibo?q="+encodeURIComponent("#"+q+"#")})
};
const S = {
  ddkospi:["디지털데일리 10/16","https://www.ddaily.co.kr/page/view/2026101609223448141"],
  fnbc:["파이낸셜뉴스 10/16","https://www.fnnews.com/news/202610161135545098"],
  khlng:["코리아헤럴드 10/15","https://www.koreaherald.com/article/10903852"],
  khscia:["코리아헤럴드 10/15","https://www.koreaherald.com/article/10904244"],
  hbiz:["헤럴드경제 10/16","https://biz.heraldcorp.com/article/10904297"],
  khvote:["코리아헤럴드 10/15","https://www.koreaherald.com/article/10903864"],
  khlee:["코리아헤럴드 10/15","https://www.koreaherald.com/article/10904258"],
  kha2o:["코리아헤럴드 10/15","https://www.koreaherald.com/article/10903806"],
  khai:["코리아헤럴드 10/14","https://www.koreaherald.com/article/10902847"],
  khbiff:["코리아헤럴드 10/15","https://www.koreaherald.com/article/10903872"],
  khjeju:["코리아헤럴드 10/15","https://www.koreaherald.com/article/10903818"],
  ktopcon:["코리아타임스 10/15","https://www.koreatimes.co.kr/southkorea/defense/20261015/seoul-pushes-back-against-us-signal-for-opcon-transfer-delay"],
  ktswap:["코리아타임스 10/15","https://www.koreatimes.co.kr/economy/20261015/seoul-tokyo-agree-to-extend-10-bil-currency-swap-deal-by-another-3-years"],
  ktnuke:["코리아타임스 10/16","https://www.koreatimes.co.kr/world/20261016/bipartisan-us-senate-bill-reaffirms-ironclad-nuclear-deterrence-pledge-to-s-korea"],
  ktdc:["코리아타임스 10/16","https://www.koreatimes.co.kr/southkorea/20261016/weekender-why-not-gangnam-data-center-boom-fuels-fear-in-neighborhoods-kept-in-the-dark"],
  ktfilm:["코리아타임스 10/16","https://www.koreatimes.co.kr/entertainment/films/20261016/hope-the-assassins-show-widening-gap-between-reviews-viewers"],
  sbs3:["SBS 10/16 모닝와이드","https://news.sbs.co.kr/english/article.do?news_id=N1008800225"],
  sbshouse:["SBS 10/16","https://news.sbs.co.kr/english/article.do?news_id=N1008800418"],
  sbsmochi:["SBS 10/16","https://news.sbs.co.kr/english/article.do?news_id=N1008800416"],
  pbsca:["PBS NewsHour 10/15","https://www.pbs.org/newshour/politics/trump-administration-sues-california-to-block-counting-of-alleged-noncitizen-mail-ballots"],
  nipjiji:["Jiji(nippon.com) 10/15","https://www.nippon.com/en/news/yjj2026101500705/takaichi-cabinet-approval-hits-new-low-of-42-4-pct-jiji-poll.html"],
  sbs4:["SBS 10/15 브리핑","https://news.sbs.co.kr/english/article.do?news_id=N1008799102"],
  dn:["Democracy Now 10/15","https://www.democracynow.org/2026/10/15/headlines"],
  dw:["Dryden Wire 10/15","https://drydenwire.com/news/morning-headlines-thursday-oct-15-2026"],
  pbs:["PBS NewsHour 10/15","https://www.pbs.org/newshour/show/october-15-2026-pbs-news-hour-full-episode"],
  tsmc:["TSMC 3분기 실적(SEC 6-K)","https://www.sec.gov/Archives/edgar/data/0001046179/000104617926000726/a3q26e_withguidancexfinal.htm"],
  engroad:["Engadget 10/15","https://www.engadget.com/2287518/tesla-roadster-launch-live-blog/"],
  cbsnlcs:["CBS Sports 10/15","https://www.cbssports.com/mlb/news/brewers-vs-dodgers-live-updates-nlcs-game-4/live/"],
  cai:["The Star 10/13","https://www.thestar.com.my/tech/tech-news/2026/10/13/characterai-files-for-bankruptcy-agrees-to-sell-some-assets-to-disney-for-20-million"],
  kabu:["株探 10/16","https://s.kabutan.jp/news/n202610160488/"],
  nikkan:["닛칸스포츠(Yahoo!ニュース) 10/16","https://news.yahoo.co.jp/articles/eb03081e817aa5844ef3a4256a4b5f11db3c9e09"],
  std:["The Standard 10/16 모닝 리캡","https://www.thestandard.com.hk/news/article/345651/Morning-Recap-October-16-2026"],
  niptb:["Jiji(nippon.com) 10/15","https://www.nippon.com/en/news/yjj2026101500352/"],
  nipspy:["Jiji(nippon.com) 10/15","https://www.nippon.com/en/news/yjj2026101500520/"],
  pia:["ぴあ映画 10/15","https://lp.p.pia.jp/article/news/515309/index.html"],
  trepo:["Trepo 하반기 트렌드 예상 10/1 (여성 1,000명)","https://news.yahoo.co.jp/articles/fb2b6712f753e90b25fe5c0270c2199b9a478f35"],
  sina2:["신랑 인터넷 핫이슈 10/15","https://k.sina.com.cn/article_7857201856_1d45362c001908r5l4.html"],
  sinazj:["신랑 10/15","https://www.sina.cn/weibo/detail/5354422095843330.html"],
  xz:["웨이보 10/15","https://weibo.com/2/detail/comos:nivhtum8058330"],
  wire:["The Wire China 10/15","https://www.thewirechina.com/2026/10/15/the-daily-roundup-october-15-2026/"],
  trend:["Trend.Az","https://www.trend.az/world/4235400.html"],
  cgtn:["CGTN 10/13","https://news.cgtn.com/news/2026-10-13/Mongolia-grassland-fire-nears-Chinese-border-1RcKZ6rN29y/share_amp.html"],
  eunbaku:["Euronews 10/15","https://www.euronews.com/2026/10/15/azerbaijan-hosts-rare-summit-of-both-converging-and-opposing-middle-east-and-asian-leaders"],
  f24:["France 24 10/15","https://www.france24.com/en/middle-east/20261015-houthi-attack-on-palace-used-by-yemen-government-in-aden-kills-five"],
  eunhz:["Euronews 10/15","https://www.euronews.com/2026/10/15/another-tanker-catches-fire-near-hormuz-after-two-cargo-ships-sunk-in-attacks"],
  euneu:["Euronews 10/15","https://www.euronews.com/2026/10/15/inconclusive-sparring-at-eu-summit-puts-budget-timeline-into-question"],
  euntr:["Euronews 10/15","https://www.euronews.com/video/2026/10/15/albania-violent-protests-rock-tirana-for-third-straight-day"],
  euncb:["Euronews 10/15","https://www.euronews.com/2026/10/15/unicredit-cleared-by-ecb-to-take-control-of-commerzbank"],
  eundebt:["Euronews 10/15","https://www.euronews.com/2026/10/15/europes-debt-map-flips-belgium-borrows-like-greece-france-pays-more-than-italy"],
  eunlk:["Euronews 10/15","https://www.euronews.com/2026/10/15/us-extends-sanctions-waiver-for-russian-oil-giant-lukoil-until-2027"],
  eunhu:["Euronews 10/15","https://www.euronews.com/2026/10/15/zelenskyy-poised-to-visit-budapest-next-week-as-ukraine-and-hungary-move-towards-diplomati"],
  eunbbc:["Euronews 10/15","https://www.euronews.com/2026/10/15/bbc-asks-court-to-compel-trump-deposition-in-86bn-defamation-case"],
  eunpt:["Euronews 10/15","https://www.euronews.com/2026/10/15/dozens-reportedly-injured-in-police-crackdown-on-portugal-housing-protest"],
  eunmad:["Euronews 10/15","https://www.euronews.com/2026/10/15/tears-hugs-and-continued-fight-for-housing-madrids-puerta-del-sol-after-two-weeks"],
  eunhm:["Euronews 10/15","https://www.euronews.com/video/2026/10/15/uk-harry-and-meghan-make-high-profile-comeback-six-years-after-royal-exit"],
  eunct:["Euronews 10/15","https://www.euronews.com/2026/10/15/at-least-19-injured-as-coach-collides-with-train-near-channel-tunnel"]
};
const FIELDS = [["tech","기술·경제","--f-tech"],["pol","정치","--f-pol"],["cul","문화·사회","--f-cul"],["acc","사건사고","--f-acc"]];
const CRIT = ["화제성","파급력","시의성","지속성"];
// i(field, title, summary, [화제성,파급력,시의성,지속성], [sns links], sourceKey)
const i = (f,t,d,s,l,src,y)=>({f,t,d,s,l,src,y});

const DATA = {
 kr:{name:"한국", plats:[["Instagram","https://www.instagram.com/explore/"],["Threads","https://www.threads.com/"],["네이버 검색","https://search.naver.com/"]], items:[
  i("tech","'검은 목요일' 하루 만에 코스피 반등, 5600선 회복","전날 7.57% 폭락해 5,554.22로 마친 코스피가 16일 오전 9시 17분 1.58% 오른 5,641.71을 기록했습니다. 7거래일 연속 하락을 끊었고 삼성전자(21만4천원)와 SK하이닉스(127만원)도 올랐습니다. 밤사이 다우가 1% 넘게 오른 영향입니다. 다만 외국인은 이날도 2,183억원을 팔고 있습니다.",[9,8,10,7],[L.naver("코스피 반등"),L.ig("코스피"),L.th("코스피 반등")],"ddkospi"),
  i("tech","TSMC 3분기 순이익 사상 최대, 1년 새 68.7% 증가","순이익 7,630억 대만달러, 매출은 약 467억달러로 시장 예상을 넘었습니다. 4분기 매출 전망은 523억~543억달러입니다. 'AI 수익성' 불안 속에 나온 호실적이라 국내 반도체주 반등 여부와 함께 거론됩니다.",[8,8,9,6],[L.naver("TSMC 실적"),L.ig("tsmc")],"tsmc"),
  i("tech","한일 통화스와프 100억달러, 3년 연장","양국 재무장관이 같은 규모로 2029년 11월까지 연장하기로 했습니다. 원화가 1,350원을 넘은 날 나온 소식입니다.",[6,7,8,6],[L.naver("한일 통화스와프 연장")],"ktswap"),
  i("tech","서울 아파트값 87주 연속 상승, 역대 최장","수도권 대출 규제 1년이 지났지만 서울 아파트값은 87주째 올라 문재인 정부 때 최장 기록(85주)을 넘었습니다. 전세 매물이 1년 새 18.8% 줄면서 서울 평균 월세는 163만원을 넘었습니다. '강남 집값 하락'은 거래량이 줄어든 탓에 생긴 착시라는 지적도 나옵니다.",[7,7,8,7],[L.naver("서울 아파트 87주 연속 상승"),L.th("서울 집값")],"sbshouse"),
  i("tech","'왜 강남은 아니냐' 주택가 데이터센터 갈등","전국 데이터센터 165곳 중 60% 넘게 수도권에 있고, 금천구에서는 주민 시위가 200일을 넘겼습니다. 완공·공사 중인 112곳 가운데 주민설명회를 한 곳은 26곳뿐입니다.",[6,6,7,7],[L.naver("데이터센터 주민 반대"),L.th("데이터센터")],"ktdc"),
  i("pol","특검 '선관위 30곳 투표율 조작' 확인, 중앙선관위 압수수색","특검은 6월 지방선거 때 25개 시군구와 5개 시도 선관위에서 잘못 입력된 시간대별 투표율에 맞춰 전체 투표자 수를 고쳤다고 밝혔습니다. 과천 중앙선관위 등 7곳을 압수수색했습니다.",[9,9,8,8],[L.naver("선관위 투표율 조작"),L.ig("선관위")],"khvote"),
  i("pol","이재명 대통령 '개헌으로 연임 안 한다'","X에 직접 글을 올려 개헌에는 야당을 포함한 의원 200명 이상의 동의가 필요하다며 연임 추진설을 '음모론'이라고 일축했습니다. 개혁 방식은 신중해졌지만 목표는 그대로라고 했습니다.",[8,7,9,6],[L.naver("이재명 연임 개헌"),L.th("이재명 개헌")],"khlee"),
  i("pol","전작권 전환 '조건 바뀌었다'는 주한미군에 정부 반박","주한미군 고위 지휘관이 조건 변화를 언급하자 국방부는 기존 조건 기반 틀대로 전환을 준비할 수 있다고 밝혔습니다.",[7,8,8,7],[L.naver("전작권 전환"),L.th("전작권")],"ktopcon"),
  i("pol","트럼프 '알래스카 LNG 한국 500억달러' 거듭 주장","중간선거를 앞두고 같은 주장을 다시 꺼냈습니다.",[7,7,7,6],[L.naver("알래스카 LNG 500억달러")],"khlng"),
  i("pol","미 상원 초당적 법안, 한국 '확장억제' 재확인","한국 등 동맹에 대한 핵우산 약속을 법으로 다시 명시하는 법안이 발의됐습니다.",[6,7,8,6],[L.naver("확장억제 법안 상원")],"ktnuke"),
  i("pol","중대범죄수사청장 임명, 2주 공백 끝","청문 보고서는 여야 합의로 채택됐지만 조국혁신당과 국민의힘의 반대 의견이 함께 실렸습니다.",[6,6,8,5],[L.naver("중대범죄수사청장 임명")],"khscia"),
  i("cul","A2O 라이트 'Neon', 29시간 만에 멜론 1위","이수만이 만든 9인조 걸그룹이 데뷔곡 공개 29시간 만에 멜론 톱100 1위에 올랐습니다. 2021년 차트 개편 이후 가장 빠른 데뷔 1위로, 뉴진스 'Attention'(8일)보다 빠릅니다.",[8,6,8,6],[L.ig("a2olite"),L.th("A2O 라이트"),L.naver("A2O Lite Neon")],"kha2o",1),
  i("cul","숏폼 배경음악으로 뜬 AI 노래, 멜론 3위","머무루의 '꿈꾸던 어른'은 보컬을 Suno로 만든 곡으로, 6월에 나왔다가 숏폼 BGM으로 쓰이며 차트를 올랐습니다. AI 곡의 저작권 기준은 아직 정해지지 않았습니다.",[7,6,7,7],[L.ig("꿈꾸던어른"),L.th("꿈꾸던 어른 AI"),L.naver("꿈꾸던 어른 머무루")],"khai",1),
  i("cul","잠실 한정판 과일 모찌, 새벽 5시부터 오픈런","잠실 롯데월드몰 매장에서만 한정 수량으로 파는 외국 브랜드 과일 모찌를 사려고 개장 전 새벽 5시부터 줄이 섰습니다. 담요를 덮고 누워 기다리는 사람도 있었습니다. SNS 입소문으로 퍼졌고, 그렇게까지 할 일이냐는 반응도 나옵니다.",[7,4,8,5],[L.ig("과일모찌"),L.th("잠실 모찌 오픈런"),L.naver("잠실 과일 모찌")],"sbsmochi"),
  i("cul","부산국제영화제, 11년 만에 최다 관객","상영 관객 200,043명으로 2015년 이후 가장 많았습니다. '암살자(들)' 감독과 배우는 안전 문제로 영화제에 불참했습니다.",[6,6,8,5],[L.naver("부산국제영화제 관객"),L.ig("biff")],"khbiff"),
  i("cul","'호프'·'암살자(들)', 평론과 관객 평점 크게 엇갈려","'호프'는 459만, '암살자(들)'은 308만 관객입니다. '암살자(들)' 네이버 평점은 정치 공방 속에 2점대까지 떨어졌다가 실관람객 평점은 9점 가까이 올랐습니다.",[7,5,7,5],[L.naver("암살자들 평점"),L.th("호프 결말")],"ktfilm"),
  i("acc","부천 도장공장 화재, 소방관 5명 등 7명 부상","16일 오전 8시 38분께 부천 오정구 내동의 4층짜리 도장공장 3층에서 불이 나 대응 2단계가 걸렸고, 약 2시간 20분 만인 11시께 꺼졌습니다. 소방관 1명은 심정지 상태로 병원에 옮겨졌습니다. 이재명 대통령이 진압과 인명 구조에 만전을 기하라고 지시했습니다.",[8,6,10,5],[L.naver("부천 공장 화재"),L.th("부천 화재")],"fnbc"),
  i("acc","인천 흉기난동 피의자 구속영장, 현금 680만원 소지","경찰이 살인미수 등 혐의로 구속영장을 신청했고 신상공개를 검토 중입니다. 광주에서도 15일 저녁 흉기로 상인을 위협한 50대 여성이 체포됐습니다.",[8,6,8,6],[L.naver("인천 흉기난동 구속영장"),L.ig("인천흉기난동")],"sbs3"),
  i("acc","제주 부녀 숨진 채 발견, 양육권 분쟁 속 경찰 대응 논란","호주에서 데려온 4살 딸과 아버지가 서귀포 차 안에서 숨진 채 발견됐습니다. 어머니는 수차례 도움을 요청했다고 주장하고, 경찰은 학대 정황은 없었고 양육권 집행 권한이 없었다고 밝혔습니다.",[7,6,7,6],[L.naver("제주 부녀 양육권"),L.th("제주 부녀")],"khjeju")
 ], cut:["밤사이 뉴욕증시 반등 (코스피 반등 항목에 포함)","북한, 남측 극초음속 시험 의문 제기에 국방부 반박 (5.5)","한화시스템 레이저 대공무기 드론 3대 요격 (5.3)","금융위 세종 이전 업계 우려 (5.0)","하정우·차정원 결혼 보도 (새 소식 없음)"]},

 us:{name:"미국", plats:[["Instagram","https://www.instagram.com/explore/"],["Reddit","https://www.reddit.com/r/news/"],["X","https://x.com/explore"]], items:[
  i("tech","증시 장 막판 반등, 다우 1% 넘게 상승","물가 충격으로 약세로 출발한 지수가 국채금리 하락에 반등했습니다. 나스닥과 S&P500도 소폭 올라 마쳤습니다.",[7,7,9,5],[L.rd("stock market rebound"),L.x("Dow")],"hbiz"),
  i("tech","테슬라 2세대 로드스터 공개, '2028년 생산'","9년 가까이 미뤄진 로드스터를 텍사스 스페이스X 시설에서 공개했습니다. 시연에서 0→60마일 0.81초를 찍었고, 냉각가스 추진기를 단 'Thrust' 모델은 계약금 25만달러로 예약을 받습니다. 가격은 발표하지 않았고, 머스크는 2028년 생산을 시작한다고 했습니다.",[8,6,10,6],[L.x("Tesla Roadster"),L.rd("Tesla Roadster unveil"),L.ig("teslaroadster")],"engroad"),
  i("tech","Character.AI 파산 신청, 디즈니에 자산 일부 2천만달러 매각","한때 기업가치 50억달러이던 AI 챗봇 회사가 챕터11을 신청했습니다. 10대 정신건강·자살 관련 소송이 이어진 뒤입니다. 서비스는 매각 절차 동안 유지됩니다.",[8,6,7,6],[L.rd("Character.AI bankruptcy"),L.x("Character AI"),L.tt("character ai")],"cai"),
  i("tech","사회보장연금 내년 3.6% 인상","7,000만 명 넘는 수급자의 연금이 1월부터 3.6% 오릅니다. 작년 인상률은 2.8%였습니다.",[7,8,8,6],[L.rd("Social Security COLA 2027"),L.x("COLA")],"dw"),
  i("tech","'아메리칸 드림' 비용 530만달러","내 집, 자녀 둘 대학, 은퇴 등 8가지 목표에 드는 돈이 1년 새 4.1% 늘었다는 보고서가 화제입니다.",[7,5,7,5],[L.rd("American Dream 5.3 million"),L.x("American Dream cost")],"dw"),
  i("pol","9월 물가 3.7%, 임금 상승(3%)보다 빨라","에너지 가격이 물가를 끌어올렸고 3주도 안 남은 중간선거에서 생활비가 핵심 쟁점입니다.",[8,9,8,8],[L.rd("CPI 3.7 inflation"),L.x("inflation")],"dn"),
  i("pol","법무부, 캘리포니아 '비시민권자 우편투표' 집계 중단 소송","11월 3일 선거에서 연방정부가 비시민권자로 보는 사람의 우편투표를 신분 확인 전까지 세지 말라는 소송입니다. 법무부는 약 2만 명 명단을 48시간 안에 검토하지 않았다고 주장하고, 셜리 웨버 주 국무장관은 증거가 없다며 '절박한 시도'라고 반박했습니다.",[8,8,8,7],[L.rd("DOJ sues California mail ballots noncitizens"),L.x("California ballots lawsuit")],"pbsca"),
  i("pol","일한 오마 의원 수사, '시민권 박탈 목표' 보도","WSJ는 국토안보부가 오마 의원의 귀화 과정을 문제 삼아 시민권 박탈과 추방을 겨냥하고 있다고 전했습니다. 요원들이 자택에서 여권 등을 압수했습니다.",[9,8,8,7],[L.rd("Ilhan Omar citizenship"),L.x("Ilhan Omar")],"dn"),
  i("pol","트럼프 '포트후드 총격범 총살형 생중계 안 한다'","생중계 계획에 대한 비판이 커지자 물러섰습니다. 집행은 12월로 예정돼 있습니다.",[8,6,8,5],[L.rd("Fort Hood execution livestream"),L.x("firing squad")],"pbs"),
  i("pol","트럼프 공화당 텃밭 순회, 토요일 켄터키 유세","몬태나 상원 경합 지원에 이어 북부 켄터키 유세를 잡았습니다. 조지아에서는 오소프와 콜린스가 맞붙습니다.",[7,8,8,7],[L.rd("Trump rally Kentucky"),L.x("midterms")],"dn"),
  i("pol","ICC 지지단체 제재에 법원 제동","뉴욕 연방판사가 표현의 자유 침해 가능성을 들어 두 단체에 대한 제재 집행을 막았습니다.",[6,6,8,6],[L.rd("ICC sanctions injunction")],"dn"),
  i("pol","미군, 이란 전투 재개 대비 'MOAB' 포함 타격안 마련","CNN은 트럼프가 교착된 이란 전쟁의 전투 재개를 지시할 경우 에너지 시설과 핵시설에 핵무기 다음으로 강력한 재래식 폭탄 'MOAB'를 쓰는 방안까지 검토하고 있다고 보도했습니다.",[8,8,9,7],[L.rd("MOAB Iran strike plans"),L.x("Mother of All Bombs Iran")],"std"),
  i("pol","미군 수백 명 중남미 투입, '마약과의 전쟁' 지상으로 확대","파나마 훈련시설을 거점으로 콜롬비아·온두라스 병력을 훈련합니다. 선박 공격 사망자는 239명 이상입니다.",[6,7,7,7],[L.rd("US troops Colombia Honduras"),L.x("Southern Command")],"dn"),
  i("cul","NLCS 4차전, 오타니 3점포에도 브루어스가 6회 역전","벼랑 끝 다저스가 2회 오타니의 3점 홈런으로 4-0으로 앞섰지만, 브루어스가 4·5회 동점을 만든 뒤 6회 미첼의 솔로 홈런으로 뒤집었습니다. 9회에 들어설 때 브루어스가 앞서 있었고, 이기면 1982년 이후 첫 월드시리즈입니다. 최종 결과는 이번 갱신에서 확인하지 못했습니다.",[9,5,10,5],[L.rd("Brewers Dodgers Game 4"),L.x("Brewers"),L.ig("brewers")],"cbsnlcs"),
  i("cul","뉴욕시 연기금, 이스라엘 채권 투자 중단","시 감사관이 채권 신용도 하락을 이유로 들었고 맘다니 시장이 환영했습니다.",[7,6,7,6],[L.rd("NYC pension Israel bonds"),L.x("Mamdani")],"dn"),
  i("cul","펜실베이니아 홍역 확산","현지 의사가 백신 접종을 호소하고 나섰습니다.",[6,6,7,7],[L.rd("Pennsylvania measles outbreak")],"pbs"),
  i("acc","위스콘신 경비행기 추락, 어린이 포함 6명 사망","조종사가 '결빙' 상황을 보고한 뒤 소크 카운티 숲에 떨어졌습니다.",[7,5,8,5],[L.rd("Wisconsin plane crash"),L.x("Wisconsin plane crash")],"dw"),
  i("acc","휴스턴 이민단속 요원, 달아나는 남성 차로 치어","해리스카운티 검찰이 형사 기소 여부를 검토합니다.",[7,6,7,6],[L.rd("ICE agent ran over Houston"),L.x("Houston ICE")],"dn")
 ], cut:["백악관 새 대변인 변호사 시험 불합격 보도 (새 소식 없음, 5.75)","식스플래그 조지아 롤러코스터 사망·9개 놀이기구 운영 중단 (10/13, 시의성 낮음)","FDA, 빵·치즈 등 139종 소금 대체제 허용 (5.5)","'브레이킹 배드' RJ 미트 사망 (새 소식 없음)","캘리포니아 강풍 단전 (새 소식 확인 못함)"]},

 jp:{name:"일본", plats:[["X (트렌드)","https://x.com/explore"],["TikTok","https://www.tiktok.com/explore"]], items:[
  i("tech","닛케이 7거래일 만에 반등, 오전장 1,124엔 올라","전날 4.9%(3,318엔) 급락해 64,425.95로 마친 닛케이가 16일 오전장을 1.75% 오른 65,550.68로 마쳤습니다. 도쿄일렉트론·소프트뱅크그룹 등 반도체·AI주가 올렸고, 프라임시장 종목 80% 넘게 상승했습니다.",[8,8,10,6],[L.x("日経平均 反発"),L.x("日経平均")],"kabu"),
  i("tech","TSMC 사상 최대 실적, 2나노 본격 양산","4분기 매출 전망을 523억~543억달러로 잡았습니다. 급락한 반도체주가 반등할지 주목됩니다.",[7,7,9,6],[L.x("TSMC 決算")],"tsmc"),
  i("pol","새 농림수산상에 다케베 아라타","야나 가즈오 전 장관이 선거법 위반 의혹 등으로 물러나자 다카이치 총리가 전 농림 부대신 다케베(56)를 기용했습니다. 총리는 야나를 밀어낸 적은 없다고 했습니다.",[7,7,9,5],[L.x("武部新 農水相"),L.x("農水相")],"niptb"),
  i("pol","다카이치 내각 지지율 42.4%, 취임 후 최저","지지통신 10월 조사에서 지난달보다 1.7%포인트 내려 다섯 달 연속 떨어졌습니다. 의혹이 쌓인 야나 전 농림수산상을 2주 넘게 자리에 둔 데 대한 비판이 반영된 것으로 풀이됩니다.",[7,7,8,6],[L.x("高市内閣 支持率"),L.x("内閣支持率 時事")],"nipjiji"),
  i("pol","다카이치 '러시아에서 스파이 활동 없다'","러시아가 홋카이도신문 기자를 간첩 혐의로 구금한 데 대해 부인했습니다. 정부는 아직 기자와 연락하지 못했고 영사 면회를 서두르고 있습니다.",[8,8,9,7],[L.x("北海道新聞 記者 拘束"),L.x("高市 スパイ")],"nipspy"),
  i("pol","한일 통화스와프 100억달러 3년 연장","2029년 11월까지 같은 규모로 연장합니다.",[5,7,8,6],[L.x("日韓通貨スワップ")],"ktswap"),
  i("cul","오타니, 26경기 만에 3점 홈런… 다저스는 역전 허용","NLCS 4차전에 1번 타자로 돌아온 오타니가 2회 3점 홈런으로 4-0을 만들었지만, 브루어스가 따라붙어 6회 미첼의 솔로 홈런으로 앞서갔습니다. 다저스는 3연패로 탈락 위기에 몰려 있습니다.",[9,5,10,5],[L.x("大谷翔平 3ラン"),L.x("ドジャース"),L.tt("大谷翔平")],"nikkan"),
  i("cul","드라마 '파도 잔잔히, 부부의 나날' 속편 15일 밤 시작","후지TV 목요극장이 15일 밤 10시 속편 방송을 시작했습니다.",[7,4,8,5],[L.x("波うららかに、めおと日和"),L.tt("めおと日和")],"pia"),
  i("acc","고베 거주 중국인 부부 체포, 호텔 냉장고 뒤에 PC 숨겨 피싱 메일 48만 통","효고현경은 두 사람이 손님으로 위장해 호텔에 들어가 냉장고 뒤에 컴퓨터를 숨기고, 호텔 와이파이로 피싱 메일 48만 통 이상을 보낸 혐의로 체포했습니다.",[6,5,9,5],[L.x("フィッシングメール ホテル 逮捕"),L.x("兵庫県警 フィッシング")],"std")
 ], cut:["고베 축제 수레 가로수 충돌 4명 부상 (10/12, 5.0)","Trepo '하반기 트렌드 예상' MAZZEL·슈가버니즈·setlog (10/1 조사, 시의성 낮음, 5.3)","치이카와·요아정·메로이 등 10/2 고교생 조사 항목 (새 소식 없음)"]},

 cn:{name:"중국", plats:[["웨이보 핫검색","https://s.weibo.com/top/summary"]], items:[
  i("tech","'쭌제 브레이크 페달 지지대 파손', 3개 부처 합동조사","둥처디 급제동 시험에서 쭌제 V800 세 대의 브레이크 페달 지지대가 모두 부러졌고, 같은 조건의 다른 8개 차종은 멀쩡했습니다. 공업정보화부·인터넷정보판공실·시장감독총국이 15일 합동조사팀을 꾸렸고, 쭌제는 '전적으로 협조하겠다'며 이미 판 차량에 무상 개선을 약속했습니다. 시험 조건이 국가 기준을 넘었다는 반론도 있습니다.",[8,7,10,7],[L.wb("三部门联合调查尊界刹车断裂"),L.wb("尊界")],"sinazj"),
  i("tech","팀 쿡 '애플 인텔리전스 중국 출시 승인'","실시간 번역, 사진 지우개, 글쓰기 도구 등이 승인됐고 이달 말 테스트 버전이 나옵니다.",[8,7,9,6],[L.wb("苹果智能 国行"),L.wb("库克")],"sina2"),
  i("tech","광저우 캔톤페어 개막, 서비스 로봇관 첫 등장","휴머노이드·4족 로봇, AI 번역기·안경이 해외 바이어 관심을 끌었습니다.",[6,6,8,5],[L.wb("广交会 机器人")],"sina2"),
  i("tech","머스크 '2029년 메모리 공급과잉, 중국 대량생산 때문'","중국이 2028년 RAM을 대량 생산할 것이라며 한국에 2~3년 안에 새 산업을 키우라고 했습니다.",[7,7,8,6],[L.wb("马斯克 内存")],"sina2"),
  i("tech","EU에 하이브리드차 양보, '유럽 시장 놓칠 수 없는 중국'","무역장벽이 늘자 중국이 EU에 하이브리드차 관련 양보를 했다는 분석입니다.",[6,7,7,7],[L.wb("中欧 混动车")],"wire"),
  i("tech","올해 무역흑자 1조2천억달러 페이스","1~8월 흑자가 8,055억달러로 집계됐습니다.",[6,7,6,7],[L.wb("贸易顺差")],"trend"),
  i("pol","왕이, 바쿠 아시아교류신뢰구축회의 참석","적대국 정상까지 모인 바쿠 회의에 시진핑 특사로 참석한 뒤 크로아티아·몬테네그로·불가리아를 돕니다.",[6,7,8,5],[L.wb("王毅 巴库")],"eunbaku"),
  i("cul","AI 쓴 직원 해고는 부당, 베이징 법원 1심","내부 감사 문서를 외부 AI에 올렸다 해고된 직원에게 '합리적 사용'이라며 손을 들어줬습니다. AI 시대 청년 취업 걱정과 함께 논쟁이 붙었습니다.",[8,6,8,6],[L.wb("使用AI被辞退"),L.wb("AI 就业")],"sina2"),
  i("cul","샤오잔 난징 콘서트 1분 만에 매진, '다마이 먹통'","502만 명이 '보고 싶다'를 눌렀고 두 회 2만2천여 장이 순식간에 팔렸습니다.",[8,4,9,5],[L.wb("肖战 南京"),L.wb("大麦崩了")],"xz"),
  i("cul","아이폰18 Pro 변색 논란","버건디 레드 모델 색이 변했다는 신고가 잇따랐습니다.",[7,5,8,4],[L.wb("iPhone18Pro 变色")],"sina2")
 ], cut:["B站 'AI 젠슨 황 월드투어' 영상 (새 소식 없음, 5.75)","사건사고: 최근 24시간 안에 확인된 큰 사건사고를 찾지 못해 비웠습니다.","몽골발 초원 화재 국경 차단 (10/13, 시의성 낮음, 5.0)","발해 해역 5G 개통 (5.0)","신압록강대교 개통 (개통 기사를 직접 확인하지 못해 제외)"]},

 etc:{name:"그 외", sub:"유럽·영국·중동", plats:[["X","https://x.com/explore"],["r/europe","https://www.reddit.com/r/europe/"],["r/worldnews","https://www.reddit.com/r/worldnews/"]], items:[
  i("tech","ECB, 우니크레디트의 코메르츠방크 인수 승인","지분 30% 초과를 허용해 2027년부터 경영권을 쥘 수 있게 됐습니다.",[6,7,8,7],[L.rd("UniCredit Commerzbank"),L.x("Commerzbank")],"euncb"),
  i("tech","유로존 국채 지도 뒤집혀, 벨기에가 그리스만큼 비싸게 빌려","프랑스는 이탈리아보다 높은 금리를 냅니다. IMF는 차입비용이 20년 만에 가장 높다고 경고했습니다.",[6,7,7,7],[L.rd("eurozone bond yields France Italy")],"eundebt"),
  i("tech","미국, 러 루크오일 제재 유예 2027년까지 연장","트럼프의 러시아산 디젤 거래와 함께 유럽 의원들의 반발이 나옵니다.",[6,7,8,6],[L.rd("Lukoil sanctions waiver"),L.x("Lukoil")],"eunlk"),
  i("pol","호르무즈 화물선 2척 침몰, 유조선 또 화재","GFS 프라이드호(21명 구조)와 케이프 다오호(1명 사망)가 가라앉았고, 하루 새 유조선 화재가 두 번 났습니다. 이란은 해협 통과에 허가가 필요하다고 밝혔습니다.",[9,9,9,8],[L.rd("Hormuz cargo ships sunk"),L.x("Hormuz")],"eunhz"),
  i("pol","후티, 예멘 아덴 대통령궁 공격, 5명 사망","후티 반군이 미사일과 드론으로 정부가 쓰는 아덴의 알마아시크 대통령궁을 공격해 5명이 숨지고 16명이 다쳤다고 예멘 보건장관이 밝혔습니다. 후티는 '사우디 군사작전 본부'를 노렸다고 주장했습니다. 후티와 사우디 사이 충돌이 커지는 가운데 나온 공격입니다.",[8,8,10,7],[L.rd("Houthi Aden palace"),L.x("Aden")],"f24"),
  i("pol","젤렌스키 '트럼프에 배신감', 러 정유시설 공격 재개","스타링크 제한 논란 속에 에너지 휴전을 접고 러시아 에너지 시설 공격을 재개했습니다. 러시아 드론 공격으로 키이우·하르키우에서 민간인 최소 9명이 숨지고 수십만 가구가 정전됐습니다.",[9,9,9,8],[L.rd("Zelensky betrayed Trump"),L.x("Zelensky"),L.x("Starlink")],"dn"),
  i("pol","EU 정상회의, 장기예산 합의 못 하고 끝나","일부 정상이 12월 시한을 거부했고 코스타 의장이 협상을 직접 맡습니다.",[7,8,8,7],[L.rd("EU summit budget"),L.x("EUCO")],"euneu"),
  i("pol","알바니아 티라나 학생 시위 사흘째 폭력 사태","라마 총리 퇴진을 요구하는 시위에서 방화와 경찰 충돌이 이어졌습니다.",[7,6,8,6],[L.rd("Tirana protests"),L.x("Tirana")],"euntr"),
  i("pol","젤렌스키, 다음 주 부다페스트 방문","10월 23일 초청을 받아 헝가리와 관계 회복에 나섭니다.",[6,7,7,6],[L.rd("Zelensky Budapest"),L.x("Magyar Zelensky")],"eunhu"),
  i("pol","노르트스트림 폭파 재판 독일서 시작","우크라이나 특수부대 출신 대위가 국가 주도 작전을 이끈 혐의를 받습니다.",[6,7,7,7],[L.rd("Nord Stream trial"),L.x("Nord Stream")],"dn"),
  i("pol","BBC, 트럼프 소송에서 증언 강제 요청","86억유로 명예훼손 소송에서 트럼프 측이 증언을 1월로 미루자 법원에 강제를 요청했습니다.",[7,5,8,6],[L.rd("BBC Trump deposition"),L.x("BBC Trump")],"eunbbc"),
  i("cul","해리·메건, 영국 복귀 6년 만에 첫 공동 공개 일정","노팅엄을 찾아 시민들과 만났습니다.",[8,5,8,5],[L.rd("Harry Meghan Nottingham"),L.x("Harry and Meghan"),L.ig("harryandmeghan")],"eunhm"),
  i("cul","샐리 루니 책, 영국 서점에서 빠져","팔레스타인 액션 지지 발언의 법적 위험 때문에 출판사가 영국 공급을 멈췄습니다. 이 단체 지지 혐의로 3,700명 넘게 체포됐습니다.",[8,6,8,6],[L.rd("Sally Rooney Faber"),L.x("Sally Rooney")],"dn"),
  i("cul","포르투·마드리드 주거 시위 확산","포르투에서 경찰이 텐트를 철거하며 최소 35명이 다쳤고, 마드리드 솔 광장 농성은 2주째입니다.",[7,6,8,7],[L.rd("Porto housing protest"),L.x("vivienda protesta")],"eunpt"),
  i("acc","루마니아 앞바다 화학 운반선 화재, 선원 7명 실종","흑해에서 화물선 드론 공격이 이어진 뒤 일어났습니다.",[6,7,8,6],[L.rd("Romania tanker fire Black Sea"),L.x("Black Sea drone")],"dn"),
  i("acc","예멘 내전 격화, 80만 명 구호 끊겨","타이즈 주요 병원은 2주 안에 필수 의약품이 바닥난다고 경고했습니다.",[6,8,8,8],[L.rd("Yemen WFP aid"),L.x("Yemen")],"dn")
 ], cut:["채널터널 근처 미니버스·열차 충돌 19명 부상 (5.5)","마드리드 솔 광장 농성 지친 시위대 (포르투 항목에 포함)","몽블랑 높이 상승 (새 소식 없음)","교황 레오 수술 (새 소식 확인 못함)"]}
};


// 깃허브 트렌딩(오늘·전체 언어). GitHub 순서 그대로 넣습니다. 점수는 매기지 않습니다.
// g(저장소, 한국어 설명, 언어, 전체 별, 오늘 받은 별)
const g = (repo,d,lang,stars,today)=>({repo,d,lang,stars,today});
const GH = {date:"2026.10.16", url:"https://github.com/trending?since=daily", items:[
  g("morluto/rea","에이전트로 앱 동작부터 네이티브 바이너리까지 무엇이든 역공학(리버스 엔지니어링)하는 도구입니다.","TypeScript",273370,32314),
  g("anthropics/claude-plugins-official","Anthropic이 직접 관리하는 고품질 Claude Code 플러그인 모음입니다.","Python",39217,307),
  g("K-Dense-AI/scientific-agent-skills","AI 에이전트를 'AI 과학자'로 만드는 스킬 모음입니다. 생물·화학·의학·신약개발용 검증된 스킬 177개와 과학 데이터베이스 100여 개를 담았습니다.","Python",50596,1091),
  g("JuliusBrussee/caveman","'원시인 말투'로 짧게 대답하게 해서 코딩 에이전트의 토큰 사용을 65% 줄여 준다는 스킬이자 프록시입니다.","Go",112644,433),
  g("debpalash/VoiceStudio","내 컴퓨터에서만 돌아가는 오픈소스 음성 도구로, ElevenLabs 대체를 내세웁니다. 목소리 복제·더빙·받아쓰기·오디오북 제작을 646개 언어로 지원합니다.","Python",69283,3024),
  g("obra/superpowers","AI 코딩 에이전트용 스킬 프레임워크이자 개발 방법론입니다.","Shell",299994,582),
  g("ruvnet/ruflo","여러 AI 에이전트를 한 팀으로 묶어 자동 작업을 돌리는 도구입니다. 기억·자가학습·RAG를 지원하고 Claude Code·Codex 등과 연동됩니다.","TypeScript",75187,147),
  g("mksglu/context-mode","AI 코딩 에이전트의 대화 공간(컨텍스트)을 아껴 주는 도구입니다. 도구 출력을 98% 줄이고 세션 기억을 유지합니다.","TypeScript",29834,904),
  g("NationalSecurityAgency/ghidra","미국 국가안보국(NSA)이 공개한 소프트웨어 역공학 프레임워크입니다.","Java",88888,1369),
  g("affaan-m/ECC","Claude Code·Codex·Cursor 같은 코딩 에이전트의 성능을 끌어올리는 스킬·기억·보안 설정 모음입니다.","JavaScript",280490,1013)
]};
