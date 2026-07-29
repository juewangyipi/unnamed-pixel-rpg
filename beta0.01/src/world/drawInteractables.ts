import {
  GATHER,
  isAvailable,
  type Interactable,
} from "../entities/interactable.ts";
import { drawShadow, drawSprite, getSprite } from "../assets/sprites.ts";

/** 绘制当前图互动物 + 焦点高亮 + 蓄力条 */
export function drawInteractables(
  ctx: CanvasRenderingContext2D,
  list: Interactable[],
  nowSec: number,
  focusId: string | null,
  active: Interactable | null,
): void {
  for (const it of list) {
    const available = isAvailable(it, nowSec);
    const focused = focusId === it.id;

    if (it.kind === "tree") {
      drawTree(ctx, it, available, focused);
    } else {
      drawFishSpot(ctx, it, available, focused);
    }

    if (available && (it.progress > 0 || (active && active.id === it.id))) {
      drawProgress(ctx, it);
    } else if (!available) {
      drawRespawnHint(ctx, it, nowSec);
    }
  }

  if (active) {
    const profile = GATHER[active.kind];
    const px = active.x + active.size / 2;
    const py = active.y - 6;
    const label = profile.label;
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const tw = ctx.measureText(label).width;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(px - tw / 2 - 5, py - 8, tw + 10, 14);
    ctx.strokeStyle = "rgba(255,220,120,0.45)";
    ctx.strokeRect(px - tw / 2 - 5, py - 8, tw + 10, 14);
    ctx.fillStyle = "#fff6c8";
    ctx.fillText(label, px, py);
  }
}

function drawFocus(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
): void {
  const ring = getSprite("focus_ring");
  if (ring) {
    drawSprite(ctx, "focus_ring", x - 2, y - 2, {
      w: size + 4,
      h: size + 4,
    });
  } else {
    ctx.strokeStyle = "#ffe08a";
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 1, y - 1, size + 2, size + 2);
  }
}

function drawTree(
  ctx: CanvasRenderingContext2D,
  it: Interactable,
  available: boolean,
  focused: boolean,
): void {
  const { x, y, size } = it;
  drawShadow(ctx, x + size / 2, y + size - 2, size * 0.38, size * 0.12);
  if (focused) drawFocus(ctx, x, y, size);

  const name = available ? "tree" : "tree_stump";
  const alpha = available ? 1 : 0.95;
  const img = getSprite(name);
  if (
    !drawSprite(ctx, name, x, y, {
      alpha,
      foot: { w: size, h: size },
      // 保持原像素比例，不硬拉成正方形
      w: img?.naturalWidth,
      h: img?.naturalHeight,
    })
  ) {
    ctx.fillStyle = available ? "#5a3d28" : "#3a3a3a";
    ctx.fillRect(x + size * 0.35, y + size * 0.45, size * 0.3, size * 0.5);
    ctx.fillStyle = available ? "#2f7a3e" : "#4a4a4a";
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size * 0.35, size * 0.42, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFishSpot(
  ctx: CanvasRenderingContext2D,
  it: Interactable,
  available: boolean,
  focused: boolean,
): void {
  const { x, y, size } = it;
  if (focused) drawFocus(ctx, x, y, size);

  const name = available ? "fish_spot" : "fish_spot_empty";
  if (
    !drawSprite(ctx, name, x, y, {
      w: size,
      h: size,
    })
  ) {
    ctx.fillStyle = available
      ? "rgba(80, 180, 220, 0.55)"
      : "rgba(80,80,90,0.4)";
    ctx.beginPath();
    ctx.ellipse(
      x + size / 2,
      y + size / 2,
      size * 0.45,
      size * 0.28,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}

function drawProgress(ctx: CanvasRenderingContext2D, it: Interactable): void {
  const w = it.size;
  const h = 4;
  const x = it.x;
  const y = it.y + it.size + 3;
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = "#3a2a18";
  ctx.fillRect(x, y, w, h);
  const pw = Math.round(w * Math.min(1, it.progress));
  ctx.fillStyle = "#e0b85a";
  ctx.fillRect(x, y, pw, h);
  ctx.fillStyle = "#fff0b0";
  ctx.fillRect(x, y, pw, 1);
}

function drawRespawnHint(
  ctx: CanvasRenderingContext2D,
  it: Interactable,
  nowSec: number,
): void {
  const left = Math.max(0, Math.ceil(it.depletedUntil - nowSec));
  if (left <= 0) return;
  ctx.fillStyle = "rgba(220,220,220,0.8)";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(`${left}s`, it.x + it.size / 2, it.y + it.size + 4);
}
