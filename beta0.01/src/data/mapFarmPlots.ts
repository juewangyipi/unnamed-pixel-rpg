import { CONFIG } from "../core/config.ts";
import type { FarmPlot } from "../entities/farmPlot.ts";

const T = CONFIG.tileSize;

/**
 * 草地右侧农田：4×3 格，每格可种。
 * 草地 20×15，树在左侧附近；农田靠右不挡左入口。
 */
export function createMapFarmPlots(): FarmPlot[] {
  const plots: FarmPlot[] = [];
  const originTx = 14;
  const originTy = 5;
  const cols = 4;
  const rows = 3;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const tx = originTx + col;
      const ty = originTy + row;
      plots.push({
        id: `gl_farm_${col}_${row}`,
        chunkId: "grassland",
        x: tx * T,
        y: ty * T,
        size: T,
        cropId: null,
        plantedWallSec: 0,
        readyWallSec: 0,
        harvestProgress: 0,
      });
    }
  }
  return plots;
}
