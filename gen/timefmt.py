# 언어별 날짜·시각 문구와 나라별 현지 갱신 시각
from datetime import date, datetime
from zoneinfo import ZoneInfo
from . import config as C

_MON = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split()
_CITY = {
    "Asia/Seoul":          {"en": "Seoul", "ko": "서울", "ja": "ソウル", "zh": "首尔"},
    "America/New_York":    {"en": "New York", "ko": "뉴욕", "ja": "ニューヨーク", "zh": "纽约"},
    "America/Los_Angeles": {"en": "Los Angeles", "ko": "LA", "ja": "ロサンゼルス", "zh": "洛杉矶"},
    "Asia/Tokyo":          {"en": "Tokyo", "ko": "도쿄", "ja": "東京", "zh": "东京"},
    "Asia/Shanghai":       {"en": "Beijing", "ko": "베이징", "ja": "北京", "zh": "北京"},
    "Europe/Paris":        {"en": "Paris", "ko": "파리", "ja": "パリ", "zh": "巴黎"},
    "Europe/London":       {"en": "London", "ko": "런던", "ja": "ロンドン", "zh": "伦敦"},
}
_AMPM = {"ja": ("午前", "午後"), "zh": ("上午", "下午")}


def parse(iso):
    return datetime.fromisoformat(iso)


def fmt_time(dt, lang):
    h12, am, mm = dt.hour % 12 or 12, dt.hour < 12, f"{dt.minute:02d}"
    if lang == "en":
        return f"{_MON[dt.month - 1]} {dt.day}, {h12}:{mm} {'AM' if am else 'PM'}"
    if lang == "ko":
        return f"{dt.month}월 {dt.day}일 {'오전' if am else '오후'} {h12}:{mm}"
    return f"{dt.month}月{dt.day}日 {_AMPM[lang][0 if am else 1]}{h12}:{mm}"


def fmt_date(ymd, lang):
    d = date.fromisoformat(ymd)
    if lang == "en":
        return f"{_MON[d.month - 1]} {d.day}, {d.year}"
    if lang == "ko":
        return f"{d.year}년 {d.month}월 {d.day}일"
    return f"{d.year}年{d.month}月{d.day}日"


def kst_date(iso):
    return parse(iso).astimezone(ZoneInfo("Asia/Seoul")).date().isoformat()


def _at(dt, zone, lang):
    city = _CITY[zone][lang]
    paren = f"（{city}）" if lang in _AMPM else f" ({city})"
    return fmt_time(dt.astimezone(ZoneInfo(zone)), lang) + paren


def country_line(iso, country, lang):
    dt = parse(iso)
    return " · ".join(_at(dt, z, lang) for z in C.COUNTRIES[country][3])


def seoul(iso, lang):
    return _at(parse(iso), "Asia/Seoul", lang)
