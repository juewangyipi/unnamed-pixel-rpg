import type { ItemId } from "./items.ts";
import type { SkillId } from "./skills.ts";

export type RecipeId = "cooked_shrimp" | "cooked_chicken";

export type Recipe = {
  id: RecipeId;
  /** 面板显示名 */
  label: string;
  inputId: ItemId;
  outputId: ItemId;
  /** 每份烹饪秒数 */
  cookSec: number;
  /** 每完成 1 份给的技能经验 */
  xp: number;
  skillId: SkillId;
};

/** 可烹饪配方 */
export const RECIPES: Record<RecipeId, Recipe> = {
  cooked_shrimp: {
    id: "cooked_shrimp",
    label: "熟虾",
    inputId: "raw_shrimp",
    outputId: "cooked_shrimp",
    cookSec: 5,
    xp: 6,
    skillId: "cooking",
  },
  cooked_chicken: {
    id: "cooked_chicken",
    label: "熟鸡肉",
    inputId: "raw_chicken",
    outputId: "cooked_chicken",
    cookSec: 5,
    xp: 7,
    skillId: "cooking",
  },
};

export const RECIPE_LIST: Recipe[] = Object.values(RECIPES);
