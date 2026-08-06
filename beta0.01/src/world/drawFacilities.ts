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
  // 商店/仓库：石基座 + 更大阴影，嵌进村落地面，减少「飘在草上」的割裂感
  const isBuilding = f.kind === "shop" || f.kind === "warehouse";
  if (isBuilding) {
    drawBuildingPad(ctx, f);
  }

  drawShadow(
    ctx,
    f.x + f.size / 2,
    f.y + f.size - 1,
    f.size * (isBuilding ? 0.52 : 0.42),
    f.size * (isBuilding ? 0.14 : 0.12),
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

/** 建筑脚下石板，用村落地砖拼一圈，和 Cainos 石地统一 */
function drawBuildingPad(ctx: CanvasRenderingContext2D, f: Facility): void {
  const pad = 6;
  const x = Math.round(f.x - pad);
  const y = Math.round(f.y + f.size * 0.55);
  const w = Math.round(f.size + pad * 2);
  const h = Math.round(f.size * 0.5 + pad);
  const tile =
    getSprite("tile_village") ?? getSprite("tile_village2") ?? null;
  if (tile) {
    ctx.imageSmoothingEnabled = false;
    const tw = 32;
    for (let py = y; py < y + h; py += tw) {
      for (let px = x; px < x + w; px += tw) {
        const dw = Math.min(tw, x + w - px);
        const dh = Math.min(tw, y + h - py);
        ctx.drawImage(tile, 0, 0, dw, dh, px, py, dw, dh);
      }
    }
  } else {
    ctx.fillStyle = "rgba(90, 88, 82, 0.85)";
    ctx.fillRect(x, y, w, h);
  }
  // 外缘深色衔接草地
  ctx.strokeStyle = "rgba(40, 36, 30, 0.35)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
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

function drawProgressBar(
  ctx: CanvasRenderingContext2D,
  f: Facility,
  progress: number,
  fill: string,
  track: string,
): void {
  const bw = f.size;
  const bh = 3;
  const bx = f.x;
  const by = f.y + f.size + 3;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
  ctx.fillStyle = track;
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = fill;
  ctx.fillRect(bx, by, Math.round(bw * Math.min(1, progress)), bh);
}

/** 精灵 + 脚底对齐；无图时返回 false */
function drawFacilitySprite(
  ctx: CanvasRenderingContext2D,
  name: SpriteName,
  f: Facility,
  opts?: { maxH?: number },
): boolean {
  const img = getSprite(name);
  if (!img) return false;
  const maxH = opts?.maxH ?? f.size;
  let w = img.naturalWidth;
  let h = img.naturalHeight;
  if (h > maxH) {
    const s = maxH / h;
    w = Math.round(w * s);
    h = Math.round(h * s);
  }
  if (w > f.size * 1.4) {
    const s = (f.size * 1.4) / w;
    w = Math.round(w * s);
    h = Math.round(h * s);
  }
  return drawSprite(ctx, name, f.x, f.y, {
    foot: { w: f.size, h: f.size },
    w,
    h,
  });
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

  drawShadow(ctx, cx, f.y + f.size - 1, f.size * 0.4, f.size * 0.12);
  if (focused) strokeFocus(ctx, f);

  // Cainos 石圈：燃烧时用完整井圈，熄灭用半圈火塘
  const baseOk = lit
    ? drawFacilitySprite(ctx, "facility_campfire_ring", f, {
        maxH: f.size * 1.15,
      }) || drawFacilitySprite(ctx, "facility_campfire", f)
    : drawFacilitySprite(ctx, "facility_campfire", f);

  if (!baseOk) {
    // 几何回退
    const cy = f.y + f.size * 0.62;
    ctx.fillStyle = "#6a655c";
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.2;
      const rx = cx + Math.cos(a) * f.size * 0.32;
      const ry = cy + Math.sin(a) * f.size * 0.18;
      ctx.beginPath();
      ctx.ellipse(rx, ry, 3.2, 2.2, a, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (lit) {
    const cy = f.y + f.size * 0.55;
    const flicker = 1 + Math.sin(t * 14) * 0.08 + Math.sin(t * 23) * 0.05;
    const h = f.size * 0.38 * flicker;
    ctx.fillStyle = "#e85d2a";
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy);
    ctx.quadraticCurveTo(cx - 6, cy - h * 0.55, cx, cy - h);
    ctx.quadraticCurveTo(cx + 6, cy - h * 0.55, cx + 5, cy);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffd36a";
    ctx.beginPath();
    ctx.moveTo(cx - 2.5, cy - 1);
    ctx.quadraticCurveTo(cx - 1.5, cy - h * 0.45, cx, cy - h * 0.7);
    ctx.quadraticCurveTo(cx + 1.5, cy - h * 0.45, cx + 2.5, cy - 1);
    ctx.closePath();
    ctx.fill();
    // 火星
    for (let i = 0; i < 3; i++) {
      const phase = t * (3 + i) + i * 2;
      const px = cx + Math.sin(phase) * (3 + i);
      const py = cy - h * 0.5 - ((phase * 6) % 12);
      ctx.fillStyle = `rgba(255, 200, 80, ${0.4 + (i % 2) * 0.25})`;
      ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
    }
    drawProgressBar(ctx, f, progress, "#ff9a3c", "#3a2010");
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

  drawShadow(ctx, cx, f.y + f.size - 1, f.size * 0.38, f.size * 0.12);
  if (focused) strokeFocus(ctx, f);

  const ok = drawFacilitySprite(ctx, "facility_cooking_pot", f);
  if (!ok) {
    const cy = f.y + f.size * 0.55;
    ctx.fillStyle = "#3a3e48";
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4, f.size * 0.38, f.size * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (cooking) {
    const cy = f.y + f.size * 0.4;
    for (let i = 0; i < 4; i++) {
      const phase = t * (2.2 + i * 0.35) + i * 1.7;
      const bx = cx + Math.sin(phase) * (5 + i);
      const by = cy - ((phase * 8) % 18);
      const r = 1.5 + (i % 3) * 0.6;
      ctx.fillStyle = `rgba(230, 245, 255, ${0.35 + (i % 2) * 0.2})`;
      ctx.beginPath();
      ctx.arc(bx, by, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(220, 230, 240, 0.35)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const sx = cx - 4 + i * 4;
      const bob = Math.sin(t * 6 + i) * 2;
      ctx.beginPath();
      ctx.moveTo(sx, cy - 4);
      ctx.quadraticCurveTo(sx + 2, cy - 10 + bob, sx - 1, cy - 16 + bob);
      ctx.stroke();
    }
    drawProgressBar(ctx, f, progress, "#7ec8ff", "#1a2030");
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

  drawShadow(ctx, cx, f.y + f.size - 1, f.size * 0.4, f.size * 0.12);
  if (focused) strokeFocus(ctx, f);

  const ok = drawFacilitySprite(ctx, "facility_alchemy", f, {
    maxH: f.size * 1.25,
  });
  if (!ok) {
    ctx.fillStyle = "#5a4030";
    ctx.fillRect(f.x + 2, f.y + f.size * 0.45, f.size - 4, f.size * 0.4);
  }

  if (crafting) {
    const cy = f.y + f.size * 0.35;
    for (let i = 0; i < 3; i++) {
      const phase = t * (2.5 + i * 0.4) + i;
      const bx = cx + Math.sin(phase) * 4;
      const by = cy - ((phase * 7) % 14);
      ctx.fillStyle = `rgba(160, 255, 180, ${0.4 + (i % 2) * 0.25})`;
      ctx.beginPath();
      ctx.arc(bx, by, 1.4 + i * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    drawProgressBar(ctx, f, progress, "#7dffb0", "#1a3020");
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

  const ok = drawFacilitySprite(ctx, "facility_chicken_coop", f, {
    maxH: f.size * 1.2,
  });
  if (!ok) {
    ctx.fillStyle = "#8a6040";
    ctx.fillRect(f.x + 4, f.y + f.size * 0.35, f.size - 8, f.size * 0.55);
    ctx.fillStyle = "#c45a3a";
    ctx.beginPath();
    ctx.moveTo(f.x + 2, f.y + f.size * 0.4);
    ctx.lineTo(cx, f.y + 4);
    ctx.lineTo(f.x + f.size - 2, f.y + f.size * 0.4);
    ctx.closePath();
    ctx.fill();
  }

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
