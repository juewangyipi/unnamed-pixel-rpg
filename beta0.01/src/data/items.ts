/**
 * 物品定义（名称、堆叠、颜色等）。
 * ★ 价格请到 prices.ts 修改，不要写在这里。
 */
import {
  getBuyPrice,
  getSellPrice,
  type ItemPrice,
} from "./prices.ts";

export type ItemId = "wood" | "raw_shrimp" | "cooked_shrimp" | "coal";

export type ItemDef = {
  id: ItemId;
  name: string;
  /** 单格最大堆叠 */
  stackMax: number;
  /** UI / 掉落占位色 */
  color: string;
};

const ITEM_BASE: Record<ItemId, ItemDef> = {
  wood: {
    id: "wood",
    name: "木头",
    stackMax: 99,
    color: "#a67c52",
  },
  raw_shrimp: {
    id: "raw_shrimp",
    name: "生虾",
    stackMax: 99,
    color: "#e07a5f",
  },
  cooked_shrimp: {
    id: "cooked_shrimp",
    name: "熟虾",
    stackMax: 99,
    color: "#e8a050",
  },
  coal: {
    id: "coal",
    name: "煤炭",
    stackMax: 99,
    color: "#3a3a42",
  },
};

/** 物品基础定义（无价格） */
export const ITEMS: Record<ItemId, ItemDef> = ITEM_BASE;

/**
 * 商店货架商品顺序（购买功能后置，当前 UI 未使用）。
 * @internal
 */
export const SHOP_ITEM_IDS: ItemId[] = [
  "wood",
  "raw_shrimp",
  "cooked_shrimp",
  "coal",
];

export function getItem(id: ItemId): ItemDef {
  return ITEMS[id];
}

/** 物品 + 当前价格（从 prices.ts 实时读取） */
export type ItemWithPrice = ItemDef & {
  sellPrice: number;
  buyPrice: number;
};

export function getItemWithPrice(id: ItemId): ItemWithPrice {
  const base = ITEMS[id];
  return {
    ...base,
    sellPrice: getSellPrice(id),
    buyPrice: getBuyPrice(id),
  };
}

/** 只读价格 */
export function getItemPrice(id: ItemId): ItemPrice {
  return {
    sell: getSellPrice(id),
    buy: getBuyPrice(id),
  };
}

export type { ItemPrice };
