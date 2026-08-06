import type { Player } from "../entities/player.ts";
import type { ChunkId } from "../world/chunk.ts";
import {
  GATHER,
  type InteractKind,
} from "../entities/interactable.ts";
import { getItem } from "../data/items.ts";
import { SKILLS, skillDuration } from "../data/skills.ts";
import type { Inventory } from "./inventory.ts";
import type { Skills } from "./skills.ts";
import { resolveGatherDrop, type Toast } from "./interaction.ts";
import { fishZoneAt, type FishZone } from "../data/fishingSpots.ts";

const TOAST_TTL = 2.2;

export type FishingUpdateResult = {
  toasts: Toast[];
  caught: boolean;
  zone: FishZone | null;
};

export type FishingDrawState = {
  zone: FishZone;
  active: boolean;
  progress: number;
  splashT: number;
  playerCx: number;
  playerCy: number;
};

/**
 * 河边挂机钓鱼：与原砍树/采矿相同的 auto 机制。
 * 站在可钓区按 E 开钓 → 自动每 duration 秒上 1 份（掉落/经验/满包处理与原来完全一致）→ 再按 E 停止。
 * 水面不再放鱼点 node。
 */
export class FishingSystem {
  private active = false;
  private progress = 0;
  private fullBagCooldown = 0;
  private splashT = 0;
  lastGatherKind: InteractKind | null = null;

  zoneFor(player: Player, chunkId: ChunkId): FishZone | null {
    return fishZoneAt(
      chunkId,
      player.x + player.size / 2,
      player.y + player.size / 2,
    );
  }

  update(args: {
    dt: number;
    player: Player;
    chunkId: ChunkId;
    interactJustPressed: boolean;
    inventory: Inventory;
    skills: Skills;
  }): FishingUpdateResult {
    const { dt, player, chunkId, interactJustPressed, inventory, skills } =
      args;
    const toasts: Toast[] = [];
    this.fullBagCooldown = Math.max(0, this.fullBagCooldown - dt);
    this.splashT = Math.max(0, this.splashT - dt);
    const zone = this.zoneFor(player, chunkId);

    // 按 E：开钓 / 停止（与 auto 采集一致）
    if (interactJustPressed) {
      if (this.active) {
        this.active = false;
        this.progress = 0;
      } else if (zone) {
        this.active = true;
        this.progress = 0;
      }
    }

    // 走出可钓区 → 自动停止
    if (this.active && !zone) {
      this.active = false;
      this.progress = 0;
    }

    let caught = false;
    if (this.active && zone) {
      const profile = GATHER.fish_spot;
      const dur = skillDuration(
        profile.duration,
        skills.get(profile.skillId).level,
      );

      // 背包满：暂停进度，腾出空位后继续（同 interaction.ts）
      const bagOk = profile.lootTable?.length
        ? profile.lootTable.every((e) =>
            inventory.canFit(e.itemId, e.amount),
          )
        : inventory.canFit(profile.itemId, profile.amount);
      if (!bagOk) {
        if (this.fullBagCooldown <= 0) {
          toasts.push({ text: "背包已满", ttl: TOAST_TTL });
          this.fullBagCooldown = 1.2;
        }
      } else {
        this.progress += dt / dur;
        if (this.progress >= 1) {
          this.progress = 0;
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
            const ups = skills.addXp(profile.skillId, profile.xp);
            for (const u of ups) {
              toasts.push({
                text: `${SKILLS[u.skillId].name} 升到 ${u.level} 级！`,
                ttl: TOAST_TTL + 0.4,
              });
            }
            this.lastGatherKind = "fish_spot";
            this.splashT = 0.5;
            caught = true;
          }
        }
      }
    }

    return { toasts, caught, zone };
  }

  drawState(player: Player, chunkId: ChunkId): FishingDrawState | null {
    const zone = this.zoneFor(player, chunkId);
    if (!zone) return null;
    return {
      zone,
      active: this.active,
      progress: this.progress,
      splashT: this.splashT,
      playerCx: player.x + player.size / 2,
      playerCy: player.y + player.size * 0.35,
    };
  }
}