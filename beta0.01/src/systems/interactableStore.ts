import type { Interactable } from "../entities/interactable.ts";
import type { ChunkId } from "../world/chunk.ts";
import { createMapInteractables } from "../data/mapInteractables.ts";

export type InteractableSnapshot = {
  id: string;
  depletedUntil: number;
  progress: number;
  hits: number;
};

/** 世界互动物仓库：按当前块过滤；耗尽时间用墙钟秒。 */
export class InteractableStore {
  private readonly all: Interactable[];
  /** 每块只 filter 一次；块归属不变，缓存无需失效 */
  private readonly byChunk = new Map<ChunkId, Interactable[]>();

  constructor() {
    this.all = createMapInteractables();
  }

  forChunk(chunkId: ChunkId): Interactable[] {
    let list = this.byChunk.get(chunkId);
    if (list) return list;
    list = this.all.filter((i) => i.chunkId === chunkId);
    this.byChunk.set(chunkId, list);
    return list;
  }

  allList(): Interactable[] {
    return this.all;
  }

  getById(id: string): Interactable | undefined {
    return this.all.find((i) => i.id === id);
  }

  toJSON(): InteractableSnapshot[] {
    return this.all.map((i) => ({
      id: i.id,
      depletedUntil: i.depletedUntil,
      progress: i.progress,
      hits: i.hits,
    }));
  }

  loadJSON(list: InteractableSnapshot[]): void {
    const map = new Map(list.map((s) => [s.id, s]));
    for (const it of this.all) {
      const s = map.get(it.id);
      if (!s) continue;
      it.depletedUntil = s.depletedUntil;
      it.progress = s.progress;
      it.hits = s.hits ?? 0;
    }
  }
}
