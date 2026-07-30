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

export type CookingPotDrawState = {
  cooking: boolean;
  progress: number;
  timeSec: number;
};

export type AlchemyTableDrawState = {
  crafting: boolean;
  progress: number;
  timeSec: number;
};

export function drawFacilities(
  ctx: CanvasRenderingContext2D,
  list: Facility[],
  focusId: string | null,
  campfireState?: CampfireDrawState | null,
  potState?: CookingPotDrawState | null,
  alchemyState?: AlchemyTableDrawState | null,
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
      case "cooking_pot":
        drawCookingPot(ctx, f, focused, potState ?? null);
        break;
      case "alchemy_table":
        drawAlchemyTable(ctx, f, focused, alchemyState ?? null);
        break;
      case "chicken_coop":
        drawChickenCoop(ctx, f, focused);
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

function drawCookingPot(
  ctx: CanvasRenderingContext2D,
  f: Facility,
  focused: boolean,
  state: CookingPotDrawState | null,
): void {
  const cooking = state?.cooking ?? false;
  const progress = state?.progress ?? 0;
  const t = state?.timeSec ?? 0;
  const cx = f.x + f.size / 2;
  const cy = f.y + f.size * 0.55;

  drawShadow(ctx, cx, f.y + f.size - 1, f.size * 0.38, f.size * 0.12);
  if (focused) strokeFocus(ctx, f);

  // 锅身
  ctx.fillStyle = "#3a3e48";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 4, f.size * 0.38, f.size * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2a2e36";
  ctx.fillRect(cx - f.size * 0.34, cy - 2, f.size * 0.68, f.size * 0.28);
  ctx.fillStyle = cooking ? "#c45a28" : "#4a3a28";
  ctx.beginPath();
  ctx.ellipse(cx, cy - 1, f.size * 0.3, f.size * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // 锅耳
  ctx.strokeStyle = "#5a606c";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx - f.size * 0.38, cy + 2, 4, Math.PI * 0.2, Math.PI * 1.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + f.size * 0.38, cy + 2, 4, -Math.PI * 0.2, Math.PI * 0.8);
  ctx.stroke();

  if (cooking) {
    // 冒泡
    for (let i = 0; i < 4; i++) {
      const phase = t * (2.2 + i * 0.35) + i * 1.7;
      const bx = cx + Math.sin(phase) * (5 + i);
      const by = cy - 6 - ((phase * 8) % 18);
      const r = 1.5 + (i % 3) * 0.6;
      ctx.fillStyle = `rgba(230, 245, 255, ${0.35 + (i % 2) * 0.2})`;
      ctx.beginPath();
      ctx.arc(bx, by, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // 蒸汽
    ctx.strokeStyle = "rgba(220, 230, 240, 0.35)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const sx = cx - 4 + i * 4;
      const bob = Math.sin(t * 6 + i) * 2;
      ctx.beginPath();
      ctx.moveTo(sx, cy - 8);
      ctx.quadraticCurveTo(sx + 2, cy - 14 + bob, sx - 1, cy - 20 + bob);
      ctx.stroke();
    }

    const bw = f.size;
    const bh = 3;
    const bx = f.x;
    const by = f.y + f.size + 3;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    ctx.fillStyle = "#1a2030";
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = "#7ec8ff";
    ctx.fillRect(bx, by, Math.round(bw * Math.min(1, progress)), bh);
  }

  drawLabel(ctx, cooking ? "烹饪锅（沸）" : "烹饪锅", cx, f.y - 4);
}

function drawAlchemyTable(
  ctx: CanvasRenderingContext2D,
  f: Facility,
  focused: boolean,
  state: AlchemyTableDrawState | null,
): void {
  const crafting = state?.crafting ?? false;
  const progress = state?.progress ?? 0;
  const t = state?.timeSec ?? 0;
  const cx = f.x + f.size / 2;
  const cy = f.y + f.size * 0.55;

  drawShadow(ctx, cx, f.y + f.size - 1, f.size * 0.4, f.size * 0.12);
  if (focused) strokeFocus(ctx, f);

  // 木台
  ctx.fillStyle = "#5a4030";
  ctx.fillRect(f.x + 2, f.y + f.size * 0.45, f.size - 4, f.size * 0.4);
  ctx.fillStyle = "#7a5840";
  ctx.fillRect(f.x + 3, f.y + f.size * 0.48, f.size - 6, 4);

  // 烧瓶
  ctx.fillStyle = crafting ? "#6bcf8e" : "#4a8a6a";
  ctx.beginPath();
  ctx.moveTo(cx - 5, cy - 2);
  ctx.lineTo(cx - 7, cy + 8);
  ctx.lineTo(cx + 7, cy + 8);
  ctx.lineTo(cx + 5, cy - 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#c8e8d8";
  ctx.fillRect(cx - 2, cy - 10, 4, 9);
  ctx.strokeStyle = "#2a4a38";
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - 2, cy - 10, 4, 9);

  if (crafting) {
    for (let i = 0; i < 3; i++) {
      const phase = t * (2.5 + i * 0.4) + i;
      const bx = cx + Math.sin(phase) * 4;
      const by = cy - 4 - ((phase * 7) % 14);
      ctx.fillStyle = `rgba(160, 255, 180, ${0.4 + (i % 2) * 0.25})`;
      ctx.beginPath();
      ctx.arc(bx, by, 1.4 + i * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    const bw = f.size;
    const bh = 3;
    const bx = f.x;
    const by = f.y + f.size + 3;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    ctx.fillStyle = "#1a3020";
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = "#7dffb0";
    ctx.fillRect(bx, by, Math.round(bw * Math.min(1, progress)), bh);
  }

  drawLabel(ctx, crafting ? "制药台（炼）" : "制药台", cx, f.y - 4);
}

function drawChickenCoop(
  ctx: CanvasRenderingContext2D,
  f: Facility,
  focused: boolean,
): void {
  const cx = f.x + f.size / 2;
  drawShadow(ctx, cx, f.y + f.size - 1, f.size * 0.42, f.size * 0.12);
  if (focused) strokeFocus(ctx, f);

  // 简易木屋鸡舍
  ctx.fillStyle = "#8a6040";
  ctx.fillRect(f.x + 4, f.y + f.size * 0.35, f.size - 8, f.size * 0.55);
  ctx.fillStyle = "#c45a3a";
  ctx.beginPath();
  ctx.moveTo(f.x + 2, f.y + f.size * 0.4);
  ctx.lineTo(cx, f.y + 4);
  ctx.lineTo(f.x + f.size - 2, f.y + f.size * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#3a2818";
  ctx.fillRect(cx - 4, f.y + f.size * 0.55, 8, f.size * 0.35);
  // 小窗
  ctx.fillStyle = "#f0d080";
  ctx.fillRect(f.x + 8, f.y + f.size * 0.5, 6, 6);

  drawLabel(ctx, f.label, cx, f.y - 4);
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
