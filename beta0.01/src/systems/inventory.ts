import type { ItemId } from "../data/items.ts";
import { getItem } from "../data/items.ts";

export type ItemStack = {
  id: ItemId;
  count: number;
};

export type InventorySnapshot = {
  capacity: number;
  slots: (ItemStack | null)[];
};

/**
 * 格子背包 / 仓库共用结构。
 * 扩容：expand()；存档：toJSON / fromJSON。
 */
export class Inventory {
  readonly slots: (ItemStack | null)[];

  constructor(slotCount: number) {
    this.slots = Array.from({ length: slotCount }, () => null);
  }

  get capacity(): number {
    return this.slots.length;
  }

  usedSlots(): number {
    return this.slots.filter((s) => s !== null).length;
  }

  countOf(id: ItemId): number {
    let n = 0;
    for (const s of this.slots) {
      if (s?.id === id) n += s.count;
    }
    return n;
  }

  expand(by: number): void {
    for (let i = 0; i < by; i++) this.slots.push(null);
  }

  add(id: ItemId, amount: number): string | null {
    if (amount <= 0) return null;
    const max = stackCap(id);
    let left = amount;

    // 优先堆入已有同物品格（无限堆叠时会全部放进第一格）
    for (const s of this.slots) {
      if (!s || s.id !== id) continue;
      const room = max - s.count;
      if (!(room > 0)) continue;
      const put = Math.min(room, left);
      s.count += put;
      left -= put;
      if (left <= 0) return null;
    }

    for (let i = 0; i < this.slots.length; i++) {
      if (this.slots[i]) continue;
      const put = Math.min(max, left);
      this.slots[i] = { id, count: put };
      left -= put;
      if (left <= 0) return null;
    }

    return "空间已满";
  }

  canFit(id: ItemId, amount: number): boolean {
    const max = stackCap(id);
    let left = amount;

    for (const s of this.slots) {
      if (s?.id === id) {
        const room = max - s.count;
        if (room > 0) left -= room;
        if (left <= 0) return true;
      }
    }
    for (const s of this.slots) {
      if (s === null) {
        left -= max;
        if (left <= 0) return true;
      }
    }
    return left <= 0;
  }

  /** 把同 id 分散格子合并到一格（读档兼容旧 99 上限） */
  consolidateStacks(): void {
    const totals = new Map<ItemId, number>();
    for (let i = 0; i < this.slots.length; i++) {
      const s = this.slots[i];
      if (!s) continue;
      totals.set(s.id, (totals.get(s.id) ?? 0) + s.count);
      this.slots[i] = null;
    }
    for (const [id, count] of totals) {
      this.add(id, count);
    }
  }

  /** 移除指定数量，返回实际移除数 */
  remove(id: ItemId, amount: number): number {
    if (amount <= 0) return 0;
    let left = amount;
    for (let i = 0; i < this.slots.length; i++) {
      const s = this.slots[i];
      if (!s || s.id !== id) continue;
      const take = Math.min(s.count, left);
      s.count -= take;
      left -= take;
      if (s.count <= 0) this.slots[i] = null;
      if (left <= 0) break;
    }
    return amount - left;
  }

  /** 取出整格，成功返回堆叠 */
  takeSlot(index: number): ItemStack | null {
    if (index < 0 || index >= this.slots.length) return null;
    const s = this.slots[index];
    if (!s) return null;
    this.slots[index] = null;
    return s;
  }

  /** 尽量放入一整堆，放不下则还原失败 */
  addStack(stack: ItemStack): string | null {
    return this.add(stack.id, stack.count);
  }

  /** 从 from 尽量全部转入 this，返回转移的物品条数描述用总数 */
  depositAllFrom(from: Inventory): number {
    let moved = 0;
    for (let i = 0; i < from.slots.length; i++) {
      const s = from.slots[i];
      if (!s) continue;
      if (!this.canFit(s.id, s.count)) continue;
      const err = this.add(s.id, s.count);
      if (!err) {
        moved += s.count;
        from.slots[i] = null;
      }
    }
    return moved;
  }

  toJSON(): InventorySnapshot {
    return {
      capacity: this.capacity,
      slots: this.slots.map((s) => (s ? { id: s.id, count: s.count } : null)),
    };
  }

  static fromJSON(data: InventorySnapshot): Inventory {
    const inv = new Inventory(data.capacity);
    for (let i = 0; i < data.slots.length && i < inv.slots.length; i++) {
      const s = data.slots[i];
      if (!s) {
        inv.slots[i] = null;
        continue;
      }
      // 旧档 raw_fish → 生虾
      const id =
        (s.id as string) === "raw_fish" ? "raw_shrimp" : s.id;
      inv.slots[i] = { id: id as ItemId, count: s.count };
    }
    // 兼容旧档：slots 比 capacity 长时扩展
    while (inv.slots.length < data.capacity) inv.slots.push(null);
    // 旧档可能按 99 拆成多格，读入后合并
    inv.consolidateStacks();
    return inv;
  }
}

function stackCap(id: ItemId): number {
  const max = getItem(id).stackMax;
  // 非正数也视作无限，避免配置失误
  return max > 0 ? max : Number.POSITIVE_INFINITY;
}
