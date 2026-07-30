/**
 * 物品定义（名称、分类、堆叠、颜色等）。
 * ★ 价格请到 prices.ts 修改。
 * ★ 食物回血请到 foods.ts 修改。
 * ★ 药水效果请到 potions.ts 修改。
 *
 * 分类约定（可多选）：
 *   wood      木头    — 原木等砍树产物
 *   mineral   矿物    — 矿石、煤炭、精华等
 *   crop      农作物  — 田里种的、树上摘的
 *   material  原材料  — 生鲜海产、羽毛、草药等加工原料
 *   food      食物    — 可直接食用（回血见 foods.ts）
 *   potion    药水    — 可饮用增益（效果见 potions.ts）
 *   chest     宝箱    — 鸟巢、钓鱼宝箱等
 */
import {
  getBuyPrice,
  getSellPrice,
  type ItemPrice,
} from "./prices.ts";

// ---------- 分类 ----------

export type ItemCategoryId =
  | "wood"
  | "mineral"
  | "crop"
  | "material"
  | "food"
  | "potion"
  | "chest";

export type ItemCategoryDef = {
  id: ItemCategoryId;
  /** 中文显示名 */
  name: string;
  /** 列表/商店排序（小在前） */
  order: number;
};

/** 物品大类（以后加类别只改这里） */
export const ITEM_CATEGORIES: Record<ItemCategoryId, ItemCategoryDef> = {
  wood: { id: "wood", name: "木头", order: 10 },
  mineral: { id: "mineral", name: "矿物", order: 20 },
  crop: { id: "crop", name: "农作物", order: 30 },
  material: { id: "material", name: "原材料", order: 40 },
  food: { id: "food", name: "食物", order: 50 },
  potion: { id: "potion", name: "药水", order: 60 },
  chest: { id: "chest", name: "宝箱", order: 70 },
};

export const ITEM_CATEGORY_LIST: ItemCategoryDef[] = Object.values(
  ITEM_CATEGORIES,
).sort((a, b) => a.order - b.order);

// ---------- 物品 ----------

export type ItemId =
  | "wood"
  | "apple"
  | "raw_shrimp"
  | "crayfish"
  | "cooked_shrimp"
  | "feather"
  | "bone"
  | "raw_chicken"
  | "cooked_chicken"
  | "galum_grass"
  | "bird_nest_potion"
  | "bird_nest"
  | "treasure_chest"
  | "coal"
  | "rune_essence"
  | "copper_ore";

/** 无限堆叠（所有物品统一使用） */
export const STACK_UNLIMITED = Number.POSITIVE_INFINITY;

export type ItemDef = {
  id: ItemId;
  name: string;
  /**
   * 所属大类（可多个，如苹果 = 农作物 + 食物）。
   * 主类（排序用）取数组第一项。
   */
  categories: ItemCategoryId[];
  /** 单格最大堆叠；Infinity = 无限 */
  stackMax: number;
  /** UI / 掉落占位色 */
  color: string;
};

const ITEM_BASE: Record<ItemId, ItemDef> = {
  // —— 木头 ——
  wood: {
    id: "wood",
    name: "普通原木",
    categories: ["wood"],
    stackMax: STACK_UNLIMITED,
    color: "#a67c52",
  },

  // —— 农作物 + 食物 ——
  apple: {
    id: "apple",
    name: "苹果",
    categories: ["crop", "food"],
    stackMax: STACK_UNLIMITED,
    color: "#e05050",
  },

  // —— 原材料 ——
  raw_shrimp: {
    id: "raw_shrimp",
    name: "生虾",
    categories: ["material"],
    stackMax: STACK_UNLIMITED,
    color: "#e07a5f",
  },
  crayfish: {
    id: "crayfish",
    name: "小龙虾",
    categories: ["material"],
    stackMax: STACK_UNLIMITED,
    color: "#c43c2c",
  },
  feather: {
    id: "feather",
    name: "羽毛",
    categories: ["material"],
    stackMax: STACK_UNLIMITED,
    color: "#e8e0d0",
  },
  bone: {
    id: "bone",
    name: "骨头",
    categories: ["material"],
    stackMax: STACK_UNLIMITED,
    color: "#d8d0c0",
  },
  raw_chicken: {
    id: "raw_chicken",
    name: "生鸡肉",
    categories: ["material"],
    stackMax: STACK_UNLIMITED,
    color: "#e8a090",
  },
  galum_grass: {
    id: "galum_grass",
    name: "盖鲁姆草",
    categories: ["material"],
    stackMax: STACK_UNLIMITED,
    color: "#5a9a48",
  },

  // —— 食物 ——
  cooked_shrimp: {
    id: "cooked_shrimp",
    name: "熟虾",
    categories: ["food"],
    stackMax: STACK_UNLIMITED,
    color: "#e8a050",
  },
  cooked_chicken: {
    id: "cooked_chicken",
    name: "熟鸡肉",
    categories: ["food"],
    stackMax: STACK_UNLIMITED,
    color: "#d4a060",
  },

  // —— 药水 ——
  bird_nest_potion: {
    id: "bird_nest_potion",
    name: "鸟巢药水",
    categories: ["potion"],
    stackMax: STACK_UNLIMITED,
    color: "#c8a060",
  },

  // —— 宝箱 ——
  bird_nest: {
    id: "bird_nest",
    name: "鸟巢",
    categories: ["chest"],
    stackMax: STACK_UNLIMITED,
    color: "#8b6914",
  },
  treasure_chest: {
    id: "treasure_chest",
    name: "宝箱",
    categories: ["chest"],
    stackMax: STACK_UNLIMITED,
    color: "#d4a017",
  },

  // —— 矿物 ——
  coal: {
    id: "coal",
    name: "煤炭",
    categories: ["mineral"],
    stackMax: STACK_UNLIMITED,
    color: "#3a3a42",
  },
  rune_essence: {
    id: "rune_essence",
    name: "符文精华",
    categories: ["mineral"],
    stackMax: STACK_UNLIMITED,
    color: "#6b8cff",
  },
  copper_ore: {
    id: "copper_ore",
    name: "铜矿石",
    categories: ["mineral"],
    stackMax: STACK_UNLIMITED,
    color: "#c4783a",
  },
};

/** 物品基础定义（无价格） */
export const ITEMS: Record<ItemId, ItemDef> = ITEM_BASE;

/** 全部物品 id（定义顺序） */
export const ITEM_IDS: ItemId[] = Object.keys(ITEM_BASE) as ItemId[];

/**
 * 商店可购买货架（参考：盖鲁姆草 50 金/棵）。
 * 以后加商品只往这个数组塞 id，并在 prices.ts 写好 buy。
 */
export const SHOP_BUY_ITEM_IDS: ItemId[] = ["galum_grass"];

/** 全部物品按分类排序（内部/调试） */
export const SHOP_ITEM_IDS: ItemId[] = sortItemIdsByCategory(ITEM_IDS);

export function getItem(id: ItemId): ItemDef {
  return ITEMS[id];
}

/** 主分类（categories[0]，用于排序） */
export function getPrimaryCategory(id: ItemId): ItemCategoryDef {
  const cats = ITEMS[id].categories;
  return ITEM_CATEGORIES[cats[0] ?? "material"];
}

/** 全部所属分类定义 */
export function getItemCategories(id: ItemId): ItemCategoryDef[] {
  return ITEMS[id].categories.map((c) => ITEM_CATEGORIES[c]);
}

/** 分类标签文案，如「农作物 · 食物」 */
export function formatItemCategories(id: ItemId): string {
  return getItemCategories(id)
    .map((c) => c.name)
    .join(" · ");
}

/** @deprecated 使用 getPrimaryCategory / formatItemCategories */
export function getItemCategory(id: ItemId): ItemCategoryDef {
  return getPrimaryCategory(id);
}

/** 是否属于某大类（多分类任一匹配即可） */
export function isItemInCategory(
  id: ItemId,
  category: ItemCategoryId,
): boolean {
  return ITEMS[id].categories.includes(category);
}

/** 某大类下的全部物品 */
export function itemsInCategory(category: ItemCategoryId): ItemId[] {
  return ITEM_IDS.filter((id) => isItemInCategory(id, category));
}

/** 按主类 order 排序 */
export function sortItemIdsByCategory(ids: readonly ItemId[]): ItemId[] {
  return [...ids].sort((a, b) => {
    const ca = getPrimaryCategory(a).order;
    const cb = getPrimaryCategory(b).order;
    if (ca !== cb) return ca - cb;
    return ITEM_IDS.indexOf(a) - ITEM_IDS.indexOf(b);
  });
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
