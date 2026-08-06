import type { Inventory } from "../systems/inventory.ts";
import {
  formatItemCategories,
  getItem,
  type ItemId,
} from "../data/items.ts";
import { getFoodHeal, isEdible } from "../data/foods.ts";
import { getPotionEffect, isDrinkable } from "../data/potions.ts";
import { getSellPrice } from "../data/prices.ts";

export type InventoryPanelActions = {
  /** 商店模式：左键卖 1 个 */
  onSellOneOf?: (itemId: ItemId) => void;
  /** 商店模式：右键卖全部 */
  onSellAllOf?: (itemId: ItemId) => void;
  /** 普通模式：左键食用食物 */
  onEat?: (itemId: ItemId) => void;
  /** 普通模式：左键饮用药水 */
  onDrink?: (itemId: ItemId) => void;
};

/**
 * DOM 背包面板。
 * 普通模式：食物左键食用；商店联动时买卖。
 */
export class InventoryPanel {
  private readonly root: HTMLElement;
  private readonly grid: HTMLElement;
  private readonly meta: HTMLElement;
  private readonly hint: HTMLElement;
  private open = false;
  private shopLinked = false;
  private actions: InventoryPanelActions | null = null;

  constructor(host: HTMLElement) {
    this.root = document.createElement("div");
    this.root.id = "inventory-panel";
    this.root.className = "pixel-frame";
    this.root.hidden = true;

    const title = document.createElement("div");
    title.className = "inv-title";
    title.textContent = "◆ 背包 ◆";

    this.meta = document.createElement("div");
    this.meta.className = "inv-meta";

    this.grid = document.createElement("div");
    this.grid.className = "inv-grid";

    this.hint = document.createElement("div");
    this.hint.className = "inv-hint";
    this.hint.textContent = "食物/药水左键使用 · B / I 关闭";

    this.root.append(title, this.meta, this.grid, this.hint);
    host.appendChild(this.root);
  }

  get isOpen(): boolean {
    return this.open;
  }

  setActions(actions: InventoryPanelActions): void {
    this.actions = actions;
  }

  /** 是否与商店联动（布局 + 右键卖） */
  setShopLinked(linked: boolean): void {
    this.shopLinked = linked;
    this.root.classList.toggle("shop-linked", linked);
    this.hint.textContent = linked
      ? "左键卖1个 · 右键卖全部"
      : "食物/药水左键使用 · B / I 关闭";
  }

  toggle(): void {
    this.setOpen(!this.open);
  }

  setOpen(open: boolean): void {
    this.open = open;
    this.root.hidden = !open;
  }

  refresh(inv: Inventory): void {
    this.meta.textContent = `${inv.usedSlots()} / ${inv.capacity} 格`;
    this.grid.replaceChildren();

    inv.slots.forEach((slot) => {
      const cell = document.createElement("button");
      cell.type = "button";
      if (slot) {
        const def = getItem(slot.id);
        const cats = formatItemCategories(slot.id);
        const edible = !this.shopLinked && isEdible(slot.id);
        const drinkable = !this.shopLinked && isDrinkable(slot.id);
        const usable = edible || drinkable;
        cell.className =
          "inv-slot" + (this.shopLinked || usable ? " clickable" : "");
        cell.style.borderColor = def.color;
        const iconFile = itemIcon(slot.id);
        if (iconFile) {
          const icon = document.createElement("img");
          icon.className = "inv-icon";
          icon.alt = def.name;
          icon.width = 28;
          icon.height = 28;
          icon.decoding = "async";
          icon.src = `${import.meta.env.BASE_URL}assets/${iconFile}`;
          cell.append(icon);
        } else {
          const swatch = document.createElement("span");
          swatch.className = "inv-swatch";
          swatch.style.background = def.color;
          cell.append(swatch);
        }
        const label = document.createElement("span");
        label.className = "inv-label";
        label.textContent = def.name;
        const catEl = document.createElement("span");
        catEl.className = "inv-cat";
        catEl.textContent = cats;
        const count = document.createElement("span");
        count.className = "inv-count";
        count.textContent = String(slot.count);
        cell.append(label, catEl, count);

        if (this.shopLinked) {
          cell.title = `[${cats}] ${def.name} · 左键卖1个 / 右键卖全部（${getSellPrice(slot.id)}金/个）`;
          cell.addEventListener("click", (e) => {
            e.preventDefault();
            this.actions?.onSellOneOf?.(slot.id);
          });
          cell.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            this.actions?.onSellAllOf?.(slot.id);
          });
        } else if (edible) {
          const heal = getFoodHeal(slot.id);
          cell.title = `[${cats}] ${def.name} · 左键食用（+${heal} HP）`;
          cell.addEventListener("click", (e) => {
            e.preventDefault();
            this.actions?.onEat?.(slot.id);
          });
        } else if (drinkable) {
          const effect = getPotionEffect(slot.id);
          const desc = effect?.description ?? "增益";
          const charges = effect?.charges ?? 0;
          cell.title = `[${cats}] ${def.name} · 左键饮用（${desc} · ${charges} 次）`;
          cell.addEventListener("click", (e) => {
            e.preventDefault();
            this.actions?.onDrink?.(slot.id);
          });
        } else {
          cell.title = `[${cats}] ${def.name}`;
        }
      } else {
        cell.className = "inv-slot empty";
        cell.disabled = true;
      }
      this.grid.appendChild(cell);
    });
  }
}

function itemIcon(id: ItemId): string | null {
  const map: Partial<Record<ItemId, string>> = {
    wood: "item_wood.png",
    apple: "item_apple.png",
    raw_shrimp: "item_raw_shrimp.png",
    cooked_shrimp: "item_cooked_shrimp.png",
    crayfish: "item_crayfish.png",
    feather: "item_feather.png",
    bone: "item_bone.png",
    raw_chicken: "item_raw_chicken.png",
    cooked_chicken: "item_cooked_chicken.png",
    galum_grass: "item_galum_grass.png",
    bird_nest_potion: "item_bird_nest_potion.png",
    bird_nest: "item_bird_nest.png",
    treasure_chest: "item_treasure_chest.png",
    coal: "item_coal.png",
    rune_essence: "item_rune_essence.png",
    copper_ore: "item_copper_ore.png",
  };
  return map[id] ?? null;
}
