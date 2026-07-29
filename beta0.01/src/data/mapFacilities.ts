import { CONFIG } from "../core/config.ts";
import type { Facility } from "../entities/facility.ts";

const T = CONFIG.tileSize;

/** 村子设施：商店、仓库、篝火、烹饪锅、存档点 */
export function createMapFacilities(): Facility[] {
  return [
    {
      id: "vil_shop",
      kind: "shop",
      chunkId: "village",
      x: 4 * T,
      y: 6 * T,
      size: T * 2,
      label: "商店",
    },
    {
      id: "vil_warehouse",
      kind: "warehouse",
      chunkId: "village",
      x: 14 * T,
      y: 6 * T,
      size: T * 2,
      label: "仓库",
    },
    {
      id: "vil_campfire",
      kind: "campfire",
      chunkId: "village",
      x: 8 * T,
      y: 7 * T,
      size: T,
      label: "篝火",
    },
    {
      id: "vil_pot",
      kind: "cooking_pot",
      chunkId: "village",
      x: 11 * T,
      y: 7 * T,
      size: T,
      label: "烹饪锅",
    },
    {
      id: "vil_save",
      kind: "save_point",
      chunkId: "village",
      x: 9 * T,
      y: 11 * T,
      size: T,
      label: "存档点",
    },
  ];
}
