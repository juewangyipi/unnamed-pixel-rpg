import type { Inventory } from "./inventory.ts";
import type { Skills } from "./skills.ts";
import type { Toast } from "./interaction.ts";
import { getItem } from "../data/items.ts";
import { SKILLS, skillDuration } from "../data/skills.ts";
import {
  ALCHEMY_RECIPES,
  type AlchemyRecipe,
  type AlchemyRecipeId,
} from "../data/alchemyRecipes.ts";

const TOAST_TTL = 2.2;

export type AlchemyUpdateResult = {
  toasts: Toast[];
  finishedBatch: boolean;
};

/**
 * 制药：多材料配方 → craftSec 秒出 1 瓶 + 经验。
 * 可随时 stop；全部完成后自动停下。
 */
export class AlchemySystem {
  crafting = false;
  recipeId: AlchemyRecipeId | null = null;
  remaining = 0;
  progress = 0;
  completed = 0;

  get recipe(): AlchemyRecipe | null {
    return this.recipeId ? ALCHEMY_RECIPES[this.recipeId] : null;
  }

  get active(): boolean {
    return this.crafting && this.remaining > 0;
  }

  start(
    recipeId: AlchemyRecipeId,
    amount: number,
    inventory: Inventory,
  ): string | null {
    const recipe = ALCHEMY_RECIPES[recipeId];
    if (!recipe) return "未知配方";
    const n = Math.floor(amount);
    if (n <= 0) return "请选择至少 1 份";

    for (const ing of recipe.ingredients) {
      const need = ing.amount * n;
      const have = inventory.countOf(ing.itemId);
      if (have < need) {
        return `${getItem(ing.itemId).name} 不足（有 ${have}，要 ${need}）`;
      }
    }
    if (!inventory.canFit(recipe.outputId, recipe.outputAmount)) {
      return "背包放不下成品";
    }

    this.crafting = true;
    this.recipeId = recipeId;
    this.remaining = n;
    this.progress = 0;
    this.completed = 0;
    return null;
  }

  stop(toasts?: Toast[], reason = "已停止制药"): void {
    if (!this.crafting && this.remaining <= 0) return;
    this.crafting = false;
    this.recipeId = null;
    this.remaining = 0;
    this.progress = 0;
    if (toasts) toasts.push({ text: reason, ttl: TOAST_TTL });
  }

  update(args: {
    dt: number;
    inventory: Inventory;
    skills: Skills;
  }): AlchemyUpdateResult {
    const { dt, inventory, skills } = args;
    const toasts: Toast[] = [];
    let finishedBatch = false;

    if (!this.crafting || !this.recipeId || this.remaining <= 0) {
      return { toasts, finishedBatch: false };
    }

    const recipe = ALCHEMY_RECIPES[this.recipeId];
    const dur = skillDuration(
      recipe.craftSec,
      skills.get(recipe.skillId).level,
    );
    this.progress += dt / dur;
    if (this.progress < 1) {
      return { toasts, finishedBatch: false };
    }

    this.progress = 0;

    for (const ing of recipe.ingredients) {
      if (inventory.countOf(ing.itemId) < ing.amount) {
        this.stop(
          toasts,
          `${getItem(ing.itemId).name} 不够了，制药中断`,
        );
        return { toasts, finishedBatch: true };
      }
    }
    if (!inventory.canFit(recipe.outputId, recipe.outputAmount)) {
      this.stop(toasts, "背包满了，制药中断");
      return { toasts, finishedBatch: true };
    }

    for (const ing of recipe.ingredients) {
      inventory.remove(ing.itemId, ing.amount);
    }
    inventory.add(recipe.outputId, recipe.outputAmount);
    this.completed += 1;
    this.remaining -= 1;

    toasts.push({
      text: `+${recipe.outputAmount} ${getItem(recipe.outputId).name}`,
      ttl: TOAST_TTL,
    });

    const ups = skills.addXp(recipe.skillId, recipe.xp);
    for (const u of ups) {
      toasts.push({
        text: `${SKILLS[u.skillId].name} 升到 ${u.level} 级！`,
        ttl: TOAST_TTL + 0.4,
      });
    }

    if (this.remaining <= 0) {
      const n = this.completed;
      this.crafting = false;
      this.recipeId = null;
      this.progress = 0;
      this.completed = 0;
      finishedBatch = true;
      toasts.push({
        text: n > 1 ? `制药完成（共 ${n} 瓶）` : "制药完成",
        ttl: TOAST_TTL + 0.6,
      });
    }

    return { toasts, finishedBatch };
  }
}
