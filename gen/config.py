# 사이트 전체 설정: 주소, 언어, 나라, 분야, 기준값
import os
from urllib.parse import urlparse

SITE_URL = (os.environ.get("SITE_URL") or "https://tking-creator.github.io/world-issues").rstrip("/")  # 빈 값도 기본 주소로
PREFIX = urlparse(SITE_URL).path  # 하위 경로에 올릴 때 내부 링크 앞에 붙는 부분 ("" 또는 "/world-issues")
LANGS = ["en", "ko", "ja", "zh"]

# 주소 키: (탭 코드, 국기, 강조색 키, 갱신 시각을 보여 줄 시간대)
COUNTRIES = {
    "korea": ("KR", "🇰🇷", "kr", ["Asia/Seoul"]),
    "usa":   ("US", "🇺🇸", "us", ["America/New_York", "America/Los_Angeles"]),
    "japan": ("JP", "🇯🇵", "jp", ["Asia/Tokyo"]),
    "china": ("CN", "🇨🇳", "cn", ["Asia/Shanghai"]),
    "world": ("EU+", "🌍", "etc", ["Europe/Paris", "Europe/London"]),
}

# 나라별 분석 플랫폼: (i18n plat_names 키, 주소)
COUNTRY_PLATFORMS = {
    "korea": [("instagram", "https://www.instagram.com/explore/"), ("threads", "https://www.threads.com/"), ("naver_search", "https://search.naver.com/")],
    "usa":   [("instagram", "https://www.instagram.com/explore/"), ("reddit", "https://www.reddit.com/r/news/"), ("x", "https://x.com/explore")],
    "japan": [("x_trends", "https://x.com/explore"), ("tiktok", "https://www.tiktok.com/explore")],
    "china": [("weibo_hot", "https://s.weibo.com/top/summary")],
    "world": [("x", "https://x.com/explore"), ("r_europe", "https://www.reddit.com/r/europe/"), ("r_worldnews", "https://www.reddit.com/r/worldnews/")],
}

# 분야 키: 색 토큰
FIELDS = {"tech": "--f-tech", "politics": "--f-pol", "culture": "--f-cul", "incidents": "--f-acc"}

REFRESH_HOUR_KST = 6  # 매일 갱신 시각(한국 시간). 루틴 일정(UTC 21:00)과 맞춥니다
MIN_SCORE = 5.0
MAX_PER_FIELD = 10
HUB_PAGE_SIZE = 30
