import type { Player } from "../entities/player.ts";
import {
  facilityCenter,
  type Facility,
} from "../entities/facility.ts";
import type { Inventory } from "./inventory.ts";
import type { Skills } from "./skills.ts";
import type { Toast } from "./interaction.ts";
import { getItem } from "../data/items.ts";
import { SKILLS } from "../data/skills.ts";
import { CONFIG } from "../core/config.ts";

/** 每烧一根木头所需秒数 */
export const CAMPFIRE_BURN_SEC = 3;
/** 离开后余烬秒数（不耗木头） */
export const CAMPFIRE_LINGER_SEC = 3;
/** 烧出煤炭概率 */
export const CAMPFIRE_COAL_CHANCE = 0.4;
/** 每次烧木头给的生火经验 */
export const CAMPFIRE_XP = 6;

const REACH = CONFIG.tileSize * 1.6;
const TOAST_TTL = 2.2;

export type CampfireUpdateResult = {
  toasts: Toast[];
  lit: boolean;
  /** 当前燃烧进度 0～1 */
  progress: number;
};

/**
 * 篝火：点 E 点燃 → 在附近每 3s 消耗 1 木头，40% 得煤炭 + 生火经验。
 * 离开后仍燃 3s 且不耗木；超时或没木头则熄灭。
 */
export class CampfireSystem {
  lit = false;
  progress = 0;
  /** 离开后的余烬剩余秒数；0 表示不在余烬阶段 */
  private lingerLeft = 0;

  extinguish(reasonToast?: string, toasts?: Toast[]): void {
    if (!this.lit && this.progress === 0 && this.lingerLeft <= 0) return;
    this.lit = false;
    this.progress = 0;
    this.lingerLeft = 0;
    if (reasonToast && toasts) {
      toasts.push({ text: reasonToast, ttl: TOAST_TTL });
    }
  }

  /**
   * 点按 E：
   * - 未燃 → 有木头则点燃
   * - 已燃（含余烬）→ 手动熄灭
   */
  tryToggle(inventory: Inventory, toasts: Toast[]): void {
    if (this.lit) {
      this.extinguish("你扑灭了篝火", toasts);
      return;
    }
    if (inventory.countOf("wood") <= 0) {
      toasts.push({ text: "需要木头才能生火", ttl: TOAST_TTL });
      return;
    }
    this.lit = true;
    this.progress = 0;
    this.lingerLeft = 0;
    toasts.push({ text: "点燃了篝火", ttl: TOAST_TTL });
  }

  update(args: {
    dt: number;
    player: Player;
    campfire: Facility | null;
    inventory: Inventory;
    skills: Skills;
    /** 当前是否在篝火范围内 */
    inRange: boolean;
  }): CampfireUpdateResult {
    const { dt, inventory, skills, inRange, campfire } = args;
    const toasts: Toast[] = [];

    if (!this.lit) {
      return { toasts, lit: false, progress: 0 };
    }

    const near = !!campfire && inRange;

    // —— 离开范围：余烬 3s，不耗木 ——
    if (!near) {
      if (this.lingerLeft <= 0) {
        this.lingerLeft = CAMPFIRE_LINGER_SEC;
      }
      this.lingerLeft -= dt;
      if (this.lingerLeft <= 0) {
        this.extinguish("离开篝火，火熄灭了", toasts);
        return { toasts, lit: false, progress: 0 };
      }
      // 进度条冻结，只维持火焰与光照
      return { toasts, lit: true, progress: this.progress };
    }

    // 回到附近：取消余烬，继续正常烧木
    this.lingerLeft = 0;

    if (inventory.countOf("wood") <= 0) {
      this.extinguish("没有木头了，火熄灭了", toasts);
      return { toasts, lit: false, progress: 0 };
    }

    this.progress += dt / CAMPFIRE_BURN_SEC;
    if (this.progress < 1) {
      return { toasts, lit: true, progress: this.progress };
    }

    this.progress = 0;

    const removed = inventory.remove("wood", 1);
    if (removed < 1) {
      this.extinguish("没有木头了，火熄灭了", toasts);
      return { toasts, lit: false, progress: 0 };
    }

    toasts.push({ text: "-1 木头", ttl: 1.6 });

    const ups = skills.addXp("firemaking", CAMPFIRE_XP);
    for (const u of ups) {
      toasts.push({
        text: `${SKILLS[u.skillId].name} 升到 ${u.level} 级！`,
        ttl: TOAST_TTL + 0.4,
      });
    }

    if (Math.random() < CAMPFIRE_COAL_CHANCE) {
      if (inventory.canFit("coal", 1)) {
        inventory.add("coal", 1);
        toasts.push({
          text: `+1 ${getItem("coal").name}`,
          ttl: TOAST_TTL,
        });
      } else {
        toasts.push({ text: "烧出了煤炭，但背包已满", ttl: TOAST_TTL });
      }
    }

    if (inventory.countOf("wood") <= 0) {
      this.extinguish("没有木头了，火熄灭了", toasts);
    }

    return {
      toasts,
      lit: this.lit,
      progress: this.progress,
    };
  }
}

export function isNearCampfire(player: Player, campfire: Facility): boolean {
  const pc = {
    x: player.x + player.size / 2,
    y: player.y + player.size / 2,
  };
  const c = facilityCenter(campfire);
  return Math.hypot(c.x - pc.x, c.y - pc.y) <= REACH;
}
