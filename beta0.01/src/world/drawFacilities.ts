import type { Facility } from "../entities/facility.ts";
import {
  drawShadow,
  drawSprite,
  getSprite,
  type SpriteName,
} from "../assets/sprites.ts";

export type CampfireDrawState = {
  lit: boolean;
  progress: number;
  timeSec: number;
};

export function drawFacilities(
  ctx: CanvasRenderingContext2D,
  list: Facility[],
  focusId: string | null,
  campfireState?: CampfireDrawState | null,
): void {
  for (const f of list) {
    const focused = f.id === focusId;
    switch (f.kind) {
      case "shop":
        drawFacility(ctx, f, focused, "shop", fallbackShop);
        break;
      case "warehouse":
        drawFacility(ctx, f, focused, "warehouse", fallbackWarehouse);
        break;
      case "save_point":
        drawFacility(ctx, f, focused, "save_point", fallbackSave);
        break;
      case "campfire":
        drawCampfire(ctx, f, focused, campfireState ?? null);
        break;
    }
  }
}

function drawFacility(
  ctx: CanvasRenderingContext2D,
  f: Facility,
  focused: boolean,
  sprite: SpriteName,
  fallback: (ctx: CanvasRenderingContext2D, f: Facility) => void,
): void {
  drawShadow(
    ctx,
    f.x + f.size / 2,
    f.y + f.size - 1,
    f.size * 0.42,
    f.size * 0.12,
  );
  if (focused) strokeFocus(ctx, f);

  const img = getSprite(sprite);
  const ok = drawSprite(ctx, sprite, f.x, f.y, {
    foot: { w: f.size, h: f.size },
    w: img?.naturalWidth,
    h: img?.naturalHeight,
  });
  if (!ok) fallback(ctx, f);

  drawLabel(ctx, f.label, f.x + f.size / 2, f.y - 4);
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
): void {
  ctx.font = "11px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  const tw = ctx.measureText(text).width;
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(x - tw / 2 - 4, y - 12, tw + 8, 14);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(0,0,0,0.55)";
  ctx.strokeText(text, x, y);
  ctx.fillStyle = "#f8f0d0";
  ctx.fillText(text, x, y);
}

function fallbackShop(ctx: CanvasRenderingContext2D, f: Facility): void {
  ctx.fillStyle = "#6b4a2e";
  ctx.fillRect(f.x, f.y, f.size, f.size);
  ctx.fillStyle = "#c4a35a";
  ctx.fillRect(f.x + 2, f.y + 2, f.size - 4, f.size * 0.35);
}

function fallbackWarehouse(ctx: CanvasRenderingContext2D, f: Facility): void {
  ctx.fillStyle = "#3d4a5c";
  ctx.fillRect(f.x, f.y, f.size, f.size);
  ctx.fillStyle = "#8a9bb0";
  ctx.fillRect(f.x + 4, f.y + 6, f.size - 8, f.size - 10);
}

function fallbackSave(ctx: CanvasRenderingContext2D, f: Facility): void {
  ctx.fillStyle = "#4a7a55";
  ctx.beginPath();
  ctx.arc(
    f.x + f.size / 2,
    f.y + f.size / 2,
    f.size * 0.45,
    0,
    Math.PI * 2,
  );
  ctx.fill();
}

function drawCampfire(
  ctx: CanvasRenderingContext2D,
  f: Facility,
  focused: boolean,
  state: CampfireDrawState | null,
): void {
  const lit = state?.lit ?? false;
  const progress = state?.progress ?? 0;
  const t = state?.timeSec ?? 0;
  const cx = f.x + f.size / 2;
  const cy = f.y + f.size * 0.62;

  drawShadow(ctx, cx, f.y + f.size - 1, f.size * 0.4, f.size * 0.12);
  if (focused) strokeFocus(ctx, f);

  // 石圈
  ctx.fillStyle = "#6a655c";
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.2;
    const rx = cx + Math.cos(a) * f.size * 0.32;
    const ry = cy + Math.sin(a) * f.size * 0.18;
    ctx.beginPath();
    ctx.ellipse(rx, ry, 3.2, 2.2, a, 0, Math.PI * 2);
    ctx.fill();
  }

  // 木柴
  ctx.strokeStyle = lit ? "#5a3a22" : "#4a4038";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy + 2);
  ctx.lineTo(cx + 8, cy - 4);
  ctx.moveTo(cx + 8, cy + 2);
  ctx.lineTo(cx - 8, cy - 4);
  ctx.stroke();

  if (lit) {
    const flicker = 1 + Math.sin(t * 14) * 0.08 + Math.sin(t * 23) * 0.05;
    const h = f.size * 0.42 * flicker;
    // 外焰
    ctx.fillStyle = "#e85d2a";
    ctx.beginPath();
    ctx.moveTo(cx - 6, cy);
    ctx.quadraticCurveTo(cx - 7, cy - h * 0.55, cx, cy - h);
    ctx.quadraticCurveTo(cx + 7, cy - h * 0.55, cx + 6, cy);
    ctx.closePath();
    ctx.fill();
    // 内焰
    ctx.fillStyle = "#ffd36a";
    ctx.beginPath();
    ctx.moveTo(cx - 3, cy - 1);
    ctx.quadraticCurveTo(cx - 2, cy - h * 0.45, cx, cy - h * 0.72);
    ctx.quadraticCurveTo(cx + 2, cy - h * 0.45, cx + 3, cy - 1);
    ctx.closePath();
    ctx.fill();

    // 燃烧进度条
    const bw = f.size;
    const bh = 3;
    const bx = f.x;
    const by = f.y + f.size + 3;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    ctx.fillStyle = "#3a2010";
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = "#ff9a3c";
    ctx.fillRect(bx, by, Math.round(bw * Math.min(1, progress)), bh);
  }

  drawLabel(ctx, lit ? "篝火（燃）" : "篝火", cx, f.y - 4);
}

function strokeFocus(ctx: CanvasRenderingContext2D, f: Facility): void {
  const ring = getSprite("focus_ring");
  if (ring) {
    drawSprite(ctx, "focus_ring", f.x - 2, f.y - 2, {
      w: f.size + 4,
      h: f.size + 4,
    });
  } else {
    ctx.strokeStyle = "#ffd98a";
    ctx.lineWidth = 2;
    ctx.strokeRect(f.x - 1, f.y - 1, f.size + 2, f.size + 2);
  }
}
