import type { Chunk, ChunkId } from "./chunk.ts";
import { CONFIG } from "../core/config.ts";

/**
 * 地图邻接：
 *
 *              forest
 *                │
 *   mine ── village ── grassland
 *                │
 *            riverside
 *
 * 村子：上森林 · 下河边 · 右草地 · 左矿区
 */
const CHUNKS: Record<ChunkId, Chunk> = {
  village: {
    id: "village",
    name: "村子",
    groundColor: "#3d5c45",
    gridColor: "#35533e",
    widthTiles: CONFIG.viewTilesW,
    heightTiles: CONFIG.viewTilesH,
    neighbors: {
      up: "forest",
      down: "riverside",
      right: "grassland",
      left: "mine",
    },
  },
  grassland: {
    id: "grassland",
    name: "草地",
    groundColor: "#4a6b3a",
    gridColor: "#405f32",
    widthTiles: CONFIG.viewTilesW,
    heightTiles: CONFIG.viewTilesH,
    neighbors: { left: "village" },
  },
  riverside: {
    id: "riverside",
    name: "河边",
    groundColor: "#3a5f6b",
    gridColor: "#32545e",
    widthTiles: CONFIG.viewTilesW,
    heightTiles: CONFIG.viewTilesH,
    neighbors: { up: "village" },
  },
  forest: {
    id: "forest",
    name: "森林",
    groundColor: "#2f4a32",
    gridColor: "#28402b",
    widthTiles: CONFIG.viewTilesW,
    heightTiles: CONFIG.viewTilesH,
    neighbors: { down: "village" },
  },
  mine: {
    id: "mine",
    name: "矿区",
    groundColor: "#3a3a42",
    gridColor: "#2e2e36",
    widthTiles: CONFIG.viewTilesW,
    heightTiles: CONFIG.viewTilesH,
    neighbors: { right: "village" },
  },
};

export function getChunk(id: ChunkId): Chunk {
  return CHUNKS[id];
}

export function allChunkIds(): ChunkId[] {
  return Object.keys(CHUNKS) as ChunkId[];
}
