import { CONFIG } from "../core/config.ts";
import { COMBAT, rollChickenLoot } from "../data/combat.ts";
import { getItem } from "../data/items.ts";
import { SKILLS } from "../data/skills.ts";
import {
  chickenCenter,
  isChickenAlive,
  type Chicken,
} from "../entities/chicken.ts";
import type { Player } from "../entities/player.ts";
import type { Inventory } from "./inventory.ts";
import type { Skills } from "./skills.ts";
import type { Toast } from "./interaction.ts";

const TOAST_TTL = 2.2;

export type CoopCombatResult = {
  toasts: Toast[];
  /** 本帧是否有击杀 */
  kills: number;
};

/**
 * 鸡舍战斗：开始后自动追鸡攻击；鸡不反击；上限 6 只，死后刷新。
 */
export class CoopCombatSystem {
  fighting = false;
  chickens: Chicken[] = [];
  private attackCd = 0;
  private idSeq = 0;
  private arena = { w: 0, h: 0 };

  get aliveCount(): number {
    const now = Date.now() / 1000;
    return this.chickens.filter((c) => isChickenAlive(c, now)).length;
  }

  start(args: { arenaW: number; arenaH: number }): void {
    this.fighting = true;
    this.attackCd = 0;
    this.arena = { w: args.arenaW, h: args.arenaH };
    this.chickens = [];
    for (let i = 0; i < COMBAT.chickenMax; i++) {
      this.chickens.push(this.spawnChicken());
    }
  }

  stop(): void {
    this.fighting = false;
    this.attackCd = 0;
    this.chickens = [];
  }

  update(args: {
    dt: number;
    player: Player;
    inventory: Inventory;
    skills: Skills;
    arenaW: number;
    arenaH: number;
  }): CoopCombatResult {
    const toasts: Toast[] = [];
    let kills = 0;
    if (!this.fighting) return { toasts, kills };

    this.arena = { w: args.arenaW, h: args.arenaH };
    const now = Date.now() / 1000;
    this.attackCd = Math.max(0, this.attackCd - args.dt);

    // 刷新死亡鸡
    for (const c of this.chickens) {
      if (c.hp <= 0 && c.respawnAt > 0 && now >= c.respawnAt) {
        this.respawnInPlace(c);
      }
    }

    // 闲逛（非锁定时轻微移动）
    for (const c of this.chickens) {
      if (!isChickenAlive(c, now)) continue;
      c.wanderT += args.dt;
      const wx = Math.sin(c.wanderT * 1.3 + c.id.length) * 8 * args.dt;
      const wy = Math.cos(c.wanderT * 1.1 + 2) * 8 * args.dt;
      c.x = clamp(c.x + wx, 0, this.arena.w - c.size);
      c.y = clamp(c.y + wy, 0, this.arena.h - c.size);
    }

    const target = this.nearestAlive(args.player, now);
    if (!target) return { toasts, kills };

    // 自动追鸡
    const pc = {
      x: args.player.x + args.player.size / 2,
      y: args.player.y + args.player.size / 2,
    };
    const tc = chickenCenter(target);
    const dx = tc.x - pc.x;
    const dy = tc.y - pc.y;
    const dist = Math.hypot(dx, dy) || 1;
    const speed =
      CONFIG.playerSpeed * CONFIG.tileSize * COMBAT.chaseSpeedMul * args.dt;

    if (dist > COMBAT.attackRange * 0.85) {
      args.player.x += (dx / dist) * speed;
      args.player.y += (dy / dist) * speed;
      // 朝向
      if (Math.abs(dx) > Math.abs(dy)) {
        args.player.facing = dx > 0 ? "right" : "left";
      } else {
        args.player.facing = dy > 0 ? "down" : "up";
      }
    }

    // 夹在场地内
    args.player.x = clamp(args.player.x, 0, this.arena.w - args.player.size);
    args.player.y = clamp(args.player.y, 0, this.arena.h - args.player.size);

    // 攻击
    const dist2 = Math.hypot(
      chickenCenter(target).x - (args.player.x + args.player.size / 2),
      chickenCenter(target).y - (args.player.y + args.player.size / 2),
    );
    if (dist2 <= COMBAT.attackRange && this.attackCd <= 0) {
      this.attackCd = COMBAT.attackIntervalSec;
      target.hp -= COMBAT.playerAttack;
      if (target.hp <= 0) {
        target.hp = 0;
        target.respawnAt = now + COMBAT.chickenRespawnSec;
        kills += 1;

        const drop = rollChickenLoot();
        if (args.inventory.canFit(drop.itemId, drop.amount)) {
          args.inventory.add(drop.itemId, drop.amount);
          toasts.push({
            text: `+${drop.amount} ${getItem(drop.itemId).name}`,
            ttl: TOAST_TTL,
          });
        } else {
          toasts.push({ text: "背包已满，掉落未捡起", ttl: TOAST_TTL });
        }

        const ups = args.skills.addXp("combat", COMBAT.killXp);
        for (const u of ups) {
          toasts.push({
            text: `${SKILLS[u.skillId].name} 升到 ${u.level} 级！`,
            ttl: TOAST_TTL + 0.4,
          });
        }
      }
    }

    return { toasts, kills };
  }

  private nearestAlive(player: Player, now: number): Chicken | null {
    const pc = {
      x: player.x + player.size / 2,
      y: player.y + player.size / 2,
    };
    let best: Chicken | null = null;
    let bestD = Infinity;
    for (const c of this.chickens) {
      if (!isChickenAlive(c, now)) continue;
      const cc = chickenCenter(c);
      const d = Math.hypot(cc.x - pc.x, cc.y - pc.y);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    return best;
  }

  private spawnChicken(): Chicken {
    this.idSeq += 1;
    const size = COMBAT.chickenSize;
    const margin = CONFIG.tileSize;
    const x =
      margin + Math.random() * Math.max(8, this.arena.w - size - margin * 2);
    const y =
      margin + Math.random() * Math.max(8, this.arena.h - size - margin * 2);
    return {
      id: `ck_${this.idSeq}`,
      x,
      y,
      size,
      hp: COMBAT.chickenHp,
      maxHp: COMBAT.chickenHp,
      respawnAt: 0,
      wanderT: Math.random() * 10,
    };
  }

  private respawnInPlace(c: Chicken): void {
    const size = COMBAT.chickenSize;
    const margin = CONFIG.tileSize;
    c.hp = COMBAT.chickenHp;
    c.maxHp = COMBAT.chickenHp;
    c.respawnAt = 0;
    c.size = size;
    c.x =
      margin + Math.random() * Math.max(8, this.arena.w - size - margin * 2);
    c.y =
      margin + Math.random() * Math.max(8, this.arena.h - size - margin * 2);
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
