import type { Facing, Player } from "../entities/player.ts";
import {
  GATHER,
  interactableCenter,
  isAvailable,
  type BonusDrop,
  type Interactable,
  type InteractKind,
} from "../entities/interactable.ts";
import type { Inventory } from "./inventory.ts";
import type { Skills } from "./skills.ts";
import { getItem, type ItemId } from "../data/items.ts";
import { rollFishingLoot } from "../data/fishing.ts";
import { SKILLS, skillDuration } from "../data/skills.ts";
import { CONFIG } from "../core/config.ts";

export type Toast = {
  text: string;
  ttl: number;
};

export type InteractionResult = {
  toasts: Toast[];
  active: Interactable | null;
  focus: Interactable | null;
  /** 最近一次成功采集类型（离线补进度用） */
  lastGatherKind: InteractKind | null;
};

const REACH = CONFIG.tileSize * 1.35;
const TOAST_TTL = 2.2;

/**
 * 采集：
 * - tree（auto）：点一下 E 开始，自动每 duration 秒掉 1 份，满 hitsToDeplete 次耗尽；
 *   冷却期间若人还在附近则保持锁定，树长回后自动继续砍
 * - fish（auto）：点一下持续钓，每 duration 秒掉 1 份；hitsToDeplete=0 永不冷却
 * depletedUntil 使用墙钟秒 Date.now()/1000，便于离线重生。
 */
export class InteractionSystem {
  private activeId: string | null = null;
  private fullBagCooldown = 0;
  lastGatherKind: InteractKind | null = null;

  update(args: {
    dt: number;
    nowSec: number;
    player: Player;
    interactHeld: boolean;
    interactJustPressed: boolean;
    list: Interactable[];
    inventory: Inventory;
    skills: Skills;
    /** 药水等临时附加掉落（如鸟巢药水 → 砍树 5% 鸟巢） */
    extraBonusDrops?: BonusDrop[];
    /** 成功砍树 1 次后回调（扣药水次数等） */
    onTreeChopped?: (toasts: Toast[]) => void;
  }): InteractionResult {
    const {
      dt,
      nowSec,
      player,
      interactHeld,
      interactJustPressed,
      list,
      inventory,
      skills,
      extraBonusDrops,
      onTreeChopped,
    } = args;
    const toasts: Toast[] = [];
    this.fullBagCooldown = Math.max(0, this.fullBagCooldown - dt);
    let gathered: InteractKind | null = null;

    const focus = findFocus(player, list, nowSec);

    // 校验当前进行中的目标是否仍有效
    if (this.activeId) {
      const active = list.find((i) => i.id === this.activeId) ?? null;
      if (!active || !isInReachAndFacing(player, active)) {
        if (active) active.progress = 0;
        this.activeId = null;
      } else if (!isAvailable(active, nowSec)) {
        // auto：冷却中仍锁定目标，长回后继续；hold：耗尽即停
        active.progress = 0;
        if (GATHER[active.kind].mode === "hold") {
          this.activeId = null;
        }
      }
    }

    // 点按：auto 开/关；冷却等待中也可 E 停止；另一棵树则切换
    if (interactJustPressed) {
      if (this.activeId) {
        const active = list.find((i) => i.id === this.activeId) ?? null;
        if (
          focus &&
          focus.id !== this.activeId &&
          GATHER[focus.kind].mode === "auto"
        ) {
          if (active) active.progress = 0;
          this.activeId = focus.id;
          focus.progress = 0;
        } else {
          if (active) active.progress = 0;
          this.activeId = null;
        }
      } else if (focus && GATHER[focus.kind].mode === "auto") {
        this.activeId = focus.id;
        focus.progress = 0;
      }
    }

    // hold 模式：按住时锁定目标；松开取消
    if (focus && GATHER[focus.kind].mode === "hold") {
      if (interactHeld) {
        this.activeId = focus.id;
      } else if (this.activeId === focus.id) {
        focus.progress = 0;
        this.activeId = null;
      }
    } else if (this.activeId) {
      const active = list.find((i) => i.id === this.activeId);
      if (active && GATHER[active.kind].mode === "hold" && !interactHeld) {
        active.progress = 0;
        this.activeId = null;
      }
    }

    // 推进采集进度（auto 冷却中不推进，树长回后自动接着砍）
    if (this.activeId) {
      const active = list.find((i) => i.id === this.activeId) ?? null;
      if (active && isAvailable(active, nowSec)) {
        const profile = GATHER[active.kind];
        const canAdvance =
          profile.mode === "auto" ||
          (profile.mode === "hold" && interactHeld);

        if (canAdvance) {
          if (!canFitGatherDrop(profile, inventory)) {
            if (this.fullBagCooldown <= 0) {
              toasts.push({ text: "背包已满", ttl: TOAST_TTL });
              this.fullBagCooldown = 1.2;
            }
            // 背包满时暂停进度，auto 仍保持进行中以便腾出空位后继续
          } else {
            const dur = skillDuration(
              profile.duration,
              skills.get(profile.skillId).level,
            );
            active.progress += dt / dur;
            if (active.progress >= 1) {
              active.progress = 0;
              active.hits += 1;

              const drop = resolveGatherDrop(profile);
              const err = inventory.add(drop.itemId, drop.amount);
              if (err) {
                toasts.push({ text: err, ttl: TOAST_TTL });
              } else {
                const item = getItem(drop.itemId);
                const rare =
                  drop.itemId === "treasure_chest"
                    ? "★ "
                    : drop.itemId === "crayfish"
                      ? "！ "
                      : "";
                toasts.push({
                  text: `${rare}+${drop.amount} ${item.name}`,
                  ttl: TOAST_TTL + (rare ? 0.8 : 0),
                });
                const bonusList: BonusDrop[] = [
                  ...(profile.bonusDrops ?? []),
                  ...(active.kind === "tree" ? (extraBonusDrops ?? []) : []),
                ];
                applyBonusDrops(bonusList, inventory, toasts, () => {
                  if (this.fullBagCooldown <= 0) {
                    this.fullBagCooldown = 1.2;
                    return true;
                  }
                  return false;
                });
                if (active.kind === "tree") {
                  onTreeChopped?.(toasts);
                }
                const ups = skills.addXp(profile.skillId, profile.xp);
                for (const u of ups) {
                  toasts.push({
                    text: `${SKILLS[u.skillId].name} 升到 ${u.level} 级！`,
                    ttl: TOAST_TTL + 0.4,
                  });
                }
                this.lastGatherKind = active.kind;
                gathered = active.kind;
              }

              // hitsToDeplete === 0：永不耗尽，直接进入下一次
              if (
                profile.hitsToDeplete > 0 &&
                active.hits >= profile.hitsToDeplete
              ) {
                active.hits = 0;
                active.progress = 0;
                active.depletedUntil = nowSec + profile.respawn;
                // auto 保持锁定，冷却结束后继续；hold 停掉
                if (profile.mode === "hold") {
                  this.activeId = null;
                }
              }
            }
          }
        }
      }
    }

    const active =
      (this.activeId && list.find((i) => i.id === this.activeId)) || null;

    return {
      toasts,
      active,
      focus,
      lastGatherKind: gathered ?? this.lastGatherKind,
    };
  }
}

/** 有 lootTable 时互斥抽奖，否则固定主产物 */
export function resolveGatherDrop(profile: (typeof GATHER)[InteractKind]): {
  itemId: ItemId;
  amount: number;
} {
  if (profile.lootTable?.length) {
    // 钓鱼表走专用掷骰（便于以后换算法）；其它表共用累加逻辑
    if (profile.lootTable === GATHER.fish_spot.lootTable) {
      return (
        rollFishingLoot(profile.lootTable) ?? {
          itemId: profile.itemId,
          amount: profile.amount,
        }
      );
    }
    return rollLootTable(profile.lootTable) ?? {
      itemId: profile.itemId,
      amount: profile.amount,
    };
  }
  return { itemId: profile.itemId, amount: profile.amount };
}

function rollLootTable(
  table: readonly { itemId: ItemId; amount: number; chance: number }[],
): { itemId: ItemId; amount: number } | null {
  if (!table.length) return null;
  const r = Math.random();
  let acc = 0;
  for (const entry of table) {
    acc += entry.chance;
    if (r < acc) return { itemId: entry.itemId, amount: entry.amount };
  }
  const last = table[table.length - 1]!;
  return { itemId: last.itemId, amount: last.amount };
}

/** lootTable：须装得下表内每一项，避免掷中无法入包 */
function canFitGatherDrop(
  profile: (typeof GATHER)[InteractKind],
  inventory: Inventory,
): boolean {
  if (profile.lootTable?.length) {
    return profile.lootTable.every((e) =>
      inventory.canFit(e.itemId, e.amount),
    );
  }
  return inventory.canFit(profile.itemId, profile.amount);
}

/** 按列表独立掷骰额外掉落；背包满时最多提示一次。 */
function applyBonusDrops(
  bonuses: BonusDrop[],
  inventory: Inventory,
  toasts: Toast[],
  canToastFull: () => boolean,
): void {
  if (!bonuses.length) return;

  for (const bonus of bonuses) {
    if (Math.random() >= bonus.chance) continue;
    if (!inventory.canFit(bonus.itemId, bonus.amount)) {
      if (canToastFull()) {
        toasts.push({ text: "背包已满", ttl: TOAST_TTL });
      }
      continue;
    }
    const err = inventory.add(bonus.itemId, bonus.amount);
    if (err) {
      if (canToastFull()) toasts.push({ text: err, ttl: TOAST_TTL });
      continue;
    }
    const item = getItem(bonus.itemId);
    const rare = bonus.itemId === "bird_nest" ? "！ " : "";
    toasts.push({
      text: `${rare}+${bonus.amount} ${item.name}`,
      ttl: TOAST_TTL + (rare ? 0.6 : 0),
    });
  }
}

function findFocus(
  player: Player,
  list: Interactable[],
  nowSec: number,
): Interactable | null {
  let best: Interactable | null = null;
  let bestDist = Infinity;

  for (const it of list) {
    if (!isAvailable(it, nowSec)) continue;
    if (!isInReachAndFacing(player, it)) continue;
    const c = interactableCenter(it);
    const pc = playerCenter(player);
    const d = Math.hypot(c.x - pc.x, c.y - pc.y);
    if (d < bestDist) {
      bestDist = d;
      best = it;
    }
  }
  return best;
}

function playerCenter(player: Player): { x: number; y: number } {
  return { x: player.x + player.size / 2, y: player.y + player.size / 2 };
}

function isInReachAndFacing(player: Player, it: Interactable): boolean {
  const pc = playerCenter(player);
  const c = interactableCenter(it);
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
