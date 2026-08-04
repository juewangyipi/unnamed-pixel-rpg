import type { ItemId } from "../data/items.ts";
import { ITEMS, SHOP_BUY_ITEM_IDS } from "../data/items.ts";
import { getBuyPrice, getSellPrice } from "../data/prices.ts";
import {
  bagExpandPrice,
  CONFIG,
  warehouseExpandPrice,
} from "../core/config.ts";
import type { Inventory } from "./inventory.ts";
import type { Wallet } from "./wallet.ts";

export type ShopState = {
  bagExpandLevel: number;
  warehouseExpandLevel: number;
};

/**
 * 商店：货架购买、卖物资（背包/仓库点击）、扩背包/仓库。
 */
export class Shop {
  bagExpandLevel = 0;
  warehouseExpandLevel = 0;

  bagPrice(): number {
    return bagExpandPrice(this.bagExpandLevel);
  }

  warehousePrice(): number {
    return warehouseExpandPrice(this.warehouseExpandLevel);
  }

  /** 从商店买 1 个进背包（仅货架：盖鲁姆草） */
  buyOne(
    inv: Inventory,
    wallet: Wallet,
    itemId: ItemId,
  ): string | null {
    if (!SHOP_BUY_ITEM_IDS.includes(itemId)) {
      return "此物暂不出售";
    }
    const price = getBuyPrice(itemId);
    if (price <= 0) return "此物暂不出售";
    if (!wallet.spend(price)) {
      return `金币不足（需 ${price}）`;
    }
    if (!inv.canFit(itemId, 1)) {
      wallet.earn(price);
      return "背包已满";
    }
    inv.add(itemId, 1);
    return null;
  }

  /** 卖掉某容器中该物品 1 个 */
  sellOne(
    inv: Inventory,
    wallet: Wallet,
    itemId: ItemId,
  ): { sold: number; gold: number } {
    if (inv.countOf(itemId) <= 0) return { sold: 0, gold: 0 };
    const removed = inv.remove(itemId, 1);
    const gold = removed * getSellPrice(itemId);
    wallet.earn(gold);
    return { sold: removed, gold };
  }

  /** 卖掉某容器中该物品的全部 */
  sellAll(
    inv: Inventory,
    wallet: Wallet,
    itemId: ItemId,
  ): { sold: number; gold: number } {
    const count = inv.countOf(itemId);
    if (count <= 0) return { sold: 0, gold: 0 };
    const removed = inv.remove(itemId, count);
    const gold = removed * getSellPrice(itemId);
    wallet.earn(gold);
    return { sold: removed, gold };
  }

  sellEverything(
    inv: Inventory,
    wallet: Wallet,
  ): { sold: number; gold: number } {
    let sold = 0;
    let gold = 0;
    for (const id of Object.keys(ITEMS) as ItemId[]) {
      const r = this.sellAll(inv, wallet, id);
      sold += r.sold;
      gold += r.gold;
    }
    return { sold, gold };
  }

  buyBagExpand(inv: Inventory, wallet: Wallet): string | null {
    const price = this.bagPrice();
    if (!wallet.spend(price)) return `金币不足（需 ${price}）`;
    inv.expand(CONFIG.expandSlots);
    this.bagExpandLevel += 1;
    return null;
  }

  buyWarehouseExpand(warehouse: Inventory, wallet: Wallet): string | null {
    const price = this.warehousePrice();
    if (!wallet.spend(price)) return `金币不足（需 ${price}）`;
    warehouse.expand(CONFIG.expandSlots);
    this.warehouseExpandLevel += 1;
    return null;
  }

  toJSON(): ShopState {
    return {
      bagExpandLevel: this.bagExpandLevel,
      warehouseExpandLevel: this.warehouseExpandLevel,
    };
  }

  loadJSON(data: ShopState): void {
    this.bagExpandLevel = data.bagExpandLevel;
    this.warehouseExpandLevel = data.warehouseExpandLevel;
  }
}
