import { CONFIG } from "../core/config.ts";

export type DayPhase = "dawn" | "day" | "dusk" | "night";

/** 昼夜：氛围为主；0～1 为一天进度。 */
export class TimeOfDay {
  /** 一天内进度 0～1 */
  progress: number;

  /** 默认从白天起点（progress 0.10）开局 */
  constructor(progress = 0.1) {
    this.progress = progress;
  }

  update(dt: number): void {
    this.progress = (this.progress + dt / CONFIG.dayLengthSec) % 1;
  }

  /**
   * 一天占比：黎明 10% · 白天 50% · 黄昏 15% · 夜晚 25%
   * progress 区间：[0,0.10) 黎明 · [0.10,0.60) 白天 · [0.60,0.75) 黄昏 · [0.75,1) 夜晚
   */
  phase(): DayPhase {
    const p = this.progress;
    if (p < 0.1) return "dawn";
    if (p < 0.6) return "day";
    if (p < 0.75) return "dusk";
    return "night";
  }

  phaseLabel(): string {
    switch (this.phase()) {
      case "dawn":
        return "黎明";
      case "day":
        return "白天";
      case "dusk":
        return "黄昏";
      case "night":
        return "夜晚";
    }
  }

  /** 画面压暗 0～1（夜晚最暗） */
  darkness(): number {
    switch (this.phase()) {
      case "dawn":
        return 0.12;
      case "day":
        return 0;
      case "dusk":
        return 0.22;
      case "night":
        return 0.48;
    }
  }
}
