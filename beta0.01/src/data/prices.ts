/**
 * ============================================================
 *  物品价格表（手动改这里即可）
 * ============================================================
 *
 *  sell = 卖给商店的单价
 *  buy  = 从商店买 1 个的单价（货架商品用）
 */

import type { ItemId } from "./items.ts";

export type ItemPrice = {
  /** 卖出价 */
  sell: number;
  /** 买入价 */
  buy: number;
};

/**
 * ★ 价格配置入口：只改下面数字 ★
 */
export const ITEM_PRICES: Record<ItemId, ItemPrice> = {
  //          卖价  买价
  wood: { sell: 2, buy: 5 },
  apple: { sell: 10, buy: 12 },
  raw_shrimp: { sell: 3, buy: 12 },
  crayfish: { sell: 18, buy: 45 },
  cooked_shrimp: { sell: 6, buy: 20 },
  feather: { sell: 4, buy: 12 },
  bone: { sell: 3, buy: 10 },
  raw_chicken: { sell: 5, buy: 15 },
  cooked_chicken: { sell: 12, buy: 30 },
  /** 参考：商店 50 金一棵 */
  galum_grass: { sell: 20, buy: 50 },
  bird_nest_potion: { sell: 40, buy: 0 },
  bird_nest: { sell: 25, buy: 0 },
  treasure_chest: { sell: 100, buy: 0 },
  coal: { sell: 6, buy: 20 },
  rune_essence: { sell: 4, buy: 12 },
  copper_ore: { sell: 5, buy: 15 },
};

// ---------- 读取接口 ----------

export function getSellPrice(id: ItemId): number {
  return ITEM_PRICES[id].sell;
}

export function getBuyPrice(id: ItemId): number {
  return ITEM_PRICES[id].buy;
}

export function setItemPrice(
  id: ItemId,
  price: Partial<ItemPrice>,
): void {
  const cur = ITEM_PRICES[id];
  if (price.sell != null) cur.sell = Math.max(0, Math.floor(price.sell));
  if (price.buy != null) cur.buy = Math.max(0, Math.floor(price.buy));
}
