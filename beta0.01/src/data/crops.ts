import type { ItemId } from "./items.ts";
import type { SkillId } from "./skills.ts";

/** 可种植作物 id */
export type CropId = "apple";

export type CropDef = {
  id: CropId;
  /** 面板显示名 */
  name: string;
  /** 消耗的种子物品（当前用苹果当种子） */
  seedItemId: ItemId;
  seedCost: number;
  /** 种植后到成熟的秒数（墙钟） */
  growSec: number;
  /** 砍伐收获 */
  harvestItemId: ItemId;
  harvestAmount: number;
  /** 砍伐一次所需秒数 */
  harvestDuration: number;
  harvestXp: number;
  skillId: SkillId;
  plantLabel: string;
  matureLabel: string;
};

export const CROPS: Record<CropId, CropDef> = {
  apple: {
    id: "apple",
    name: "苹果",
    seedItemId: "apple",
    seedCost: 1,
    growSec: 100,
    harvestItemId: "apple",
    harvestAmount: 10,
    harvestDuration: 3,
    harvestXp: 8,
    skillId: "woodcutting",
    plantLabel: "种苹果",
    matureLabel: "苹果树",
  },
};

export const CROP_LIST: CropDef[] = Object.values(CROPS);

export function getCrop(id: CropId): CropDef {
  return CROPS[id];
}
