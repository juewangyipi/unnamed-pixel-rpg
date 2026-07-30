import type { ItemId } from "../data/items.ts";
import { getItem } from "../data/items.ts";
import {
  getPotionEffect,
  isDrinkable,
  type PotionId,
} from "../data/potions.ts";
import type { BonusDrop } from "../entities/interactable.ts";
import type { Toast } from "./interaction.ts";

const TOAST_TTL = 2.4;

export type ActiveBuff = {
  potionId: PotionId;
  /** 剩余可用次数 */
  chargesLeft: number;
};

export type BuffsSnapshot = {
  active: ActiveBuff | null;
};

/**
 * 药水增益：按次数计。
 * 同种药水可叠加次数；不同种药水后喝的会替换先前的。
 * 鸟巢药水：每成功砍树 1 次扣 1 次。
 */
export class BuffSystem {
  active: ActiveBuff | null = null;

  /** 兼容旧接口；次数制不按时间衰减 */
  update(_dt: number, _toasts?: Toast[]): void {
    /* no-op */
  }

  /** 饮用 1 瓶；同种叠加次数，异种替换。调用方负责从背包扣物品 */
  applyDrink(itemId: ItemId): string | null {
    if (!isDrinkable(itemId)) return "这个不能喝";
    const effect = getPotionEffect(itemId);
    if (!effect || effect.charges <= 0) return "这个不能喝";
    const potionId = itemId as PotionId;
    if (this.active?.potionId === potionId) {
      this.active.chargesLeft += effect.charges;
    } else {
      this.active = {
        potionId,
        chargesLeft: effect.charges,
      };
    }
    return null;
  }

  /** 砍树时额外掉落表（有剩余次数时） */
  treeBonusDrops(): BonusDrop[] {
    if (!this.active || this.active.chargesLeft <= 0) return [];
    const effect = getPotionEffect(this.active.potionId);
    return effect?.treeBonusDrops ? [...effect.treeBonusDrops] : [];
  }

  /**
   * 成功砍树 1 次后调用：消耗 1 次鸟巢类效果。
   * 用尽时提示并清除。
   */
  onTreeChopped(toasts?: Toast[]): void {
    if (!this.active) return;
    const effect = getPotionEffect(this.active.potionId);
    // 仅对带砍树加成的药水扣次
    if (!effect?.treeBonusDrops?.length) return;

    this.active.chargesLeft -= 1;
    if (this.active.chargesLeft <= 0) {
      const name = getItem(this.active.potionId).name;
      this.active = null;
      toasts?.push({ text: `${name} 效果用尽`, ttl: TOAST_TTL });
    }
  }

  statusLine(): string | null {
    if (!this.active || this.active.chargesLeft <= 0) return null;
    const name = getItem(this.active.potionId).name;
    return `${name} 剩 ${this.active.chargesLeft} 次`;
  }

  toJSON(): BuffsSnapshot {
    return {
      active: this.active
        ? {
            potionId: this.active.potionId,
            chargesLeft: this.active.chargesLeft,
          }
        : null,
    };
  }

  loadJSON(data: BuffsSnapshot | undefined | null): void {
    if (!data?.active) {
      this.active = null;
      return;
    }
    // 兼容旧存档 remainingSec
    const raw = data.active as ActiveBuff & { remainingSec?: number };
    let charges = raw.chargesLeft;
    if (charges == null && raw.remainingSec != null) {
      // 旧时长档：尽量折成次数（上限用配置）
      const effect = getPotionEffect(raw.potionId);
      charges = effect?.charges ?? 0;
    }
    this.active = {
      potionId: raw.potionId,
      chargesLeft: Math.max(0, Math.floor(charges ?? 0)),
    };
    if (this.active.chargesLeft <= 0) this.active = null;
  }
}
