import type { ChunkId } from "../world/chunk.ts";
import type { CropId } from "../data/crops.ts";
import type { FarmPlot } from "../entities/farmPlot.ts";
import { createMapFarmPlots } from "../data/mapFarmPlots.ts";

export type FarmPlotSnapshot = {
  id: string;
  cropId: CropId | null;
  plantedWallSec: number;
  readyWallSec: number;
  harvestProgress: number;
};

/** 农田状态仓库：生长用墙钟秒，便于离线成熟。 */
export class FarmStore {
  private readonly all: FarmPlot[];

  constructor() {
    this.all = createMapFarmPlots();
  }

  forChunk(chunkId: ChunkId): FarmPlot[] {
    return this.all.filter((p) => p.chunkId === chunkId);
  }

  allList(): FarmPlot[] {
    return this.all;
  }

  getById(id: string): FarmPlot | undefined {
    return this.all.find((p) => p.id === id);
  }

  toJSON(): FarmPlotSnapshot[] {
    return this.all.map((p) => ({
      id: p.id,
      cropId: p.cropId,
      plantedWallSec: p.plantedWallSec,
      readyWallSec: p.readyWallSec,
      harvestProgress: p.harvestProgress,
    }));
  }

  loadJSON(list: FarmPlotSnapshot[] | undefined | null): void {
    if (!list?.length) return;
    const map = new Map(list.map((s) => [s.id, s]));
    for (const plot of this.all) {
      const s = map.get(plot.id);
      if (!s) continue;
      plot.cropId = s.cropId;
      plot.plantedWallSec = s.plantedWallSec ?? 0;
      plot.readyWallSec = s.readyWallSec ?? 0;
      plot.harvestProgress = s.harvestProgress ?? 0;
    }
  }
}
