export type Chicken = {
  id: string;
  x: number;
  y: number;
  size: number;
  hp: number;
  maxHp: number;
  /** 墙钟秒：>0 且 now < 此值时为死亡待刷新 */
  respawnAt: number;
  /** 游走相位 */
  wanderT: number;
  /** 受击闪白剩余秒（视觉） */
  hitFlash: number;
  /** 击退方向（像素/秒，短衰减） */
  knockVx: number;
  knockVy: number;
};

export function isChickenAlive(c: Chicken, nowSec: number): boolean {
  return c.hp > 0 && (c.respawnAt <= 0 || nowSec >= c.respawnAt);
}

export function chickenCenter(c: Chicken): { x: number; y: number } {
  return { x: c.x + c.size / 2, y: c.y + c.size / 2 };
}
