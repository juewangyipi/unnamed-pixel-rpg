import type { ChunkId } from "../world/chunk.ts";
import type { ItemId } from "../data/items.ts";
import type { SkillId } from "../data/skills.ts";
import {
  FISHING_LOOT,
  type FishingLootEntry,
} from "../data/fishing.ts";

export type InteractKind =
  | "tree"
  | "fish_spot"
  | "rune_node"
  | "copper_node";

/** hold：按住才推进；auto：点一下后自动持续采集 */
export type GatherMode = "hold" | "auto";

export type Interactable = {
  id: string;
  kind: InteractKind;
  chunkId: ChunkId;
  /** 块内像素坐标（左上角） */
  x: number;
  y: number;
  size: number;
  /** 耗尽后至该墙钟秒（Date.now()/1000）前不可采，便于离线重生 */
  depletedUntil: number;
  /** 当前这一下采集进度 0～1（满一次掉 1 份资源） */
  progress: number;
  /** 本周期已成功采集次数；达到 hitsToDeplete 后耗尽 */
  hits: number;
};

/** 主产物之外的额外掉落（每次成功采集独立判定） */
export type BonusDrop = {
  itemId: ItemId;
  amount: number;
  /** 0～1，例如 0.05 = 5% */
  chance: number;
};

/** 互斥掉落表项（概率之和应为 1） */
export type LootEntry = FishingLootEntry;

export type GatherProfile = {
  skillId: SkillId;
  /**
   * 固定主产物（无 lootTable 时使用）。
   * 有 lootTable 时作兜底/离线展示用。
   */
  itemId: ItemId;
  /** 每次完成获得数量（无 lootTable 时） */
  amount: number;
  /** 技能经验 */
  xp: number;
  /** 每一次采集所需秒数 */
  duration: number;
  /**
   * 需要成功几次才耗尽（树桩/矿点等）。
   * 0 = 永不耗尽（可一直采）
   */
  hitsToDeplete: number;
  /** 耗尽后重生秒数（永不耗尽时无意义） */
  respawn: number;
  mode: GatherMode;
  label: string;
  /** 可选：额外掉落表（独立掷骰，可多项） */
  bonusDrops?: BonusDrop[];
  /**
   * 可选：互斥主掉落表（如钓鱼）。
   * 有则每次成功采集按 chance 抽一项，替代固定 itemId。
   */
  lootTable?: LootEntry[];
};

export const GATHER: Record<InteractKind, GatherProfile> = {
  tree: {
    skillId: "woodcutting",
    itemId: "wood",
    amount: 1,
    xp: 5,
    duration: 3,
    /** 砍满次数后进入冷却 */
    hitsToDeplete: 15,
    respawn: 3,
    mode: "auto",
    label: "砍树",
    bonusDrops: [{ itemId: "apple", amount: 1, chance: 0.05 }],
  },
  fish_spot: {
    skillId: "fishing",
    itemId: "raw_shrimp",
    amount: 1,
    xp: 6,
    duration: 5,
    hitsToDeplete: 0,
    respawn: 0,
    mode: "auto",
    label: "钓鱼",
    lootTable: FISHING_LOOT,
  },
  /** 符文精华：2s 一次，10 次后冷却 10s */
  rune_node: {
    skillId: "mining",
    itemId: "rune_essence",
    amount: 1,
    xp: 5,
    duration: 2,
    hitsToDeplete: 10,
    respawn: 10,
    mode: "auto",
    label: "采符文",
  },
  /** 铜矿石：5s 一次，10 次后冷却 10s */
  copper_node: {
    skillId: "mining",
    itemId: "copper_ore",
    amount: 1,
    xp: 7,
    duration: 5,
    hitsToDeplete: 10,
    respawn: 10,
    mode: "auto",
    label: "采铜矿",
  },
};

export function isAvailable(it: Interactable, nowSec: number): boolean {
  // 永不耗尽类型忽略冷却时间（含旧档里残留的 depletedUntil）
  if (GATHER[it.kind].hitsToDeplete === 0) return true;
  return nowSec >= it.depletedUntil;
}

export function interactableCenter(it: Interactable): { x: number; y: number } {
  return { x: it.x + it.size / 2, y: it.y + it.size / 2 };
}
