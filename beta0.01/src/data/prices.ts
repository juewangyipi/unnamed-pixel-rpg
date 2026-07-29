/**
 * ============================================================
 *  物品价格表（手动改这里即可）
 * ============================================================
 *
 *  sell = 卖给商店的单价（背包/仓库左键卖1、右键卖全部）
 *  buy  = 从商店买 1 个的单价（购买功能后置，改了也先不生效）
 *
 *  改完保存，刷新游戏页面即可（npm run dev 下会热更新）。
 *  不要写负数；整数即可。
 *
 *  示例：
 *    wood: { sell: 2, buy: 5 },   // 普通原木卖 2 金，以后买 5 金
 */

import type { ItemId } from "./items.ts";

export type ItemPrice = {
  /** 卖出价 */
  sell: number;
  /** 买入价（商店购买开放后使用） */
  buy: number;
};

/**
 * ★ 价格配置入口：只改下面数字 ★
 */
export const ITEM_PRICES: Record<ItemId, ItemPrice> = {
  //          卖价  买价（暂未开放）
  wood: { sell: 2, buy: 5 },
  raw_shrimp: { sell: 3, buy: 12 },
  cooked_shrimp: { sell: 6, buy: 20 },
  coal: { sell: 6, buy: 20 },
  rune_essence: { sell: 4, buy: 12 },
  copper_ore: { sell: 5, buy: 15 },
};

// ---------- 读取接口（代码里用，一般不用改） ----------

export function getSellPrice(id: ItemId): number {
  return ITEM_PRICES[id].sell;
}

export function getBuyPrice(id: ItemId): number {
  return ITEM_PRICES[id].buy;
}

/** 一次改某个物品的卖价/买价（调试用，运行时生效，不写回文件） */
export function setItemPrice(
  id: ItemId,
  price: Partial<ItemPrice>,
): void {
  const cur = ITEM_PRICES[id];
  if (price.sell != null) cur.sell = Math.max(0, Math.floor(price.sell));
  if (price.buy != null) cur.buy = Math.max(0, Math.floor(price.buy));
}
