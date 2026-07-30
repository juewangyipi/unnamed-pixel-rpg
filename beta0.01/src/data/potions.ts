/**
 * ============================================================
 *  药水效果表（手动改这里即可）
 * ============================================================
 *
 *  规则：
 *  - 只有写在本表里的物品可「背包左键饮用」
 *  - 对应物品须在 items.ts 带有 "potion" 分类
 *  - charges = 一瓶可用次数（砍树等触发后扣 1 次）
 *  - 同种药水可叠加次数；异种会替换
 *  - treeBonus：砍树成功时额外独立掷骰掉落
 *
 *  参考：鸟巢药水 → 砍树 5% 鸟巢 · 50 次/瓶（可叠）
 */

import type { ItemId } from "./items.ts";
import type { BonusDrop } from "../entities/interactable.ts";

export type PotionId = "bird_nest_potion";

export type PotionEffect = {
  /** 一瓶可用次数（如砍树次数） */
  charges: number;
  /** 砍树时额外掉落（独立判定）；有次数时生效 */
  treeBonusDrops?: BonusDrop[];
  /** 面板/提示用短描述 */
  description: string;
};

/**
 * ★ 药水配置入口 ★
 */
export const POTION_EFFECTS: Record<PotionId, PotionEffect> = {
  bird_nest_potion: {
    charges: 50,
    description: "砍树时 5% 概率获得鸟巢（每砍 1 次扣 1 次效果）",
    treeBonusDrops: [{ itemId: "bird_nest", amount: 1, chance: 0.05 }],
  },
};

export function isPotionId(id: ItemId): id is PotionId {
  return Object.prototype.hasOwnProperty.call(POTION_EFFECTS, id);
}

/** 是否可饮用 */
export function isDrinkable(id: ItemId): boolean {
  return isPotionId(id) && POTION_EFFECTS[id].charges > 0;
}

export function getPotionEffect(id: ItemId): PotionEffect | null {
  if (!isPotionId(id)) return null;
  return POTION_EFFECTS[id];
}

export function allPotionIds(): PotionId[] {
  return Object.keys(POTION_EFFECTS) as PotionId[];
}
