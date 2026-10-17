# 공유 미리보기 이미지(1200x630): 언어 x (첫 화면, 나라 5곳, 깃허브)
import os, sys
from PIL import Image, ImageDraw, ImageFont
from . import config as C
from .i18n import T
from .timefmt import fmt_date, kst_date

# 맥 기본 글꼴을 먼저 찾고, 리눅스(클라우드 갱신)에서는 Noto CJK를 찾습니다.
_NOTO = ["/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc", "/usr/share/fonts/noto-cjk/NotoSansCJK-Bold.ttc"]
FONT_CANDIDATES = {
    "en": ["/System/Library/Fonts/Helvetica.ttc", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"] + _NOTO,
    "ko": ["/System/Library/Fonts/AppleSDGothicNeo.ttc"] + _NOTO,
    "ja": ["/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc"] + _NOTO,
    "zh": ["/System/Library/Fonts/STHeiti Medium.ttc", "/System/Library/Fonts/Hiragino Sans GB.ttc"] + _NOTO,
}
COLORS = {"kr": "#0071e3", "us": "#248a3d", "jp": "#d30f45", "cn": "#c93400", "etc": "#5e5ce6", "gh": "#1d1d1f"}


def _font_path(lang):
    return next((p for p in FONT_CANDIDATES[lang] if os.path.exists(p)), None)


def _render(path, font_path, heading, sub, color):
    img = Image.new("RGB", (1200, 630), "#f2f2f7")
    d = ImageDraw.Draw(img)
    f = (lambda s: ImageFont.truetype(font_path, s)) if font_path else (lambda s: ImageFont.load_default(s))
    d.rectangle([0, 0, 1200, 18], fill=color)
    d.text((80, 190), heading, font=f(84), fill="#1d1d1f")
    d.text((80, 320), sub, font=f(46), fill=color)
    d.text((80, 520), C.SITE_URL.split("://", 1)[1], font=f(30), fill="#6e6e73")
    img.save(path, optimize=True)


def build_og(out_dir, latest):
    out_dir.mkdir(parents=True, exist_ok=True)
    day, files = kst_date(latest["updated"]), []
    for lang in C.LANGS:
        font = _font_path(lang)
        text_lang = lang if font else "en"  # 글꼴이 없으면 글자가 깨지지 않게 영어로 그립니다.
        if not font:
            print(f"경고: {lang} 글꼴을 찾지 못해 공유 이미지를 영어로 만듭니다", file=sys.stderr)
        t = T(text_lang)
        date = fmt_date(day, text_lang)
        targets = [("home", "", "kr")]
        targets += [(k, t["countries"][k], C.COUNTRIES[k][2]) for k in C.COUNTRIES]
        targets += [("github", "GitHub Trending", "gh")]
        for key, label, accent in targets:
            p = out_dir / f"{lang}-{key}.png"
            _render(p, font, t["site_name"], f"{label} · {date}" if key != "home" else date, COLORS[accent])
            files.append(p)
    return files
