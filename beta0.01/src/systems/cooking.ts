import type { Inventory } from "./inventory.ts";
import type { Skills } from "./skills.ts";
import type { Toast } from "./interaction.ts";
import { getItem } from "../data/items.ts";
import { SKILLS, skillDuration } from "../data/skills.ts";
import {
  RECIPES,
  type Recipe,
  type RecipeId,
} from "../data/recipes.ts";

const TOAST_TTL = 2.2;

export type CookingUpdateResult = {
  toasts: Toast[];
  /** 本帧是否刚结束整批任务 */
  finishedBatch: boolean;
};

/**
 * 烹饪：选定配方与份数 → 每份 cookSec 秒消耗 1 原料产出 1 成品 + 经验。
 * 可随时 stop；全部完成后自动停下。
 */
export class CookingSystem {
  cooking = false;
  recipeId: RecipeId | null = null;
  /** 本批还要完成的份数（含正在煮的这一份） */
  remaining = 0;
  /** 当前这一份进度 0～1 */
  progress = 0;
  /** 本批已完成份数 */
  completed = 0;

  get recipe(): Recipe | null {
    return this.recipeId ? RECIPES[this.recipeId] : null;
  }

  /** 是否在烹饪（冒泡 / 光照） */
  get active(): boolean {
    return this.cooking && this.remaining > 0;
  }

  start(
    recipeId: RecipeId,
    amount: number,
    inventory: Inventory,
  ): string | null {
    const recipe = RECIPES[recipeId];
    if (!recipe) return "未知配方";
    const n = Math.floor(amount);
    if (n <= 0) return "请选择至少 1 份";
    const have = inventory.countOf(recipe.inputId);
    if (have < n) {
      return `${getItem(recipe.inputId).name} 不足（有 ${have}，要 ${n}）`;
    }
    // 预检成品空间：至少能放 1 份（过程中再检）
    if (!inventory.canFit(recipe.outputId, 1)) {
      return "背包放不下成品";
    }

    this.cooking = true;
    this.recipeId = recipeId;
    this.remaining = n;
    this.progress = 0;
    this.completed = 0;
    return null;
  }

  stop(toasts?: Toast[], reason = "已停止烹饪"): void {
    if (!this.cooking && this.remaining <= 0) return;
    this.cooking = false;
    this.recipeId = null;
    this.remaining = 0;
    this.progress = 0;
    if (toasts) toasts.push({ text: reason, ttl: TOAST_TTL });
  }

  update(args: {
    dt: number;
    inventory: Inventory;
    skills: Skills;
  }): CookingUpdateResult {
    const { dt, inventory, skills } = args;
    const toasts: Toast[] = [];
    let finishedBatch = false;

    if (!this.cooking || !this.recipeId || this.remaining <= 0) {
      return { toasts, finishedBatch: false };
    }

    const recipe = RECIPES[this.recipeId];
    const dur = skillDuration(
      recipe.cookSec,
      skills.get(recipe.skillId).level,
    );
    this.progress += dt / dur;

    if (this.progress < 1) {
      return { toasts, finishedBatch: false };
    }

    this.progress = 0;

    // 完成 1 份：扣原料、加成品、加经验
    if (inventory.countOf(recipe.inputId) < 1) {
      this.stop(toasts, `${getItem(recipe.inputId).name} 不够了，烹饪中断`);
      return { toasts, finishedBatch: true };
    }
    if (!inventory.canFit(recipe.outputId, 1)) {
      this.stop(toasts, "背包满了，烹饪中断");
      return { toasts, finishedBatch: true };
    }

    inventory.remove(recipe.inputId, 1);
    inventory.add(recipe.outputId, 1);
    this.completed += 1;
    this.remaining -= 1;

    toasts.push({
      text: `+1 ${getItem(recipe.outputId).name}`,
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
      this.cooking = false;
      this.recipeId = null;
      this.progress = 0;
      this.completed = 0;
      finishedBatch = true;
      toasts.push({
        text: n > 1 ? `烹饪完成（共 ${n} 份）` : "烹饪完成",
        ttl: TOAST_TTL + 0.6,
      });
    }

    return { toasts, finishedBatch };
  }
}
