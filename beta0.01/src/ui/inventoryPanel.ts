import type { Inventory } from "../systems/inventory.ts";
import { getItem } from "../data/items.ts";

/**
 * DOM 背包面板：开关由 Game 控制，只展示数据不改逻辑。
 */
export class InventoryPanel {
  private readonly root: HTMLElement;
  private readonly grid: HTMLElement;
  private readonly meta: HTMLElement;
  private open = false;

  constructor(host: HTMLElement) {
    this.root = document.createElement("div");
    this.root.id = "inventory-panel";
    this.root.hidden = true;

    const title = document.createElement("div");
    title.className = "inv-title";
    title.textContent = "背包";

    this.meta = document.createElement("div");
    this.meta.className = "inv-meta";

    this.grid = document.createElement("div");
    this.grid.className = "inv-grid";

    const hint = document.createElement("div");
    hint.className = "inv-hint";
    hint.textContent = "B / I 关闭";

    this.root.append(title, this.meta, this.grid, hint);
    host.appendChild(this.root);
  }

  get isOpen(): boolean {
    return this.open;
  }

  toggle(): void {
    this.open = !this.open;
    this.root.hidden = !this.open;
  }

  setOpen(open: boolean): void {
    this.open = open;
    this.root.hidden = !open;
  }

  refresh(inv: Inventory): void {
    this.meta.textContent = `${inv.usedSlots()} / ${inv.capacity} 格`;
    this.grid.replaceChildren();

    for (const slot of inv.slots) {
      const cell = document.createElement("div");
      cell.className = "inv-slot";
      if (slot) {
        const def = getItem(slot.id);
        cell.style.borderColor = def.color;
        const iconFile =
          slot.id === "wood"
            ? "item_wood.png"
            : slot.id === "raw_shrimp"
              ? "item_fish.png"
              : null;
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
      } else {
        cell.classList.add("empty");
      }
      this.grid.appendChild(cell);
    }
  }
}
