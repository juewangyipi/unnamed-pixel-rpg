import type { Chunk, ChunkId } from "./chunk.ts";
import { CONFIG } from "../core/config.ts";

/**
 * 地图邻接：
 *
 *              forest ── coop
 *                │        │
 *   mine ── village ── grassland
 *                │
 *            riverside
 *
 * 鸡舍：森林左边 · 矿区上边
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
    neighbors: {
      down: "village",
      left: "coop",
    },
  },
  mine: {
    id: "mine",
    name: "矿区",
    groundColor: "#3a3a42",
    gridColor: "#2e2e36",
    widthTiles: CONFIG.viewTilesW,
    heightTiles: CONFIG.viewTilesH,
    neighbors: {
      right: "village",
      up: "coop",
    },
  },
  coop: {
    id: "coop",
    name: "鸡舍",
    groundColor: "#5a6b3a",
    gridColor: "#4a5a32",
    widthTiles: CONFIG.viewTilesW,
    heightTiles: CONFIG.viewTilesH,
    neighbors: {
      right: "forest",
      down: "mine",
    },
  },
};

export function getChunk(id: ChunkId): Chunk {
  return CHUNKS[id];
}

export function allChunkIds(): ChunkId[] {
  return Object.keys(CHUNKS) as ChunkId[];
}
