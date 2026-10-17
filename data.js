// 이슈 데이터. 매일 갱신할 때는 이 파일만 바꾸면 됩니다.
// i(분야, 제목, 요약, [화제성,파급력,시의성,지속성], [SNS 링크], 출처키, 10~20대트렌드여부)
const UPDATED = "2026.10.17 SAT 12:03";   // 페이지 상단에 표시되는 갱신 시각
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
  hbsox:["헤럴드경제 10/17","https://biz.heraldcorp.com/article/10905645"],
  khjobs:["코리아헤럴드 10/16","https://www.koreaherald.com/article/10905069"],
  ktasml:["코리아타임스 10/17","https://www.koreatimes.co.kr/business/companies/20261017/securing-equipment-emerges-as-new-variable-for-koreas-chip-expansion-plans"],
  kh22:["코리아헤럴드 10/17","https://www.koreaherald.com/article/10905718"],
  ktnkt:["코리아타임스 10/17","https://www.koreatimes.co.kr/foreignaffairs/northkorea/20261017/n-korea-tests-new-precision-guided-torpedo-using-ai-kcna"],
  kh518:["코리아헤럴드 10/17","https://www.koreaherald.com/article/10905762"],
  khhyun:["코리아헤럴드 10/17","https://www.koreaherald.com/article/10905710"],
  ktbong:["코리아타임스 10/17","https://www.koreatimes.co.kr/lifestyle/20261017/pray-for-wealth-seoul-buddhist-temple-becomes-gen-z-hot-spot"],
  ktrich:["코리아타임스(한국일보) 10/16","https://www.koreatimes.co.kr/southkorea/20261016/why-young-koreans-are-embracing-the-rich-girl-aesthetic"],
  khbugak:["코리아헤럴드 10/16","https://www.koreaherald.com/article/10905142"],
  khseesaw:["코리아헤럴드 10/16","https://www.koreaherald.com/article/10905006"],
  ktankle:["코리아타임스 10/17","https://www.koreatimes.co.kr/southkorea/law-crime/20261017/incheon-stabbing-raises-questions-over-effectiveness-of-electronic-ankle-monitors"],
  pbswrap:["PBS NewsHour 10/16 뉴스 랩","https://www.pbs.org/newshour/show/news-wrap-zacharia-out-as-white-house-press-secretary-after-less-than-a-week-on-the-job"],
  engchrome:["Engadget 10/16","https://www.engadget.com/2288580/open-ai-updates-chatgpt-extension-for-chrome/"],
  eunzach:["Euronews 10/16","https://www.euronews.com/2026/10/16/trumps-new-press-secretary-leaves-after-less-than-a-week-following-controversy"],
  pbsdoj:["PBS NewsHour(AP) 10/16","https://www.pbs.org/newshour/politics/doj-says-california-officials-who-process-ballots-from-suspected-noncitizens-risk-prosecution"],
  pbsowl:["PBS NewsHour(AP) 10/16","https://www.pbs.org/newshour/nation/a-rare-family-of-barn-owls-moved-into-manhattans-upper-west-side-captivating-new-yorkers"],
  pbsbend2:["PBS NewsHour 10/16","https://www.pbs.org/newshour/show/oregon-school-shooter-attacked-special-education-classroom-police-say"],
  pbsgoliath:["PBS NewsHour(AP) 10/16","https://www.pbs.org/newshour/nation/more-roller-coasters-shut-down-as-authorities-investigate-fatal-fall-at-georgia-amusement-park"],
  itmbase:["ITmedia NEWS(Yahoo!ニュース) 10/17","https://news.yahoo.co.jp/articles/3509521b1e8afacc68421446758f335c9ad53aed"],
  fnndocomo:["FNN(Yahoo!ニュース) 10/16","https://news.yahoo.co.jp/articles/f378c647e05114b0075d23536a06b33794ebb5cd"],
  shusai:["슈에이샤 온라인(Yahoo!ニュース) 10/17","https://news.yahoo.co.jp/articles/981ecc07c160b75a8e9ca24cbf124898af0d22da"],
  jijipoll:["지지통신(Yahoo!ニュース) 10/17","https://news.yahoo.co.jp/articles/708e31b4abc7a10294125f05083c941254a995a2"],
  tbsyana:["TBS NEWS DIG(Yahoo!ニュース) 10/17","https://news.yahoo.co.jp/articles/04094ef8e8210fdb9c311271b72ac94f1eac6ca3"],
  nikhanshin:["닛칸스포츠(Yahoo!ニュース) 10/17","https://news.yahoo.co.jp/articles/9bc61eddf3776d12686bc1cfca03afef1a6271cf"],
  tetoito:["테레토 스포츠(Yahoo!ニュース) 10/17","https://news.yahoo.co.jp/articles/4f0cdf5a0ecc73f47b5898555b4c815e5208b136"],
  rcctyphoon:["RCC 주고쿠방송(Yahoo!ニュース) 10/17","https://news.yahoo.co.jp/articles/687a9b10fa7419ca976adbec649b067326ac93f8"],
  xhexport:["신화통신 10/16","https://english.news.cn/20261016/76d3065ceb1a4b729d4d3151cff94a64/c.html"],
  sinatoken:["신랑과기 10/16","https://finance.sina.com.cn/tech/roll/2026-10-16/doc-iniviqxz8022393.shtml"],
  xhauto:["신화통신 10/17","https://english.news.cn/20261017/03b8813ebcbf4545a9d3aa9cc8f99a1f/c.html"],
  stdduo:["The Standard 10/17","https://www.thestandard.com.hk/news/article/345722/Cybersecurity-experts-urge-vigilance-as-wave-of-credit-card-fraud-hits-launch-of-premium-foldable-iPhone-Duo"],
  sinahuang:["신랑재경 10/17","https://finance.sina.cn/2026-10-17/detail-inivnzsm7276274.d.html"],
  sinaai:["신랑(양청파) 10/17","https://k.sina.cn/article_5787187353_158f17899020029vu4.html"],
  sinahg:["신랑재경 10/16","https://finance.sina.cn/2026-10-16/detail-inivkncp7048590.d.html"],
  sinamongol:["신랑 10/17(칼럼)","https://news.sina.cn/gj/2026-10-17/detail-inivnvkv8250754.d.html"],
  xhshantou:["신화통신 10/17","https://english.news.cn/20261017/61fbc73e856141a09c112d70405b24f6/c.html"],
  sinatanker:["신랑재경(CCTV) 10/17","https://finance.sina.cn/2026-10-17/detail-inivnvku1500806.d.html"],
  eunmos:["Euronews 10/16","https://www.euronews.com/2026/10/16/ukrainian-drones-force-closure-of-all-four-moscow-airports-overnight-cancelling-dozens-of-"],
  eunsum:["Euronews 10/16","https://www.euronews.com/2026/10/16/budget-ukraine-migration-five-takeaways-from-the-eu-leaders-summit"],
  eunoles:["Euronews 10/16","https://www.euronews.com/2026/10/16/pope-leo-xiv-urges-putin-to-agree-to-truce-in-besieged-ukrainian-city-of-oleshky"],
  eunro:["Euronews 10/16","https://www.euronews.com/2026/10/16/romanian-president-calls-for-greater-nato-oversight-in-the-black-sea-in-euronews-interview"],
  eunalb:["Euronews 10/16","https://www.euronews.com/2026/10/16/albanian-pm-blames-foreign-hands-for-escalating-anti-government-unrest"],
  f24fr:["France 24 10/16 신문 리뷰","https://www.france24.com/en/tv-shows/press-review/20261016-france-to-witness-a-crossroads-of-anger-as-mass-protests-expected-on-saturday"],
  euncro:["Euronews 10/16","https://www.euronews.com/2026/10/16/croatias-leaders-slam-pro-nazi-chants-ahead-of-ajax-match-in-southern-city-split"],
  eunnor:["Euronews 10/16","https://www.euronews.com/2026/10/16/norwegian-teenager-sentenced-to-20-years-in-prison-over-uk-murder-plot"]
};
const FIELDS = [["tech","기술·경제","--f-tech"],["pol","정치","--f-pol"],["cul","문화·사회","--f-cul"],["acc","사건사고","--f-acc"]];
const CRIT = ["화제성","파급력","시의성","지속성"];
// i(field, title, summary, [화제성,파급력,시의성,지속성], [sns links], sourceKey)
const i = (f,t,d,s,l,src,y)=>({f,t,d,s,l,src,y});

const DATA = {
 kr:{name:"한국", plats:[["Instagram","https://www.instagram.com/explore/"],["Threads","https://www.threads.com/"],["네이버 검색","https://search.naver.com/"]], items:[
  i("tech","미 반도체지수 8일 연속 하락, 금융위기 이후 최장","16일(현지시간) 필라델피아 반도체지수가 3.83% 빠져 2008년 이후 가장 긴 연속 하락을 기록했습니다. SK하이닉스 ADR은 6.58%, 마이크론은 5.63% 떨어졌고 나스닥도 2.15% 내렸습니다. AI 인프라 기업의 빚 부담과 브렌트유 109.86달러까지 오른 유가가 겹친 탓으로 풀이됩니다. 월요일 국내 반도체주 흐름에 관심이 쏠립니다.",[8,8,9,6],[L.naver("필라델피아 반도체지수 8일 연속"),L.th("반도체지수"),L.ig("하이닉스")],"hbsox"),
  i("tech","제조업 취업자 27개월 만에 늘었지만 청년 고용은 47개월째 감소","9월 제조업 취업자는 436만명으로 1년 전보다 1만6천명 늘어 26개월 연속 감소를 끝냈습니다. 전체 취업자는 11만3천명 늘었습니다. 반면 15~29세 취업자는 14만7천명 줄었고 청년 실업률은 5.4%로 9월 기준 4년 만에 가장 높았습니다.",[7,7,8,6],[L.naver("청년 고용률 47개월 감소"),L.th("청년 실업률")],"khjobs"),
  i("tech","'장비가 모자란다' 반도체 증설에 새 변수","ASML은 노광장비 생산을 2027·2028년에 각각 30%씩 늘려도 수요를 다 맞추지 못할 것이라고 밝혔습니다. 장비 주문부터 납품까지 1년 반~2년이 걸려, 2027년 10월 가동 목표인 SK하이닉스 용인 1기 팹과 이달 착공하는 삼성 용인 팹 일정에도 영향을 줄 수 있다는 분석입니다.",[6,7,8,7],[L.naver("ASML 장비 부족 용인"),L.th("ASML")],"ktasml"),
  i("tech","한·미 첫 재무·통화 '2+2' 회의","16일 방콕 G20 재무장관회의를 계기로 이형일 재정경제부 장관·신현송 한은 총재와 케빈 워시 연준 의장·프랜시스 브룩 재무부 부장관이 처음 함께 만났습니다. 대외 금융 불확실성 대응과 정책 공조를 논의했습니다.",[6,7,9,6],[L.naver("한미 2+2 재무 통화"),L.th("한미 2+2")],"kh22"),
  i("pol","북한 'AI 정밀유도 어뢰' 잠-2.0 시험","조선중앙통신은 목요일 AI로 표적을 찾고 유도하는 고속 어뢰 '잠-2.0' 수중 시험에 성공했다고 17일 밝혔습니다. 전문가들은 잠수함용 초공동 어뢰일 가능성을 거론하며 우리 해군 주력 함정을 겨냥한 무기로 봤습니다. 수요일에는 3,000톤급 잠수함이 전략순항미사일 두 종을 쐈습니다.",[7,7,9,6],[L.naver("북한 AI 어뢰 잠-2.0"),L.th("북한 어뢰")],"ktnkt"),
  i("pol","5·18을 '폭동'이라 쓴 일베 이용자 항소심 무죄","대구지법 항소부는 2021년 5·18을 '폭동'이라 쓴 45세 남성에게 벌금 100만원을 선고한 1심을 뒤집었습니다. 부정적 평가가 곧 허위 사실은 아니라는 판단이며, 그 표현에 동의하는 것은 아니라고 덧붙였습니다. 5·18 왜곡 처벌법 적용 범위를 둘러싼 논쟁이 다시 붙었습니다.",[7,6,9,6],[L.naver("5·18 폭동 항소심 무죄"),L.th("5·18 무죄")],"kh518"),
  i("pol","트럼프, 조지아 유세서 '현대 5억6천만달러 투자' 자랑","16일 돌턴 유세에서 웨스트포인트 공장 확장 계획을 언급했습니다. 현대트랜시스가 하이브리드 파워트레인 생산을 늘리려 공장 2곳을 고치고 1곳을 새로 지으며 일자리 320개를 만든다는 내용입니다.",[6,6,9,5],[L.naver("트럼프 현대 조지아 5억6천만달러"),L.th("현대트랜시스 조지아")],"khhyun"),
  i("cul","북악산 남서쪽 탐방로, 58년 만에 오늘 개방","1968년 김신조 사건 뒤 막혔던 청와대 뒤편 북악산 남서측 1.32km 구간이 17일 오전 9시 열렸습니다. 인왕산·남산·경복궁이 내려다보이는 전망대 4곳이 생겼고, 이로써 세 차례에 걸친 전면 개방이 마무리됐습니다.",[7,5,10,6],[L.naver("북악산 탐방로 개방"),L.ig("북악산"),L.th("북악산")],"khbugak"),
  i("cul","'재물운 성지' 강남 봉은사에 몰리는 20대","이재용 회장이 찾는다는 소문과 인스타그램 영상을 타고 봉은사가 MZ세대 기도 명소가 됐습니다. 연못 불상에 동전 던지기, 미륵대불 세 바퀴 돌기 같은 비공식 '의식'이 공유되고, 목탁 모양 '공덕 키링' 2,000개가 두 시간 반 만에 다 팔렸습니다.",[7,5,8,6],[L.ig("봉은사"),L.th("봉은사 공덕 키링"),L.naver("봉은사 키링")],"ktbong",1),
  i("cul","로고 없는 부잣집 딸 스타일 '현백코어'","실크·캐시미어 같은 소재로 힘을 뺀 고급스러움을 내는 20~30대 패션입니다. 현대백화점 고객 중 20~30대 비중은 2020년 37%에서 올해 46.7%로 늘었습니다.",[7,5,7,6],[L.ig("현백코어"),L.th("현백코어"),L.naver("현백코어")],"ktrich",1),
  i("cul","크러쉬×아이유 신곡 '시소' 다음 주 공개","크러쉬가 아이유와 함께한 디지털 싱글 '시소'를 다음 주 수요일 냅니다. 두 사람의 첫 정식 협업이라 공개 전부터 기대가 모입니다.",[7,4,8,5],[L.ig("크러쉬"),L.th("크러쉬 아이유 시소"),L.naver("크러쉬 아이유 시소")],"khseesaw"),
  i("acc","인천 흉기난동, 전자발찌 차고도 못 막아","피의자는 2015년 전처 살인미수로 복역한 뒤 2029년까지 전자발찌를 차야 했고, 2021년 야간 외출 위반으로 벌금을 냈으며 지난달 흉기 소지로 입건됐습니다. 범행 당일 보호관찰관을 만나기도 했습니다. 올해 1~7월 전자감독 위반은 599건이고, 위치만 알 뿐 흉기 소지는 막지 못한다는 지적이 나옵니다.",[8,7,9,7],[L.naver("인천 흉기난동 전자발찌"),L.th("전자발찌")],"ktankle")
 ], cut:["해녀 성정희, FAO 여성 100인 선정 (5.5)","훈바루즈 자세 교정 인형 (5.75, 새 소식 없음)","코스피 5,668 반등·삼성·하이닉스 과매도·원화 강세 (새 소식 없음, 반도체지수 항목으로 대체)","국민연금 손실 공방 (새 소식 없음)","헌법 전문 개헌·청해부대·북한 극초음속 반박·북한군 포로 (새 소식 없음)","BTS 100억 스트리밍·송민호 재복무·수능 AI 안경 (새 소식 없음)","부천 공장 화재·창원 택시기사 재심 (새 소식 없음)","치이카와 극장판 100만 관객 (캐릿 10/13, 시의성 낮음)"]},

 us:{name:"미국", plats:[["Instagram","https://www.instagram.com/explore/"],["Reddit","https://www.reddit.com/r/news/"],["X","https://x.com/explore"]], items:[
  i("tech","기술주 급락, S&P500 6월 이후 최악의 한 주","16일 나스닥이 2.15%, 다우가 175포인트 내렸고 필라델피아 반도체지수는 8거래일 연속 떨어졌습니다. 코어위브(-11.91%)·네비우스(-12.18%) 같은 AI 인프라 기업의 빚 우려와 유가 급등이 겹쳤고, 변동성 지수(VIX)는 21% 넘게 뛰었습니다.",[8,8,9,6],[L.rd("Nasdaq tech selloff worst week since June"),L.x("SOX semiconductor index")],"hbsox"),
  i("tech","ChatGPT 크롬 확장, 열린 탭 읽고 대신 일한다","탭 여러 개를 비교하거나, 에이전트 'ChatGPT Work'가 양식 작성·메시지 전송·탭 정리를 해 줍니다. 사이드바에서 전체 대화 기록도 쓸 수 있고 모든 요금제와 엣지·브레이브 등 크로미움 브라우저에서 됩니다. 오픈AI는 8월 9일 단독 브라우저를 접었습니다.",[6,6,8,6],[L.rd("ChatGPT Chrome extension tabs"),L.x("ChatGPT Chrome extension")],"engchrome"),
  i("pol","백악관 대변인 재커리아, 1주일도 안 돼 퇴진","13일 첫 브리핑은 15분이 안 됐고 질문은 3개만 받았습니다. 변호사라고 소개해 왔지만 변호사 시험에 붙은 적이 없다고 15일 인정했습니다. NYT 등은 경질이라고 보도했고 트럼프는 '언론에 시달렸다'며 해고는 아니라고 했습니다. 후임은 아직 없습니다.",[9,6,10,6],[L.rd("Katie Zacharia press secretary out"),L.x("Zacharia"),L.ig("katiezacharia")],"eunzach"),
  i("pol","법무부 '비시민권자 의심 투표지 집계하면 기소' 경고","법무부가 LA 카운티에 보낸 서한에서 연방이 지목한 약 2만명의 우편투표를 세는 공무원은 연방범죄 방조자가 될 수 있다고 했습니다. 하루 전에는 집계를 멈추라며 캘리포니아주를 고소했습니다. 주 국무장관은 비시민권자라는 증거가 없다고 반박합니다. 중간선거는 11월 3일입니다.",[7,8,9,7],[L.rd("DOJ California ballots noncitizens prosecution"),L.x("DOJ Los Angeles ballots")],"pbsdoj"),
  i("pol","트럼프 조지아 돌턴 유세, 현대 투자 앞세워","16일 돌턴 공항 유세에서 경제 성과를 내세우며 현대트랜시스의 웨스트포인트 공장 5억6천만달러 투자를 자랑했습니다. 중간선거를 2주여 앞둔 접전지 조지아 지원 유세입니다.",[7,6,9,5],[L.rd("Trump Dalton Georgia rally"),L.x("Trump Dalton rally")],"khhyun"),
  i("cul","맨해튼에 첫 원숭이올빼미 둥지, 밤마다 구경꾼","어퍼웨스트사이드 75번가 건물 물탱크에 원숭이올빼미(barn owl) 가족이 살고 있습니다. 코넬 조류연구소는 맨해튼에서 처음 기록된 둥지로 봅니다. 어른 새 2마리와 새끼 5~6마리가 확인됐고 밤마다 사진가들이 모입니다.",[7,4,8,5],[L.rd("barn owls Upper West Side"),L.x("Manhattan barn owls"),L.ig("barnowl")],"pbsowl"),
  i("acc","오리건 초교 총격범, 특수교육 교실 노려","경찰은 총격범이 이 학교를 다녔던 16세 그리핀 존 2세이며, 어머니 명의 산탄총으로 입구 옆 특수교육 교실에서 최대 15발을 쐈다고 밝혔습니다. 5세 아동과 25세 교사 등 4명이 숨졌고 7세 아동과 교사 1명이 위독합니다. 동기는 아직 밝혀지지 않았습니다.",[9,8,9,7],[L.rd("Bend Oregon school shooting special education"),L.x("Silver Rail Elementary"),L.ig("bendstrong")],"pbsbend2"),
  i("acc","남캘리포니아 대형 산불 3곳, 주민 대피","말리부와 오렌지카운티에서 불이 번져 집이 여러 채 탔고, 전력회사들이 수만 가구 전기를 끊었습니다. 샌타애나 강풍이 시속 70마일(약 113km)까지 불고 토요일까지 덥고 건조할 전망입니다.",[8,7,10,6],[L.rd("Malibu fire Orange County Santa Ana"),L.x("Malibu fire"),L.ig("malibufire")],"pbswrap"),
  i("acc","식스플래그스 '골리앗' 추락사, 롤러코스터 11대 멈춰","조지아 식스플래그스에서 42세 남성이 좌석에서 튕겨 나가 숨졌습니다. 같은 제조사(B&M)·비슷한 안전바를 쓴 코스터 등 최소 11대가 운행을 멈췄습니다. 안전바가 자꾸 풀렸다는 탑승객 증언이 나왔고 골리앗에는 보조 안전장치가 없습니다.",[7,6,8,6],[L.rd("Six Flags Goliath death"),L.x("Goliath roller coaster")],"pbsgoliath")
 ], cut:["아이폰 듀오 예약판매·FTC 오픈AI·앤트로픽 소환장·오픈AI 에이전트 이더리움·KFC 코카콜라 (새 소식 없음)","이란 학교 폭격 보고서·연회장 기부·텍사스 상원·위스콘신 선관위 (새 소식 없음)","브루어스 월드시리즈 진출 (새 소식 없음)","ALCS 4차전 우천 연기 (5.0)","힌두 사원 총격 미수 (새 소식 없음)","테슬라 로드스터 2028년 생산 (5.5)"]},

 jp:{name:"일본", plats:[["X (트렌드)","https://x.com/explore"],["TikTok","https://www.tiktok.com/explore"]], items:[
  i("tech","긴급지진속보 오보, 도코모는 알림조차 안 가","16일 낮 12시 40분께 기상청이 긴급지진속보를 냈다가 8분 뒤 취소했습니다. 그런데 NTT도코모 단말에는 속보 알림(에리어 메일)이 아예 오지 않았고, 도코모는 시스템 오류였다며 사과했습니다.",[8,7,9,6],[L.x("緊急地震速報 ドコモ"),L.x("緊急地震速報 誤報")],"fnndocomo"),
  i("tech","쇼프서브 해킹, 2,335만명 개인정보 유출","BASE 자회사 E스토어는 쇼핑몰 구축 서비스 '쇼프서브'가 5월 21일~8월 1일 침입당해 약 2,335만6천명분이 새어 나갔다고 최종 발표했습니다. 이 중 약 209만7천명은 카드번호 일부와 유효기간도 포함됩니다. 점포 7,858곳이 해당됩니다.",[7,7,9,6],[L.x("ショップサーブ 漏えい"),L.x("Eストアー 2335万")],"itmbase"),
  i("tech","사이제리야, 상장 후 첫 본격 가격 인상","29일부터 메뉴 80% 이상을 평균 6% 올립니다. 300엔이던 밀라노풍 도리아는 320엔이 됩니다. 호주산 소고기와 닭고기 값이 오르고 원가율이 48.3%까지 높아지자 버티지 못했다는 분석입니다.",[8,6,8,6],[L.x("サイゼリヤ 値上げ"),L.x("ミラノ風ドリア 320円"),L.tt("サイゼリヤ")],"shusai"),
  i("pol","지지통신 조사도 내각 지지율 최저 42.4%, 남성 이탈","9~12일 조사에서 다카이치 내각 지지율이 1.7포인트 내려 5개월 연속 떨어졌습니다. 남성 지지가 4.2포인트 줄어 42.0%로 여성(42.9%)과 비슷해졌고, 18~29세만 50.4%로 절반을 넘었습니다.",[7,7,9,6],[L.x("高市内閣 支持率 時事"),L.x("高市離れ")],"jijipoll"),
  i("pol","야나 전 농림상 사퇴 뒷얘기 '공선법 위반으로 성격 바뀌어'","총리가 직접 고른 인사였고, 관저는 '자기를 크게 보이려던 것'이라는 해명으로 버티려 했다고 TBS가 전했습니다. 선거구 셔틀버스 문제가 13일 국회에서 다뤄지며 공직선거법 위반 의혹으로 번지자 14일 사표를 냈습니다.",[6,6,8,5],[L.x("簗和生 辞任 舞台裏"),L.x("簗和生")],"tbsyana"),
  i("cul","한신, CS 파이널 3경기 연속 영봉패… 탈락 위기","센트럴리그 클라이맥스 시리즈 파이널 스테이지에서 DeNA에 3연패했습니다. 포스트시즌 역사상 첫 3경기 연속 무득점 패배입니다. 오늘 4차전에는 부상으로 빠졌던 사토 데루아키와 모리시타 쇼타가 돌아옵니다.",[8,5,9,5],[L.x("阪神 CS"),L.x("阪神 3試合連続0封"),L.tt("阪神タイガース")],"nikhanshin"),
  i("cul","도쿄올림픽 금메달 이토 미마, 대표팀 떠나","일본탁구협회 여자 대표 명단에서 빠졌고 본인은 '한 사람으로서 나를 돌아보는 시간을 갖겠다'고 밝혔습니다. 대신 사토 히토미가 3년 반 만에 대표로 돌아왔습니다.",[7,5,8,6],[L.x("伊藤美誠 代表離脱"),L.tt("伊藤美誠")],"tetoito"),
  i("acc","태풍 30호 '찬파' 매우 강한 세력으로, 사키시마 쪽으로","17일 오전 9시 마리아나 제도 부근에서 중심기압 975hPa로 서북서진하고 있으며, 18일에는 950hPa·순간최대풍속 60m/s의 '매우 강한' 세력이 될 전망입니다. 하루 전과 달리 본토보다 오키나와 사키시마 제도·대륙 쪽으로 가는 예상이 늘었습니다.",[7,7,9,6],[L.x("台風30号"),L.x("台風30号 先島諸島")],"rcctyphoon")
 ], cut:["시부야 트렌드리서치 '넥스트 트렌드 10선'(카라콘 실·드파이 등) (10/2 발표, 시의성 낮음)","요시다 지나미 수술 고백 (5.25)","세븐일레븐 가파오라이스 호평 (5.0)","닛케이 반등·다카이치 화장 발언·가타야마 G20·510만엔 가구 (새 소식 없음)","다저스 탈락·가와카미 심판·오사카 중체련 (새 소식 없음)","10~20대 트렌드: 최근 24시간 안에 나온 X·틱톡 유행 기사를 찾지 못했습니다."]},

 cn:{name:"중국", plats:[["웨이보 핫검색","https://s.weibo.com/top/summary"]], items:[
  i("tech","AI·바이오·태양광 기술 40개 수출 금지·제한 추진","상무부·과학기술부가 수출 금지·제한 기술 목록 개정안을 내고 11월 15일까지 의견을 받습니다. 대형 모델·에이전트·연산 클러스터 등 AI 23개, 세포·유전자 치료 등 바이오 5개, 폴리실리콘·웨이퍼 등 태양광 12개입니다. 오픈소스나 논문으로 공개된 기술은 빠집니다.",[7,8,9,7],[L.wb("技术出口管制 人工智能"),L.wb("禁止出口限制出口技术目录")],"xhexport"),
  i("tech","'AI 연산 절반이 숏드라마 만드는 데' 공시 화제","중문재선은 투자자 공시에서 중국 AI 토큰 소비의 약 55%가 숏드라마·영상 생성, 24%가 전자상거래 광고이고 연구개발은 15%뿐이라고 밝혔습니다. 올해 1~8월 나온 숏드라마는 43만 편으로 작년 전체의 13배입니다.",[7,6,8,6],[L.wb("国内一半AI算力在造爽剧"),L.wb("AI短剧 算力")],"sinatoken"),
  i("tech","당국, 완성차 30여 곳 불러 '비이성적 경쟁 말라'","공업정보화부 등 4개 부처가 16일 주요 자동차 회사 30여 곳과 회의를 열고 가격 출혈 경쟁 자제, 제품 안전 1차 책임, 과장 광고 금지를 요구했습니다. 스마트 커넥티드 전기차 안전 규정도 곧 낼 예정입니다.",[6,7,9,6],[L.wb("车企 非理性竞争"),L.wb("工信部 车企座谈")],"xhauto"),
  i("tech","아이폰 듀오 출시 뒤 홍콩서 카드 도용 잇따라","쓴 적도 없는 카드로 3만4,998홍콩달러씩 최대 5번 결제됐다는 글이 홍콩 SNS에 이어졌습니다. 전문가는 애플 결제에 3D 시큐어 인증이 없어 유출된 카드로 대량 주문을 넣는 것이라고 봤습니다.",[7,5,9,5],[L.wb("iPhone Duo 盗刷"),L.wb("iPhone Duo")],"stdduo"),
  i("pol","황치판 전 충칭시장 조사 뒤 기율위 '퇴로 없다'","중앙기율검사위 사이트는 17일 논평에서 은퇴했어도 부패했다면 '무사 착륙'은 없다고 했습니다. 13일 황치판 전 충칭시장 조사 소식에 이어 14일 바오후이 전 청두시 인대 주임이 당적을 박탈당해, 일주일 새 전직 중앙관리 간부 2명이 처분을 받았습니다.",[8,6,7,6],[L.wb("黄奇帆被查"),L.wb("包惠 开除党籍")],"sinahuang"),
  i("cul","'훙궈 숏드라마 보면 바보 된다' 핫검색","반전이 쉴 새 없는 숏드라마를 보고 나면 머리가 멍하고 멈출 수 없다는 글이 퍼졌습니다. 하루 10시간 넘게 봤다는 화면 기록도 올라왔습니다. 정신과 의사는 도파민 과자극으로 집중력이 잠시 떨어지는 것이지 지능이 낮아지는 것은 아니라고 했습니다.",[8,5,9,6],[L.wb("红果短剧降智"),L.wb("红果短剧")],"sinahg"),
  i("cul","AI 아이돌 '임신 하차' 설정 소동","가상 AI 걸그룹 BABYQUEEN 멤버 Mity가 '임신해 활동을 쉰다'는 공지를 올렸다가 지어낸 설정으로 드러났습니다. 사과 한 시간 만에 그룹 복귀를 알려 '출산휴가는 가짜, 홍보는 진짜'라는 비판을 받았고, 제작진은 악성 댓글을 멈춰 달라고 호소했습니다.",[8,5,9,5],[L.wb("AI偶像怀孕"),L.wb("BABYQUEEN")],"sinaai"),
  i("acc","몽골 보호구 산불 중국 국경까지, 3,400명 투입","9일 몽골 동방성 보호구에서 난 불이 내몽골 국경까지 번져 소방 인력 3,400여 명이 방화선을 쳤고 13일 국경 밖에서 막았습니다. 보호구 약 80%가 탔고 곰·수달 등이 국경을 넘어 피했습니다. 일본인 경영자 일행의 낚시 차량이 원인이라는 보도가 있지만 몽골 당국은 아직 공식 발표하지 않았습니다.",[7,6,7,6],[L.wb("蒙古国大火 中国边境"),L.wb("蒙古山火")],"sinamongol"),
  i("acc","산터우 12명 사망 화재 조사 결과 공개","광둥성은 지난해 12월 산터우 차오난구 무허가 건물 화재 조사 보고서를 냈습니다. 모기향 불이 실내 리튬이온 배터리를 터뜨려 부탄가스·스프레이 등으로 번졌다고 결론냈고, 부실 평가를 한 소방 점검 업체를 사법기관에 넘겼습니다.",[6,6,8,5],[L.wb("汕头火灾 调查报告"),L.wb("潮南 火灾")],"xhshantou")
 ], cut:["3분기 GDP (18일 발표 예정, 새 소식 없음)","징둥 직원 vs 더우인·텐센트 AI 에이전트·부유층 해외신탁 (새 소식 없음)","왕이·헤르초그 회동 (새 소식 없음)","선전 경적 금지·황쯔타오 소문 (새 소식 없음)","톈수이 유치원 납중독 판결 (새 소식 없음)","TVB 숏드라마 진출 (5.0)"]},

 etc:{name:"그 외", sub:"유럽·영국·중동", plats:[["X","https://x.com/explore"],["r/europe","https://www.reddit.com/r/europe/"],["r/worldnews","https://www.reddit.com/r/worldnews/"]], items:[
  i("tech","EU 정상들 '중국산 막을 무역 수단 달라'","16일 정상회의에서 화학·기계 산업을 지킬 쿼터·관세 같은 수단을 집행위에 요구했습니다. EU의 대중 무역적자는 약 3,600억유로이고 지난 1년 중국의 대EU 수출은 25% 늘었습니다. 에너지값 대책을 두고는 배출권거래제(ETS) 재검토 여부로 갈렸습니다.",[6,8,8,7],[L.rd("EU summit China trade defence"),L.x("EU China tariffs")],"eunsum"),
  i("pol","이란혁명수비대 '호르무즈서 유조선 기뢰 폭발'","IRGC 해군은 17일 원유 200만배럴 넘게 실은 초대형 유조선이 레이더를 끄고 미군 지원을 받아 지나려다 기뢰에 부딪혀 크게 폭발했다고 주장하며, 해협은 닫혔다고 다시 밝혔습니다. 인명 피해는 알려지지 않았습니다.",[8,9,10,8],[L.rd("Hormuz tanker mine explosion IRGC"),L.x("Hormuz tanker")],"sinatanker"),
  i("pol","우크라 드론 500대, 모스크바 4개 공항 7시간 마비","브누코보·셰레메티예보 등이 최대 7시간 멈춰 160편 넘게 취소됐습니다. 소뱌닌 시장은 드론 94대를 격추했다고 했습니다. 모스크바 공항은 10월 첫 14일 동안 101시간 닫혀 9월 전체(46시간)의 두 배가 넘었습니다.",[8,7,9,6],[L.rd("Moscow airports closed drones"),L.x("Moscow airports drones")],"eunmos"),
  i("pol","EU, 젤렌스키 지지했지만 예산 협상은 제자리","정상들은 러시아 침공이 이어지는 한 제재를 유지하기로 했습니다. 젤렌스키는 내년 700억유로 추가 지원을 요청해 900억유로 대출로 2026~27년을 버틴다는 계획이 흔들렸습니다. 다년도 예산은 11월 26일 특별 정상회의로 넘어갔습니다.",[7,8,8,7],[L.rd("EU summit Zelensky 70 billion budget"),L.x("EU summit Zelenskyy")],"eunsum"),
  i("pol","교황, 푸틴과 통화해 '올레시키 휴전' 요청","폐 수술 뒤 회복 중인 레오 14세가 16일 푸틴에게 전화해 포위된 헤르손주 올레시키에 식량·의약품을 넣고 주민 약 2,000명이 빠져나올 수 있게 해 달라고 했습니다. 푸틴은 감사를 전했지만 휴전 동의 여부는 밝혀지지 않았습니다.",[7,6,9,5],[L.rd("Pope Leo Putin call Oleshky"),L.x("Oleshky")],"eunoles"),
  i("pol","루마니아 대통령 '흑해에 NATO 감시 더 필요'","니쿠쇼르 단 대통령은 유로뉴스 인터뷰에서 전쟁이 끝나야 흑해가 안전해진다고 했습니다. 불가리아·루마니아 앞바다 화물선 드론 공격이 사흘 연속 이어졌고, 뤼터 NATO 사무총장은 동부 전선 대드론 능력을 늘리겠다고 했습니다.",[6,7,8,7],[L.rd("Romania president NATO Black Sea"),L.x("Black Sea drones NATO")],"eunro"),
  i("pol","알바니아 시위 나흘째 160명 연행, 라마 '외부 세력 탓'","라마 총리 퇴진과 교육 개혁을 요구하는 시위가 티라나 밖으로 번졌고 학생들은 수업을 거부하고 있습니다. 경찰은 최루가스와 물대포를 썼습니다. 쿠슈너·이방카가 연관된 관광 개발 반대 시위가 계기였습니다.",[7,6,9,6],[L.rd("Albania protests Rama foreign hands"),L.x("Tirana protests")],"eunalb"),
  i("pol","프랑스 오늘 전국 시위 '분노의 교차로'","3주째 이어진 고교생 시위에 노란조끼 등 여러 사회운동이 합류해 17일 토요일 전국 시위를 엽니다.",[7,7,9,6],[L.rd("France protests October 17"),L.x("manifestation 17 octobre")],"f24fr"),
  i("cul","크로아티아 하이두크 팬 '친나치 구호', 대통령·총리 규탄","아약스와의 콘퍼런스리그 경기를 앞두고 스플리트 팬들이 반유대·우스타샤 구호를 외쳤습니다. 수십 명이 연행됐고 홍염으로 경기가 10분 넘게 멈췄습니다. 이스라엘 대사관은 '깊은 충격'이라고 했고 구단은 UEFA와 아약스에 사과했습니다.",[7,6,9,6],[L.rd("Hajduk Split Nazi chants Ajax"),L.x("Hajduk Ajax chants")],"euncro"),
  i("acc","영국서 청부살인 하려던 노르웨이 19세 징역 20년","2만5천유로를 받기로 하고 영국에 왔다가 범행 몇 시간 전 붙잡혔고 권총 2정과 실탄 19발이 나왔습니다. 지시자는 '에이전트 47'이라는 이름을 썼고, 경찰은 스웨덴 범죄조직 폭스트롯 네트워크와 연결된 것으로 봤습니다.",[6,6,8,5],[L.rd("Norwegian teenager 20 years UK murder plot"),L.x("Foxtrot network")],"eunnor")
 ], cut:["이탈리아 항공관제 데이터망 장애 (5.75)","푸틴 유럽 기업 압류·독일 담뱃세 (새 소식 없음)","젤렌스키 '트럼프가 상대하기 쉽다'·시리아 바니야스 학살자 체포 (새 소식 없음)","교황 수술 후 첫 사진 (올레시키 통화 항목으로 대체)","샐리 루니 서점 재고 대란 (새 소식 없음)","이스탄불 폭우·감비아 이주민선 침몰 (새 소식 없음)"]}
};


// 깃허브 트렌딩(오늘·전체 언어). GitHub 순서 그대로 넣습니다. 점수는 매기지 않습니다.
// g(저장소, 한국어 설명, 언어, 전체 별, 오늘 받은 별)
const g = (repo,d,lang,stars,today)=>({repo,d,lang,stars,today});
const GH = {date:"2026.10.17", url:"https://github.com/trending?since=daily", items:[
  g("anthropics/claude-plugins-official","Anthropic이 직접 관리하는 고품질 Claude Code 플러그인 모음입니다.","Python",40778,1552),
  g("K-Dense-AI/scientific-agent-skills","AI 에이전트를 'AI 과학자'로 만드는 스킬 모음입니다. 생물·화학·의학·신약개발용 검증된 스킬 177개와 과학 데이터베이스 100여 개를 담았고, 과학자 25만 명 이상이 쓴다고 소개합니다.","Python",51646,1158),
  g("affaan-m/ECC","Claude Code·Codex·Cursor 같은 코딩 에이전트의 성능을 끌어올리는 스킬·기억·보안 설정 모음입니다.","JavaScript",281648,1057),
  g("HKUDS/CLI-Anything","모든 소프트웨어를 AI 에이전트가 다룰 수 있게 명령줄(CLI)로 바꿔 주는 프로젝트입니다.","Python",53596,281),
  g("mksglu/context-mode","AI 코딩 에이전트의 대화 공간(컨텍스트)을 아껴 주는 도구입니다. 도구 출력을 98% 줄이고 세션 기억을 유지하며, MCP와 훅으로 17개 플랫폼을 지원합니다.","TypeScript",30289,449),
  g("ruvnet/ruflo","여러 AI 에이전트를 한 팀으로 묶어 자동 작업을 돌리는 도구입니다. 기억·자가학습·RAG를 지원하고 Claude Code·Codex 등과 연동됩니다.","TypeScript",75704,672),
  g("android/skills","AI 에이전트가 안드로이드 개발 모범 사례를 따르도록 돕는 구글 안드로이드 공식 스킬 모음입니다(저장소 설명이 비어 있어 README를 참고했습니다).","Kotlin",8140,36),
  g("obra/superpowers","AI 코딩 에이전트용 스킬 프레임워크이자 개발 방법론입니다.","Shell",300759,973),
  g("cursor/plugins","Cursor 플러그인 규격과 공식 플러그인 모음입니다.","TypeScript",12032,278),
  g("debpalash/VoiceStudio","내 컴퓨터에서만 돌아가는 오픈소스 음성 도구로, ElevenLabs 대체를 내세웁니다. 목소리 복제·더빙·받아쓰기·오디오북 제작을 646개 언어로 지원합니다.","Python",71549,2301)
]};
