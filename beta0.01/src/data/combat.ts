/**
 * ============================================================
 *  战斗 / 鸡舍配置（手动改这里即可）
 * ============================================================
 * 参考：新技能战斗 · 鸡舍 6 只鸡 · 攻击力 2 · 鸡 5HP · 不反击
 * 掉落：50% 羽毛 · 40% 骨头 · 10% 生鸡肉
 */

import type { ItemId } from "./items.ts";
import { CONFIG } from "../core/config.ts";

export type CombatLootEntry = {
  itemId: ItemId;
  amount: number;
  chance: number;
};

/** ★ 战斗数值入口 ★ */
export const COMBAT = {
  /** 玩家基础攻击力 */
  playerAttack: 2,
  /** 鸡生命 */
  chickenHp: 5,
  /** 同时存在上限 */
  chickenMax: 6,
  /** 死后刷新秒数 */
  chickenRespawnSec: 5,
  /** 攻击间隔（秒） */
  attackIntervalSec: 0.55,
  /** 攻击距离（像素） */
  attackRange: CONFIG.tileSize * 0.95,
  /** 鸡体型 */
  chickenSize: CONFIG.tileSize * 0.65,
  /** 追鸡移速倍率（相对玩家正常移速） */
  chaseSpeedMul: 1.05,
  /** 击杀给的战斗经验 */
  killXp: 4,
} as const;

/** 击杀一只鸡的互斥掉落表（之和应为 1） */
export const CHICKEN_LOOT: CombatLootEntry[] = [
  { itemId: "feather", amount: 1, chance: 0.5 },
  { itemId: "bone", amount: 1, chance: 0.4 },
  { itemId: "raw_chicken", amount: 1, chance: 0.1 },
];

export function rollChickenLoot(
  table: readonly CombatLootEntry[] = CHICKEN_LOOT,
): { itemId: ItemId; amount: number } {
  const r = Math.random();
  let acc = 0;
  for (const e of table) {
    acc += e.chance;
    if (r < acc) return { itemId: e.itemId, amount: e.amount };
  }
  const last = table[table.length - 1]!;
  return { itemId: last.itemId, amount: last.amount };
}
