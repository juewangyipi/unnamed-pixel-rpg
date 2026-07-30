import { CONFIG } from "../core/config.ts";
import { GATHER, type InteractKind } from "../entities/interactable.ts";
import { getItem } from "../data/items.ts";
import { SKILLS } from "../data/skills.ts";
import type { ItemId } from "../data/items.ts";
import type { Inventory } from "./inventory.ts";
import type { Skills } from "./skills.ts";
import { resolveGatherDrop, type Toast } from "./interaction.ts";

/**
 * 离线补进度（简版）：
 * 按离开前最后采集类型，用离线时长折算有限次采集（有上限）。
 */
export function applyOfflineProgress(args: {
  elapsedSec: number;
  lastGatherKind: InteractKind | null;
  inventory: Inventory;
  skills: Skills;
}): Toast[] {
  const { lastGatherKind, inventory, skills } = args;
  const toasts: Toast[] = [];
  const elapsed = Math.min(
    Math.max(0, args.elapsedSec),
    CONFIG.offlineMaxSec,
  );
  if (elapsed < 5 || !lastGatherKind) {
    if (elapsed >= 5) {
      toasts.push({
        text: `离线 ${formatDur(elapsed)}（无进行中的采集可补）`,
        ttl: 3,
      });
    }
    return toasts;
  }

  const profile = GATHER[lastGatherKind];
  const times = Math.min(
    CONFIG.offlineMaxGathers,
    Math.floor(elapsed / CONFIG.offlineGatherSec),
  );
  if (times <= 0) {
    toasts.push({ text: `离线 ${formatDur(elapsed)}`, ttl: 2.5 });
    return toasts;
  }

  const gained = new Map<ItemId, number>();
  let any = false;
  for (let i = 0; i < times; i++) {
    const drop = resolveGatherDrop(profile);
    if (!inventory.canFit(drop.itemId, drop.amount)) break;
    const err = inventory.add(drop.itemId, drop.amount);
    if (err) break;
    gained.set(drop.itemId, (gained.get(drop.itemId) ?? 0) + drop.amount);
    any = true;
    skills.addXp(profile.skillId, profile.xp);

    for (const bonus of profile.bonusDrops ?? []) {
      if (Math.random() >= bonus.chance) continue;
      if (!inventory.canFit(bonus.itemId, bonus.amount)) continue;
      if (inventory.add(bonus.itemId, bonus.amount)) continue;
      gained.set(
        bonus.itemId,
        (gained.get(bonus.itemId) ?? 0) + bonus.amount,
      );
    }
  }

  if (any) {
    const parts = [...gained.entries()]
      .map(([id, n]) => `${n} ${getItem(id).name}`)
      .join("、");
    toasts.push({
      text: `离线 ${formatDur(elapsed)}：补 ${parts}（${SKILLS[profile.skillId].name}）`,
      ttl: 4,
    });
  } else {
    toasts.push({
      text: `离线 ${formatDur(elapsed)}：背包满，未能补采集`,
      ttl: 3.5,
    });
  }
  return toasts;
}

function formatDur(sec: number): string {
  if (sec < 60) return `${Math.floor(sec)}秒`;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  if (m < 60) return s > 0 ? `${m}分${s}秒` : `${m}分钟`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm > 0 ? `${h}小时${rm}分` : `${h}小时`;
}
