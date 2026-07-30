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
  // 矿区暂用村砖 + 装饰，缺专用矿砖时不崩
  mine: "tile_village",
  coop: "tile_grass",
};

/**
 * 画当前块：像素地砖 + 装饰 + 出口提示。
 */
export function renderChunkBackground(
  ctx: CanvasRenderingContext2D,
  chunk: Chunk,
  width: number,
  height: number,
): void {
  const { tileSize } = CONFIG;
  const tileName = TILE_FOR_CHUNK[chunk.id] ?? "tile_grass";

  if (!tileSprite(ctx, tileName, width, height, tileSize)) {
    ctx.fillStyle = chunk.groundColor;
    ctx.fillRect(0, 0, width, height);
  }

  // 极淡网格（几乎看不见，只帮认路）
  ctx.strokeStyle = "rgba(0,0,0,0.04)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= width; x += tileSize) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, height);
  }
  for (let y = 0; y <= height; y += tileSize) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(width, y + 0.5);
  }
  ctx.stroke();

  drawDecor(ctx, chunk, width, height, tileSize);
  drawExitEdges(ctx, chunk, width, height, tileSize);
}

function drawDecor(
  ctx: CanvasRenderingContext2D,
  chunk: Chunk,
  width: number,
  height: number,
  tile: number,
): void {
  switch (chunk.id) {
    case "village": {
      const house = getSprite("house");
      if (house) {
        const bx = Math.round((width - house.naturalWidth) / 2);
        const by = Math.round(height * 0.28 - house.naturalHeight * 0.15);
        drawSprite(ctx, "house", bx, by);
      } else {
        const bw = tile * 3;
        const bh = tile * 2;
        const bx = (width - bw) / 2;
        const by = (height - bh) / 2 - tile;
        ctx.fillStyle = "#6b5344";
        ctx.fillRect(bx, by, bw, bh);
      }
      // 石板小径（横贯）
      paintPathRow(ctx, height / 2 + tile * 0.5, width, tile);
      // 院落灌木
      for (const [tx, ty] of [
        [2, 3],
        [17, 3],
        [1, 11],
        [18, 11],
      ] as [number, number][]) {
        drawSprite(ctx, "bush", tx * tile, ty * tile, {
          w: tile,
          h: tile,
        });
      }
      break;
    }
    case "grassland": {
      paintPathRow(ctx, height / 2 - tile / 2, width, tile);
      const bushes: [number, number][] = [
        [2, 2],
        [16, 3],
        [3, 12],
        [15, 11],
        [9, 4],
        [12, 12],
        [5, 8],
      ];
      for (const [tx, ty] of bushes) {
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
      break;
    }
    case "riverside": {
      // 右侧水域；最左一列用水岸过渡砖，其余纯水
      const waterX = width - tile * 4;
      for (let y = 0; y < height; y += tile) {
        drawSprite(ctx, "tile_water_edge", waterX, y, {
          w: tile,
          h: tile,
        });
        for (let i = 1; i < 4; i++) {
          drawSprite(ctx, "tile_water", waterX + i * tile, y, {
            w: tile,
            h: tile,
          });
        }
      }
      // 横向小路通到水边（盖在草地上）
      paintPathRow(ctx, height / 2 - tile / 2, waterX + tile, tile);
      // 岸边小路最后一格用岸砖衔接
      drawSprite(ctx, "tile_path", waterX - tile, Math.round(height / 2 - tile / 2), {
        w: tile,
        h: tile,
      });
      break;
    }
    case "coop": {
      // 围栏感：四边灌木 + 中间空地
      for (let tx = 1; tx < 19; tx += 2) {
        drawSprite(ctx, "bush", tx * tile, 1 * tile, { w: tile, h: tile });
        drawSprite(ctx, "bush", tx * tile, 13 * tile, { w: tile, h: tile });
      }
      for (let ty = 2; ty < 13; ty += 2) {
        drawSprite(ctx, "bush", 1 * tile, ty * tile, { w: tile, h: tile });
        drawSprite(ctx, "bush", 18 * tile, ty * tile, { w: tile, h: tile });
      }
      paintPathRow(ctx, height / 2 - tile / 2, width, tile);
      break;
    }
    case "forest": {
      const bushes: [number, number][] = [
        [1, 1],
        [18, 2],
        [2, 13],
        [17, 12],
        [9, 1],
        [14, 14],
        [0, 7],
        [19, 8],
      ];
      for (const [tx, ty] of bushes) {
        if (
          !drawSprite(ctx, "bush", tx * tile, ty * tile, {
            w: tile,
            h: tile,
          })
        ) {
          ctx.fillStyle = "rgba(30, 60, 35, 0.45)";
          ctx.fillRect(tx * tile + 2, ty * tile + 2, tile - 4, tile - 4);
        }
      }
      break;
    }
    case "mine": {
      // 岩地暗色叠层 + 碎石点缀
      ctx.fillStyle = "rgba(20, 20, 28, 0.35)";
      ctx.fillRect(0, 0, width, height);
      // 通往村子的东向小路
      paintPathRow(ctx, height / 2 - tile / 2, width, tile);
      const rocks: [number, number][] = [
        [2, 2],
        [17, 2],
        [1, 12],
        [18, 13],
        [9, 1],
        [11, 14],
      ];
      for (const [tx, ty] of rocks) {
        ctx.fillStyle = "#4a4a55";
        ctx.beginPath();
        ctx.ellipse(
          tx * tile + tile * 0.5,
          ty * tile + tile * 0.55,
          tile * 0.28,
          tile * 0.18,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.fillStyle = "#5a5a68";
        ctx.beginPath();
        ctx.ellipse(
          tx * tile + tile * 0.42,
          ty * tile + tile * 0.48,
          tile * 0.14,
          tile * 0.1,
          -0.3,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      break;
    }
  }
}

function paintPathRow(
  ctx: CanvasRenderingContext2D,
  y: number,
  width: number,
  tile: number,
): void {
  const yy = Math.round(y);
  for (let x = 0; x < width; x += tile) {
    if (
      !drawSprite(ctx, "tile_path", x, yy, { w: tile, h: tile })
    ) {
      ctx.fillStyle = "#6d7a45";
      ctx.fillRect(x, yy, tile, tile);
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

    ctx.fillStyle = "rgba(255, 220, 100, 0.35)";
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
    ctx.fillStyle = "rgba(255, 250, 220, 0.95)";
    ctx.font = "13px 'Segoe UI', system-ui, sans-serif";
    ctx.textBaseline = "middle";
    // 描边让字在亮/暗地上都清晰
    const drawLabel = (text: string, x: number, y: number, align: CanvasTextAlign) => {
      ctx.textAlign = align;
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0,0,0,0.55)";
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
