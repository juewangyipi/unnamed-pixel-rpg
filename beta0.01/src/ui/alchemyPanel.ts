import type { Inventory } from "../systems/inventory.ts";
import type { AlchemySystem } from "../systems/alchemy.ts";
import type { Skills } from "../systems/skills.ts";
import {
  ALCHEMY_RECIPE_LIST,
  type AlchemyRecipeId,
} from "../data/alchemyRecipes.ts";
import { getItem } from "../data/items.ts";
import { SKILLS, skillDuration } from "../data/skills.ts";

export type AlchemyPanelActions = {
  onStart: (recipeId: AlchemyRecipeId, amount: number) => void;
  onStop: () => void;
  onClose: () => void;
};

/** 制药台面板：选配方、份数、开始/停止 */
export class AlchemyPanel {
  private readonly root: HTMLElement;
  private readonly body: HTMLElement;
  private open = false;
  private actions: AlchemyPanelActions | null = null;
  private selected: AlchemyRecipeId = "bird_nest_potion";
  private amount = 1;

  constructor(host: HTMLElement) {
    this.root = document.createElement("div");
    this.root.id = "alchemy-panel";
    this.root.className = "side-panel pixel-frame";
    this.root.hidden = true;

    const title = document.createElement("div");
    title.className = "inv-title";
    title.textContent = "◆ 制药台 ◆";

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

  setActions(actions: AlchemyPanelActions): void {
    this.actions = actions;
  }

  setOpen(open: boolean): void {
    this.open = open;
    this.root.hidden = !open;
  }

  refresh(alchemy: AlchemySystem, inv: Inventory, skills: Skills): void {
    this.body.replaceChildren();

    const lv = skills.get("alchemy");
    this.body.appendChild(
      el("div", "panel-row strong", `${SKILLS.alchemy.name} Lv${lv.level}`),
    );

    if (alchemy.active) {
      const recipe = alchemy.recipe!;
      const pct = Math.floor(alchemy.progress * 100);
      this.body.appendChild(
        el(
          "div",
          "panel-muted",
          `制药中：${recipe.label}（${recipe.ingredients
            .map((i) => `${i.amount}${getItem(i.itemId).name}`)
            .join("+")}）`,
        ),
      );
      this.body.appendChild(
        el(
          "div",
          "panel-muted",
          `进度 ${pct}% · 剩余 ${alchemy.remaining} · 已完成 ${alchemy.completed}`,
        ),
      );
      const bar = document.createElement("div");
      bar.className = "cook-progress-track";
      const fill = document.createElement("div");
      fill.className = "cook-progress-fill";
      fill.style.width = `${Math.min(100, alchemy.progress * 100)}%`;
      bar.appendChild(fill);
      this.body.appendChild(bar);
      this.body.appendChild(btn("停止制药", () => this.actions?.onStop()));
      this.body.appendChild(
        btn("Esc 关闭", () => this.actions?.onClose(), "ghost"),
      );
      return;
    }

    this.body.appendChild(el("div", "panel-muted", "选择要制作的药水："));

    for (const recipe of ALCHEMY_RECIPE_LIST) {
      const maxByIng = maxCraftable(recipe, inv);
      const sec = skillDuration(
        recipe.craftSec,
        skills.get(recipe.skillId).level,
      );
      const ingText = recipe.ingredients
        .map(
          (i) =>
            `${i.amount}${getItem(i.itemId).name}(有${inv.countOf(i.itemId)})`,
        )
        .join(" + ");
      const row = document.createElement("button");
      row.type = "button";
      row.className =
        "panel-btn" + (this.selected === recipe.id ? " selected" : "");
      row.textContent = `${recipe.label}（${ingText} · ${sec.toFixed(1)}s · 最多 ${maxByIng}）`;
      row.addEventListener("click", () => {
        this.selected = recipe.id;
        this.amount = Math.min(Math.max(1, this.amount), Math.max(1, maxByIng));
        this.refresh(alchemy, inv, skills);
      });
      this.body.appendChild(row);
    }

    const recipe =
      ALCHEMY_RECIPE_LIST.find((r) => r.id === this.selected) ??
      ALCHEMY_RECIPE_LIST[0]!;
    const max = maxCraftable(recipe, inv);
    if (max <= 0) this.amount = 0;
    else {
      if (this.amount < 1) this.amount = 1;
      if (this.amount > max) this.amount = max;
    }
    const perSec = skillDuration(
      recipe.craftSec,
      skills.get(recipe.skillId).level,
    );

    const qtyBlock = document.createElement("div");
    qtyBlock.className = "cook-slider-block";
    const qtyLabel = document.createElement("div");
    qtyLabel.className = "cook-qty-label";
    const updateLabel = () => {
      if (max <= 0) qtyLabel.textContent = "数量 0（材料不足）";
      else {
        const total = (this.amount * perSec).toFixed(1);
        qtyLabel.textContent = `数量 ${this.amount} / ${max} · 约 ${total}s`;
      }
    };
    updateLabel();

    const slider = document.createElement("input");
    slider.type = "range";
    slider.className = "cook-slider";
    slider.min = max <= 0 ? "0" : "1";
    slider.max = String(Math.max(max, 0));
    slider.step = "1";
    slider.value = String(this.amount);
    slider.disabled = max <= 0;

    const startBtn = btn(
      max <= 0 ? "材料不足" : `开始制药（${this.amount} 瓶）`,
      () => this.actions?.onStart(this.selected, this.amount),
    );
    if (max <= 0) startBtn.disabled = true;

    slider.addEventListener("input", () => {
      this.amount = Number(slider.value) || 0;
      updateLabel();
      startBtn.textContent =
        max <= 0 ? "材料不足" : `开始制药（${this.amount} 瓶）`;
    });

    qtyBlock.append(qtyLabel, slider);
    this.body.appendChild(qtyBlock);
    this.body.appendChild(el("div", "panel-divider", ""));
    this.body.appendChild(startBtn);
    this.body.appendChild(
      btn("Esc 关闭", () => this.actions?.onClose(), "ghost"),
    );
  }
}

function maxCraftable(
  recipe: (typeof ALCHEMY_RECIPE_LIST)[number],
  inv: Inventory,
): number {
  let max = Infinity;
  for (const ing of recipe.ingredients) {
    max = Math.min(max, Math.floor(inv.countOf(ing.itemId) / ing.amount));
  }
  return Number.isFinite(max) ? Math.max(0, max) : 0;
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
