# 크롬 확장 아이콘(16/32/48/128px): 파란 둥근 사각형 위에 지구 선과 빨간 점(떠오르는 이슈)
import pathlib, sys
from PIL import Image, ImageDraw

OUT = pathlib.Path(__file__).resolve().parent.parent / "extension" / "icons"


def icon(n):
    s = 8  # 크게 그린 뒤 줄여 가장자리를 부드럽게
    W = n * s
    im = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, W - 1], radius=W * 0.22, fill=(0, 113, 227, 255))
    c, r, w = W / 2, W * 0.30, max(2, int(W * 0.055))
    d.ellipse([c - r, c - r, c + r, c + r], outline="white", width=w)
    d.ellipse([c - r * 0.45, c - r, c + r * 0.45, c + r], outline="white", width=w)
    d.line([c - r, c, c + r, c], fill="white", width=w)
    dot = W * 0.13
    d.ellipse([W * 0.70 - dot, W * 0.27 - dot, W * 0.70 + dot, W * 0.27 + dot], fill=(255, 59, 48, 255), outline="white", width=w)
    return im.resize((n, n), Image.LANCZOS)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for n in (16, 32, 48, 128):
        icon(n).save(OUT / f"{n}.png")
    print("icons:", sorted(p.name for p in OUT.iterdir()), file=sys.stderr)
