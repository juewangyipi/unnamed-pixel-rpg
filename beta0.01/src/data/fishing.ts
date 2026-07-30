/**
 * ============================================================
 *  钓鱼掉落表（手动改这里即可）
 * ============================================================
 *
 *  每次成功钓鱼按 chance 做一次互斥判定（概率之和应为 1）。
 *  改完保存，刷新游戏页面即可。
 *
 *  当前：
 *    生虾 95% · 小龙虾 4.99% · 宝箱 0.01%
 */

import type { ItemId } from "./items.ts";

export type FishingLootEntry = {
  itemId: ItemId;
  amount: number;
  /** 0～1，本表各项之和应为 1 */
  chance: number;
};

/**
 * ★ 钓鱼掉落配置入口 ★
 * 顺序：从上到下累加 chance 做区间判定。
 */
export const FISHING_LOOT: FishingLootEntry[] = [
  { itemId: "raw_shrimp", amount: 1, chance: 0.95 },
  { itemId: "crayfish", amount: 1, chance: 0.0499 },
  { itemId: "treasure_chest", amount: 1, chance: 0.0001 },
];

/** 按掉落表掷一次；表为空时返回 null */
export function rollFishingLoot(
  table: readonly FishingLootEntry[] = FISHING_LOOT,
): { itemId: ItemId; amount: number } | null {
  if (!table.length) return null;
  const r = Math.random();
  let acc = 0;
  for (const entry of table) {
    acc += entry.chance;
    if (r < acc) {
      return { itemId: entry.itemId, amount: entry.amount };
    }
  }
  // 浮点误差：落到最后一项
  const last = table[table.length - 1]!;
  return { itemId: last.itemId, amount: last.amount };
}
