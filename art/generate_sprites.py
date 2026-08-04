#!/usr/bin/env python3
"""
beta0.01 sprites — 档位 B+ 精细版
戴夫海感青蓝 × 北欧草地 · 多层明暗 · 微细节 · 冷色阴影
风格见 art/STYLE.md
"""
from __future__ import annotations

from pathlib import Path
from PIL import Image
import math
import random

ROOT = Path(__file__).resolve().parent
OUT_PNG = ROOT.parent / "beta0.01" / "public" / "assets"
OUT_SRC = ROOT / "src"
OUT_PNG.mkdir(parents=True, exist_ok=True)
OUT_SRC.mkdir(parents=True, exist_ok=True)

C = {
    "0": (0, 0, 0, 0),
    "ink": (18, 26, 34, 255),
    "ink2": (32, 42, 52, 255),
    "shade": (6, 20, 34, 78),
    "shade2": (6, 20, 34, 40),
    # skin 5-tone
    "sk0": (148, 98, 72, 255),
    "sk1": (198, 148, 108, 255),
    "sk2": (232, 190, 148, 255),
    "sk3": (250, 222, 186, 255),
    "sk4": (255, 236, 210, 255),
    "sk_blush": (236, 150, 130, 255),
    # hair
    "hr0": (36, 24, 26, 255),
    "hr1": (64, 40, 38, 255),
    "hr2": (96, 62, 50, 255),
    "hr3": (128, 88, 68, 255),
    # ocean tunic 6-tone
    "cl0": (12, 48, 64, 255),
    "cl1": (20, 78, 98, 255),
    "cl2": (32, 118, 140, 255),
    "cl3": (52, 158, 176, 255),
    "cl4": (88, 198, 210, 255),
    "cl5": (150, 230, 236, 255),
    # gold
    "gl0": (100, 68, 22, 255),
    "gl1": (178, 138, 48, 255),
    "gl2": (228, 196, 88, 255),
    "gl3": (250, 230, 150, 255),
    # boots
    "bt0": (28, 24, 26, 255),
    "bt1": (52, 40, 38, 255),
    "bt2": (78, 60, 52, 255),
    "bt3": (104, 82, 68, 255),
    # leaves
    "lf0": (18, 58, 40, 255),
    "lf1": (28, 92, 54, 255),
    "lf2": (44, 132, 70, 255),
    "lf3": (72, 172, 92, 255),
    "lf4": (118, 210, 120, 255),
    "lf5": (36, 110, 88, 255),
    "lf6": (160, 230, 150, 255),
    # trunk
    "tr0": (40, 26, 18, 255),
    "tr1": (74, 48, 30, 255),
    "tr2": (112, 76, 46, 255),
    "tr3": (148, 108, 66, 255),
    "tr4": (178, 136, 88, 255),
    # grass
    "g0": (28, 62, 42, 255),
    "g1": (40, 88, 52, 255),
    "g2": (54, 116, 64, 255),
    "g3": (74, 144, 78, 255),
    "g4": (100, 172, 92, 255),
    "g5": (36, 84, 68, 255),
    "g6": (140, 200, 118, 255),
    "g7": (48, 100, 72, 255),
    # path
    "p0": (68, 54, 36, 255),
    "p1": (104, 84, 52, 255),
    "p2": (136, 112, 70, 255),
    "p3": (168, 144, 96, 255),
    "p4": (88, 72, 48, 255),
    "p5": (196, 176, 128, 255),
    "p6": (52, 42, 30, 255),
    # village cobble
    "v0": (42, 80, 62, 255),
    "v1": (56, 100, 76, 255),
    "v2": (84, 112, 96, 255),
    "v3": (120, 128, 124, 255),
    "v4": (152, 156, 152, 255),
    "v5": (80, 92, 90, 255),
    "v6": (100, 140, 130, 255),
    "v7": (170, 174, 168, 255),
    # forest
    "f0": (22, 44, 32, 255),
    "f1": (32, 58, 40, 255),
    "f2": (44, 74, 48, 255),
    "f3": (56, 90, 56, 255),
    "f4": (70, 64, 38, 255),
    # water
    "w0": (8, 40, 58, 255),
    "w1": (14, 68, 92, 255),
    "w2": (22, 104, 132, 255),
    "w3": (40, 152, 172, 255),
    "w4": (78, 198, 212, 255),
    "w5": (150, 228, 236, 255),
    "w6": (210, 246, 250, 255),
    "w7": (28, 88, 110, 255),
    # slime
    "s0": (20, 78, 42, 255),
    "s1": (42, 138, 72, 255),
    "s2": (78, 198, 110, 255),
    "s3": (130, 232, 160, 255),
    "s4": (190, 255, 210, 255),
    "se": (16, 24, 20, 255),
    # wood
    "wd0": (48, 30, 20, 255),
    "wd1": (86, 54, 32, 255),
    "wd2": (120, 80, 46, 255),
    "wd3": (158, 112, 66, 255),
    "wd4": (192, 148, 96, 255),
    "wd5": (220, 180, 124, 255),
    # roof
    "rf0": (78, 26, 30, 255),
    "rf1": (120, 40, 42, 255),
    "rf2": (158, 62, 54, 255),
    "rf3": (198, 96, 72, 255),
    "rf4": (230, 140, 100, 255),
    "rf5": (248, 180, 140, 255),
    # stone
    "st0": (44, 50, 58, 255),
    "st1": (74, 82, 94, 255),
    "st2": (108, 118, 128, 255),
    "st3": (148, 158, 168, 255),
    "st4": (180, 188, 196, 255),
    # gem
    "gm0": (12, 72, 78, 255),
    "gm1": (28, 128, 124, 255),
    "gm2": (60, 196, 178, 255),
    "gm3": (120, 236, 210, 255),
    "gm4": (200, 255, 238, 255),
    # accents
    "sg0": (140, 100, 32, 255),
    "sg1": (210, 170, 60, 255),
    "sg2": (248, 218, 110, 255),
    "ct0": (148, 34, 46, 255),
    "ct1": (210, 64, 72, 255),
    "ct2": (255, 130, 140, 255),
    "ct3": (255, 190, 100, 255),
    # fish
    "fi0": (24, 78, 108, 255),
    "fi1": (52, 138, 165, 255),
    "fi2": (110, 190, 210, 255),
    "fi3": (180, 230, 242, 255),
    # shrimp
    "rs0": (70, 100, 95, 255),
    "rs1": (120, 155, 140, 255),
    "rs2": (165, 195, 180, 255),
    "rs3": (200, 175, 170, 255),
    "cs0": (140, 60, 30, 255),
    "cs1": (210, 110, 55, 255),
    "cs2": (240, 160, 90, 255),
    "cs3": (255, 200, 140, 255),
    # focus
    "fc0": (32, 110, 130, 255),
    "fc1": (90, 200, 214, 255),
    "fc2": (210, 248, 255, 255),
    # logs
    "lg0": (64, 42, 26, 255),
    "lg1": (110, 74, 42, 255),
    "lg2": (150, 104, 60, 255),
    "lg3": (184, 140, 88, 255),
    # plaster
    "pl0": (100, 84, 64, 255),
    "pl1": (148, 126, 94, 255),
    "pl2": (182, 158, 120, 255),
    "pl3": (210, 188, 150, 255),
    "pl4": (232, 212, 176, 255),
    "dr0": (50, 30, 24, 255),
    "dr1": (84, 50, 36, 255),
    "dr2": (112, 70, 48, 255),
    # window glass
    "wn0": (16, 56, 78, 255),
    "wn1": (40, 120, 150, 255),
    "wn2": (90, 180, 205, 255),
    "wn3": (160, 220, 235, 255),
    "wn4": (220, 245, 250, 255),
}


def rgba(k: str) -> tuple[int, int, int, int]:
    return C[k]


def new(w: int, h: int) -> Image.Image:
    return Image.new("RGBA", (w, h), (0, 0, 0, 0))


def p(img: Image.Image, x: int, y: int, k: str) -> None:
    if 0 <= x < img.width and 0 <= y < img.height:
        img.putpixel((x, y), rgba(k))


def fill(img: Image.Image, x0: int, y0: int, w: int, h: int, k: str) -> None:
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            p(img, x, y, k)


def circle(img: Image.Image, cx: int, cy: int, r: int, k: str) -> None:
    rr = r * r
    for y in range(cy - r, cy + r + 1):
        for x in range(cx - r, cx + r + 1):
            if (x - cx) ** 2 + (y - cy) ** 2 <= rr:
                p(img, x, y, k)


def ellipse_fill(img: Image.Image, cx: int, cy: int, rx: int, ry: int, k: str) -> None:
    if rx <= 0 or ry <= 0:
        return
    for y in range(cy - ry, cy + ry + 1):
        for x in range(cx - rx, cx + rx + 1):
            if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1.0:
                p(img, x, y, k)


def dither_fill(
    img: Image.Image,
    x0: int,
    y0: int,
    w: int,
    h: int,
    a: str,
    b: str,
    phase: int = 0,
) -> None:
    """棋盘/斜纹抖动，做过渡色。"""
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            p(img, x, y, a if ((x + y + phase) & 1) == 0 else b)


def outline_nontransparent(img: Image.Image, ink: str = "ink") -> Image.Image:
    out = img.copy()
    w, h = img.size
    opaque = [[img.getpixel((x, y))[3] > 20 for x in range(w)] for y in range(h)]
    for y in range(h):
        for x in range(w):
            if opaque[y][x]:
                continue
            for dy, dx in (
                (-1, 0),
                (1, 0),
                (0, -1),
                (0, 1),
                (-1, -1),
                (-1, 1),
                (1, -1),
                (1, 1),
            ):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and opaque[ny][nx]:
                    out.putpixel((x, y), rgba(ink))
                    break
    return out


def save(img: Image.Image, name: str) -> None:
    img.save(OUT_PNG / f"{name}.png")
    img.save(OUT_SRC / f"{name}.png")
    print(f"  {name}.png {img.size}")


# ---------- character：更圆润、多层衣褶、眼神高光 ----------

def make_player(facing: str) -> Image.Image:
    img = new(32, 32)
    ellipse_fill(img, 16, 30, 9, 2, "shade")
    ellipse_fill(img, 16, 30, 6, 1, "shade2")

    if facing == "up":
        fill(img, 9, 4, 14, 10, "hr1")
        fill(img, 10, 3, 12, 2, "hr0")
        fill(img, 11, 5, 10, 6, "hr2")
        fill(img, 12, 6, 8, 3, "hr3")
        # hood
        fill(img, 9, 12, 14, 4, "cl1")
        fill(img, 10, 11, 12, 2, "cl2")
        fill(img, 11, 12, 10, 1, "cl3")
        # body
        fill(img, 8, 15, 16, 11, "cl1")
        fill(img, 9, 15, 14, 2, "cl2")
        dither_fill(img, 9, 17, 14, 4, "cl2", "cl1")
        fill(img, 8, 22, 16, 4, "cl0")
        fill(img, 11, 16, 10, 5, "cl0")  # pack
        fill(img, 12, 17, 8, 2, "cl1")
        fill(img, 10, 22, 12, 2, "gl1")
        fill(img, 14, 22, 4, 2, "gl2")
        p(img, 15, 22, "gl3")
        fill(img, 10, 25, 5, 5, "bt1")
        fill(img, 17, 25, 5, 5, "bt1")
        fill(img, 10, 29, 5, 2, "bt0")
        fill(img, 17, 29, 5, 2, "bt0")
        p(img, 11, 26, "bt2")
        p(img, 18, 26, "bt2")
    elif facing in ("left", "right"):
        fill(img, 10, 4, 12, 9, "hr1")
        fill(img, 11, 3, 10, 2, "hr0")
        fill(img, 12, 5, 8, 5, "hr2")
        fill(img, 13, 6, 5, 3, "hr3")
        # face
        fill(img, 12, 10, 9, 7, "sk2")
        fill(img, 13, 11, 7, 4, "sk3")
        fill(img, 13, 15, 7, 2, "sk1")
        eye = 18 if facing == "right" else 13
        fill(img, eye, 12, 2, 2, "ink")
        p(img, eye, 12, "sk4")
        p(img, eye + (0 if facing == "right" else 1), 13, "ink")
        # blush
        p(img, 14 if facing == "right" else 18, 15, "sk_blush")
        # body
        fill(img, 9, 16, 14, 10, "cl1")
        fill(img, 10, 16, 12, 2, "cl2")
        fill(img, 11, 16, 8, 1, "cl3")
        dither_fill(img, 10, 18, 12, 3, "cl2", "cl1")
        fill(img, 9, 22, 14, 3, "cl0")
        fill(img, 11, 20, 8, 2, "gl1")
        p(img, 14, 20, "gl2")
        arm = 7 if facing == "left" else 22
        fill(img, arm, 17, 3, 7, "cl2")
        fill(img, arm, 23, 3, 2, "sk2")
        fill(img, 11, 26, 4, 4, "bt1")
        fill(img, 17, 26, 4, 4, "bt1")
        fill(img, 11, 29, 4, 2, "bt0")
        fill(img, 17, 29, 4, 2, "bt0")
        if facing == "left":
            img = img.transpose(Image.FLIP_LEFT_RIGHT)
    else:
        # front
        fill(img, 9, 3, 14, 8, "hr1")
        fill(img, 10, 2, 12, 2, "hr0")
        fill(img, 11, 4, 10, 5, "hr2")
        fill(img, 12, 5, 8, 3, "hr3")
        # bangs
        fill(img, 10, 9, 4, 2, "hr1")
        fill(img, 18, 9, 4, 2, "hr1")
        p(img, 14, 9, "hr0")
        p(img, 17, 9, "hr0")
        # face oval
        fill(img, 10, 10, 12, 8, "sk2")
        fill(img, 11, 11, 10, 5, "sk3")
        fill(img, 12, 12, 8, 3, "sk4")
        fill(img, 11, 16, 10, 2, "sk1")
        fill(img, 12, 17, 8, 1, "sk0")
        # eyes
        fill(img, 12, 12, 3, 3, "ink")
        fill(img, 17, 12, 3, 3, "ink")
        p(img, 12, 12, "sk4")
        p(img, 17, 12, "sk4")
        p(img, 13, 13, "ink")
        p(img, 18, 13, "ink")
        # brows
        fill(img, 12, 11, 3, 1, "hr0")
        fill(img, 17, 11, 3, 1, "hr0")
        # blush + smile
        p(img, 11, 15, "sk_blush")
        p(img, 20, 15, "sk_blush")
        p(img, 14, 16, "sk0")
        p(img, 15, 17, "sk0")
        p(img, 16, 17, "sk0")
        p(img, 17, 16, "sk0")
        # tunic
        fill(img, 8, 17, 16, 9, "cl1")
        fill(img, 9, 17, 14, 2, "cl2")
        fill(img, 10, 17, 12, 1, "cl3")
        dither_fill(img, 9, 19, 14, 3, "cl2", "cl1")
        fill(img, 8, 23, 16, 3, "cl0")
        # collar highlight
        fill(img, 12, 17, 8, 3, "cl3")
        fill(img, 14, 18, 4, 2, "cl4")
        p(img, 15, 18, "cl5")
        p(img, 16, 18, "cl5")
        # belt + buckle
        fill(img, 9, 22, 14, 2, "gl1")
        fill(img, 13, 22, 6, 2, "gl2")
        p(img, 15, 22, "gl3")
        p(img, 16, 22, "gl0")
        # legs
        fill(img, 10, 25, 5, 5, "bt1")
        fill(img, 17, 25, 5, 5, "bt1")
        fill(img, 10, 29, 5, 2, "bt0")
        fill(img, 17, 29, 5, 2, "bt0")
        fill(img, 11, 26, 2, 2, "bt2")
        fill(img, 18, 26, 2, 2, "bt2")
        p(img, 12, 27, "bt3")
        p(img, 19, 27, "bt3")

    return outline_nontransparent(img)


def make_slime() -> Image.Image:
    img = new(32, 32)
    ellipse_fill(img, 16, 29, 11, 2, "shade")
    ellipse_fill(img, 16, 18, 13, 11, "s0")
    ellipse_fill(img, 16, 17, 12, 10, "s1")
    ellipse_fill(img, 16, 16, 11, 9, "s2")
    ellipse_fill(img, 13, 13, 6, 5, "s3")
    ellipse_fill(img, 11, 11, 3, 3, "s4")
    fill(img, 10, 15, 4, 5, "se")
    fill(img, 18, 15, 4, 5, "se")
    p(img, 11, 16, "s4")
    p(img, 19, 16, "s4")
    fill(img, 14, 21, 4, 1, "s0")
    fill(img, 6, 22, 2, 4, "s1")
    fill(img, 24, 21, 2, 3, "s2")
    return outline_nontransparent(img)


def make_tree() -> Image.Image:
    img = new(32, 44)
    ellipse_fill(img, 16, 42, 8, 2, "shade")
    # trunk layered
    fill(img, 13, 26, 6, 15, "tr1")
    fill(img, 14, 26, 2, 15, "tr2")
    fill(img, 17, 26, 1, 15, "tr0")
    p(img, 15, 30, "tr0")
    p(img, 15, 35, "tr0")
    p(img, 16, 32, "tr3")
    p(img, 14, 38, "tr4")
    fill(img, 10, 40, 4, 2, "tr0")
    fill(img, 18, 40, 4, 2, "tr0")
    # canopy clusters
    layers = [
        (16, 15, 13, "lf0"),
        (16, 14, 12, "lf1"),
        (16, 13, 11, "lf2"),
        (8, 16, 7, "lf5"),
        (24, 16, 7, "lf5"),
        (16, 8, 8, "lf2"),
        (10, 10, 6, "lf3"),
        (22, 10, 6, "lf3"),
        (16, 9, 5, "lf4"),
        (13, 13, 4, "lf4"),
        (19, 12, 4, "lf6"),
    ]
    for cx, cy, r, col in layers:
        circle(img, cx, cy, r, col)
    for x, y in [(6, 13), (26, 14), (9, 6), (23, 7), (16, 4), (7, 18), (25, 18), (12, 8)]:
        p(img, x, y, "lf6")
        p(img, x + 1, y, "lf4")
    # leaf holes / depth
    p(img, 14, 16, "lf0")
    p(img, 20, 15, "lf1")
    return outline_nontransparent(img)


def make_tree_stump() -> Image.Image:
    img = new(32, 32)
    ellipse_fill(img, 16, 29, 9, 2, "shade")
    fill(img, 10, 17, 12, 12, "tr1")
    fill(img, 11, 17, 4, 12, "tr2")
    fill(img, 18, 17, 3, 12, "tr0")
    ellipse_fill(img, 16, 16, 8, 4, "tr3")
    ellipse_fill(img, 16, 16, 5, 2, "tr2")
    ellipse_fill(img, 16, 16, 2, 1, "tr0")
    p(img, 14, 16, "tr4")
    p(img, 12, 20, "lf1")
    p(img, 21, 22, "lf5")
    fill(img, 8, 27, 3, 2, "tr0")
    fill(img, 21, 27, 3, 2, "tr0")
    return outline_nontransparent(img)


def make_fish_spot(empty: bool = False) -> Image.Image:
    img = new(32, 32)
    ellipse_fill(img, 16, 17, 15, 10, "w0")
    ellipse_fill(img, 16, 16, 14, 9, "w1")
    ellipse_fill(img, 16, 15, 13, 8, "w2")
    ellipse_fill(img, 16, 15, 11, 6, "w3")
    ellipse_fill(img, 15, 14, 6, 3, "w4")
    for i, y in enumerate((11, 17, 21)):
        for x in range(6 + i, 26 - i):
            if (x + y) % 3 == 0:
                p(img, x, y, "w4")
            if (x + y * 2) % 7 == 0:
                p(img, x, y, "w5")
    for x, y in [(8, 11), (22, 12), (13, 10), (19, 20), (11, 19), (24, 16)]:
        p(img, x, y, "w5")
        p(img, x + 1, y, "w6")
    if not empty:
        ellipse_fill(img, 16, 16, 7, 3, "fi1")
        fill(img, 10, 15, 5, 3, "fi2")
        fill(img, 22, 15, 4, 3, "fi0")
        p(img, 23, 14, "fi1")
        p(img, 23, 17, "fi1")
        p(img, 12, 15, "se")
        p(img, 12, 16, "fi3")
        p(img, 16, 13, "fi2")
        p(img, 17, 13, "fi3")
    return outline_nontransparent(img, "w0")


def make_shop() -> Image.Image:
    img = new(64, 64)
    ellipse_fill(img, 32, 60, 26, 3, "shade")
    ellipse_fill(img, 32, 60, 18, 2, "shade2")
    # roof shingles
    for y in range(5, 22):
        inset = 25 - (y - 5)
        for x in range(inset, 64 - inset):
            row = (y - 5) // 2
            col = "rf1"
            if (x // 3 + row) % 2 == 0:
                col = "rf0"
            if y < 10:
                col = "rf2"
            if y < 8 and abs(x - 32) < 10:
                col = "rf3"
            p(img, x, y, col)
            if y % 2 == 0 and x % 4 == 0:
                p(img, x, y, "rf0")
    for x in range(16, 48):
        p(img, x, 7, "rf4")
        if x % 5 == 0:
            p(img, x, 8, "rf5")
    # walls
    fill(img, 9, 22, 46, 34, "wd2")
    fill(img, 9, 22, 46, 2, "wd1")
    fill(img, 9, 54, 46, 2, "wd0")
    for y in range(24, 54):
        for x in range(9, 55):
            if (x + y * 3) % 9 == 0:
                p(img, x, y, "wd1")
            if y % 5 == 0:
                p(img, x, y, "wd0")
    fill(img, 9, 22, 3, 34, "wd0")
    fill(img, 52, 22, 3, 34, "wd0")
    # teal awning stripes
    fill(img, 13, 24, 38, 8, "cl2")
    fill(img, 13, 24, 38, 2, "cl1")
    for x in range(13, 51, 4):
        fill(img, x, 26, 2, 5, "cl3" if (x // 4) % 2 == 0 else "cl1")
    fill(img, 13, 31, 38, 1, "cl0")
    for x in range(13, 51, 5):
        fill(img, x, 32, 3, 3, "cl0")
    # counter + goods
    fill(img, 15, 38, 34, 14, "wd3")
    fill(img, 15, 38, 34, 2, "wd5")
    fill(img, 15, 50, 34, 2, "wd1")
    dither_fill(img, 16, 40, 32, 8, "wd3", "wd2")
    # sign
    fill(img, 18, 10, 28, 12, "sg1")
    fill(img, 18, 10, 28, 2, "sg0")
    fill(img, 20, 13, 24, 6, "sg2")
    for i in range(3):
        p(img, 24 + i * 6, 15, "gl0")
    circle(img, 26, 44, 2, "gl2")
    circle(img, 34, 45, 2, "gl1")
    circle(img, 42, 44, 2, "gl3")
    fill(img, 17, 42, 6, 6, "wd1")
    fill(img, 18, 43, 4, 2, "wd4")
    fill(img, 42, 42, 6, 6, "wd0")
    # window
    fill(img, 17, 33, 10, 5, "wn0")
    fill(img, 18, 34, 8, 3, "wn1")
    p(img, 19, 34, "wn3")
    p(img, 20, 35, "wn4")
    return outline_nontransparent(img)


def make_warehouse() -> Image.Image:
    img = new(64, 64)
    ellipse_fill(img, 32, 60, 26, 3, "shade")
    for y in range(6, 20):
        inset = 19 - (y - 6)
        for x in range(inset + 3, 61 - inset):
            p(img, x, y, "st1" if (x // 2 + y) % 2 == 0 else "st0")
    fill(img, 20, 6, 24, 2, "st3")
    fill(img, 16, 18, 32, 2, "cl0")
    fill(img, 16, 19, 32, 1, "cl1")
    fill(img, 9, 20, 46, 36, "wd1")
    fill(img, 9, 20, 46, 2, "wd0")
    for y in range(24, 54, 4):
        fill(img, 11, y, 42, 1, "wd0")
        for x in range(11, 53, 6):
            p(img, x, y + 1, "wd2")
    # door double
    fill(img, 22, 28, 20, 28, "wd0")
    fill(img, 24, 30, 8, 24, "st0")
    fill(img, 34, 30, 8, 24, "st1")
    fill(img, 25, 32, 6, 20, "st2")
    fill(img, 35, 32, 6, 20, "st2")
    p(img, 30, 42, "st4")
    p(img, 38, 42, "gl1")
    for ox, oy in [(9, 20), (51, 20), (9, 52), (51, 52)]:
        fill(img, ox, oy, 4, 4, "st2")
    fill(img, 11, 48, 9, 8, "wd2")
    fill(img, 12, 49, 7, 2, "wd4")
    fill(img, 44, 48, 9, 8, "wd2")
    fill(img, 45, 49, 7, 2, "wd3")
    return outline_nontransparent(img)


def make_save_point() -> Image.Image:
    img = new(32, 40)
    ellipse_fill(img, 16, 38, 10, 2, "shade")
    fill(img, 7, 28, 18, 10, "st1")
    fill(img, 8, 28, 16, 2, "st3")
    fill(img, 7, 36, 18, 2, "st0")
    fill(img, 9, 30, 14, 5, "st2")
    dither_fill(img, 10, 31, 12, 3, "st3", "st2")
    fill(img, 12, 16, 8, 14, "st2")
    fill(img, 13, 16, 3, 14, "st3")
    fill(img, 17, 16, 2, 14, "st0")
    for cy, r, col in [(4, 8, "gm0"), (5, 7, "gm1"), (6, 6, "gm2"), (7, 5, "gm3")]:
        for y in range(cy, cy + r * 2 + 2):
            half = max(1, r - abs((y - cy) - r))
            for x in range(16 - half, 16 + half + 1):
                p(img, x, y, col)
    fill(img, 15, 7, 2, 10, "gm4")
    p(img, 14, 9, "gm3")
    p(img, 17, 11, "gm4")
    p(img, 13, 12, "gm2")
    for x, col in [(11, "gm2"), (16, "gm3"), (21, "gm2")]:
        p(img, x, 32, col)
    return outline_nontransparent(img)


def make_house() -> Image.Image:
    """初始村大屋：瓦片屋顶、木梁、玻璃高光、花箱、地基。"""
    img = new(96, 72)
    ellipse_fill(img, 48, 69, 40, 3, "shade")
    ellipse_fill(img, 48, 69, 28, 2, "shade2")
    # chimney
    fill(img, 68, 4, 12, 26, "st1")
    fill(img, 68, 2, 12, 3, "st2")
    fill(img, 70, 0, 8, 3, "st0")
    fill(img, 69, 6, 3, 20, "st0")
    fill(img, 76, 8, 2, 16, "st3")
    for x, y in [(72, 0), (75, 1), (70, 1), (74, 2)]:
        p(img, x, y, "st3")
    # roof tiles
    for y in range(6, 28):
        half = 44 - (y - 6)
        for x in range(48 - half, 48 + half):
            row = (y - 6) // 2
            col = "rf1" if (x // 4 + row) % 2 == 0 else "rf0"
            if y < 12:
                col = "rf2"
            if y < 9 and abs(x - 48) < 14:
                col = "rf3"
            p(img, x, y, col)
            if (x + y) % 6 == 0:
                p(img, x, y, "rf0")
    for x in range(16, 80):
        p(img, x, 8, "rf4")
        if x % 4 == 0:
            p(img, x, 9, "rf5")
    # walls
    fill(img, 12, 28, 72, 38, "pl1")
    fill(img, 12, 28, 72, 3, "pl0")
    fill(img, 12, 62, 72, 4, "pl0")
    # foundation stones
    for x in range(12, 84, 6):
        fill(img, x, 64, 5, 4, "st1" if (x // 6) % 2 == 0 else "st0")
        p(img, x + 1, 65, "st2")
    rng = random.Random(19)
    for _ in range(200):
        x = rng.randint(14, 82)
        y = rng.randint(32, 60)
        p(img, x, y, rng.choice(["pl2", "pl0", "pl3", "pl1"]))
    # timber frame
    fill(img, 12, 42, 72, 3, "wd0")
    fill(img, 12, 43, 72, 1, "wd1")
    fill(img, 26, 28, 3, 36, "wd1")
    fill(img, 67, 28, 3, 36, "wd1")
    fill(img, 12, 28, 3, 40, "wd0")
    fill(img, 81, 28, 3, 40, "wd0")
    fill(img, 46, 28, 2, 14, "wd0")
    # door recessed
    fill(img, 38, 40, 20, 26, "dr0")
    fill(img, 40, 42, 16, 22, "dr1")
    fill(img, 42, 44, 12, 18, "dr2")
    dither_fill(img, 43, 46, 10, 14, "dr2", "dr1")
    fill(img, 44, 48, 2, 8, "wd0")  # panel line
    p(img, 52, 54, "gl2")
    p(img, 51, 54, "gl3")
    p(img, 53, 55, "gl0")
    # doorstep
    fill(img, 36, 66, 24, 3, "v3")
    fill(img, 38, 66, 20, 2, "v4")
    p(img, 40, 67, "v7")
    # windows with glass gradient
    for ox in (18, 64):
        fill(img, ox, 32, 16, 14, "wd0")
        fill(img, ox + 1, 33, 14, 12, "wn0")
        fill(img, ox + 2, 34, 12, 10, "wn1")
        fill(img, ox + 3, 35, 5, 4, "wn2")
        p(img, ox + 4, 36, "wn3")
        p(img, ox + 5, 37, "wn4")
        p(img, ox + 10, 40, "wn0")  # corner dark
        # mullion
        fill(img, ox + 8, 33, 1, 12, "wd0")
        fill(img, ox + 1, 39, 14, 1, "wd0")
        # curtain hint
        fill(img, ox + 2, 34, 2, 8, "ct0")
        for i in range(3):
            p(img, ox + 2, 35 + i * 2, "ct1")
    # flower boxes
    for base in (18, 64):
        fill(img, base, 46, 16, 4, "wd2")
        fill(img, base, 46, 16, 1, "wd4")
        for i, col in enumerate(
            ("lf3", "ct1", "lf4", "ct2", "sg1", "lf6", "ct3", "lf3")
        ):
            p(img, base + 2 + i * 2, 45, col)
            p(img, base + 3 + i * 2, 44, "lf2")
    # vine on left post
    for y in range(30, 58, 3):
        p(img, 14, y, "lf2")
        p(img, 15, y + 1, "lf3")
    return outline_nontransparent(img)


def make_bush() -> Image.Image:
    img = new(32, 32)
    ellipse_fill(img, 16, 28, 10, 2, "shade")
    for cx, cy, r, col in [
        (16, 18, 11, "lf0"),
        (16, 17, 10, "lf1"),
        (10, 18, 7, "lf5"),
        (22, 18, 7, "lf2"),
        (16, 12, 8, "lf3"),
        (12, 14, 5, "lf4"),
        (21, 13, 5, "lf4"),
        (16, 14, 3, "lf6"),
    ]:
        circle(img, cx, cy, r, col)
    p(img, 10, 15, "ct1")
    p(img, 22, 16, "ct2")
    p(img, 16, 11, "sg1")
    p(img, 14, 18, "lf6")
    p(img, 19, 19, "ct3")
    return outline_nontransparent(img)


def tile_noise(img: Image.Image, colors: list[str], seed: int = 0, density: float = 0.2) -> None:
    rng = random.Random(seed)
    w, h = img.size
    for y in range(h):
        for x in range(w):
            n = (x * 17 + y * 31 + seed * 13) % len(colors)
            if rng.random() < density:
                n = (n + 1) % len(colors)
            # soft clump
            n = (n + ((x // 4) ^ (y // 4)) + seed) % len(colors)
            p(img, x, y, colors[n])


def make_tile(kind: str, variant: int = 0) -> Image.Image:
    img = new(32, 32)
    seed = variant * 97 + 3
    if kind == "grass":
        tile_noise(img, ["g1", "g2", "g1", "g3", "g0", "g2", "g5", "g7"], seed, 0.22)
        blades = [
            (3, 8), (7, 20), (12, 5), (18, 14), (24, 9), (28, 22),
            (5, 26), (15, 28), (22, 3), (10, 16), (26, 18), (1, 12),
            (16, 10), (8, 12), (20, 20), (14, 22), (4, 4), (30, 14),
        ]
        off = variant * 3
        for i, (x, y) in enumerate(blades):
            x = (x + off) % 32
            y = (y + off // 2) % 30 + 1
            p(img, x, y, "g4")
            p(img, x, y - 1, "g3")
            if y > 2:
                p(img, x, y - 2, "g6")
            if i % 3 == 0:
                p(img, x + 1, y - 1, "g4")
        for x, y in [(9, 10), (21, 24), (27, 6), (4, 18), (16, 16)]:
            xx = (x + variant * 5) % 30
            p(img, xx, y, "sg2")
            p(img, xx, y + 1, "lf2")
            p(img, xx + 1, y, "ct3" if variant else "sg1")
    elif kind == "path":
        tile_noise(img, ["p1", "p2", "p1", "p3", "p0", "p4", "p2"], seed + 1, 0.18)
        for y in (0, 1, 30, 31):
            for x in range(32):
                p(img, x, y, "p6" if y in (0, 31) else "p0")
        for x, y in [(5, 8), (14, 18), (22, 6), (10, 26), (26, 20), (18, 12), (8, 14), (28, 24)]:
            xx = (x + variant * 4) % 30
            p(img, xx, y, "p3")
            p(img, xx + 1, y, "p5")
            p(img, xx, y + 1, "p0")
            p(img, xx + 1, y + 1, "p4")
        # edge grit
        for x in range(0, 32, 3):
            p(img, x, 2, "p4")
            p(img, x + 1, 29, "p6")
    elif kind == "water":
        for y in range(32):
            for x in range(32):
                wave = (
                    math.sin((x + variant * 4 + y * 0.55) * 0.42)
                    + math.sin(x * 0.28 + y * 0.12 + variant)
                    + math.sin((x - y) * 0.2)
                )
                if wave > 1.1:
                    k = "w5"
                elif wave > 0.55:
                    k = "w4"
                elif wave > 0.1:
                    k = "w3"
                elif wave > -0.35:
                    k = "w2"
                elif wave > -0.85:
                    k = "w1"
                else:
                    k = "w0"
                p(img, x, y, k)
                if (x + y * 2 + variant) % 11 == 0:
                    p(img, x, y, "w7")
        for x, y in [(6, 10), (18, 7), (25, 16), (12, 22), (20, 26), (4, 20), (28, 4), (14, 14)]:
            p(img, (x + variant * 2) % 31, y, "w5")
            p(img, (x + 1 + variant * 2) % 31, y, "w6")
    elif kind == "water_edge":
        for y in range(32):
            for x in range(32):
                if x < 8:
                    n = (x + y * 2 + variant) % 6
                    p(img, x, y, ["g1", "g2", "g3", "g0", "g5", "g7"][n])
                elif x < 12:
                    p(img, x, y, "p0" if (x + y) % 2 else "p1")
                elif x < 14:
                    p(img, x, y, "p4" if (y + variant) % 3 else "w7")
                else:
                    wave = math.sin((x + y + variant) * 0.38)
                    p(img, x, y, "w3" if wave > 0 else "w1")
                    if (x + y) % 5 == 0:
                        p(img, x, y, "w4")
        for y in range(32):
            p(img, 11, y, "p6")
            if y % 3 == 0:
                p(img, 13, y, "w5")
                p(img, 14, y, "w4")
                p(img, 15, y + 1 if y < 31 else y, "w6")
    elif kind == "forest":
        tile_noise(img, ["f1", "f2", "f0", "f3", "f1", "f2", "g5"], seed + 2, 0.2)
        for x, y in [(4, 6), (20, 10), (12, 22), (26, 18), (8, 28), (16, 14)]:
            xx = (x + variant * 3) % 30
            p(img, xx, y, "f4")
            p(img, xx + 1, y, "tr0")
            p(img, xx, y + 1, "tr1")
        for x, y in [(15, 5), (3, 16), (28, 24), (10, 12), (22, 8)]:
            p(img, x, y, "lf0")
            p(img, x + 1, y, "lf5")
    elif kind == "village":
        tile_noise(img, ["v0", "v1", "g1", "v1", "g2", "g5", "g7"], seed + 3, 0.16)
        stones = [
            (2, 2), (14, 8), (6, 18), (18, 20), (10, 4), (22, 14),
            (4, 24), (20, 2), (12, 14), (26, 22), (0, 12), (16, 26),
        ]
        for i, (ox, oy) in enumerate(stones):
            ox = (ox + variant * 5) % 26
            oy = (oy + variant * 3) % 26
            fill(img, ox, oy, 6, 4, "v3")
            fill(img, ox + 1, oy + 1, 4, 2, "v4")
            p(img, ox, oy, "v5")
            p(img, ox + 5, oy + 3, "v2")
            p(img, ox + 2, oy + 3, "v6")
            p(img, ox + 3, oy, "lf5")
            if i % 2 == 0:
                p(img, ox + 4, oy + 1, "v7")
    return img


def make_item_wood() -> Image.Image:
    img = new(32, 32)
    for y in (9, 15, 21):
        fill(img, 5, y, 22, 6, "lg1")
        fill(img, 5, y, 22, 1, "lg3")
        fill(img, 5, y + 5, 22, 1, "lg0")
        fill(img, 6, y + 1, 5, 3, "lg2")
        ellipse_fill(img, 8, y + 3, 3, 2, "lg3")
        p(img, 8, y + 3, "lg0")
        p(img, 18, y + 2, "lg0")
    return outline_nontransparent(img)


def make_item_raw_shrimp() -> Image.Image:
    img = new(32, 32)
    ellipse_fill(img, 14, 16, 9, 5, "rs1")
    ellipse_fill(img, 12, 16, 6, 3, "rs2")
    for dy in range(-3, 4):
        p(img, 23, 16 + dy, "rs0")
        p(img, 24, 16 + dy // 2, "rs1")
        p(img, 25, 16 + dy, "rs0")
    p(img, 8, 15, "se")
    p(img, 9, 15, "rs2")
    fill(img, 14, 10, 4, 2, "rs2")
    fill(img, 14, 20, 4, 2, "rs0")
    fill(img, 11, 17, 6, 2, "rs3")
    return outline_nontransparent(img)


def make_item_cooked_shrimp() -> Image.Image:
    img = new(32, 32)
    ellipse_fill(img, 14, 16, 9, 5, "cs1")
    ellipse_fill(img, 12, 16, 6, 3, "cs2")
    for dy in range(-3, 4):
        p(img, 23, 16 + dy, "cs0")
        p(img, 24, 16 + dy // 2, "cs1")
        p(img, 25, 16 + dy, "cs0")
    p(img, 8, 15, "se")
    p(img, 9, 15, "cs3")
    fill(img, 14, 10, 4, 2, "cs2")
    fill(img, 14, 20, 4, 2, "cs0")
    fill(img, 11, 17, 6, 2, "cs3")
    return outline_nontransparent(img)


def make_focus_ring() -> Image.Image:
    img = new(36, 36)
    for i in range(36):
        for t in (0, 1, 34, 35):
            p(img, i, t, "fc1" if i % 3 else "fc0")
            p(img, t, i, "fc1" if i % 3 else "fc0")
    for x, y in [(2, 2), (33, 2), (2, 33), (33, 33)]:
        p(img, x, y, "fc2")
    # inner soft corners
    for x, y in [(3, 3), (32, 3), (3, 32), (32, 32)]:
        p(img, x, y, "fc1")
    return img


def make_sheet(sprites: dict[str, Image.Image]) -> Image.Image:
    names = [n for n in sprites if not n.startswith("house") and n != "house"]
    # put house last in preview
    names = [n for n in names if n != "house"]
    cols = 6
    rows = (len(names) + cols - 1) // cols
    cell = 40
    sheet = Image.new("RGBA", (cols * cell, rows * cell + 90), (10, 24, 32, 255))
    for i, name in enumerate(names):
        sp = sprites[name]
        scale = min((cell - 4) / sp.width, (cell - 4) / sp.height, 1.0)
        if scale < 1:
            sp2 = sp.resize(
                (max(1, int(sp.width * scale)), max(1, int(sp.height * scale))),
                Image.NEAREST,
            )
        else:
            sp2 = sp
        x = (i % cols) * cell + (cell - sp2.width) // 2
        y = (i // cols) * cell + (cell - sp2.height) // 2
        sheet.paste(sp2, (x, y), sp2)
    h = sprites["house"]
    hs = h.resize((h.width // 2, h.height // 2), Image.NEAREST)
    sheet.paste(hs, (8, rows * cell + 8), hs)
    return sheet


def load_hand_drawn() -> dict[str, Image.Image]:
    migrated = ROOT / "src" / "migrated-from-v0.1"
    mapping = {
        "item_wood": migrated / "wood" / "nor_wood_32.png",
        "item_cooked_shrimp": migrated / "shrimp" / "nor_shrimp_32.png",
    }
    out: dict[str, Image.Image] = {}
    for name, path in mapping.items():
        if path.is_file():
            out[name] = Image.open(path).convert("RGBA")
            print(f"  hand-drawn {name} <- {path.relative_to(ROOT)}")
    return out


def main() -> None:
    print("Generating fine-detail style-B+ sprites...")
    hand = load_hand_drawn()
    sprites: dict[str, Image.Image] = {
        "player_down": make_player("down"),
        "player_up": make_player("up"),
        "player_left": make_player("left"),
        "player_right": make_player("right"),
        "slime": make_slime(),
        "tree": make_tree(),
        "tree_stump": make_tree_stump(),
        "fish_spot": make_fish_spot(False),
        "fish_spot_empty": make_fish_spot(True),
        "shop": make_shop(),
        "warehouse": make_warehouse(),
        "save_point": make_save_point(),
        "house": make_house(),
        "bush": make_bush(),
        "tile_grass": make_tile("grass", 0),
        "tile_grass2": make_tile("grass", 1),
        "tile_path": make_tile("path", 0),
        "tile_path2": make_tile("path", 1),
        "tile_water": make_tile("water", 0),
        "tile_water2": make_tile("water", 1),
        "tile_water_edge": make_tile("water_edge", 0),
        "tile_forest": make_tile("forest", 0),
        "tile_forest2": make_tile("forest", 1),
        "tile_village": make_tile("village", 0),
        "tile_village2": make_tile("village", 1),
        "item_wood": hand.get("item_wood") or make_item_wood(),
        "item_raw_shrimp": make_item_raw_shrimp(),
        "item_cooked_shrimp": hand.get("item_cooked_shrimp") or make_item_cooked_shrimp(),
        "focus_ring": make_focus_ring(),
    }
    for name, img in sprites.items():
        save(img, name)
    sheet = make_sheet(sprites)
    sheet.save(OUT_PNG / "sheet_preview.png")
    sheet.save(OUT_SRC / "sheet_preview.png")
    print("  sheet_preview.png", sheet.size)
    print("Done.")


if __name__ == "__main__":
    main()
