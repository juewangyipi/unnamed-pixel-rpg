import type { ChunkId } from "../world/chunk.ts";
import { CONFIG } from "../core/config.ts";

const T = CONFIG.tileSize;

export type WaterDir = "left" | "right" | "up" | "down";

/**
 * 可钓鱼区：站在区内（岸边陆地）按下 E 即以原挂机机制自动钓鱼。
 * 不再需要在地图上摆放鱼点 node。
 */
export type FishZone = {
  /** 岸边可站立区域（块内像素，左上角 + 宽高） */
  x: number;
  y: number;
  w: number;
  h: number;
  /** 水面所在方向（决定玩家朝哪，鱼线往哪抛） */
  waterDir: WaterDir;
  /** 水面左/上边线的像素坐标（用于把浮标/鱼线画到水面） */
  waterEdge: number;
};

/** 目前只有河边（riverside）紧贴水岸的一段可以钓鱼 */
export const FISH_ZONES: Partial<Record<ChunkId, FishZone>> = {
  riverside: {
    x: T * 13,
    y: T * 1,
    w: T * 3,
    h: T * 13,
    waterDir: "right",
    waterEdge: T * 16,
  },
};

/** 若 (px, py) 落在某图的可钓区则返回该区，否则 null */
export function fishZoneAt(
  chunkId: ChunkId,
  px: number,
  py: number,
): FishZone | null {
  const z = FISH_ZONES[chunkId];
  if (!z) return null;
  if (px < z.x || px >= z.x + z.w) return null;
  if (py < z.y || py >= z.y + z.h) return null;
  return z;
}

/** 根据朝向画鱼线时对水面偏一点的锚点（保持在 zone 上边内） */
export function zoneMinY(z: FishZone): number {
  return z.y;
}
export function zoneMaxY(z: FishZone): number {
  return z.y + z.h;
}