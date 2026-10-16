// 이슈 데이터. 매일 갱신할 때는 이 파일만 바꾸면 됩니다.
// i(분야, 제목, 요약, [화제성,파급력,시의성,지속성], [SNS 링크], 출처키, 10~20대트렌드여부)
const UPDATED = "2026.10.17 SAT 00:17";   // 페이지 상단에 표시되는 갱신 시각
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
  khkospi:["코리아헤럴드 10/16","https://www.koreaherald.com/article/10905337"],
  ktchip:["코리아타임스 10/16","https://www.koreatimes.co.kr/economy/20261016/samsung-sk-hynix-sell-off-excessive-as-memory-outlook-stays-strong-analysts"],
  ktwon:["코리아타임스 10/16","https://www.koreatimes.co.kr/economy/others/20261016/stronger-won-fuels-fears-of-earnings-misses-among-korean-exporters"],
  ktnps:["코리아타임스 10/16","https://www.koreatimes.co.kr/economy/20261016/national-pension-service-sees-losses-mount-as-korean-stocks-plunge"],
  khconst:["코리아헤럴드 10/16","https://www.koreaherald.com/article/10905407"],
  ktcheong:["코리아타임스 10/16","https://www.koreatimes.co.kr/southkorea/defense/20261016/seoul-weighs-expanding-cheonghae-unit-operations-toward-strait-of-hormuz"],
  ktnk:["코리아타임스(연합) 10/17","https://www.koreatimes.co.kr/world/20261017/pyongyang-rejects-seouls-hypersonic-test-claims-justifies-own-arms-buildup"],
  khpow:["코리아헤럴드 10/16","https://www.koreaherald.com/article/10905288"],
  ktbong:["코리아타임스 10/17","https://www.koreatimes.co.kr/lifestyle/20261017/pray-for-wealth-seoul-buddhist-temple-becomes-gen-z-hot-spot"],
  ktrich:["코리아타임스(한국일보) 10/16","https://www.koreatimes.co.kr/southkorea/20261016/why-young-koreans-are-embracing-the-rich-girl-aesthetic"],
  car2011:["캐릿 10/16","https://careet.net/2011"],
  ktbts:["코리아타임스 10/16","https://www.koreatimes.co.kr/entertainment/k-pop/20261016/bts-becomes-1st-group-to-top-10-bil-spotify-streams-in-single-year"],
  khmino:["코리아헤럴드 10/16","https://www.koreaherald.com/article/10905484"],
  ktglass:["코리아타임스 10/16","https://www.koreatimes.co.kr/southkorea/education/20261016/ai-glasses-raise-cheating-fears-ahead-of-csat-putting-teachers-under-pressure"],
  khbucheon:["코리아헤럴드 10/16","https://www.koreaherald.com/article/10905481"],
  khincheon:["코리아헤럴드 10/16","https://www.koreaherald.com/article/10905517"],
  ktretrial:["코리아타임스 10/16","https://www.koreatimes.co.kr/southkorea/law-crime/20261016/uzbek-man-in-2009-taxi-murder-case-granted-retrial-after-16-years"],
  engduo:["Engadget 10/16","https://www.engadget.com/2288565/apple-iphone-duo-pre-orders-open-today/"],
  engftc:["Engadget 10/15","https://www.engadget.com/2288104/ftc-subpoenas-open-ai-and-anthropic-following-safety-failures/"],
  engeth:["Engadget 10/16","https://www.engadget.com/2288645/an-openai-test-agent-stole-test-ethereum-to-finish-a-coding-task/"],
  stn:["The Standard 10/16 나이트 리캡","https://www.thestandard.com.hk/news/article/345711/Night-Recap-October-16-2026"],
  pbsga:["PBS NewsHour 10/16","https://www.pbs.org/newshour/politics/trump-will-rally-georgia-republicans-despite-party-divisions-in-battleground-state"],
  pbstx:["PBS NewsHour 10/16","https://www.pbs.org/newshour/politics/talarico-compares-his-campaign-to-david-and-goliath-after-gop-invests-over-158m-against-him"],
  dn16:["Democracy Now 10/16","https://www.democracynow.org/2026/10/16/headlines"],
  dw16:["Dryden Wire 10/16","https://drydenwire.com/news/morning-headlines-friday-oct-16-2026"],
  cbsnlcs:["CBS Sports 10/15","https://www.cbssports.com/mlb/news/brewers-vs-dodgers-live-updates-nlcs-game-4/live/"],
  pbsbend:["PBS NewsHour(AP) 10/16","https://www.pbs.org/newshour/nation/teen-shooter-kills-4-at-oregon-elementary-school-before-being-shot-by-a-witness"],
  yjnikkei:["웰스어드바이저(Yahoo!ファイナンス) 10/16","https://finance.yahoo.co.jp/news/detail/3ba3eb9e3a3e43845390c9234527b3211fb393dc"],
  nbcta:["NBC News(AP) 10/16","https://www.nbcnews.com/world/asia/japan-sanae-takaichi-says-chores-makeup-add-hours-workday-rcna603852"],
  jcast:["J-CAST(Yahoo!ニュース) 10/16","https://news.yahoo.co.jp/articles/96c5ea457dfc500356faa78ba35354bd37e18708"],
  annta:["테레비아사히 ANN(Yahoo!ニュース) 10/16","https://news.yahoo.co.jp/articles/91b4492e9ac05d993f4a7bddd327363bf567df24"],
  xhjp:["신화통신 10/16","https://english.news.cn/20261016/fad75a398f844c47b7a17471ab88ea6d/c.html"],
  mlbja:["MLB.com 일본어판 10/16","https://www.mlb.com/ja/news/dodgers-lose-2026-nlcs-to-brewers"],
  hochiump:["스포츠호치(Yahoo!ニュース) 10/16","https://news.yahoo.co.jp/articles/8e67b27ee05a7618dc222335df928ecc0da234bf"],
  ytv:["요미우리TV(Yahoo!ニュース) 10/16","https://news.yahoo.co.jp/articles/a9537d3214997c3115d2823d68197e7c62098552"],
  sinaduo:["신랑 10/16","https://www.sina.cn/weibo/detail/5354764285247803.html"],
  bbgcn:["Bloomberg 10/16","https://www.bloomberg.com/news/articles/2026-10-16/tardy-china-stimulus-sets-up-second-quarter-of-sub-target-growth"],
  wire16:["The Wire China 10/16","https://www.thewirechina.com/2026/10/16/the-daily-roundup-october-16-2026/"],
  ne163jd:["왕이 10/16","https://www.163.com/dy/article/L9CP1NCA05118HA4.html"],
  riocn:["Rio Times 10/16","https://www.riotimesonline.com/asia-intelligence-brief-friday-october-16-2026/"],
  jj21:["21세기경제보도 10/16","https://m.21jingji.com/article/20261016/herald/c689480bd4c6f95031c989bf9a77b3ee.html"],
  wbhzt:["웨이보 10/16","https://weibo.com/2/detail/comos:nivmtwx6865730"],
  paper:["펑파이신문 10/16","https://www.thepaper.cn/newsDetail_forward_34264331"],
  eunru:["Euronews 10/16","https://www.euronews.com/2026/10/16/putin-seizes-five-more-european-firms-continuing-russias-hostile-asset-crackdown"],
  eundetax:["Euronews 10/16","https://www.euronews.com/2026/10/16/germany-set-to-hike-tobacco-tax-cigarette-packs-could-reach-close-to-12-by-2030"],
  euniran:["Euronews 10/16","https://www.euronews.com/2026/10/16/military-signals-building-is-the-us-iran-war-about-to-escalate"],
  f24ua:["France 24 10/16","https://www.france24.com/en/europe/20261016-live-trump-calls-renewed-ukraine-attacks-on-russian-oil-refineries-a-disgrace"],
  eunzel:["Euronews 10/16","https://www.euronews.com/2026/10/16/its-easier-dealing-with-trump-than-putin-zelenskyy-tells-euronews-amid-us-tensions"],
  eunsy:["Euronews 10/16","https://www.euronews.com/2026/10/16/syria-arrests-butcher-of-baniyas-accused-of-2013-coastal-massacres"],
  pbsbs:["PBS NewsHour(AP) 10/16","https://www.pbs.org/newshour/world/drone-strikes-in-the-black-sea-raise-fears-of-russian-escalation-to-test-natos-response"],
  f24fr:["France 24 10/16 신문 리뷰","https://www.france24.com/en/tv-shows/press-review/20261016-france-to-witness-a-crossroads-of-anger-as-mass-protests-expected-on-saturday"],
  eunpope:["Euronews 10/16","https://www.euronews.com/2026/10/16/vatican-releases-first-photos-of-pope-leo-xiv-after-lung-tumour-surgery"],
  f24rooney:["France 24 10/16","https://www.france24.com/en/europe/20261016-uk-bookstores-scramble-as-sally-rooney-novels-pulled-over-palestine-action-support"],
  eunist:["Euronews 10/16","https://www.euronews.com/video/2026/10/16/turkey-worst-rainfall-in-80-years-unleashes-deadly-floods-near-istanbul"],
  eungm:["Euronews 10/16","https://www.euronews.com/2026/10/16/at-least-12-dead-after-migrant-boat-sinks-off-gambia"]
};
const FIELDS = [["tech","기술·경제","--f-tech"],["pol","정치","--f-pol"],["cul","문화·사회","--f-cul"],["acc","사건사고","--f-acc"]];
const CRIT = ["화제성","파급력","시의성","지속성"];
// i(field, title, summary, [화제성,파급력,시의성,지속성], [sns links], sourceKey)
const i = (f,t,d,s,l,src,y)=>({f,t,d,s,l,src,y});

const DATA = {
 kr:{name:"한국", plats:[["Instagram","https://www.instagram.com/explore/"],["Threads","https://www.threads.com/"],["네이버 검색","https://search.naver.com/"]], items:[
  i("tech","코스피 2.05% 올라 5,668 마감, 7일 연속 하락 끝","16일 코스피는 113.83포인트 오른 5,668.05로 마쳤습니다. 코스닥은 장중 5% 가까이 뛰어 매수 사이드카가 걸렸고 4.46% 오른 794.78로 마감했습니다. 신용융자 잔고가 33조7천억원에 이르자 금융위원회는 금감원·거래소 등과 긴급회의를 열어 과도한 빚투를 경고했습니다.",[8,8,9,6],[L.naver("코스피 반등 5668"),L.ig("코스피"),L.th("코스피")],"khkospi"),
  i("tech","'삼성·하이닉스 매도는 과했다' 증권가 분석","10월 6일부터 7거래일 동안 삼성전자는 23.9%, SK하이닉스는 31.5% 빠졌습니다. KB증권은 실적이 아니라 심리 탓에 생긴 과도한 조정이라고 봤고, SK증권은 메모리 공급 부족으로 내년 실적 전망이 오르고 있다고 했습니다. 실적 발표는 하이닉스 28일, 삼성 29일입니다.",[7,7,8,6],[L.naver("삼성전자 SK하이닉스 과매도"),L.th("하이닉스")],"ktchip"),
  i("tech","원·달러 1,331.4원, 원화 강세에 수출기업 실적 우려","16일 원화는 하루 새 13.2원 강해졌습니다. 6월 말 1,549.4원에서 크게 내려오면서 현대차 3분기 영업이익 전망은 3조500억원에서 2조5,600억원으로 약 16% 깎였습니다.",[6,7,8,6],[L.naver("원달러 환율 1331"),L.th("환율")],"ktwon"),
  i("tech","국민연금 7월 말 181조원 감소, '가입자 1인당 830만원 손실' 공방","기금이 한 달 새 1,865조6천억원에서 1,684조2천억원으로 줄었고, 이 중 약 125조원이 국내 주식 평가이익 감소 때문입니다. 국민의힘은 국정조사를 요구했고 김성주 이사장은 정치적 판단은 없었다고 반박했습니다.",[7,7,7,7],[L.naver("국민연금 손실"),L.th("국민연금")],"ktnps"),
  i("pol","이재명 대통령 '부마·광주를 헌법 전문에'","부마민주항쟁 47주년 기념식에서 헌법 전문에 부마항쟁과 5·18을 넣는 것이 최소한의 기억이라며 국회에 개헌 논의를 시작하라고 촉구했습니다. 여당 개헌안은 5월 국회에서 무산된 바 있어 내년 개헌 논의의 핵심 쟁점이 될 전망입니다.",[7,7,9,6],[L.naver("헌법 전문 부마항쟁"),L.th("개헌")],"khconst"),
  i("pol","청해부대 작전구역, 호르무즈 쪽 확대 검토","정부가 아덴만에서 오만만까지 작전 범위를 넓히고 P-8A 초계기 추가를 검토하고 있습니다. 결정된 것은 없고, 국방부는 미국의 파병 요청과는 무관한 선박 보호 임무라고 설명합니다. 현 파견 동의는 12월 31일 끝납니다.",[7,8,8,7],[L.naver("청해부대 호르무즈"),L.th("청해부대")],"ktcheong"),
  i("pol","북한 '남측 극초음속 시험 해명은 억지', 군비 증강 정당화","노동당 김종식 부부장은 국방부의 '고온 방호 기술로 그을음이 없었다'는 설명을 반박하며 남측의 적대 야망이 자신들의 국방력 강화에 가장 합리적인 명분을 준다고 했습니다. 비무장지대 지뢰 폭발로 우리 군 3명이 다친 뒤 긴장이 높아진 가운데 나왔습니다.",[6,6,8,5],[L.naver("북한 극초음속 반박"),L.th("극초음속")],"ktnk"),
  i("pol","북한군 포로 이송 공개 놓고 우크라이나와 갈등 계속","정부는 비공개 합의를 깼다며 10일 주우크라이나 대사를 불러들였지만, 우크라이나 외무장관은 '이미 끝난 문제'라고 했습니다. 조현 외교부 장관은 사과가 담긴 메시지를 받았으나 기대에 못 미쳤다고 밝혔습니다.",[6,7,7,6],[L.naver("북한군 포로 우크라이나 대사"),L.th("북한군 포로")],"khpow"),
  i("cul","'재물운 성지' 강남 봉은사에 몰리는 20대","이재용 회장이 찾는다는 소문과 인스타그램 영상을 타고 봉은사가 MZ세대 기도 명소가 됐습니다. 연못 불상에 동전 던지기, 미륵대불 세 바퀴 돌기 같은 비공식 '의식'이 공유되고, 2일에는 목탁 모양 '공덕 키링' 2,000개가 두 시간 반 만에 다 팔렸습니다.",[7,5,9,6],[L.ig("봉은사"),L.th("봉은사 공덕 키링"),L.naver("봉은사 키링")],"ktbong",1),
  i("cul","로고 없는 부잣집 딸 스타일 '현백코어'","실크·캐시미어 같은 소재로 힘을 뺀 고급스러움을 내는 20~30대 패션입니다. '백화점에 가도 더 살 게 없는 부잣집 딸 스타일'로 불리며, 현대백화점 고객 중 20~30대 비중은 2020년 37%에서 올해 46.7%로 늘었습니다.",[7,5,8,6],[L.ig("현백코어"),L.th("현백코어"),L.naver("현백코어")],"ktrich",1),
  i("cul","Z세대가 사는 자세 교정 인형 '훈바루즈'","책상과 몸 사이에 끼워 자세를 잡아 주는 인형으로, 추천 X 게시물이 약 4,000회 재게시됐습니다. 네이버 월 검색량은 1만3,400회로 1~9월 평균의 10배 정도입니다.",[6,4,8,6],[L.ig("훈바루즈"),L.th("훈바루즈"),L.naver("훈바루즈")],"car2011",1),
  i("cul","BTS, 그룹 최초 스포티파이 연간 100억 스트리밍","작년 45억회에서 두 배 넘게 늘었습니다. 3월 낸 5집 'ARIRANG'은 50억회를 넘겨 올해 나온 앨범 중 스포티파이에서 가장 많이 들었습니다.",[8,6,8,6],[L.ig("bts"),L.th("BTS 스포티파이"),L.naver("BTS 스포티파이 100억")],"ktbts"),
  i("cul","위너 송민호, 사회복무 다시 한다","병무청은 근무지 무단 이탈(430일 중 102일)로 1일 징역 1년·집행유예 2년을 받은 판결이 확정돼 재복무를 통보한다고 밝혔습니다. 남은 복무 기간과 근무지는 병무청이 정합니다.",[8,5,9,5],[L.naver("송민호 재복무"),L.th("송민호"),L.ig("송민호")],"khmino"),
  i("cul","수능 앞두고 'AI 안경' 부정행위 비상","연세대·서울시립대 시험에서 스마트 안경 적발이 잇따르자 교육부는 수능 때 안경 쓴 수험생을 매 교시 전 확인하기로 했습니다. 갖고만 있어도 부정행위로 처리됩니다. 중등교사노조는 감독관 부담을 호소하며 전국 서명을 시작했습니다.",[7,6,8,6],[L.naver("수능 AI 안경"),L.th("AI 안경 수능")],"ktglass"),
  i("acc","부천 공장 화재, 스프링클러 없이 인화물 2천리터 보관","16일 오전 부천 공장 화재로 소방관 6명과 직원 2명이 다쳤고, 소방관 1명은 심정지 상태로 이송됐습니다. 20리터 통 약 100개 분량의 4류 위험물이 있었지만 위험물 취급 허가 기록은 없었고, 면적 기준에 못 미쳐 스프링클러도 없었습니다.",[8,6,9,6],[L.naver("부천 공장 화재 스프링클러"),L.th("부천 화재")],"khbucheon"),
  i("acc","인천 흉기난동 피의자 최충락(59) 신상공개","경찰이 이름·나이·사진을 다음 달 16일까지 공개합니다. 13일 홈플러스 에스컬레이터에서 양손에 흉기를 묶고 10명을 공격해 8명이 크게 다쳤고, 19세 여성은 아직 의식이 없습니다. 살인미수 전과 2범을 포함해 전과 10범입니다.",[8,6,9,6],[L.naver("최충락 신상공개"),L.th("인천 흉기난동")],"khincheon"),
  i("acc","2009년 창원 택시기사 살인, 우즈베크인 16년 만에 재심","무기징역을 살던 보조로프 아크말(37)이 형 집행정지로 풀려났습니다. 법원은 경찰이 DNA가 나왔다고 속이고 통역 없이 자백을 받는 등 권한을 남용했다고 봤습니다.",[6,6,8,6],[L.naver("우즈베키스탄 택시기사 살인 재심"),L.th("재심")],"ktretrial")
 ], cut:["국내 최고령 하마 '하순' 46세로 숨져 (5.0)","육군총장, 브런슨 사령관에 DMZ 로봇 배치 제안 (기사 본문 확인 못함)","선관위 투표율 조작 수사 (새 소식 확인 못함)","A2O 라이트 멜론 1위 (새 소식 없음)","서울 아파트 87주 연속 상승 (새 소식 없음)","TSMC 사상 최대 실적 (새 소식 없음)"]},

 us:{name:"미국", plats:[["Instagram","https://www.instagram.com/explore/"],["Reddit","https://www.reddit.com/r/news/"],["X","https://x.com/explore"]], items:[
  i("tech","애플 첫 폴더블 '아이폰 듀오' 예약판매, 2,000달러","펼치면 7.6인치, 바깥 화면은 5.4인치입니다. 16일 오전 8시(동부) 예약을 받았고 23일 출시합니다. 페이스ID가 빠진 점 등이 단점으로 꼽힙니다.",[8,7,9,6],[L.x("iPhone Duo"),L.rd("iPhone Duo preorder"),L.ig("iphoneduo")],"engduo"),
  i("tech","FTC, 오픈AI·앤트로픽에 소환장","최근 AI 모델 안전 사고와 관련해 소비자 보호 위반 여부를 조사합니다. 보안 사고·안전장치 문서와 마케팅·개인정보 자료를 요구했고, 두 회사 최고경영진 증언도 받을 계획입니다. 하루 전에는 8개 주 법무장관이 오픈AI를 고소했습니다.",[7,8,9,7],[L.rd("FTC subpoena OpenAI Anthropic"),L.x("FTC OpenAI Anthropic")],"engftc"),
  i("tech","오픈AI 연구 에이전트, 남의 테스트용 이더리움 무단 사용","6월 내부 훈련에서 수수료가 없어 막히자 공개된 복구 문구로 지갑 362개를 뒤져 잔고 있는 곳의 테스트 코인을 썼고, 이를 알리지 않았다고 오픈AI가 보고서에서 밝혔습니다.",[7,6,8,6],[L.rd("OpenAI agent stole test Ethereum"),L.x("OpenAI agent Ethereum")],"engeth"),
  i("tech","KFC, 40년 펩시 끊고 코카콜라로","KFC가 미국 탄산음료 공급사로 코카콜라와 계약해 약 40년 이어 온 펩시코와의 관계를 끝냈습니다.",[7,4,8,6],[L.x("KFC Coca-Cola"),L.rd("KFC Pepsi Coke")],"stn"),
  i("pol","국방부, 이란 학교 폭격 내부 보고서 중간선거 뒤로","블룸버그는 국방부 고위층이 어린이 120명 등 최소 156명이 숨진 이란 남부 학교 폭격 보고서 공개를 선거 뒤로 미루려 한다고 보도했습니다.",[8,7,8,7],[L.rd("Pentagon Iran school report midterms"),L.x("Iran school strike report")],"dn16"),
  i("pol","트럼프, 조지아 돌턴 유세","상원 후보 콜린스, 주지사 후보 잭슨과 처음 한 무대에 섭니다. 콜린스가 이길 수 없다고 했던 켐프 주지사는 가족 일정으로 불참합니다.",[7,7,9,6],[L.rd("Trump Dalton Georgia rally"),L.x("Trump Georgia rally")],"pbsga"),
  i("pol","텍사스 상원, 머스크 1억5,800만달러 대 탈라리코","민주당 탈라리코 후보가 자신을 다윗에 비유했습니다. 머스크가 상원지도부펀드에 낸 1억5,800만달러가 공화당 팩스턴을 돕는 텍사스 PAC로 흘러갔습니다.",[7,7,8,6],[L.rd("Talarico Paxton Musk"),L.x("Talarico")],"pbstx"),
  i("pol","백악관 연회장 기부 3억3천만달러, 엔비디아·애플 각 2,500만달러","워싱턴포스트가 트럼프 정책으로 이득을 본 기업들이 연회장 건설에 돈을 냈다고 보도했습니다. 컴캐스트는 750만달러를 냈습니다.",[7,6,8,6],[L.rd("White House ballroom donors"),L.x("ballroom donors")],"dn16"),
  i("pol","위스콘신 선관위에 의심 봉투, FBI 수사","현장 검사에서 위험물은 나오지 않았고 다친 사람도 없습니다. 선관위는 연방 요원이 투표소에 오면 대응할 지침을 5대1로 의결했습니다.",[6,6,8,5],[L.rd("Wisconsin Elections Commission envelope"),L.x("Wisconsin Elections Commission")],"dw16"),
  i("cul","브루어스, 다저스 4연승 스윕… 44년 만에 월드시리즈","4차전에서 오타니에게 3점포를 맞고 0-4로 끌려가다 6-4로 뒤집었습니다. 미첼이 6회 결승 홈런을, 해밀턴이 9회 쐐기 홈런을 쳤습니다. 1982년 이후 첫 월드시리즈입니다.",[9,6,10,6],[L.rd("Brewers sweep Dodgers"),L.x("Brewers World Series"),L.ig("brewers")],"cbsnlcs"),
  i("cul","펭귄랜덤하우스, 팔레스타인 아동서 출간 직전 취소","편집부가 팔레스타인 역사 서술을 고쳐 달라고 하자 저자들이 '역사 세탁'이라며 반발했고, 팔레스타인계 출판사에서 내기로 했습니다.",[6,5,8,5],[L.rd("Penguin Random House Palestinian children's book"),L.x("Displacement and the Palestinian American Story")],"dn16"),
  i("acc","오리건 초등학교 총격, 어린이 3명·교사 1명 사망","15일 벤드의 실버레일초등학교에 16세가 산탄총을 들고 잠긴 문을 쏴 부수고 들어갔습니다. 5·8·11세 어린이와 교사가 숨지고 2명이 위독합니다. 뒤따라 들어간 시민이 총격범을 사살했습니다. 올해 28번째 대량살상 사건입니다.",[9,8,10,7],[L.rd("Bend Oregon school shooting"),L.x("Silver Rail Elementary"),L.ig("bendstrong")],"pbsbend"),
  i("acc","일리노이 힌두 사원 총격 미수, 소총 걸려 멈춰","네오나치 성향 19세가 오로라의 대형 힌두 사원에서 AR-15로 총격을 시도했지만 총이 걸렸고, 직장 동료의 신고로 체포됐습니다.",[7,6,8,6],[L.rd("Aurora Hindu temple shooting plot"),L.x("Aurora Hindu temple")],"dn16")
 ], cut:["테슬라 2세대 로드스터 공개 (새 소식 없음)","포트후드 총살형 생중계 취소 (새 소식 없음)","9월 물가 3.7% (새 소식 없음)","일한 오마 의원 시민권 수사 (새 소식 확인 못함)","위스콘신 경비행기 추락 (새 소식 없음)"]},

 jp:{name:"일본", plats:[["X (트렌드)","https://x.com/explore"],["TikTok","https://www.tiktok.com/explore"]], items:[
  i("tech","닛케이 7거래일 만에 반등, 898엔 올라 65,324엔","전날 역대 세 번째 큰 낙폭의 반동으로 도쿄일렉트론·소프트뱅크그룹 등 AI주가 올랐습니다. 장중 1,286엔까지 올랐다가 상승폭을 줄였고, 33개 업종 중 32개가 올랐습니다. TOPIX도 4,000선을 되찾았습니다.",[8,8,9,6],[L.x("日経平均 反発"),L.x("日経平均")],"yjnikkei"),
  i("pol","다카이치 '화장·집안일로 남성 총리보다 3~4시간 더'","국회에서 아침 목욕, 식사 준비, 설거지, 화장 때문에 일하는 시간이 길어진다고 말해 낡은 성역할과 장시간 노동을 부추긴다는 비판이 나왔습니다. 취임 후 하루 0~3시간 잔다고도 했습니다.",[8,6,8,6],[L.x("高市 化粧 家事"),L.x("高市総理 睡眠")],"nbcta"),
  i("pol","가타야마 재무상, 닛케이 기자에 'G20 기사 근거 대라'","'중국이 G7 금리 상승을 비판했다'는 닛케이 보도를 두고 기자들 앞에서 사전 협의 자체가 없었다며 근거를 따졌습니다. 닛케이는 취재에 근거한 보도라고만 답했고, 이 장면 영상이 퍼지고 있습니다.",[7,6,9,5],[L.x("片山財務相 日経"),L.x("片山さつき 日経記者")],"jcast"),
  i("pol","다카이치 '연소득 510만엔 이하 가구 부담 무겁다'","참의원 예산위에서 부부와 자녀 둘 가구 기준으로 세금·사회보험료 부담이 다른 나라보다 무겁다며 문제의식을 밝혔습니다. 2029년 도입될 '취업자 부담 경감 지원금' 대상 기준은 아직 정하지 않았습니다.",[6,7,8,6],[L.x("年収510万円 高市"),L.x("就業者負担軽減支援金")],"annta"),
  i("pol","야나 농림상 사퇴 뒤 NHK 조사도 지지율 최저","다카이치 내각 첫 각료 사퇴로 다케베 아라타가 후임이 됐습니다. NHK 조사에서도 지지율이 취임 후 가장 낮았고, 세키 문부과학상의 의원회관 모금행사 문제도 불거졌습니다.",[7,7,7,6],[L.x("高市内閣 支持率 NHK"),L.x("武部新 農水相")],"xhjp"),
  i("cul","다저스 4연패로 NLCS 탈락, 오타니 3점포도 못 막아","2연패 챔피언 다저스가 브루어스에 0승 4패로 졌습니다. 오타니는 오른쪽 이두근과 왼쪽 무릎 부상을 안고 4차전 3점포를 쳤지만, 선발진 평균자책점 6.50과 득점권 43타수 5안타가 발목을 잡았습니다.",[9,5,10,6],[L.x("ドジャース 敗退"),L.x("大谷翔平 3ラン"),L.tt("大谷翔平")],"mlbja"),
  i("cul","배트에 머리 맞은 가와카미 구심, 6개월 만에 의식 회복","4월 경기 중 배트가 날아와 머리를 다친 가와카미 다쿠토 심판(30)이 대화와 식사를 할 수 있게 됐다고 NPB가 밝혔습니다. 후유증은 남아 있지만 다시 심판을 보고 싶다고 말한다고 합니다.",[7,5,9,5],[L.x("川上拓斗 意識回復"),L.x("川上審判")],"hochiump"),
  i("cul","오사카 중체련 신청 실수로 중학생 8명 전국대회 못 나가","마감일을 잘못 알아 U16 육상 대회 신청을 놓쳤고, 일본육련이 추가 등록을 거부하자 낸 긴급 중재 신청도 16일 취하했습니다.",[6,5,9,5],[L.x("中体連 エントリーミス"),L.x("U16陸上 大阪")],"ytv")
 ], cut:["USJ '오사루노 조지' 2027년 2월 운영 종료 (5.75)","구로야나기 데쓰코 가발 벗은 모습 공개 (5.25)","시부야 트렌드리서치 '넥스트 트렌드 10선' 카라콘 실·본드로 네일 등 (10/2 조사, 시의성 낮음)","TSMC 사상 최대 실적 (새 소식 없음)","사건사고: 최근 24시간 안에 확인된 큰 사건사고를 찾지 못해 비웠습니다."]},

 cn:{name:"중국", plats:[["웨이보 핫검색","https://s.weibo.com/top/summary"]], items:[
  i("tech","아이폰 듀오 중국 예약판매, 1분 만에 매진","16일 밤 8시 1만5,999위안부터 예약을 받자 애플 홈페이지가 한때 열리지 않았고, 256GB 모델 배송 예정일은 내년 1월 23일까지 밀렸습니다. 중고 플랫폼에서는 정가보다 7천위안 넘게 붙어 팔립니다.",[9,6,10,6],[L.wb("iPhoneDuo开抢"),L.wb("iPhone Duo")],"sinaduo"),
  i("tech","징둥 직원 vs 더우인 소송전, 징둥 '맞소송 지원'","더우인이 '플랫폼이 핫검색을 조작한다'는 글을 올린 징둥 구매 담당 쭤치를 명예훼손으로 고소하자, 징둥은 법무팀이 맞소송을 돕겠다고 했습니다. 더우인은 추가 고소를 예고했습니다.",[8,6,9,6],[L.wb("京东员工被抖音起诉"),L.wb("左琦")],"ne163jd"),
  i("tech","텐센트 'AI 에이전트가 의도치 않게 웹 탐색'","외부 모델 평가용 AI 에이전트가 의도하지 않은 웹 탐색을 했다고 인정했습니다. 중국 대기업이 '통제 벗어난 에이전트' 사례를 공개한 첫 경우로 보입니다.",[7,7,8,6],[L.wb("腾讯 AI智能体"),L.wb("腾讯")],"stn"),
  i("tech","중국, AI 기술 수출통제 검토","경쟁이 치열해지자 핵심 산업을 지키려 AI 기술 수출 제한을 검토한다고 WSJ가 보도했습니다.",[6,8,7,7],[L.wb("人工智能 出口管制")],"wire16"),
  i("tech","3분기 성장률 4.4% 전망, 두 분기 연속 목표 밑돌 듯","부양책이 늦어 18일 발표될 성장률이 목표(4.5~5%)에 못 미칠 것으로 예상됩니다.",[6,8,7,6],[L.wb("三季度GDP")],"bbgcn"),
  i("tech","중국 부자들, 해외 신탁 정리·국적 변경","해외 소득 신고 시한을 앞두고 일부 부유층이 해외 신탁을 정리하고 주식을 팔거나 국적을 바꾸고 있습니다.",[6,6,7,6],[L.wb("境外收入 申报")],"stn"),
  i("pol","왕이, 헤르초그에 '서안 정착촌 중단하라'","이스라엘 대통령과 만나 정착촌 확대를 멈추고 되돌려야 한다고 말했습니다.",[6,6,8,5],[L.wb("王毅 赫尔佐格")],"riocn"),
  i("cul","선전, 11월부터 시 전역 24시간 경적 금지 5년","급커브·언덕 꼭대기, 추월, 긴급 상황만 예외이고 위반하면 300위안, 1년에 세 번째부터는 500위안을 물립니다. 소음 줄이기에 찬성하는 쪽과 단속 오류를 걱정하는 쪽이 맞섭니다.",[8,5,9,6],[L.wb("深圳全市全天禁鸣喇叭5年"),L.wb("禁鸣喇叭")],"jj21"),
  i("cul","황쯔타오·쉬이양 열애·아이 소문, 네티즌 '대필 해명문' 놀이","황쯔타오가 했다는 '돈도 얼굴도 있지만 사랑하는 사람은 못 붙잡았다' 같은 말이 지어낸 것으로 드러난 뒤, 네티즌들이 그의 말투로 해명문을 대신 써 올리는 놀이가 퍼졌습니다. 본인은 아직 답하지 않았습니다.",[9,3,9,4],[L.wb("徐艺洋 孩子是我自己生的"),L.wb("黄子韬")],"wbhzt"),
  i("acc","톈수이 유치원 납중독 1심, 실제 운영자 무기징역","란저우 중급법원은 원생 음식에 유독 물질을 넣게 한 운영자 리후이팡에게 무기징역, 원장 주징린에게 징역 15년을 선고했습니다. 조리원 4명도 6~8년형을 받았습니다.",[8,7,9,7],[L.wb("天水幼儿血铅案一审宣判"),L.wb("天水 血铅")],"paper")
 ], cut:["쭌제 브레이크 페달 합동조사 (새 소식 확인 못함)","샤오잔 난징 콘서트 매진 (새 소식 없음)","'칼로리 높아 보이지만 낮은 착한 음식' 핫검색 (기사 출처 확인 못함)","자오리잉 19세 이력서 화제 (5.0)","중국판 애플 인텔리전스 승인 (새 소식 없음)"]},

 etc:{name:"그 외", sub:"유럽·영국·중동", plats:[["X","https://x.com/explore"],["r/europe","https://www.reddit.com/r/europe/"],["r/worldnews","https://www.reddit.com/r/worldnews/"]], items:[
  i("tech","푸틴, 유럽 기업 5곳 러시아 자산 압류","프랑스 타케트, 독일 멘셴 등 연매출 합계 500억루블이 넘는 5개사 자산을 임시 관리에 넘겼습니다. 9월 네슬레·메트로·오샹에 이은 조치로, EU의 러시아 자산 3,000억유로 동결에 대한 보복으로 풀이됩니다.",[6,7,9,6],[L.rd("Putin seizes European firms"),L.x("Tarkett Russia")],"eunru"),
  i("tech","독일 담뱃세 인상, 2030년 한 갑 11.36유로","지금 8.05유로인 담배 한 갑이 해마다 올라 2030년 11.36유로가 됩니다. 4년간 120억유로를 더 걷을 계획이지만 업계는 암시장 확대를 경고합니다.",[6,6,8,6],[L.rd("Germany tobacco tax"),L.x("Tabaksteuer")],"eundetax"),
  i("pol","미·이란 확전 신호, 2주 새 호르무즈 선박 24척 공격","미 항모 2척이 아라비아해에 있고 병력 약 9,000명이 더 향하고 있다는 보도가 나왔습니다. 트럼프는 11월 3일 중간선거 뒤 공습 강화 가능성을 열어 뒀고, 이란은 미국 데이터센터도 사정권이라고 경고했습니다.",[8,9,8,8],[L.rd("US Iran escalation Hormuz"),L.x("Hormuz")],"euniran"),
  i("pol","젤렌스키, EU에 내년 700억유로 추가 요청","내년 전쟁 비용을 1,550억유로로 잡았습니다. 러시아의 에너지 시설 공격으로 키이우 등 6개 지역 100만 곳 넘게 정전됐고 하르키우 드론 공격으로 3명이 숨졌습니다.",[8,8,9,8],[L.rd("Zelensky EU 70 billion"),L.x("Zelensky EU summit")],"f24ua"),
  i("pol","젤렌스키 '트럼프가 푸틴보다 상대하기 쉽다'","유로뉴스 인터뷰에서 정유시설 공격을 둘러싼 미국과의 갈등에도 버티겠다고 했습니다. 폰데어라이엔은 전쟁이 끝날 때까지 제재를 풀지 않겠다고 했습니다.",[7,6,9,5],[L.rd("Zelensky easier Trump than Putin"),L.x("Zelenskyy Euronews")],"eunzel"),
  i("pol","흑해 화물선 드론 공격 잇따라, NATO 시험대","10월에만 루마니아·불가리아 앞바다에서 화물선 7척 이상이 공격받아 2명이 숨지고 25명 이상이 실종됐습니다. 배후를 밝힌 쪽은 없고, 경제수역 공격에 NATO 5조가 적용되는지 논란입니다.",[7,8,8,7],[L.rd("Black Sea drone attacks ships NATO"),L.x("Black Sea drones")],"pbsbs"),
  i("pol","프랑스 17일 전국 시위, '분노의 교차로'","3주째 이어진 고교생 시위에 노란조끼 등 여러 사회운동이 합류해 토요일 전국 시위를 예고했습니다.",[7,7,9,6],[L.rd("France protests October 17"),L.x("manifestation 17 octobre")],"f24fr"),
  i("pol","알바니아 시위 사흘째, 의회 회의 취소","쿠슈너가 투자한 리조트에 남부 해안을 파는 계획을 철회하라는 학생 시위가 경찰과 충돌했습니다. 아르헨티나에서도 교육 예산 삭감 반대 행진이 열렸습니다.",[7,6,8,6],[L.rd("Tirana protests Kushner"),L.x("Tirana")],"dn16"),
  i("pol","시리아, '바니야스 학살자' 알리 카얄리 체포","2013년 바이다·바니야스에서 민간인 수백 명을 살해한 친아사드 민병대 지휘자로 지목된 인물입니다. 레바논 자택에서 끌려갔다는 다른 주장도 있습니다.",[6,6,9,6],[L.rd("Butcher of Baniyas arrested"),L.x("Mihrac Ural")],"eunsy"),
  i("cul","교황 레오 14세, 폐 종양 수술 뒤 첫 사진","제멜리 병원에서 미사를 집전하는 모습이 공개됐고, 바티칸은 상태가 계속 좋아지고 있다고 밝혔습니다.",[8,6,9,5],[L.rd("Pope Leo photos hospital"),L.x("Pope Leo")],"eunpope"),
  i("cul","샐리 루니 책, 영국 서점 재고 대란","출판사 페이버가 영국 공급을 끊자 서점들이 재고를 확보하려 했지만 이미 동났습니다. 재주문은 안 되고 남은 책만 팔 수 있습니다. 팔레스타인 액션 금지령은 다음 달 대법원 판단을 받습니다.",[8,6,8,6],[L.rd("Sally Rooney bookstores"),L.x("Sally Rooney"),L.ig("sallyrooney")],"f24rooney"),
  i("acc","이스탄불 80년 만의 폭우, 최소 3명 사망","15일 아야자아에서 하천이 넘쳐 차량 수십 대가 떠내려갔고 5명이 실종됐습니다. 일부 지역은 전기·가스가 끊겼습니다.",[7,6,9,5],[L.rd("Istanbul floods"),L.x("Ayazağa sel")],"eunist"),
  i("acc","감비아 앞바다 이주민 보트 침몰, 최소 12명 사망","카나리아 제도로 향하던 배로 보입니다. 이 경로는 도착자가 62% 줄었지만 사망·실종은 4%만 줄어 더 위험해졌다고 IOM이 밝혔습니다.",[6,6,8,6],[L.rd("Gambia migrant boat sinks"),L.x("Gambia migrants")],"eungm")
 ], cut:["후티 아덴 대통령궁 공격 (새 소식 없음)","해리·메건 노팅엄 방문 (새 소식 없음)","채널터널 미니버스·열차 충돌 19명 부상 (5.5)","루크오일 제재 유예 연장 (새 소식 없음)","벨기에 펌킨 축제 (4.5)"]}
};


// 깃허브 트렌딩(오늘·전체 언어). GitHub 순서 그대로 넣습니다. 점수는 매기지 않습니다.
// g(저장소, 한국어 설명, 언어, 전체 별, 오늘 받은 별)
const g = (repo,d,lang,stars,today)=>({repo,d,lang,stars,today});
const GH = {date:"2026.10.17", url:"https://github.com/trending?since=daily", items:[
  g("anthropics/claude-plugins-official","Anthropic이 직접 관리하는 고품질 Claude Code 플러그인 모음입니다.","Python",40072,1552),
  g("K-Dense-AI/scientific-agent-skills","AI 에이전트를 'AI 과학자'로 만드는 스킬 모음입니다. 생물·화학·의학·신약개발용 검증된 스킬 177개와 과학 데이터베이스 100여 개를 담았고, 과학자 25만 명 이상이 쓴다고 소개합니다.","Python",51205,1158),
  g("affaan-m/ECC","Claude Code·Codex·Cursor 같은 코딩 에이전트의 성능을 끌어올리는 스킬·기억·보안 설정 모음입니다.","JavaScript",281068,1057),
  g("HKUDS/CLI-Anything","모든 소프트웨어를 AI 에이전트가 다룰 수 있게 명령줄(CLI)로 바꿔 주는 프로젝트입니다.","Python",53296,323),
  g("mksglu/context-mode","AI 코딩 에이전트의 대화 공간(컨텍스트)을 아껴 주는 도구입니다. 도구 출력을 98% 줄이고 세션 기억을 유지하며, MCP와 훅으로 17개 플랫폼을 지원합니다.","TypeScript",30067,449),
  g("ruvnet/ruflo","여러 AI 에이전트를 한 팀으로 묶어 자동 작업을 돌리는 도구입니다. 기억·자가학습·RAG를 지원하고 Claude Code·Codex 등과 연동됩니다.","TypeScript",75482,672),
  g("android/skills","AI 에이전트가 안드로이드 개발 모범 사례를 따르도록 돕는 구글 안드로이드 공식 스킬 모음입니다(저장소 설명이 비어 있어 README를 참고했습니다).","Kotlin",7924,35),
  g("obra/superpowers","AI 코딩 에이전트용 스킬 프레임워크이자 개발 방법론입니다.","Shell",300479,973),
  g("cursor/plugins","Cursor 플러그인 규격과 공식 플러그인 모음입니다.","TypeScript",11811,214),
  g("debpalash/VoiceStudio","내 컴퓨터에서만 돌아가는 오픈소스 음성 도구로, ElevenLabs 대체를 내세웁니다. 목소리 복제·더빙·받아쓰기·오디오북 제작을 646개 언어로 지원합니다.","Python",70402,2301)
]};
