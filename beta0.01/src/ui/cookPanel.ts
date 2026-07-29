import type { Inventory } from "../systems/inventory.ts";
import type { CookingSystem } from "../systems/cooking.ts";
import type { Skills } from "../systems/skills.ts";
import { RECIPE_LIST, type RecipeId } from "../data/recipes.ts";
import { getItem } from "../data/items.ts";
import { SKILLS, skillDuration } from "../data/skills.ts";

export type CookPanelActions = {
  onStart: (recipeId: RecipeId, amount: number) => void;
  onStop: () => void;
  onClose: () => void;
};

/**
 * 烹饪锅面板：选配方、选数量、开始/停止。
 */
export class CookPanel {
  private readonly root: HTMLElement;
  private readonly body: HTMLElement;
  private open = false;
  private actions: CookPanelActions | null = null;
  private selected: RecipeId = "cooked_shrimp";
  private amount = 1;

  constructor(host: HTMLElement) {
    this.root = document.createElement("div");
    this.root.id = "cook-panel";
    this.root.className = "side-panel pixel-frame";
    this.root.hidden = true;

    const title = document.createElement("div");
    title.className = "inv-title";
    title.textContent = "◆ 烹饪锅 ◆";

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

  setActions(actions: CookPanelActions): void {
    this.actions = actions;
  }

  setOpen(open: boolean): void {
    this.open = open;
    this.root.hidden = !open;
  }

  refresh(cook: CookingSystem, inv: Inventory, skills: Skills): void {
    this.body.replaceChildren();

    const cookLv = skills.get("cooking");
    this.body.appendChild(
      el(
        "div",
        "panel-row strong",
        `${SKILLS.cooking.name} Lv${cookLv.level}`,
      ),
    );

    if (cook.active) {
      const recipe = cook.recipe!;
      const pct = Math.floor(cook.progress * 100);
      this.body.appendChild(
        el(
          "div",
          "panel-muted",
          `烹饪中：${getItem(recipe.inputId).name} → ${getItem(recipe.outputId).name}`,
        ),
      );
      this.body.appendChild(
        el(
          "div",
          "panel-muted",
          `当前进度 ${pct}% · 剩余 ${cook.remaining} 份 · 已完成 ${cook.completed}`,
        ),
      );
      const bar = document.createElement("div");
      bar.className = "cook-progress-track";
      const fill = document.createElement("div");
      fill.className = "cook-progress-fill";
      fill.style.width = `${Math.min(100, cook.progress * 100)}%`;
      bar.appendChild(fill);
      this.body.appendChild(bar);

      this.body.appendChild(
        btn("停止烹饪", () => this.actions?.onStop()),
      );
      this.body.appendChild(
        btn("Esc 关闭", () => this.actions?.onClose(), "ghost"),
      );
      return;
    }

    this.body.appendChild(el("div", "panel-muted", "选择要烹饪的东西："));

    for (const recipe of RECIPE_LIST) {
      const have = inv.countOf(recipe.inputId);
      const sec = skillDuration(
        recipe.cookSec,
        skills.get(recipe.skillId).level,
      );
      const row = document.createElement("button");
      row.type = "button";
      row.className =
        "panel-btn" + (this.selected === recipe.id ? " selected" : "");
      row.textContent = `${getItem(recipe.inputId).name} → ${getItem(recipe.outputId).name}（有 ${have} · ${sec.toFixed(1)}s/份）`;
      row.addEventListener("click", () => {
        this.selected = recipe.id;
        const max = Math.max(1, inv.countOf(recipe.inputId));
        this.amount = Math.min(this.amount, max);
        if (have > 0 && this.amount < 1) this.amount = 1;
        this.refresh(cook, inv, skills);
      });
      this.body.appendChild(row);
    }

    const recipe = RECIPE_LIST.find((r) => r.id === this.selected) ?? RECIPE_LIST[0]!;
    const max = inv.countOf(recipe.inputId);
    if (max <= 0) this.amount = 0;
    else {
      if (this.amount < 1) this.amount = 1;
      if (this.amount > max) this.amount = max;
    }
    const perSec = skillDuration(
      recipe.cookSec,
      skills.get(recipe.skillId).level,
    );

    // 拖动滑条选择份数
    const qtyBlock = document.createElement("div");
    qtyBlock.className = "cook-slider-block";

    const qtyLabel = document.createElement("div");
    qtyLabel.className = "cook-qty-label";
    const updateLabel = () => {
      if (max <= 0) {
        qtyLabel.textContent = "数量 0（材料不足）";
      } else {
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
    slider.setAttribute("aria-label", "烹饪份数");

    const startBtn = btn(
      max <= 0
        ? "材料不足"
        : `开始烹饪（${this.amount} 份）`,
      () => this.actions?.onStart(this.selected, this.amount),
    );
    if (max <= 0) startBtn.disabled = true;

    slider.addEventListener("input", () => {
      this.amount = Number(slider.value) || 0;
      updateLabel();
      startBtn.textContent =
        max <= 0
          ? "材料不足"
          : `开始烹饪（${this.amount} 份）`;
    });

    // 刻度：1 … max
    const ticks = document.createElement("div");
    ticks.className = "cook-slider-ticks";
    if (max > 0) {
      ticks.append(
        el("span", "", "1"),
        el("span", "", String(max)),
      );
    }

    qtyBlock.append(qtyLabel, slider, ticks);
    this.body.appendChild(qtyBlock);

    this.body.appendChild(el("div", "panel-divider", ""));
    this.body.appendChild(startBtn);

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
  b.addEventListener("click", onClick);
  return b;
}
