import type { Inventory } from "../systems/inventory.ts";
import { getItem, type ItemId } from "../data/items.ts";
import { getSellPrice } from "../data/prices.ts";

export type InventoryPanelActions = {
  /** 商店模式：左键卖 1 个 */
  onSellOneOf?: (itemId: ItemId) => void;
  /** 商店模式：右键卖全部 */
  onSellAllOf?: (itemId: ItemId) => void;
};

/**
 * DOM 背包面板。
 * 普通模式只展示；商店联动时右键卖全部。
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
    this.hint.textContent = "B / I 关闭";

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
      : "B / I 关闭";
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

    inv.slots.forEach((slot, index) => {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "inv-slot" + (this.shopLinked && slot ? " clickable" : "");
      if (slot) {
        const def = getItem(slot.id);
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
        const count = document.createElement("span");
        count.className = "inv-count";
        count.textContent = String(slot.count);
        cell.append(label, count);

        if (this.shopLinked) {
          cell.title = `左键卖1个 / 右键卖全部（${getSellPrice(slot.id)}金/个）`;
          cell.addEventListener("click", (e) => {
            e.preventDefault();
            this.actions?.onSellOneOf?.(slot.id);
          });
          cell.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            this.actions?.onSellAllOf?.(slot.id);
          });
        }
      } else {
        cell.classList.add("empty");
        cell.disabled = true;
      }
      void index;
      this.grid.appendChild(cell);
    });
  }
}

function itemIcon(id: ItemId): string | null {
  if (id === "wood") return "item_wood.png";
  if (id === "raw_shrimp" || id === "cooked_shrimp") return "item_fish.png";
  return null;
}
