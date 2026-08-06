import {
  GATHER,
  isAvailable,
  type Interactable,
} from "../entities/interactable.ts";
import { drawShadow, drawSprite, getSprite } from "../assets/sprites.ts";

export type GatherAnimContext = {
  /** 墙钟或 performance 秒，用于粒子相位 */
  timeSec: number;
  /** 玩家中心，画钓线用 */
  playerCx: number;
  playerCy: number;
};

/** 绘制当前图互动物 + 焦点高亮 + 蓄力条 + 采集反馈动画 */
export function drawInteractables(
  ctx: CanvasRenderingContext2D,
  list: Interactable[],
  nowSec: number,
  focusId: string | null,
  active: Interactable | null,
  anim?: GatherAnimContext,
): void {
  const t = anim?.timeSec ?? nowSec;

  for (const it of list) {
    const available = isAvailable(it, nowSec);
    const focused = focusId === it.id;
    const gathering = !!(active && active.id === it.id && available);

    if (it.kind === "tree") {
      drawTree(ctx, it, available, focused, gathering, t);
    } else if (it.kind === "fish_spot") {
      drawFishSpot(ctx, it, available, focused, gathering, t, anim);
    } else if (it.kind === "rune_node") {
      drawMineNode(ctx, it, available, focused, "rune", gathering, t);
    } else if (it.kind === "copper_node") {
      drawMineNode(ctx, it, available, focused, "copper", gathering, t);
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
  gathering: boolean,
  t: number,
): void {
  const { x, y, size } = it;
  // 砍树时左右微颤，progress 越高抖越狠
  let ox = 0;
  if (gathering && available) {
    const hit = Math.sin(t * 28) * (1.2 + it.progress * 2.2);
    ox = Math.round(hit);
  }

  drawShadow(ctx, x + size / 2 + ox, y + size - 2, size * 0.38, size * 0.12);
  if (focused) drawFocus(ctx, x, y, size);

  const name = available ? "tree" : "tree_stump";
  const alpha = available ? 1 : 0.95;
  const img = getSprite(name);
  if (
    !drawSprite(ctx, name, x + ox, y, {
      alpha,
      foot: { w: size, h: size },
      w: img?.naturalWidth,
      h: img?.naturalHeight,
    })
  ) {
    ctx.fillStyle = available ? "#5a3d28" : "#3a3a3a";
    ctx.fillRect(x + size * 0.35 + ox, y + size * 0.45, size * 0.3, size * 0.5);
    ctx.fillStyle = available ? "#2f7a3e" : "#4a4a4a";
    ctx.beginPath();
    ctx.arc(x + size / 2 + ox, y + size * 0.35, size * 0.42, 0, Math.PI * 2);
    ctx.fill();
  }

  // 木屑
  if (gathering && available) {
    const cx = x + size / 2 + ox;
    const cy = y + size * 0.45;
    for (let i = 0; i < 5; i++) {
      const phase = t * (6 + i) + i * 1.3;
      const px = cx + Math.sin(phase) * (6 + i * 2) + ox * 0.3;
      const py = cy - ((phase * 10 + i * 5) % 18);
      ctx.fillStyle = `rgba(180, 140, 80, ${0.35 + (i % 2) * 0.25})`;
      ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
    }
  }
}

function drawFishSpot(
  ctx: CanvasRenderingContext2D,
  it: Interactable,
  available: boolean,
  focused: boolean,
  gathering: boolean,
  t: number,
  anim?: GatherAnimContext,
): void {
  const { x, y, size } = it;
  const cx = x + size / 2;
  const cy = y + size / 2;
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
    ctx.ellipse(cx, cy, size * 0.45, size * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 水面涟漪
  if (gathering && available) {
    for (let i = 0; i < 3; i++) {
      const wave = ((t * 1.4 + i * 0.33) % 1);
      const r = size * (0.15 + wave * 0.35);
      ctx.strokeStyle = `rgba(180, 230, 255, ${0.45 * (1 - wave)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 2, r, r * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    // 鱼漂轻点
    const bob = Math.sin(t * 5) * 2;
    ctx.fillStyle = "#c45a3a";
    ctx.beginPath();
    ctx.arc(cx + Math.sin(t * 2) * 3, cy + bob - 2, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff0c0";
    ctx.fillRect(Math.round(cx + Math.sin(t * 2) * 3 - 1), Math.round(cy + bob - 6), 2, 4);

    // 钓线：玩家 → 鱼点
    if (anim) {
      ctx.strokeStyle = "rgba(220, 230, 240, 0.55)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(anim.playerCx, anim.playerCy - 4);
      const midX = (anim.playerCx + cx) / 2;
      const midY = Math.min(anim.playerCy, cy) - 12 - Math.sin(t * 3) * 2;
      ctx.quadraticCurveTo(midX, midY, cx + Math.sin(t * 2) * 3, cy + bob - 2);
      ctx.stroke();
    }
  }
}

/** 矿点：符文（蓝）/ 铜（橙）；耗尽变暗灰色 */
function drawMineNode(
  ctx: CanvasRenderingContext2D,
  it: Interactable,
  available: boolean,
  focused: boolean,
  variant: "rune" | "copper",
  gathering: boolean,
  t: number,
): void {
  const { x, y, size } = it;
  const shake =
    gathering && available
      ? Math.round(Math.sin(t * 32) * (1 + it.progress * 1.5))
      : 0;
  const cx = x + size / 2 + shake;
  const cy = y + size * 0.55;
  drawShadow(ctx, cx, y + size - 2, size * 0.36, size * 0.12);
  if (focused) drawFocus(ctx, x, y, size);

  const base = available ? "#4a4a55" : "#2a2a30";
  const glow =
    variant === "rune"
      ? available
        ? "#6b8cff"
        : "#3a4060"
      : available
        ? "#c4783a"
        : "#5a4030";

  ctx.save();
  ctx.translate(shake, 0);

  // 岩块
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.moveTo(x + size * 0.18, cy + size * 0.12);
  ctx.lineTo(x + size * 0.3, cy - size * 0.28);
  ctx.lineTo(x + size * 0.6, cy - size * 0.35);
  ctx.lineTo(x + size * 0.85, cy - size * 0.08);
  ctx.lineTo(x + size * 0.78, cy + size * 0.2);
  ctx.lineTo(x + size * 0.35, cy + size * 0.28);
  ctx.closePath();
  ctx.fill();

  // 矿脉高光
  ctx.fillStyle = glow;
  ctx.globalAlpha = available ? 0.9 : 0.35;
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.08, cy - size * 0.2);
  ctx.lineTo(cx + size * 0.12, cy - size * 0.05);
  ctx.lineTo(cx + size * 0.02, cy + size * 0.1);
  ctx.lineTo(cx - size * 0.15, cy - size * 0.02);
  ctx.closePath();
  ctx.fill();
  if (variant === "rune" && available) {
    ctx.fillStyle = "rgba(180, 210, 255, 0.7)";
    ctx.beginPath();
    ctx.arc(cx + 2, cy - 4, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // 火花 / 矿屑
  if (gathering && available) {
    const sparkColor =
      variant === "rune" ? "rgba(160, 200, 255, 0.85)" : "rgba(255, 200, 100, 0.85)";
    for (let i = 0; i < 6; i++) {
      const phase = t * (8 + i * 0.7) + i;
      const ang = phase * 1.7;
      const dist = 4 + ((phase * 14) % 14);
      const px = cx + Math.cos(ang) * dist;
      const py = cy - 4 - ((phase * 11) % 16);
      ctx.fillStyle = sparkColor;
      ctx.globalAlpha = 0.4 + (i % 3) * 0.2;
      ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
    }
    ctx.globalAlpha = 1;
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
