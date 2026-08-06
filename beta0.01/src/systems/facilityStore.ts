import type { Facility } from "../entities/facility.ts";
import type { ChunkId } from "../world/chunk.ts";
import { createMapFacilities } from "../data/mapFacilities.ts";

export class FacilityStore {
  private readonly all: Facility[];
  /** 每块只 filter 一次；块归属不变，缓存无需失效 */
  private readonly byChunk = new Map<ChunkId, Facility[]>();

  constructor() {
    this.all = createMapFacilities();
  }

  forChunk(chunkId: ChunkId): Facility[] {
    let list = this.byChunk.get(chunkId);
    if (list) return list;
    list = this.all.filter((f) => f.chunkId === chunkId);
    this.byChunk.set(chunkId, list);
    return list;
  }
}
