import type { Inventory } from "../systems/inventory.ts";
import { getItem, type ItemId } from "../data/items.ts";
import { getSellPrice } from "../data/prices.ts";

export type WarehouseActions = {
  onDepositAll: () => void;
  onWithdrawAll: () => void;
  onBagSlot: (index: number) => void;
  onWarehouseSlot: (index: number) => void;
  /** 商店模式：左键卖 1 个 */
  onSellOneOf?: (itemId: ItemId) => void;
  /** 商店模式：右键卖全部（仓库） */
  onSellAllOf?: (itemId: ItemId) => void;
  onClose: () => void;
};

/**
 * 仓库面板。
 * - full：背包+仓库互存
 * - shop：仅仓库格，右键卖全部（背包由独立面板显示）
 */
export class WarehousePanel {
  private readonly root: HTMLElement;
  private readonly bagSection: HTMLElement;
  private readonly bagGrid: HTMLElement;
  private readonly whGrid: HTMLElement;
  private readonly meta: HTMLElement;
  private readonly hint: HTMLElement;
  private readonly actionsRow: HTMLElement;
  private open = false;
  private shopLinked = false;
  private actions: WarehouseActions | null = null;

  constructor(host: HTMLElement) {
    this.root = document.createElement("div");
    this.root.id = "warehouse-panel";
    this.root.className = "side-panel wide pixel-frame";
    this.root.hidden = true;

    const title = document.createElement("div");
    title.className = "inv-title";
    title.textContent = "◆ 仓库 ◆";

    this.meta = document.createElement("div");
    this.meta.className = "inv-meta";

    this.actionsRow = document.createElement("div");
    this.actionsRow.className = "panel-actions";
    const dep = document.createElement("button");
    dep.type = "button";
    dep.className = "panel-btn";
    dep.textContent = "全部存入";
    dep.addEventListener("click", () => this.actions?.onDepositAll());
    const wit = document.createElement("button");
    wit.type = "button";
    wit.className = "panel-btn";
    wit.textContent = "尽量取出";
    wit.addEventListener("click", () => this.actions?.onWithdrawAll());
    this.actionsRow.append(dep, wit);

    this.bagSection = document.createElement("div");
    this.bagSection.className = "wh-bag-section";
    const bagLabel = el("div", "panel-sub", "▸ 背包（点格子存入）");
    this.bagGrid = document.createElement("div");
    this.bagGrid.className = "inv-grid";
    this.bagSection.append(bagLabel, this.bagGrid);

    const whLabel = el("div", "panel-sub", "▸ 仓库");
    this.whGrid = document.createElement("div");
    this.whGrid.className = "inv-grid";

    this.hint = document.createElement("div");
    this.hint.className = "inv-hint";
    this.hint.textContent = "Esc / E 关闭";

    this.root.append(
      title,
      this.meta,
      this.actionsRow,
      this.bagSection,
      whLabel,
      this.whGrid,
      this.hint,
    );
    host.appendChild(this.root);
  }

  get isOpen(): boolean {
    return this.open;
  }

  setActions(actions: WarehouseActions): void {
    this.actions = actions;
  }

  setShopLinked(linked: boolean): void {
    this.shopLinked = linked;
    this.root.classList.toggle("shop-linked", linked);
    this.bagSection.hidden = linked;
    this.actionsRow.hidden = linked;
    this.hint.textContent = linked
      ? "左键卖1个 · 右键卖全部"
      : "Esc / E 关闭";
    const subs = this.root.querySelectorAll(".panel-sub");
    const whLabel = subs[subs.length - 1];
    if (whLabel) {
      whLabel.textContent = linked
        ? "▸ 仓库（左键卖1 · 右键卖全部）"
        : "▸ 仓库（点格子取出）";
    }
  }

  setOpen(open: boolean): void {
    this.open = open;
    this.root.hidden = !open;
  }

  refresh(bag: Inventory, warehouse: Inventory): void {
    if (this.shopLinked) {
      this.meta.textContent = `仓库 ${warehouse.usedSlots()}/${warehouse.capacity}`;
      fillGrid(this.whGrid, warehouse, {
        onLeftSellOne: (id) => this.actions?.onSellOneOf?.(id),
        onRightSell: (id) => this.actions?.onSellAllOf?.(id),
      });
    } else {
      this.meta.textContent = `背包 ${bag.usedSlots()}/${bag.capacity} · 仓库 ${warehouse.usedSlots()}/${warehouse.capacity}`;
      fillGrid(this.bagGrid, bag, {
        onLeft: (i) => this.actions?.onBagSlot(i),
      });
      fillGrid(this.whGrid, warehouse, {
        onLeft: (i) => this.actions?.onWarehouseSlot(i),
      });
    }
  }
}

function fillGrid(
  grid: HTMLElement,
  inv: Inventory,
  opts: {
    onLeft?: (index: number) => void;
    onLeftSellOne?: (itemId: ItemId) => void;
    onRightSell?: (itemId: ItemId) => void;
  },
): void {
  grid.replaceChildren();
  inv.slots.forEach((slot, index) => {
    const cell = document.createElement("button");
    cell.type = "button";
    const interactive =
      opts.onLeft ||
      (opts.onLeftSellOne && slot) ||
      (opts.onRightSell && slot);
    cell.className = "inv-slot" + (interactive ? " clickable" : "");
    if (slot) {
      const def = getItem(slot.id);
      cell.style.borderColor = def.color;
      const iconFile = itemIcon(slot.id);
      if (iconFile) {
        const icon = document.createElement("img");
        icon.className = "inv-icon";
        icon.alt = def.name;
        icon.width = 24;
        icon.height = 24;
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

      if (opts.onRightSell) {
        cell.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          opts.onRightSell?.(slot.id);
        });
      }
      if (opts.onLeftSellOne) {
        cell.title = `左键卖1个 / 右键卖全部（${getSellPrice(slot.id)}金/个）`;
        cell.addEventListener("click", (e) => {
          e.preventDefault();
          opts.onLeftSellOne?.(slot.id);
        });
      } else if (opts.onLeft) {
        cell.addEventListener("click", () => opts.onLeft?.(index));
      } else {
        cell.addEventListener("click", (e) => e.preventDefault());
      }
    } else {
      cell.classList.add("empty");
      cell.disabled = true;
    }
    grid.appendChild(cell);
  });
}

function itemIcon(id: ItemId): string | null {
  if (id === "wood") return "item_wood.png";
  if (id === "raw_shrimp" || id === "cooked_shrimp") return "item_fish.png";
  return null;
}

function el(tag: string, cls: string, text: string): HTMLElement {
  const n = document.createElement(tag);
  n.className = cls;
  n.textContent = text;
  return n;
}
