import {
  farmPhase,
  growProgress,
  type FarmPlot,
} from "../entities/farmPlot.ts";
import { getCrop } from "../data/crops.ts";
import { drawShadow, drawSprite, getSprite } from "../assets/sprites.ts";

/** 绘制草地农田：空地 / 生长 / 成熟苹果树 */
export function drawFarmPlots(
  ctx: CanvasRenderingContext2D,
  list: FarmPlot[],
  nowSec: number,
  focusId: string | null,
  active: FarmPlot | null,
): void {
  for (const plot of list) {
    const focused = focusId === plot.id;
    const phase = farmPhase(plot, nowSec);
    drawSoil(ctx, plot, focused);

    if (phase === "growing") {
      drawSprout(ctx, plot, growProgress(plot, nowSec));
      drawGrowHint(ctx, plot, nowSec);
    } else if (phase === "mature") {
      drawAppleTree(ctx, plot, focused);
    }

    if (
      phase === "mature" &&
      (plot.harvestProgress > 0 || (active && active.id === plot.id))
    ) {
      drawProgress(ctx, plot);
    }
  }

  if (active && farmPhase(active, nowSec) === "mature" && active.cropId) {
    const label = getCrop(active.cropId).matureLabel;
    const px = active.x + active.size / 2;
    const py = active.y - 6;
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const tw = ctx.measureText(`砍${label}`).width;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(px - tw / 2 - 5, py - 8, tw + 10, 14);
    ctx.strokeStyle = "rgba(255,220,120,0.45)";
    ctx.strokeRect(px - tw / 2 - 5, py - 8, tw + 10, 14);
    ctx.fillStyle = "#fff6c8";
    ctx.fillText(`砍${label}`, px, py);
  }
}

function drawSoil(
  ctx: CanvasRenderingContext2D,
  plot: FarmPlot,
  focused: boolean,
): void {
  const { x, y, size } = plot;
  // 田垄底
  ctx.fillStyle = "#5a4228";
  ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
  ctx.fillStyle = "#6e5232";
  ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
  // 垄沟
  ctx.fillStyle = "rgba(30,20,12,0.35)";
  ctx.fillRect(x + 2, y + size * 0.45, size - 4, 2);
  ctx.fillRect(x + 2, y + size * 0.7, size - 4, 2);
  // 湿土高光
  ctx.fillStyle = "rgba(120, 90, 50, 0.45)";
  ctx.fillRect(x + 3, y + 3, size * 0.35, 2);

  if (focused) {
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
}

function drawSprout(
  ctx: CanvasRenderingContext2D,
  plot: FarmPlot,
  progress: number,
): void {
  const { x, y, size } = plot;
  const cx = x + size / 2;
  const h = 4 + progress * 10;
  // 茎
  ctx.fillStyle = "#3d7a3a";
  ctx.fillRect(cx - 1, y + size - 6 - h, 2, h);
  // 叶
  ctx.fillStyle = "#6bc46a";
  ctx.beginPath();
  ctx.ellipse(cx - 3, y + size - 6 - h, 3 + progress * 2, 2, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 3, y + size - 6 - h, 3 + progress * 2, 2, 0.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawGrowHint(
  ctx: CanvasRenderingContext2D,
  plot: FarmPlot,
  nowSec: number,
): void {
  const left = Math.max(0, Math.ceil(plot.readyWallSec - nowSec));
  if (left <= 0) return;
  ctx.fillStyle = "rgba(200,230,180,0.85)";
  ctx.font = "9px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(`${left}s`, plot.x + plot.size / 2, plot.y + plot.size + 2);
}

function drawAppleTree(
  ctx: CanvasRenderingContext2D,
  plot: FarmPlot,
  _focused: boolean,
): void {
  const { x, y, size } = plot;
  drawShadow(ctx, x + size / 2, y + size - 2, size * 0.38, size * 0.12);

  const img = getSprite("tree");
  if (
    !drawSprite(ctx, "tree", x, y, {
      foot: { w: size, h: size },
      w: img?.naturalWidth,
      h: img?.naturalHeight,
    })
  ) {
    ctx.fillStyle = "#5a3d28";
    ctx.fillRect(x + size * 0.35, y + size * 0.45, size * 0.3, size * 0.5);
    ctx.fillStyle = "#2f7a3e";
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size * 0.35, size * 0.42, 0, Math.PI * 2);
    ctx.fill();
  }

  // 红苹果点缀
  const apples: [number, number][] = [
    [0.32, 0.28],
    [0.62, 0.22],
    [0.48, 0.38],
    [0.7, 0.4],
    [0.28, 0.42],
  ];
  for (const [fx, fy] of apples) {
    ctx.fillStyle = "#e05050";
    ctx.beginPath();
    ctx.arc(x + size * fx, y + size * fy, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff0a0";
    ctx.fillRect(x + size * fx - 0.5, y + size * fy - 1.5, 1, 1);
  }
}

function drawProgress(ctx: CanvasRenderingContext2D, plot: FarmPlot): void {
  const w = plot.size;
  const h = 4;
  const x = plot.x;
  const y = plot.y + plot.size + 3;
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = "#3a2a18";
  ctx.fillRect(x, y, w, h);
  const pw = Math.round(w * Math.min(1, plot.harvestProgress));
  ctx.fillStyle = "#e0b85a";
  ctx.fillRect(x, y, pw, h);
  ctx.fillStyle = "#fff0b0";
  ctx.fillRect(x, y, pw, 1);
}
