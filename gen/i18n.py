# 화면 고정 문구를 i18n/{lang}.json에서 읽습니다.
import json, pathlib

_DIR = pathlib.Path(__file__).resolve().parent.parent / "i18n"
_cache = {}


def T(lang):
    if lang not in _cache:
        _cache[lang] = json.loads((_DIR / f"{lang}.json").read_text(encoding="utf-8"))
    return _cache[lang]
