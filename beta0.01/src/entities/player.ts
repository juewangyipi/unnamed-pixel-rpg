import { CONFIG } from "../core/config.ts";
import type { MoveAxis } from "../core/input.ts";

export type Facing = "up" | "down" | "left" | "right";

/** 采集 / 战斗等占用动作（驱动角色表动画） */
export type PlayerAction = "none" | "chop" | "mine" | "fish" | "combat";

/** 玩家：块内像素坐标 + 朝向。边界与切屏由 World 处理。 */
export class Player {
  /** 块内像素坐标（左上角） */
  x: number;
  y: number;
  facing: Facing = "down";
  readonly size: number;
  /** 是否在移动（用于行走微弹） */
  moving = false;
  /** 行走/动作相位（帧时间源） */
  walkPhase = 0;
  /** 当前占用动作（砍树/挖矿/钓鱼） */
  action: PlayerAction = "none";

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.size = CONFIG.tileSize;
  }

  /** 转向世界坐标上的一点（采集时面向目标） */
  faceToward(wx: number, wy: number): void {
    const cx = this.x + this.size / 2;
    const cy = this.y + this.size / 2;
    const dx = wx - cx;
    const dy = wy - cy;
    if (Math.abs(dx) > Math.abs(dy)) {
      this.facing = dx > 0 ? "right" : "left";
    } else {
      this.facing = dy > 0 ? "down" : "up";
    }
  }

  /** 只负责位移与朝向，允许短暂出界以便 World 检测切屏。 */
  update(dt: number, axis: MoveAxis): void {
    // 动作中相位加快，挥砍更利落
    const phaseRate = this.action !== "none" ? 12 : 9;
    let { x: ax, y: ay } = axis;
    if (ax === 0 && ay === 0) {
      this.moving = false;
      this.walkPhase += dt * phaseRate;
      return;
    }

    const len = Math.hypot(ax, ay);
    ax /= len;
    ay /= len;

    const speed = CONFIG.playerSpeed * CONFIG.tileSize;
    this.x += ax * speed * dt;
    this.y += ay * speed * dt;
    this.moving = true;
    this.walkPhase += dt * phaseRate;

    // 采集动作中保持面向目标，不因微移改朝向
    if (this.action === "none") {
      if (Math.abs(ax) > Math.abs(ay)) {
        this.facing = ax > 0 ? "right" : "left";
      } else {
        this.facing = ay > 0 ? "down" : "up";
      }
    }
  }
}
