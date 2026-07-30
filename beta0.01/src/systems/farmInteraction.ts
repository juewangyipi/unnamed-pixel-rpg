import type { Facing, Player } from "../entities/player.ts";
import {
  clearPlot,
  farmPhase,
  farmPlotCenter,
  plantCrop,
  type FarmPlot,
} from "../entities/farmPlot.ts";
import { getCrop, type CropId } from "../data/crops.ts";
import { getItem } from "../data/items.ts";
import { SKILLS } from "../data/skills.ts";
import { CONFIG } from "../core/config.ts";
import type { Inventory } from "./inventory.ts";
import type { Skills } from "./skills.ts";
import type { Toast } from "./interaction.ts";

const REACH = CONFIG.tileSize * 1.35;
const TOAST_TTL = 2.2;

export type FarmInteractionResult = {
  toasts: Toast[];
  focus: FarmPlot | null;
  active: FarmPlot | null;
  /** 是否消耗了本次 E 按下（避免再触发别的交互） */
  consumedPress: boolean;
};

/**
 * 农田交互：
 * - 空地：E 由外部打开种植面板
 * - 生长中：E 提示剩余时间
 * - 成熟：E 开始自动砍伐，完成后收获并清空地块
 */
export class FarmInteraction {
  private activeId: string | null = null;
  private fullBagCooldown = 0;

  update(args: {
    dt: number;
    nowSec: number;
    player: Player;
    interactJustPressed: boolean;
    list: FarmPlot[];
    inventory: Inventory;
    skills: Skills;
    /** 面板已开时不推进砍伐 */
    panelOpen: boolean;
  }): FarmInteractionResult {
    const {
      dt,
      nowSec,
      player,
      interactJustPressed,
      list,
      inventory,
      skills,
      panelOpen,
    } = args;
    const toasts: Toast[] = [];
    this.fullBagCooldown = Math.max(0, this.fullBagCooldown - dt);
    let consumedPress = false;

    const focus = findFarmFocus(player, list);

    // 校验进行中的目标
    if (this.activeId) {
      const active = list.find((p) => p.id === this.activeId) ?? null;
      if (
        !active ||
        panelOpen ||
        farmPhase(active, nowSec) !== "mature" ||
        !isInReachAndFacing(player, active)
      ) {
        if (active) active.harvestProgress = 0;
        this.activeId = null;
      }
    }

    if (interactJustPressed && !panelOpen) {
      if (this.activeId) {
        // 砍伐中再按 E：停止
        const active = list.find((p) => p.id === this.activeId);
        if (active) active.harvestProgress = 0;
        this.activeId = null;
        consumedPress = true;
      } else if (focus) {
        const phase = farmPhase(focus, nowSec);
        if (phase === "growing") {
          const left = Math.ceil(Math.max(0, focus.readyWallSec - nowSec));
          const name = focus.cropId ? getCrop(focus.cropId).name : "作物";
          toasts.push({
            text: `${name}生长中 · 约 ${left}s 成熟`,
            ttl: TOAST_TTL,
          });
          consumedPress = true;
        } else if (phase === "mature") {
          this.activeId = focus.id;
          focus.harvestProgress = 0;
          consumedPress = true;
        }
        // empty：不在此消费，交给外部开面板
      }
    }

    // 推进砍伐
    if (this.activeId && !panelOpen) {
      const active = list.find((p) => p.id === this.activeId) ?? null;
      if (active && farmPhase(active, nowSec) === "mature" && active.cropId) {
        const crop = getCrop(active.cropId);
        if (!inventory.canFit(crop.harvestItemId, crop.harvestAmount)) {
          if (this.fullBagCooldown <= 0) {
            toasts.push({ text: "背包已满", ttl: TOAST_TTL });
            this.fullBagCooldown = 1.2;
          }
        } else {
          active.harvestProgress += dt / crop.harvestDuration;
          if (active.harvestProgress >= 1) {
            active.harvestProgress = 0;
            const err = inventory.add(crop.harvestItemId, crop.harvestAmount);
            if (err) {
              toasts.push({ text: err, ttl: TOAST_TTL });
            } else {
              const item = getItem(crop.harvestItemId);
              toasts.push({
                text: `+${crop.harvestAmount} ${item.name}`,
                ttl: TOAST_TTL,
              });
              const ups = skills.addXp(crop.skillId, crop.harvestXp);
              for (const u of ups) {
                toasts.push({
                  text: `${SKILLS[u.skillId].name} 升到 ${u.level} 级！`,
                  ttl: TOAST_TTL + 0.4,
                });
              }
              clearPlot(active);
              this.activeId = null;
            }
          }
        }
      }
    }

    const active =
      (this.activeId && list.find((p) => p.id === this.activeId)) || null;

    return {
      toasts,
      focus,
      active,
      consumedPress,
    };
  }

  /** 在指定地块种植；失败返回错误文案 */
  tryPlant(
    plot: FarmPlot,
    cropId: CropId,
    nowSec: number,
    inventory: Inventory,
  ): string | null {
    if (farmPhase(plot, nowSec) !== "empty") {
      return "这块地已经种了东西";
    }
    const crop = getCrop(cropId);
    if (inventory.countOf(crop.seedItemId) < crop.seedCost) {
      return `需要 ${crop.seedCost} 个${getItem(crop.seedItemId).name}`;
    }
    const removed = inventory.remove(crop.seedItemId, crop.seedCost);
    if (removed < crop.seedCost) {
      return `需要 ${crop.seedCost} 个${getItem(crop.seedItemId).name}`;
    }
    plantCrop(plot, cropId, nowSec);
    return null;
  }

  clearActive(): void {
    this.activeId = null;
  }
}

export function findFarmFocus(
  player: Player,
  list: FarmPlot[],
): FarmPlot | null {
  let best: FarmPlot | null = null;
  let bestDist = Infinity;
  const pc = playerCenter(player);

  for (const plot of list) {
    if (!isInReachAndFacing(player, plot)) continue;
    const c = farmPlotCenter(plot);
    const d = Math.hypot(c.x - pc.x, c.y - pc.y);
    if (d < bestDist) {
      bestDist = d;
      best = plot;
    }
  }
  return best;
}

function playerCenter(player: Player): { x: number; y: number } {
  return { x: player.x + player.size / 2, y: player.y + player.size / 2 };
}

function isInReachAndFacing(player: Player, plot: FarmPlot): boolean {
  const pc = playerCenter(player);
  const c = farmPlotCenter(plot);
  const dx = c.x - pc.x;
  const dy = c.y - pc.y;
  const dist = Math.hypot(dx, dy);
  if (dist > REACH) return false;
  if (dist < CONFIG.tileSize * 0.55) return true;

  const f = facingVec(player.facing);
  const inv = dist || 1;
  const dot = (dx / inv) * f.x + (dy / inv) * f.y;
  return dot >= 0.25;
}

function facingVec(f: Facing): { x: number; y: number } {
  switch (f) {
    case "up":
      return { x: 0, y: -1 };
    case "down":
      return { x: 0, y: 1 };
    case "left":
      return { x: -1, y: 0 };
    case "right":
      return { x: 1, y: 0 };
  }
}
