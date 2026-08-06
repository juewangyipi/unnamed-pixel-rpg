import type { Chunk, ChunkNeighbors } from "./chunk.ts";
import { CONFIG } from "../core/config.ts";
import { getChunk } from "./registry.ts";
import {
  drawSprite,
  getSprite,
  tileSprite,
  type SpriteName,
} from "../assets/sprites.ts";

type ExitDir = keyof ChunkNeighbors;

const TILE_FOR_CHUNK: Record<string, SpriteName> = {
  village: "tile_village",
  grassland: "tile_grass",
  riverside: "tile_grass",
  forest: "tile_forest",
  mine: "tile_village",
  coop: "tile_grass",
};

/**
 * 静态背景缓存：地砖 + 网格 + AO + 氛围 + 装饰 + 出口，每块只画一次。
 * 每帧只 drawImage 一次，动画层（粒子 / 水面焦散）再叠上去。
 */
const STATIC_CACHE = new Map<string, HTMLCanvasElement>();

function getCachedBackground(
  chunk: Chunk,
  width: number,
  height: number,
  tile: number,
): HTMLCanvasElement {
  const key = `${chunk.id}:${width}x${height}`;
  const cached = STATIC_CACHE.get(key);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("Chunk cache canvas unavailable");
  c.imageSmoothingEnabled = false;

  drawStaticBackground(c, chunk, width, height, tile);
  STATIC_CACHE.set(key, canvas);
  return canvas;
}

/**
 * 画当前块：静态层取缓存，动画层（粒子 / 焦散）每帧叠加。
 */
export function renderChunkBackground(
  ctx: CanvasRenderingContext2D,
  chunk: Chunk,
  width: number,
  height: number,
  timeSec = 0,
): void {
  const { tileSize } = CONFIG;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(getCachedBackground(chunk, width, height, tileSize), 0, 0);

  if (chunk.id === "riverside") {
    drawWaterCaustics(ctx, width, height, tileSize, timeSec);
  }
  drawParticles(ctx, chunk, width, height, timeSec);
}

function drawStaticBackground(
  ctx: CanvasRenderingContext2D,
  chunk: Chunk,
  width: number,
  height: number,
  tile: number,
): void {
  const tileName = TILE_FOR_CHUNK[chunk.id] ?? "tile_grass";

  if (!tileSprite(ctx, tileName, width, height, tile)) {
    ctx.fillStyle = chunk.groundColor;
    ctx.fillRect(0, 0, width, height);
  }

  drawGrid(ctx, width, height, tile);
  drawGroundAO(ctx, width, height);
  drawDecor(ctx, chunk, width, height, tile);
  drawAmbient(ctx, chunk, width, height);
  drawExitEdges(ctx, chunk, width, height, tile);
}

/** 极淡网格 */
function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tile: number,
): void {
  ctx.strokeStyle = "rgba(0,0,0,0.035)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= width; x += tile) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, height);
  }
  for (let y = 0; y <= height; y += tile) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(width, y + 0.5);
  }
  ctx.stroke();
}

function drawGroundAO(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const g = ctx.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.2,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.7,
  );
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(0.7, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(4, 14, 22, 0.14)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
}

/** 天光 / vignette / 路径暖带（静态，随 chunk 缓存） */
function drawAmbient(
  ctx: CanvasRenderingContext2D,
  chunk: Chunk,
  width: number,
  height: number,
): void {
  const skyStrength =
    chunk.id === "village"
      ? 0.16
      : chunk.id === "riverside"
        ? 0.12
        : chunk.id === "forest"
          ? 0.05
          : 0.08;

  // 双层天光：冷青 + 淡绿
  const sky = ctx.createLinearGradient(0, 0, 0, height * 0.5);
  sky.addColorStop(0, `rgba(100, 190, 220, ${skyStrength})`);
  sky.addColorStop(0.4, `rgba(120, 200, 180, ${skyStrength * 0.4})`);
  sky.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height * 0.5);

  // 侧向斜光（模拟太阳从左上）
  const sun = ctx.createLinearGradient(0, 0, width * 0.7, height * 0.6);
  sun.addColorStop(0, "rgba(255, 240, 200, 0.045)");
  sun.addColorStop(0.55, "rgba(255, 240, 200, 0)");
  sun.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, width, height);

  // 底部冷 vignette
  const vig = ctx.createRadialGradient(
    width / 2,
    height * 0.52,
    Math.min(width, height) * 0.22,
    width / 2,
    height * 0.58,
    Math.max(width, height) * 0.75,
  );
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(4, 16, 28, 0.22)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, width, height);

  if (chunk.id === "village") {
    const pathY = height / 2 + CONFIG.tileSize * 0.5;
    const glow = ctx.createLinearGradient(0, pathY - 24, 0, pathY + 32);
    glow.addColorStop(0, "rgba(0,0,0,0)");
    glow.addColorStop(0.4, "rgba(255, 228, 160, 0.055)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, pathY - 24, width, 56);

    // 屋后淡雾（纵深）
    const fog = ctx.createLinearGradient(0, height * 0.15, 0, height * 0.4);
    fog.addColorStop(0, "rgba(180, 220, 230, 0.06)");
    fog.addColorStop(1, "rgba(180, 220, 230, 0)");
    ctx.fillStyle = fog;
    ctx.fillRect(0, height * 0.12, width, height * 0.28);
  }

  if (chunk.id === "forest") {
    ctx.fillStyle = "rgba(10, 30, 20, 0.08)";
    ctx.fillRect(0, 0, width, height);
  }
}

/** 水面焦散 + 岸线泡沫 */
function drawWaterCaustics(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tile: number,
  timeSec: number,
): void {
  const waterX = width - tile * 4;
  const t = timeSec;
  ctx.save();

  // 半透明水色叠加加深
  ctx.fillStyle = "rgba(20, 90, 120, 0.08)";
  ctx.fillRect(waterX, 0, tile * 4, height);

  // 焦散斑点
  for (let i = 0; i < 16; i++) {
    const phase = t * (0.9 + i * 0.13) + i * 1.9;
    const x =
      waterX +
      tile * 0.35 +
      ((Math.sin(phase) * 0.5 + 0.5) * (tile * 3.4));
    const y = ((phase * 22 + i * 41) % (height + 24)) - 12;
    const a = 0.1 + (Math.sin(phase * 2.2) * 0.5 + 0.5) * 0.22;
    const px = Math.round(x);
    const py = Math.round(y);
    ctx.fillStyle = `rgba(200, 245, 255, ${a})`;
    ctx.fillRect(px, py, 3, 1);
    ctx.fillRect(px + 1, py - 1, 1, 2);
    if (i % 3 === 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${a * 0.5})`;
      ctx.fillRect(px + 2, py, 1, 1);
    }
  }

  // 岸线泡沫脉动
  const foam = 0.1 + Math.sin(t * 2.2) * 0.05;
  ctx.fillStyle = `rgba(190, 235, 245, ${foam})`;
  for (let y = 0; y < height; y += 3) {
    if ((y + Math.floor(t * 4)) % 7 < 2) {
      ctx.fillRect(waterX + tile - 2, y, 3, 2);
    }
  }

  // 深水渐变（右侧更深）
  const deep = ctx.createLinearGradient(waterX + tile, 0, width, 0);
  deep.addColorStop(0, "rgba(8, 40, 60, 0)");
  deep.addColorStop(1, "rgba(6, 30, 48, 0.18)");
  ctx.fillStyle = deep;
  ctx.fillRect(waterX + tile, 0, tile * 3, height);
  ctx.restore();
}

/** 花粉 / 尘埃微粒 */
function drawParticles(
  ctx: CanvasRenderingContext2D,
  chunk: Chunk,
  width: number,
  height: number,
  timeSec: number,
): void {
  if (chunk.id === "mine") return;
  const count = chunk.id === "village" ? 14 : chunk.id === "forest" ? 10 : 8;
  const warm = chunk.id === "village" || chunk.id === "grassland";
  ctx.save();
  for (let i = 0; i < count; i++) {
    const seed = i * 17.13;
    const drift = timeSec * (8 + (i % 5)) + seed * 20;
    const x = ((Math.sin(seed) * 0.5 + 0.5) * width + drift * 0.35) % width;
    const y =
      ((Math.cos(seed * 1.3) * 0.5 + 0.5) * height +
        Math.sin(timeSec * 0.7 + seed) * 12) %
      height;
    const a = 0.12 + (Math.sin(timeSec + seed) * 0.5 + 0.5) * 0.18;
    ctx.fillStyle = warm
      ? `rgba(255, 240, 180, ${a})`
      : `rgba(180, 230, 240, ${a})`;
    const s = 1 + (i % 3 === 0 ? 1 : 0);
    ctx.fillRect(Math.round(x), Math.round(y), s, s);
  }
  ctx.restore();
}

type DecorItem = {
  y: number;
  draw: () => void;
};

function drawDecor(
  ctx: CanvasRenderingContext2D,
  chunk: Chunk,
  width: number,
  height: number,
  tile: number,
): void {
  const items: DecorItem[] = [];

  const footShadow = (cx: number, cy: number, rx: number, ry: number) => {
    ctx.save();
    ctx.fillStyle = "rgba(8, 24, 40, 0.22)";
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const pushBush = (tx: number, ty: number, variant = 0) => {
    const spr: SpriteName = variant % 2 === 0 ? "bush" : "bush2";
    items.push({
      y: ty * tile + tile,
      draw: () => {
        footShadow(
          tx * tile + tile * 0.5,
          ty * tile + tile * 0.88,
          tile * 0.32,
          tile * 0.1,
        );
        if (
          !drawSprite(ctx, spr, tx * tile, ty * tile, {
            w: tile,
            h: tile,
          })
        ) {
          if (
            !drawSprite(ctx, "bush", tx * tile, ty * tile, {
              w: tile,
              h: tile,
            })
          ) {
            ctx.fillStyle = "rgba(40, 80, 45, 0.5)";
            ctx.fillRect(tx * tile + 2, ty * tile + 2, tile - 4, tile - 4);
          }
        }
      },
    });
  };

  const pushTree = (tx: number, ty: number) => {
    items.push({
      y: ty * tile + tile,
      draw: () => {
        footShadow(
          tx * tile + tile * 0.5,
          ty * tile + tile * 0.92,
          tile * 0.3,
          tile * 0.11,
        );
        const tree = getSprite("tree");
        if (tree) {
          drawSprite(ctx, "tree", tx * tile, ty * tile - 10, {
            foot: { w: tile, h: tile },
            w: tree.naturalWidth,
            h: tree.naturalHeight,
          });
        }
      },
    });
  };

  const pushDeco = (
    tx: number,
    ty: number,
    spr: SpriteName,
    footY = 0.9,
  ) => {
    items.push({
      y: ty * tile + tile * footY,
      draw: () => {
        const img = getSprite(spr);
        if (!img) return;
        footShadow(
          tx * tile + tile * 0.5,
          ty * tile + tile * footY,
          tile * 0.22,
          tile * 0.08,
        );
        drawSprite(ctx, spr, tx * tile + (tile - img.naturalWidth) / 2, ty * tile, {
          foot: { w: tile, h: tile },
          w: img.naturalWidth,
          h: img.naturalHeight,
        });
      },
    });
  };

  switch (chunk.id) {
    case "village": {
      // 路径先画（在装饰下）
      paintPathRow(ctx, height / 2 + tile * 0.5, width, tile, true);

      const house = getSprite("house");
      if (house) {
        const bx = Math.round((width - house.naturalWidth) / 2);
        const by = Math.round(height * 0.28 - house.naturalHeight * 0.15);
        items.push({
          y: by + house.naturalHeight,
          draw: () => {
            // 建筑接触影 + 柔影
            ctx.save();
            ctx.fillStyle = "rgba(6, 18, 32, 0.18)";
            ctx.beginPath();
            ctx.ellipse(
              bx + house.naturalWidth / 2,
              by + house.naturalHeight - 1,
              house.naturalWidth * 0.48,
              8,
              0,
              0,
              Math.PI * 2,
            );
            ctx.fill();
            ctx.fillStyle = "rgba(8, 24, 40, 0.28)";
            ctx.beginPath();
            ctx.ellipse(
              bx + house.naturalWidth / 2,
              by + house.naturalHeight - 1,
              house.naturalWidth * 0.38,
              5,
              0,
              0,
              Math.PI * 2,
            );
            ctx.fill();
            ctx.restore();
            drawSprite(ctx, "house", bx, by);
          },
        });
      }

      const bushes: [number, number, number?][] = [
        [2, 3, 0],
        [17, 3, 1],
        [1, 11, 1],
        [18, 11, 0],
        [4, 5, 0],
        [15, 5, 1],
        [3, 9, 1],
        [16, 9, 0],
        [8, 2, 0],
        [11, 2, 1],
        [6, 12, 1],
        [13, 12, 0],
      ];
      for (const [tx, ty, v] of bushes) pushBush(tx, ty, v ?? 0);
      for (const [tx, ty] of [
        [5, 4],
        [13, 4],
        [2, 7],
        [17, 7],
      ] as [number, number][]) {
        pushTree(tx, ty);
      }
      // 村落道具：木桶 / 木箱 / 路牌 / 石块
      pushDeco(7, 6, "deco_barrel");
      pushDeco(12, 6, "deco_crate");
      pushDeco(9, 10, "deco_chest");
      pushDeco(14, 9, "deco_sign");
      pushDeco(4, 10, "deco_rock");
      pushDeco(15, 3, "deco_rock");
      break;
    }
    case "grassland": {
      paintPathRow(ctx, height / 2 - tile / 2, width, tile, true);
      const glBushes: [number, number, number][] = [
        [2, 2, 0],
        [16, 3, 1],
        [3, 12, 1],
        [15, 11, 0],
        [9, 4, 0],
        [12, 12, 1],
        [5, 8, 1],
        [18, 8, 0],
      ];
      for (const [tx, ty, v] of glBushes) pushBush(tx, ty, v);
      pushDeco(7, 6, "deco_rock");
      pushDeco(14, 5, "deco_rock");
      pushDeco(4, 10, "deco_barrel");
      pushTree(10, 9);
      break;
    }
    case "riverside": {
      const waterX = width - tile * 4;
      for (let y = 0; y < height; y += tile) {
        drawSprite(ctx, "tile_water_edge", waterX, y, {
          w: tile,
          h: tile,
        });
        for (let i = 1; i < 4; i++) {
          // 水砖变体交错
          const wn: SpriteName =
            ((y / tile + i) | 0) % 2 === 0 ? "tile_water" : "tile_water2";
          if (
            !drawSprite(ctx, wn, waterX + i * tile, y, {
              w: tile,
              h: tile,
            })
          ) {
            drawSprite(ctx, "tile_water", waterX + i * tile, y, {
              w: tile,
              h: tile,
            });
          }
        }
      }
      paintPathRow(ctx, height / 2 - tile / 2, waterX + tile, tile, true);
      drawSprite(
        ctx,
        "tile_path",
        waterX - tile,
        Math.round(height / 2 - tile / 2),
        { w: tile, h: tile },
      );
      pushBush(3, 3, 0);
      pushBush(8, 11, 1);
      pushBush(11, 4, 1);
      pushTree(5, 5);
      pushDeco(7, 9, "deco_rock");
      pushDeco(2, 8, "deco_barrel");
      break;
    }
    case "coop": {
      for (let tx = 1; tx < 19; tx += 2) {
        pushBush(tx, 1, tx % 4 === 1 ? 0 : 1);
        pushBush(tx, 13, tx % 4 === 1 ? 1 : 0);
      }
      for (let ty = 2; ty < 13; ty += 2) {
        pushBush(1, ty, ty % 4 === 0 ? 0 : 1);
        pushBush(18, ty, ty % 4 === 0 ? 1 : 0);
      }
      paintPathRow(ctx, height / 2 - tile / 2, width, tile, true);
      pushDeco(6, 5, "deco_crate");
      pushDeco(13, 5, "deco_barrel");
      pushDeco(9, 10, "deco_rock");
      pushDeco(4, 8, "deco_sign");
      break;
    }
    case "forest": {
      const fBushes: [number, number, number][] = [
        [1, 1, 0],
        [18, 2, 1],
        [2, 13, 1],
        [17, 12, 0],
        [9, 1, 0],
        [14, 14, 1],
        [0, 7, 1],
        [19, 8, 0],
        [6, 5, 0],
        [12, 9, 1],
      ];
      for (const [tx, ty, v] of fBushes) pushBush(tx, ty, v);
      for (const [tx, ty] of [
        [4, 3],
        [15, 4],
        [8, 11],
        [12, 2],
        [10, 7],
      ] as [number, number][]) {
        pushTree(tx, ty);
      }
      pushDeco(7, 8, "deco_rock");
      pushDeco(13, 12, "deco_rock");
      pushDeco(3, 6, "deco_barrel");
      break;
    }
    case "mine": {
      ctx.fillStyle = "rgba(20, 20, 28, 0.35)";
      ctx.fillRect(0, 0, width, height);
      paintPathRow(ctx, height / 2 - tile / 2, width, tile, false);
      for (const [tx, ty] of [
        [2, 2],
        [17, 2],
        [1, 12],
        [18, 13],
        [9, 1],
        [11, 14],
        [5, 6],
        [14, 8],
      ] as [number, number][]) {
        pushDeco(tx, ty, "deco_rock");
      }
      pushDeco(8, 5, "deco_crate");
      pushDeco(12, 10, "deco_barrel");
      break;
    }
  }

  // Y 排序绘制，近大远小的前后遮挡感
  items.sort((a, b) => a.y - b.y);
  for (const it of items) it.draw();
}

function paintPathRow(
  ctx: CanvasRenderingContext2D,
  y: number,
  width: number,
  tile: number,
  softEdge: boolean,
): void {
  const yy = Math.round(y);
  if (softEdge) {
    // 路缘衔接色：深土压边，减轻与草地硬接缝
    ctx.fillStyle = "rgba(48, 40, 28, 0.18)";
    ctx.fillRect(0, yy - 3, width, tile + 6);
    ctx.fillStyle = "rgba(30, 50, 36, 0.1)";
    ctx.fillRect(0, yy - 2, width, 3);
    ctx.fillRect(0, yy + tile - 1, width, 3);
  }
  for (let x = 0, i = 0; x < width; x += tile, i++) {
    // 形状变体交错 + 偶发翻转（由 draw 时处理不了，这里换图）
    const name: SpriteName =
      (i + Math.floor(yy / tile)) % 3 === 0 ? "tile_path2" : "tile_path";
    if (!drawSprite(ctx, name, x, yy, { w: tile, h: tile })) {
      if (!drawSprite(ctx, "tile_path", x, yy, { w: tile, h: tile })) {
        ctx.fillStyle = "#6d7a45";
        ctx.fillRect(x, yy, tile, tile);
      }
    }
  }
}

function drawExitEdges(
  ctx: CanvasRenderingContext2D,
  chunk: Chunk,
  width: number,
  height: number,
  tile: number,
): void {
  const dirs: ExitDir[] = ["up", "down", "left", "right"];
  const band = 2;

  for (const dir of dirs) {
    const nextId = chunk.neighbors[dir];
    if (!nextId) continue;

    ctx.fillStyle = "rgba(120, 210, 230, 0.3)";
    switch (dir) {
      case "left":
        ctx.fillRect(0, 0, band, height);
        break;
      case "right":
        ctx.fillRect(width - band, 0, band, height);
        break;
      case "up":
        ctx.fillRect(0, 0, width, band);
        break;
      case "down":
        ctx.fillRect(0, height - band, width, band);
        break;
    }

    const label = getChunk(nextId).name;
    ctx.fillStyle = "rgba(230, 250, 255, 0.95)";
    ctx.font = "13px 'Segoe UI', system-ui, sans-serif";
    ctx.textBaseline = "middle";
    const drawLabel = (
      text: string,
      x: number,
      y: number,
      align: CanvasTextAlign,
    ) => {
      ctx.textAlign = align;
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(8, 24, 40, 0.65)";
      ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);
    };
    switch (dir) {
      case "right":
        drawLabel(`→ ${label}`, width - tile * 0.35, height / 2, "right");
        break;
      case "left":
        drawLabel(`${label} ←`, tile * 0.35, height / 2, "left");
        break;
      case "up":
        drawLabel(`↑ ${label}`, width / 2, tile * 0.65, "center");
        break;
      case "down":
        drawLabel(`↓ ${label}`, width / 2, height - tile * 0.65, "center");
        break;
    }
  }
}
