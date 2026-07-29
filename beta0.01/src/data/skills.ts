/** 生活技能定义（beta0.01：砍树、钓鱼、生火、烹饪） */
export type SkillId = "woodcutting" | "fishing" | "firemaking" | "cooking";

export type SkillDef = {
  id: SkillId;
  name: string;
};

export const SKILLS: Record<SkillId, SkillDef> = {
  woodcutting: { id: "woodcutting", name: "砍树" },
  fishing: { id: "fishing", name: "钓鱼" },
  firemaking: { id: "firemaking", name: "生火" },
  cooking: { id: "cooking", name: "烹饪" },
};

/** 升到 nextLevel 所需经验（从当前 level 升到 level+1） */
export function xpToNextLevel(level: number): number {
  return 10 + (level - 1) * 8;
}

/** 每升 1 级，对应动作耗时减少的秒数 */
export const SKILL_SPEED_PER_LEVEL = 0.1;

/** 动作最短耗时（秒），防止减到 0 或负数 */
export const SKILL_DURATION_MIN = 0.2;

/**
 * 按技能等级计算实际耗时。
 * 1 级 = 基础时间；每升 1 级快 0.1s。
 * 例：基础 3s → Lv1=3.0，Lv2=2.9，Lv3=2.8 …
 */
export function skillDuration(baseSec: number, level: number): number {
  const lv = Math.max(1, Math.floor(level));
  return Math.max(
    SKILL_DURATION_MIN,
    baseSec - (lv - 1) * SKILL_SPEED_PER_LEVEL,
  );
}
