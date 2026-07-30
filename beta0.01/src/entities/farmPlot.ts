import type { ChunkId } from "../world/chunk.ts";
import type { CropId } from "../data/crops.ts";
import { getCrop } from "../data/crops.ts";

export type FarmPlot = {
  id: string;
  chunkId: ChunkId;
  x: number;
  y: number;
  size: number;
  /** 当前作物；null = 空地 */
  cropId: CropId | null;
  /** 种植时刻（墙钟秒）；空地为 0 */
  plantedWallSec: number;
  /** 成熟时刻（墙钟秒）；空地为 0 */
  readyWallSec: number;
  /** 成熟后砍伐进度 0～1 */
  harvestProgress: number;
};

export type FarmPhase = "empty" | "growing" | "mature";

export function farmPhase(plot: FarmPlot, nowSec: number): FarmPhase {
  if (!plot.cropId) return "empty";
  if (nowSec >= plot.readyWallSec) return "mature";
  return "growing";
}

export function growRemainingSec(plot: FarmPlot, nowSec: number): number {
  if (!plot.cropId) return 0;
  return Math.max(0, plot.readyWallSec - nowSec);
}

export function growProgress(plot: FarmPlot, nowSec: number): number {
  if (!plot.cropId) return 0;
  const def = getCrop(plot.cropId);
  if (def.growSec <= 0) return 1;
  const elapsed = nowSec - plot.plantedWallSec;
  return Math.min(1, Math.max(0, elapsed / def.growSec));
}

export function farmPlotCenter(plot: FarmPlot): { x: number; y: number } {
  return { x: plot.x + plot.size / 2, y: plot.y + plot.size / 2 };
}

export function clearPlot(plot: FarmPlot): void {
  plot.cropId = null;
  plot.plantedWallSec = 0;
  plot.readyWallSec = 0;
  plot.harvestProgress = 0;
}

export function plantCrop(plot: FarmPlot, cropId: CropId, nowSec: number): void {
  const def = getCrop(cropId);
  plot.cropId = cropId;
  plot.plantedWallSec = nowSec;
  plot.readyWallSec = nowSec + def.growSec;
  plot.harvestProgress = 0;
}
