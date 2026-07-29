/** 物品定义：尽量纯数据，系统只读 id。 */
export type ItemId = "wood" | "raw_shrimp";

export type ItemDef = {
  id: ItemId;
  name: string;
  /** 单格最大堆叠 */
  stackMax: number;
  /** 卖价（商店后用） */
  sellPrice: number;
  /** UI / 掉落占位色 */
  color: string;
};

export const ITEMS: Record<ItemId, ItemDef> = {
  wood: {
    id: "wood",
    name: "木头",
    stackMax: 99,
    sellPrice: 2,
    color: "#a67c52",
  },
  raw_shrimp: {
    id: "raw_shrimp",
    name: "生虾",
    stackMax: 99,
    sellPrice: 5,
    color: "#e07a5f",
  },
};

export function getItem(id: ItemId): ItemDef {
  return ITEMS[id];
}
