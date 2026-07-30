/**
 * ============================================================
 *  食物食用效果表（手动改这里即可）
 * ============================================================
 *
 *  规则：
 *  - 只有写在本表里的物品才能「背包左键食用」
 *  - healHp = 吃 1 个恢复的生命（整数，建议 ≥ 1）
 *  - 对应物品仍须在 items.ts 里带有 "food" 分类
 *
 *  改完保存，刷新游戏页面即可（npm run dev 下会热更新）。
 *
 *  示例：
 *    apple: { healHp: 12 },           // 苹果回 12 血
 *    cooked_shrimp: { healHp: 28 },   // 熟虾回 28 血
 */

import type { ItemId } from "./items.ts";

/** 当前已配置的可食用食物 id */
export type FoodId = "apple" | "cooked_shrimp" | "cooked_chicken";

export type FoodEffect = {
  /** 食用 1 个恢复的生命值 */
  healHp: number;
};

/**
 * ★ 食物配置入口：只改下面数字 ★
 * 新增食物时：
 *  1. 在 items.ts 给物品 categories 加上 "food"
 *  2. 把 id 加进上方 FoodId 联合类型
 *  3. 在本表补一行 healHp
 */
export const FOOD_EFFECTS: Record<FoodId, FoodEffect> = {
  //          回血
  apple: { healHp: 8 },
  cooked_shrimp: { healHp: 10 },
  cooked_chicken: { healHp: 18 },
};

// ---------- 读取接口（代码里用，一般不用改） ----------

const FOOD_IDS = Object.keys(FOOD_EFFECTS) as FoodId[];

export function isFoodId(id: ItemId): id is FoodId {
  return Object.prototype.hasOwnProperty.call(FOOD_EFFECTS, id);
}

/** 是否可食用（在食物表里且 healHp > 0） */
export function isEdible(id: ItemId): boolean {
  if (!isFoodId(id)) return false;
  return FOOD_EFFECTS[id].healHp > 0;
}

/** 食用回血量；不可食用返回 0 */
export function getFoodHeal(id: ItemId): number {
  if (!isFoodId(id)) return 0;
  return Math.max(0, Math.floor(FOOD_EFFECTS[id].healHp));
}

/** 食物效果；不可食用返回 null */
export function getFoodEffect(id: ItemId): FoodEffect | null {
  if (!isFoodId(id)) return null;
  return FOOD_EFFECTS[id];
}

/** 全部可配置食物 id */
export function allFoodIds(): FoodId[] {
  return FOOD_IDS.slice();
}

/** 运行时改某食物回血（调试用，不写回文件） */
export function setFoodHeal(id: FoodId, healHp: number): void {
  FOOD_EFFECTS[id].healHp = Math.max(0, Math.floor(healHp));
}
