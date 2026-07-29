#!/usr/bin/env python3
"""
v0.1.1 high-detail pixel sprites (32px base).
Nordic-fantasy cozy palette · outlines · multi-shade · transparent BG.
"""
from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import math
import random

ROOT = Path(__file__).resolve().parent
OUT_PNG = ROOT.parent / "v0.1" / "public" / "assets"
OUT_SRC = ROOT / "src"
OUT_PNG.mkdir(parents=True, exist_ok=True)
OUT_SRC.mkdir(parents=True, exist_ok=True)

# Expanded palette — warm, readable, cohesive
C = {
    "0": (0, 0, 0, 0),
    # outlines / neutrals
    "ink": (24, 20, 28, 255),
    "ink2": (40, 34, 46, 255),
    "shade": (0, 0, 0, 70),
    # skin
    "sk0": (168, 118, 86, 255),
    "sk1": (220, 178, 132, 255),
    "sk2": (240, 208, 168, 255),
    # hair
    "hr0": (48, 30, 28, 255),
    "hr1": (78, 48, 40, 255),
    "hr2": (112, 72, 54, 255),
    # cloak blue
    "cl0": (28, 52, 78, 255),
    "cl1": (44, 82, 118, 255),
    "cl2": (70, 118, 158, 255),
    "cl3": (110, 160, 198, 255),
    # belt / metal
    "gl0": (110, 78, 32, 255),
    "gl1": (180, 140, 60, 255),
    "gl2": (220, 190, 100, 255),
    # boots
    "bt0": (36, 26, 24, 255),
    "bt1": (58, 42, 36, 255),
    # leaves
    "lf0": (22, 58, 34, 255),
    "lf1": (36, 92, 48, 255),
    "lf2": (52, 128, 64, 255),
    "lf3": (78, 168, 88, 255),
    "lf4": (120, 198, 110, 255),
    # trunk
    "tr0": (52, 34, 24, 255),
    "tr1": (86, 56, 36, 255),
    "tr2": (120, 82, 50, 255),
    "tr3": (152, 110, 70, 255),
    # grass
    "g0": (40, 72, 38, 255),
    "g1": (54, 96, 48, 255),
    "g2": (68, 116, 58, 255),
    "g3": (84, 136, 70, 255),
    "g4": (102, 154, 82, 255),
    "g5": (70, 108, 52, 255),
    # path
    "p0": (88, 70, 44, 255),
    "p1": (122, 98, 58, 255),
    "p2": (148, 124, 76, 255),
    "p3": (172, 148, 96, 255),
    "p4": (100, 84, 52, 255),
    # village cobble
    "v0": (58, 86, 58, 255),
    "v1": (72, 104, 70, 255),
    "v2": (96, 118, 92, 255),
    "v3": (130, 128, 118, 255),
    "v4": (150, 148, 138, 255),
    "v5": (88, 96, 86, 255),
    # forest floor
    "f0": (28, 48, 32, 255),
    "f1": (38, 62, 40, 255),
    "f2": (48, 76, 48, 255),
    "f3": (58, 90, 56, 255),
    "f4": (72, 70, 42, 255),
    # water
    "w0": (18, 52, 78, 255),
    "w1": (28, 78, 112, 255),
    "w2": (40, 108, 148, 255),
    "w3": (56, 140, 178, 255),
    "w4": (90, 180, 210, 255),
    "w5": (170, 220, 235, 255),
    "w6": (210, 240, 248, 255),
    # slime
    "s0": (24, 90, 48, 255),
    "s1": (48, 150, 78, 255),
    "s2": (86, 210, 118, 255),
    "s3": (140, 240, 170, 255),
    "s4": (200, 255, 220, 255),
    "se": (18, 28, 22, 255),
    # wood building
    "wd0": (62, 40, 26, 255),
    "wd1": (98, 64, 38, 255),
    "wd2": (132, 90, 52, 255),
    "wd3": (168, 120, 72, 255),
    "wd4": (198, 154, 98, 255),
    # roof
    "rf0": (88, 32, 34, 255),
    "rf1": (128, 48, 46, 255),
    "rf2": (168, 68, 58, 255),
    "rf3": (198, 100, 78, 255),
    # stone / metal
    "st0": (58, 62, 68, 255),
    "st1": (88, 94, 102, 255),
    "st2": (120, 128, 136, 255),
    "st3": (158, 166, 174, 255),
    # gem save
    "gm0": (24, 90, 72, 255),
    "gm1": (40, 140, 110, 255),
    "gm2": (80, 200, 160, 255),
    "gm3": (140, 240, 200, 255),
    "gm4": (210, 255, 230, 255),
    # cloth / sign
    "sg0": (150, 110, 40, 255),
    "sg1": (210, 175, 70, 255),
    "sg2": (240, 210, 120, 255),
    "ct0": (150, 40, 48, 255),
    "ct1": (200, 70, 70, 255),
    # fish
    "fi0": (30, 90, 120, 255),
    "fi1": (60, 140, 175, 255),
    "fi2": (110, 190, 215, 255),
    "fi3": (180, 230, 245, 255),
    # focus / ui
    "fc0": (180, 140, 40, 255),
    "fc1": (255, 220, 100, 255),
    "fc2": (255, 250, 200, 255),
    # items
    "lg0": (70, 46, 28, 255),
    "lg1": (120, 80, 46, 255),
    "lg2": (160, 112, 66, 255),
    "lg3": (190, 145, 90, 255),
    # wall plaster
    "pl0": (120, 98, 72, 255),
    "pl1": (158, 132, 96, 255),
    "pl2": (188, 160, 118, 255),
    "pl3": (210, 186, 145, 255),
    "dr0": (58, 36, 28, 255),
    "dr1": (88, 54, 38, 255),
    "wn0": (50, 100, 120, 255),
    "wn1": (100, 170, 195, 255),
    "wn2": (180, 230, 240, 255),
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


def circle(img: Image.Image, cx: int, cy: int, r: int, k: str, fill_in=True) -> None:
    for y in range(cy - r, cy + r + 1):
        for x in range(cx - r, cx + r + 1):
            d2 = (x - cx) ** 2 + (y - cy) ** 2
            if fill_in and d2 <= r * r:
                p(img, x, y, k)
            elif not fill_in and abs(d2 - r * r) <= r:
                p(img, x, y, k)


def ellipse_fill(img: Image.Image, cx: int, cy: int, rx: int, ry: int, k: str) -> None:
    for y in range(cy - ry, cy + ry + 1):
        for x in range(cx - rx, cx + rx + 1):
            if rx == 0 or ry == 0:
                continue
            if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1.0:
                p(img, x, y, k)


def outline_nontransparent(img: Image.Image, ink="ink") -> Image.Image:
    """Add dark outline around opaque pixels."""
    out = img.copy()
    w, h = img.size
    opaque = [[img.getpixel((x, y))[3] > 20 for x in range(w)] for y in range(h)]
    for y in range(h):
        for x in range(w):
            if opaque[y][x]:
                continue
            for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and opaque[ny][nx]:
                    out.putpixel((x, y), rgba(ink))
                    break
    return out


def save(img: Image.Image, name: str) -> None:
    img.save(OUT_PNG / f"{name}.png")
    img.save(OUT_SRC / f"{name}.png")
    print(f"  {name}.png {img.size}")


# ---------- character 32x32 ----------

def make_player(facing: str) -> Image.Image:
    img = new(32, 32)
    # shadow
    ellipse_fill(img, 16, 29, 7, 2, "shade")

    if facing == "up":
        # back view
        # hair mass
        fill(img, 11, 6, 10, 8, "hr1")
        fill(img, 12, 5, 8, 2, "hr0")
        fill(img, 13, 7, 6, 4, "hr2")
        # cloak body
        fill(img, 10, 14, 12, 10, "cl1")
        fill(img, 11, 14, 10, 2, "cl2")
        fill(img, 10, 18, 12, 4, "cl0")
        # hood
        fill(img, 11, 11, 10, 4, "cl1")
        fill(img, 12, 10, 8, 2, "cl2")
        # legs
        fill(img, 12, 24, 3, 4, "bt1")
        fill(img, 17, 24, 3, 4, "bt1")
        fill(img, 12, 27, 3, 2, "bt0")
        fill(img, 17, 27, 3, 2, "bt0")
    elif facing in ("left", "right"):
        # side
        # hair
        fill(img, 12, 6, 8, 7, "hr1")
        fill(img, 13, 5, 6, 2, "hr0")
        fill(img, 14, 7, 4, 3, "hr2")
        # face
        fill(img, 14, 10, 5, 5, "sk1")
        fill(img, 15, 11, 3, 2, "sk2")
        p(img, 17 if facing == "right" else 15, 12, "ink")
        # cloak
        fill(img, 11, 15, 10, 9, "cl1")
        fill(img, 12, 15, 8, 2, "cl2")
        fill(img, 11, 20, 10, 3, "cl0")
        fill(img, 14, 18, 4, 2, "gl1")  # belt
        # arms hint
        fill(img, 9 if facing == "left" else 20, 16, 3, 5, "cl2")
        # legs
        fill(img, 13, 24, 3, 4, "bt1")
        fill(img, 17, 24, 3, 4, "bt1")
        fill(img, 13, 27, 3, 2, "bt0")
        fill(img, 17, 27, 3, 2, "bt0")
        if facing == "left":
            img = img.transpose(Image.FLIP_LEFT_RIGHT)
    else:
        # down / front
        # hair
        fill(img, 11, 5, 10, 6, "hr1")
        fill(img, 12, 4, 8, 2, "hr0")
        fill(img, 13, 6, 6, 3, "hr2")
        # bangs
        fill(img, 12, 9, 3, 2, "hr1")
        fill(img, 17, 9, 3, 2, "hr1")
        # face
        fill(img, 12, 10, 8, 6, "sk1")
        fill(img, 13, 11, 6, 3, "sk2")
        fill(img, 13, 14, 6, 2, "sk0")  # jaw
        # eyes
        p(img, 14, 12, "ink")
        p(img, 17, 12, "ink")
        p(img, 14, 13, "sk2")
        p(img, 17, 13, "sk2")
        # mouth soft
        p(img, 15, 15, "sk0")
        p(img, 16, 15, "sk0")
        # cloak / body
        fill(img, 10, 16, 12, 8, "cl1")
        fill(img, 11, 16, 10, 2, "cl2")
        fill(img, 12, 16, 8, 1, "cl3")
        fill(img, 10, 21, 12, 3, "cl0")
        # collar
        fill(img, 13, 16, 6, 2, "cl3")
        # belt
        fill(img, 11, 20, 10, 2, "gl1")
        p(img, 15, 20, "gl2")
        p(img, 16, 20, "gl2")
        # legs
        fill(img, 12, 24, 3, 4, "bt1")
        fill(img, 17, 24, 3, 4, "bt1")
        fill(img, 12, 27, 3, 2, "bt0")
        fill(img, 17, 27, 3, 2, "bt0")

    return outline_nontransparent(img)


def make_slime() -> Image.Image:
    img = new(32, 32)
    ellipse_fill(img, 16, 28, 9, 2, "shade")
    # body layers
    ellipse_fill(img, 16, 18, 11, 9, "s0")
    ellipse_fill(img, 16, 17, 10, 8, "s1")
    ellipse_fill(img, 16, 16, 9, 7, "s2")
    ellipse_fill(img, 14, 13, 5, 4, "s3")
    # highlight
    ellipse_fill(img, 12, 12, 2, 2, "s4")
    # eyes
    fill(img, 11, 15, 3, 4, "se")
    fill(img, 18, 15, 3, 4, "se")
    p(img, 12, 16, "s4")
    p(img, 19, 16, "s4")
    # mouth
    fill(img, 14, 20, 4, 1, "s0")
    # drip
    fill(img, 8, 22, 2, 3, "s1")
    fill(img, 22, 21, 2, 2, "s2")
    return outline_nontransparent(img)


def make_tree() -> Image.Image:
    # taller canopy 32x40 but export 32x40 then we'll use 32x32 crop with offset
    # use 32x40 canvas
    img = new(32, 40)
    ellipse_fill(img, 16, 37, 6, 2, "shade")
    # trunk
    fill(img, 13, 24, 6, 12, "tr1")
    fill(img, 14, 24, 2, 12, "tr2")
    fill(img, 17, 24, 1, 12, "tr0")
    # bark marks
    p(img, 15, 28, "tr0")
    p(img, 15, 32, "tr0")
    p(img, 16, 30, "tr3")
    # roots
    fill(img, 11, 35, 3, 2, "tr0")
    fill(img, 18, 35, 3, 2, "tr0")
    # canopy blobs layered
    for cx, cy, r, col in [
        (16, 14, 11, "lf0"),
        (16, 13, 10, "lf1"),
        (16, 12, 9, "lf2"),
        (10, 14, 6, "lf1"),
        (22, 14, 6, "lf1"),
        (16, 8, 7, "lf2"),
        (12, 10, 5, "lf3"),
        (20, 10, 5, "lf3"),
        (16, 9, 4, "lf4"),
        (14, 11, 3, "lf4"),
    ]:
        circle(img, cx, cy, r, col)
    # leaf clusters detail
    for x, y in [(8, 12), (24, 13), (11, 6), (21, 7), (16, 5), (9, 16), (23, 16)]:
        p(img, x, y, "lf4")
        p(img, x + 1, y, "lf3")
    img = outline_nontransparent(img)
    # export as 32x40 - game can draw full height
    return img


def make_tree_stump() -> Image.Image:
    img = new(32, 32)
    ellipse_fill(img, 16, 28, 7, 2, "shade")
    # stump body
    fill(img, 11, 18, 10, 10, "tr1")
    fill(img, 12, 18, 3, 10, "tr2")
    fill(img, 18, 18, 2, 10, "tr0")
    # top rings
    ellipse_fill(img, 16, 17, 6, 3, "tr3")
    ellipse_fill(img, 16, 17, 4, 2, "tr2")
    ellipse_fill(img, 16, 17, 2, 1, "tr0")
    # chips / moss
    p(img, 12, 20, "lf1")
    p(img, 20, 22, "lf0")
    fill(img, 9, 26, 3, 2, "tr0")
    fill(img, 20, 26, 3, 2, "tr0")
    return outline_nontransparent(img)


def make_fish_spot(empty=False) -> Image.Image:
    img = new(32, 32)
    # water ellipse
    ellipse_fill(img, 16, 16, 13, 8, "w0")
    ellipse_fill(img, 16, 16, 12, 7, "w1")
    ellipse_fill(img, 16, 15, 11, 6, "w2")
    ellipse_fill(img, 16, 15, 9, 4, "w3")
    # ripples
    for i, y in enumerate((12, 18, 20)):
        for x in range(8 + i, 24 - i):
            if (x + y) % 3 == 0:
                p(img, x, y, "w4")
    # foam
    for x, y in [(10, 12), (20, 13), (14, 11), (18, 19)]:
        p(img, x, y, "w5")
    if not empty:
        # fish body
        ellipse_fill(img, 16, 16, 5, 3, "fi1")
        fill(img, 12, 15, 3, 3, "fi2")
        fill(img, 20, 15, 3, 3, "fi0")  # tail
        p(img, 21, 14, "fi1")
        p(img, 21, 17, "fi1")
        p(img, 14, 15, "se")  # eye
        p(img, 14, 16, "fi3")
        # fin
        p(img, 16, 13, "fi2")
        p(img, 17, 13, "fi3")
    else:
        # quieter water
        for x in range(12, 20):
            p(img, x, 16, "w1")
    return outline_nontransparent(img, "w0")


def make_shop() -> Image.Image:
    img = new(64, 64)
    # shadow
    ellipse_fill(img, 32, 58, 22, 4, "shade")
    # roof
    for y in range(8, 22):
        inset = 22 - (y - 8)
        for x in range(inset, 64 - inset):
            col = "rf1" if (x + y) % 4 else "rf0"
            if y < 12:
                col = "rf2"
            p(img, x, y, col)
    # roof ridge highlight
    for x in range(20, 44):
        p(img, x, 9, "rf3")
    # walls
    fill(img, 10, 22, 44, 30, "wd2")
    fill(img, 10, 22, 44, 2, "wd1")
    fill(img, 10, 50, 44, 2, "wd0")
    # planks
    for y in range(24, 50, 4):
        for x in range(10, 54):
            if (x + y) % 7 == 0:
                p(img, x, y, "wd1")
    # posts
    fill(img, 10, 22, 3, 30, "wd0")
    fill(img, 51, 22, 3, 30, "wd0")
    # awning cloth
    fill(img, 14, 24, 36, 6, "ct1")
    fill(img, 14, 24, 36, 2, "ct0")
    for x in range(14, 50, 6):
        fill(img, x, 30, 3, 3, "ct0")
    # counter
    fill(img, 16, 38, 32, 10, "wd3")
    fill(img, 16, 38, 32, 2, "wd4")
    fill(img, 16, 46, 32, 2, "wd1")
    # sign
    fill(img, 20, 14, 24, 10, "sg1")
    fill(img, 20, 14, 24, 2, "sg0")
    fill(img, 22, 17, 20, 5, "sg2")
    # coins on counter
    circle(img, 28, 42, 2, "gl2")
    circle(img, 36, 43, 2, "gl1")
    # goods crates
    fill(img, 18, 40, 5, 5, "wd1")
    fill(img, 42, 40, 5, 5, "wd0")
    return outline_nontransparent(img)


def make_warehouse() -> Image.Image:
    img = new(64, 64)
    ellipse_fill(img, 32, 58, 22, 4, "shade")
    # roof metal
    for y in range(10, 20):
        inset = 18 - (y - 10)
        for x in range(inset + 4, 60 - inset):
            p(img, x, y, "st1" if (x // 3 + y) % 2 == 0 else "st0")
    fill(img, 22, 10, 20, 2, "st3")
    # walls
    fill(img, 10, 20, 44, 32, "wd1")
    fill(img, 10, 20, 44, 2, "wd0")
    # horizontal boards
    for y in range(24, 50, 5):
        fill(img, 12, y, 40, 1, "wd0")
    # door
    fill(img, 24, 30, 16, 22, "wd0")
    fill(img, 26, 32, 12, 18, "st0")
    fill(img, 28, 34, 8, 14, "st1")
    # hinges / latch
    fill(img, 27, 38, 2, 2, "st3")
    fill(img, 35, 40, 3, 2, "gl1")
    # metal corners
    fill(img, 10, 20, 4, 4, "st2")
    fill(img, 50, 20, 4, 4, "st2")
    fill(img, 10, 48, 4, 4, "st2")
    fill(img, 50, 48, 4, 4, "st2")
    # crates outside
    fill(img, 12, 44, 8, 8, "wd2")
    fill(img, 13, 45, 6, 2, "wd3")
    fill(img, 44, 44, 8, 8, "wd2")
    return outline_nontransparent(img)


def make_save_point() -> Image.Image:
    img = new(32, 40)
    ellipse_fill(img, 16, 37, 8, 2, "shade")
    # stone base
    fill(img, 8, 28, 16, 8, "st1")
    fill(img, 9, 28, 14, 2, "st2")
    fill(img, 8, 34, 16, 2, "st0")
    fill(img, 10, 30, 12, 4, "st3")
    # pillar
    fill(img, 13, 20, 6, 10, "st2")
    fill(img, 14, 20, 2, 10, "st3")
    fill(img, 17, 20, 1, 10, "st0")
    # crystal
    pts_layers = [
        (16, 4, 7, "gm0"),
        (16, 5, 6, "gm1"),
        (16, 6, 5, "gm2"),
        (16, 7, 4, "gm3"),
    ]
    for cx, cy, r, col in pts_layers:
        # diamond-ish
        for y in range(cy, cy + r * 2 + 4):
            w = max(1, r - abs((y - cy) - r) // 1)
            for x in range(cx - w, cx + w + 1):
                p(img, x, y, col)
    # inner glow
    fill(img, 15, 8, 2, 8, "gm4")
    p(img, 14, 10, "gm3")
    p(img, 17, 12, "gm4")
    # runes on base
    p(img, 12, 31, "gm2")
    p(img, 16, 32, "gm3")
    p(img, 20, 31, "gm2")
    return outline_nontransparent(img)


def make_house() -> Image.Image:
    img = new(96, 72)
    ellipse_fill(img, 48, 68, 36, 4, "shade")
    # chimney
    fill(img, 68, 8, 10, 22, "st1")
    fill(img, 68, 6, 10, 3, "st2")
    fill(img, 70, 4, 6, 3, "st0")
    # smoke soft
    for x, y in [(72, 2), (74, 1), (70, 3)]:
        p(img, x, y, "st3")
    # roof
    for y in range(10, 28):
        half = 40 - (y - 10)
        for x in range(48 - half, 48 + half):
            col = "rf1"
            if (x + y * 2) % 5 == 0:
                col = "rf0"
            if y < 14:
                col = "rf2"
            p(img, x, y, col)
    for x in range(20, 76):
        p(img, x, 12, "rf3")
    # walls
    fill(img, 16, 28, 64, 36, "pl1")
    fill(img, 16, 28, 64, 3, "pl0")
    fill(img, 16, 60, 64, 4, "pl0")
    # plaster noise
    rng = random.Random(7)
    for _ in range(120):
        x = rng.randint(18, 76)
        y = rng.randint(32, 58)
        p(img, x, y, "pl2" if rng.random() > 0.5 else "pl0")
    # timber beams
    fill(img, 16, 40, 64, 2, "wd0")
    fill(img, 30, 28, 2, 32, "wd1")
    fill(img, 64, 28, 2, 32, "wd1")
    # door
    fill(img, 40, 42, 16, 22, "dr0")
    fill(img, 42, 44, 12, 18, "dr1")
    fill(img, 44, 46, 8, 14, "wd1")
    p(img, 52, 52, "gl2")
    # windows
    for ox in (22, 62):
        fill(img, ox, 34, 12, 10, "wd0")
        fill(img, ox + 1, 35, 10, 8, "wn0")
        fill(img, ox + 2, 36, 8, 6, "wn1")
        fill(img, ox + 3, 37, 3, 2, "wn2")
        fill(img, ox + 6, 35, 1, 8, "wd0")
        fill(img, ox + 1, 39, 10, 1, "wd0")
    # flower box
    fill(img, 22, 44, 12, 3, "wd2")
    for x in range(24, 32, 2):
        p(img, x, 43, "lf3")
        p(img, x + 1, 42, "ct1")
    return outline_nontransparent(img)


def make_bush() -> Image.Image:
    img = new(32, 32)
    ellipse_fill(img, 16, 26, 8, 2, "shade")
    for cx, cy, r, col in [
        (16, 18, 9, "lf0"),
        (16, 17, 8, "lf1"),
        (12, 18, 6, "lf2"),
        (20, 18, 6, "lf2"),
        (16, 14, 6, "lf3"),
        (14, 16, 4, "lf4"),
        (19, 15, 3, "lf4"),
    ]:
        circle(img, cx, cy, r, col)
    # berries
    p(img, 12, 16, "ct1")
    p(img, 20, 18, "ct1")
    p(img, 16, 13, "sg1")
    return outline_nontransparent(img)


def tile_noise(img: Image.Image, colors: list[str], seed: int = 0) -> None:
    rng = random.Random(seed)
    w, h = img.size
    for y in range(h):
        for x in range(w):
            n = (x * 17 + y * 31 + seed * 13) % len(colors)
            if rng.random() < 0.15:
                n = (n + 1) % len(colors)
            p(img, x, y, colors[n])


def make_tile(kind: str) -> Image.Image:
    img = new(32, 32)
    if kind == "grass":
        tile_noise(img, ["g1", "g2", "g1", "g3", "g0", "g2"], 1)
        # blades
        for x, y in [
            (3, 8), (7, 20), (12, 5), (18, 14), (24, 9), (28, 22),
            (5, 26), (15, 28), (22, 3), (10, 16), (26, 18), (1, 12),
        ]:
            p(img, x, y, "g4")
            p(img, x, y - 1, "g3")
            if y > 2:
                p(img, x, y - 2, "lf4")
        # tiny flowers
        for x, y in [(9, 10), (21, 24), (27, 6)]:
            p(img, x, y, "sg2")
            p(img, x, y + 1, "lf2")
    elif kind == "path":
        tile_noise(img, ["p1", "p2", "p1", "p3", "p0", "p4"], 2)
        for y in (0, 31):
            for x in range(32):
                p(img, x, y, "p0")
        # pebbles
        for x, y in [(5, 8), (14, 18), (22, 6), (10, 26), (26, 20)]:
            p(img, x, y, "p3")
            p(img, x + 1, y, "p2")
    elif kind == "water":
        for y in range(32):
            for x in range(32):
                wave = math.sin((x + y * 0.5) * 0.4) + math.sin(x * 0.25)
                if wave > 0.8:
                    k = "w4"
                elif wave > 0.2:
                    k = "w3"
                elif wave > -0.3:
                    k = "w2"
                elif wave > -0.8:
                    k = "w1"
                else:
                    k = "w0"
                p(img, x, y, k)
        # sparkles
        for x, y in [(6, 10), (18, 7), (25, 16), (12, 22), (20, 26)]:
            p(img, x, y, "w5")
            p(img, x + 1, y, "w6")
    elif kind == "water_edge":
        # left grass -> right water
        for y in range(32):
            for x in range(32):
                if x < 10:
                    n = (x + y * 2) % 4
                    p(img, x, y, ["g1", "g2", "g3", "g0"][n])
                elif x < 14:
                    p(img, x, y, "p0" if (x + y) % 2 else "p1")
                else:
                    wave = math.sin((x + y) * 0.35)
                    p(img, x, y, "w3" if wave > 0 else "w1")
        for y in range(32):
            p(img, 13, y, "p4")
            if y % 4 == 0:
                p(img, 15, y, "w5")
    elif kind == "forest":
        tile_noise(img, ["f1", "f2", "f0", "f3", "f1", "f2"], 4)
        for x, y in [(4, 6), (20, 10), (12, 22), (26, 18), (8, 28)]:
            p(img, x, y, "f4")
            p(img, x + 1, y, "tr0")
        for x, y in [(15, 5), (3, 16), (28, 24)]:
            p(img, x, y, "lf0")
    elif kind == "village":
        # grass with cobble patches
        tile_noise(img, ["v0", "v1", "v0", "v1", "g1"], 5)
        for ox, oy in [(2, 2), (14, 8), (6, 18), (18, 20), (10, 4), (22, 14)]:
            fill(img, ox, oy, 5, 4, "v3")
            fill(img, ox + 1, oy + 1, 3, 2, "v4")
            p(img, ox, oy, "v5")
            p(img, ox + 4, oy + 3, "v2")
    return img


def make_item_wood() -> Image.Image:
    img = new(32, 32)
    # stacked logs
    for i, y in enumerate((10, 16, 22)):
        fill(img, 6, y, 20, 5, "lg1")
        fill(img, 6, y, 20, 1, "lg3")
        fill(img, 6, y + 4, 20, 1, "lg0")
        fill(img, 7, y + 1, 4, 3, "lg2")
        # rings on end
        ellipse_fill(img, 8, y + 2, 2, 2, "lg3")
        p(img, 8, y + 2, "lg0")
    return outline_nontransparent(img)


def make_item_fish() -> Image.Image:
    img = new(32, 32)
    ellipse_fill(img, 14, 16, 8, 5, "fi1")
    ellipse_fill(img, 12, 16, 5, 3, "fi2")
    # tail
    for dy in range(-3, 4):
        p(img, 23, 16 + dy, "fi0")
        p(img, 24, 16 + dy // 2, "fi1")
        p(img, 25, 16 + dy, "fi0")
    # eye
    p(img, 9, 15, "se")
    p(img, 10, 15, "fi3")
    # fin
    fill(img, 14, 10, 4, 2, "fi2")
    fill(img, 14, 20, 4, 2, "fi0")
    # belly highlight
    fill(img, 11, 17, 6, 2, "fi3")
    return outline_nontransparent(img)


def make_focus_ring() -> Image.Image:
    img = new(36, 36)
    # rounded pixel frame
    for i in range(36):
        for t in (0, 1, 34, 35):
            p(img, i, t, "fc1" if i % 3 else "fc0")
            p(img, t, i, "fc1" if i % 3 else "fc0")
    for x, y in [(2, 2), (33, 2), (2, 33), (33, 33)]:
        p(img, x, y, "fc2")
        p(img, x + (1 if x < 18 else -1), y, "fc1")
    return img


def make_sheet(sprites: dict[str, Image.Image]) -> Image.Image:
    # scale small preview cells
    names = [n for n in sprites if n != "house"]
    cols = 6
    rows = (len(names) + cols - 1) // cols
    cell = 40
    sheet = Image.new("RGBA", (cols * cell, rows * cell + 80), (18, 22, 28, 255))
    for i, name in enumerate(names):
        sp = sprites[name]
        # fit in cell
        scale = min((cell - 4) / sp.width, (cell - 4) / sp.height, 1.0)
        if scale < 1:
            sp2 = sp.resize((max(1, int(sp.width * scale)), max(1, int(sp.height * scale))), Image.NEAREST)
        else:
            sp2 = sp
        x = (i % cols) * cell + (cell - sp2.width) // 2
        y = (i // cols) * cell + (cell - sp2.height) // 2
        sheet.paste(sp2, (x, y), sp2)
    h = sprites["house"]
    hs = h.resize((h.width // 2, h.height // 2), Image.NEAREST)
    sheet.paste(hs, (8, rows * cell + 8), hs)
    return sheet


def main() -> None:
    print("Generating high-detail sprites (32px)...")
    sprites = {
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
        "tile_grass": make_tile("grass"),
        "tile_path": make_tile("path"),
        "tile_water": make_tile("water"),
        "tile_water_edge": make_tile("water_edge"),
        "tile_forest": make_tile("forest"),
        "tile_village": make_tile("village"),
        "item_wood": make_item_wood(),
        "item_fish": make_item_fish(),
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
