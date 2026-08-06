import type { FishingDrawState } from "../systems/fishing.ts";
import { CONFIG } from "../core/config.ts";

const T = CONFIG.tileSize;

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/**
 * 河边钓鱼视觉：鱼线从玩家手上抛到水面 + 浮标 + 涟漪 / 上钩水花 + 进度条。
 * 只在可钓区内绘制（drawState 非 null）。
 */
export function drawFishing(
  ctx: CanvasRenderingContext2D,
  state: FishingDrawState,
  t: number,
): void {
  const z = state.zone;
  // 水面锚点：在玩家同高、clamp 在 zone 内，靠近岸线
  const bx =
    z.waterDir === "right" ? z.waterEdge + T * 1.1 : z.waterEdge - T * 1.1;
  const by = clamp(
    state.playerCy,
    z.y + T * 0.6,
    z.y + z.h - T * 0.6,
  );

  // 鱼线（玩家手 → 锚点），带轻微下弧
  ctx.strokeStyle = "rgba(235, 235, 245, 0.6)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(state.playerCx, state.playerCy - T * 0.35);
  ctx.quadraticCurveTo(
    (state.playerCx + bx) / 2,
    (state.playerCy + by) / 2 - T * 0.9,
    bx,
    by - 2,
  );
  ctx.stroke();

  // 未开钓：在岸边水面画一个淡圈提示此处可钓
  if (!state.active) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.ellipse(bx, by + T * 0.15, T * 0.55, T * 0.24, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    return;
  }

  // 浮标随钓下沉一点（进度越高沉得越多），并轻晃
  const sink = state.progress * 3;
  const bobY = by + sink + Math.sin(t * 2.4) * 1.2;

  // 水面涟漪（静态叠加圈）
  ctx.strokeStyle = "rgba(200, 235, 250, 0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(bx, by + T * 0.22, T * 0.5, T * 0.18, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 浮标（红锥 + 白顶）
  const bx0 = Math.round(bx);
  const by0 = Math.round(bobY - T * 0.25);
  ctx.fillStyle = "#e8eef6";
  ctx.fillRect(bx0 - 3, by0 - 2, 6, 2);
  ctx.fillStyle = "#c84030";
  ctx.beginPath();
  ctx.moveTo(bx0 - 3, by0);
  ctx.lineTo(bx0 + 3, by0);
  ctx.lineTo(bx0, by0 + 6);
  ctx.closePath();
  ctx.fill();

  // 上钩水花：一圈向外扩散的亮点
  if (state.splashT > 0) {
    const p = 1 - state.splashT / 0.5; // 0→1
    for (let i = 0; i < 8; i++) {
      const ang = i * 1.05;
      const ring = 2 + p * 9;
      const alpha = 0.55 * (1 - p);
      if (alpha <= 0) break;
      const px = bx + Math.cos(ang) * ring;
      const py = by + T * 0.22 + Math.sin(ang) * ring * 0.4;
      ctx.fillStyle = `rgba(200, 240, 255, ${alpha})`;
      ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
    }
  }

  // 进度条（浮标旁）
  const bw = T * 3;
  const bh = 4;
  const pxx = Math.round(bx - bw / 2);
  const pyy = Math.round(by + T * 0.55);
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(pxx - 1, pyy - 1, bw + 2, bh + 2);
  ctx.fillStyle = "#3a2a18";
  ctx.fillRect(pxx, pyy, bw, bh);
  const pw = Math.round(bw * Math.min(1, state.progress));
  ctx.fillStyle = "#e0b85a";
  ctx.fillRect(pxx, pyy, pw, bh);
  ctx.fillStyle = "#fff0b0";
  ctx.fillRect(pxx, pyy, pw, 1);
}