import type { Facility } from "../entities/facility.ts";
import {
  drawShadow,
  drawSprite,
  getSprite,
  type SpriteName,
} from "../assets/sprites.ts";

export function drawFacilities(
  ctx: CanvasRenderingContext2D,
  list: Facility[],
  focusId: string | null,
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
