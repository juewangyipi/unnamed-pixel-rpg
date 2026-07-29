import type { ChunkId } from "../world/chunk.ts";
import type { ItemId } from "../data/items.ts";
import type { SkillId } from "../data/skills.ts";

export type InteractKind = "tree" | "fish_spot";

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
  /** 本周期已成功采集次数；达到 hitsToDeplete 后变树桩/耗尽 */
  hits: number;
};

export type GatherProfile = {
  skillId: SkillId;
  itemId: ItemId;
  /** 每次完成获得数量 */
  amount: number;
  /** 技能经验 */
  xp: number;
  /** 每一次采集所需秒数 */
  duration: number;
  /**
   * 需要成功几次才耗尽（树桩等）。
   * 0 = 永不耗尽（可一直采）
   */
  hitsToDeplete: number;
  /** 耗尽后重生秒数（永不耗尽时无意义） */
  respawn: number;
  mode: GatherMode;
  label: string;
};

export const GATHER: Record<InteractKind, GatherProfile> = {
  tree: {
    skillId: "woodcutting",
    itemId: "wood",
    amount: 1,
    xp: 5,
    duration: 3,
    hitsToDeplete: 10,
    respawn: 10,
    mode: "auto",
    label: "砍树",
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
  },
};

export function isAvailable(it: Interactable, nowSec: number): boolean {
  return nowSec >= it.depletedUntil;
}

export function interactableCenter(it: Interactable): { x: number; y: number } {
  return { x: it.x + it.size / 2, y: it.y + it.size / 2 };
}
