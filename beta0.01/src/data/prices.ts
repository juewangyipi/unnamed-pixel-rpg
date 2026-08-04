/**
 * ============================================================
 *  物品价格表（手动改这里即可）
 * ============================================================
 *
 *  sell = 卖给商店的单价
 *  buy  = 从商店买 1 个的单价（仅货架商品需要写；不写 = 不可购买）
 */

import type { ItemId } from "./items.ts";

export type ItemPrice = {
  /** 卖出价 */
  sell: number;
  /**
   * 买入价（可选）。
   * 只有商店货架商品需要填写；不写表示不可购买。
   */
  buy?: number;
};

/**
 * ★ 价格配置入口：只改下面数字 ★
 */
export const ITEM_PRICES: Record<ItemId, ItemPrice> = {
  wood: { sell: 2 },
  apple: { sell: 10 },
  raw_shrimp: { sell: 3 },
  crayfish: { sell: 18 },
  cooked_shrimp: { sell: 6 },
  feather: { sell: 4 },
  bone: { sell: 3 },
  raw_chicken: { sell: 5 },
  cooked_chicken: { sell: 12 },
  /** 商店唯一可购 */
  galum_grass: { sell: 30, buy: 50 },
  bird_nest_potion: { sell: 40 },
  bird_nest: { sell: 25 },
  treasure_chest: { sell: 100 },
  coal: { sell: 6 },
  rune_essence: { sell: 4 },
  copper_ore: { sell: 5 },
};

// ---------- 读取接口 ----------

export function getSellPrice(id: ItemId): number {
  return ITEM_PRICES[id].sell;
}

/** 买入价；未配置则返回 0（不可买） */
export function getBuyPrice(id: ItemId): number {
  return ITEM_PRICES[id].buy ?? 0;
}

export function setItemPrice(
  id: ItemId,
  price: Partial<ItemPrice>,
): void {
  const cur = ITEM_PRICES[id];
  if (price.sell != null) cur.sell = Math.max(0, Math.floor(price.sell));
  if (price.buy !== undefined) {
    if (price.buy == null) {
      delete cur.buy;
    } else {
      cur.buy = Math.max(0, Math.floor(price.buy));
    }
  }
}
