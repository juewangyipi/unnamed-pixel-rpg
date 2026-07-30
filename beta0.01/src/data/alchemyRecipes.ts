/**
 * 制药配方（参考：鸟巢药水 = 2 羽毛 + 1 盖鲁姆草，10s）
 */
import type { ItemId } from "./items.ts";
import type { SkillId } from "./skills.ts";

export type AlchemyRecipeId = "bird_nest_potion";

export type AlchemyIngredient = {
  itemId: ItemId;
  amount: number;
};

export type AlchemyRecipe = {
  id: AlchemyRecipeId;
  label: string;
  ingredients: AlchemyIngredient[];
  outputId: ItemId;
  outputAmount: number;
  /** 制作 1 份秒数 */
  craftSec: number;
  xp: number;
  skillId: SkillId;
};

export const ALCHEMY_RECIPES: Record<AlchemyRecipeId, AlchemyRecipe> = {
  bird_nest_potion: {
    id: "bird_nest_potion",
    label: "鸟巢药水",
    ingredients: [
      { itemId: "feather", amount: 2 },
      { itemId: "galum_grass", amount: 1 },
    ],
    outputId: "bird_nest_potion",
    outputAmount: 1,
    craftSec: 10,
    xp: 8,
    skillId: "alchemy",
  },
};

export const ALCHEMY_RECIPE_LIST: AlchemyRecipe[] = Object.values(
  ALCHEMY_RECIPES,
);
