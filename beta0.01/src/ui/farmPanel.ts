import type { Inventory } from "../systems/inventory.ts";
import type { FarmPlot } from "../entities/farmPlot.ts";
import { farmPhase, growRemainingSec } from "../entities/farmPlot.ts";
import { CROP_LIST, type CropId } from "../data/crops.ts";
import { getItem } from "../data/items.ts";

export type FarmPanelActions = {
  onPlant: (cropId: CropId) => void;
  onClose: () => void;
};

/**
 * 农田种植面板：选作物并种植到当前地块。
 */
export class FarmPanel {
  private readonly root: HTMLElement;
  private readonly body: HTMLElement;
  private open = false;
  private actions: FarmPanelActions | null = null;
  private plot: FarmPlot | null = null;
  private selected: CropId = "apple";

  constructor(host: HTMLElement) {
    this.root = document.createElement("div");
    this.root.id = "farm-panel";
    this.root.className = "side-panel pixel-frame";
    this.root.hidden = true;

    const title = document.createElement("div");
    title.className = "inv-title";
    title.textContent = "◆ 农田 ◆";

    this.body = document.createElement("div");
    this.body.className = "panel-body";

    const hint = document.createElement("div");
    hint.className = "inv-hint";
    hint.textContent = "Esc 关闭 · E 关闭";

    this.root.append(title, this.body, hint);
    host.appendChild(this.root);
  }

  get isOpen(): boolean {
    return this.open;
  }

  get targetPlot(): FarmPlot | null {
    return this.plot;
  }

  setActions(actions: FarmPanelActions): void {
    this.actions = actions;
  }

  setOpen(open: boolean): void {
    this.open = open;
    this.root.hidden = !open;
    if (!open) this.plot = null;
  }

  openFor(plot: FarmPlot, inv: Inventory, nowSec: number): void {
    this.plot = plot;
    this.setOpen(true);
    this.refresh(inv, nowSec);
  }

  refresh(inv: Inventory, nowSec: number): void {
    this.body.replaceChildren();
    const plot = this.plot;
    if (!plot) {
      this.body.appendChild(el("div", "panel-muted", "没有选中的农田"));
      return;
    }

    const phase = farmPhase(plot, nowSec);
    if (phase !== "empty") {
      if (phase === "growing") {
        const left = Math.ceil(growRemainingSec(plot, nowSec));
        this.body.appendChild(
          el("div", "panel-row strong", "作物生长中"),
        );
        this.body.appendChild(
          el("div", "panel-muted", `约 ${left} 秒后成熟`),
        );
      } else {
        this.body.appendChild(
          el("div", "panel-row strong", "已成熟 · 靠近按 E 砍伐"),
        );
      }
      this.body.appendChild(
        btn("关闭", () => this.actions?.onClose(), "ghost"),
      );
      return;
    }

    this.body.appendChild(el("div", "panel-muted", "选择要种的东西："));

    for (const crop of CROP_LIST) {
      const have = inv.countOf(crop.seedItemId);
      const seedName = getItem(crop.seedItemId).name;
      const row = document.createElement("button");
      row.type = "button";
      row.className =
        "panel-btn" + (this.selected === crop.id ? " selected" : "");
      row.textContent = `${crop.plantLabel}（消耗 ${crop.seedCost} ${seedName} · 有 ${have} · ${crop.growSec}s 成熟）`;
      row.addEventListener("click", () => {
        this.selected = crop.id;
        this.refresh(inv, nowSec);
      });
      this.body.appendChild(row);
    }

    const crop = CROP_LIST.find((c) => c.id === this.selected) ?? CROP_LIST[0]!;
    const have = inv.countOf(crop.seedItemId);
    const canPlant = have >= crop.seedCost;

    this.body.appendChild(el("div", "panel-divider", ""));
    this.body.appendChild(
      el(
        "div",
        "panel-muted",
        `成熟后砍伐可得 ${crop.harvestAmount} 个${getItem(crop.harvestItemId).name}`,
      ),
    );

    const plantBtn = btn(
      canPlant ? `种植 ${crop.name}` : "种子不足",
      () => this.actions?.onPlant(this.selected),
    );
    if (!canPlant) plantBtn.disabled = true;
    this.body.appendChild(plantBtn);

    this.body.appendChild(
      btn("Esc 关闭", () => this.actions?.onClose(), "ghost"),
    );
  }
}

function el(tag: string, cls: string, text: string): HTMLElement {
  const n = document.createElement(tag);
  n.className = cls;
  n.textContent = text;
  return n;
}

function btn(
  label: string,
  onClick: () => void,
  variant: "normal" | "ghost" = "normal",
): HTMLButtonElement {
  const b = document.createElement("button");
  b.type = "button";
  b.className = variant === "ghost" ? "panel-btn ghost" : "panel-btn";
  b.textContent = label;
  b.addEventListener("click", () => onClick());
  return b;
}
