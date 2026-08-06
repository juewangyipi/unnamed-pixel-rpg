import { isChickenAlive, type Chicken } from "../entities/chicken.ts";
import { drawShadow } from "../assets/sprites.ts";

/** 绘制鸡舍里的鸡（占位像素风 + 受击反馈） */
export function drawChickens(
  ctx: CanvasRenderingContext2D,
  list: Chicken[],
  nowSec: number,
  timeSec = nowSec,
): void {
  for (const c of list) {
    if (!isChickenAlive(c, nowSec)) {
      continue;
    }
    const { size } = c;
    const flash = c.hitFlash > 0;
    const flinch = flash ? Math.round(Math.sin(timeSec * 60) * 2) : 0;
    const x = c.x + flinch;
    const y = c.y;
    const cx = x + size / 2;
    const cy = y + size / 2;
    drawShadow(ctx, cx, y + size - 1, size * 0.35, size * 0.12);

    // 受击：短暂抬高 / 白闪
    const bob = flash ? -2 : Math.sin(c.wanderT * 6) * 0.8;

    ctx.save();
    ctx.translate(0, bob);

    const body = flash ? "#fff8f0" : "#f0e8d0";
    const head = flash ? "#ffffff" : "#fff8e8";

    // 身体
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 1, size * 0.38, size * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    // 头
    ctx.fillStyle = head;
    ctx.beginPath();
    ctx.arc(cx + size * 0.12, cy - size * 0.12, size * 0.2, 0, Math.PI * 2);
    ctx.fill();
    // 冠
    ctx.fillStyle = flash ? "#ff8080" : "#d04040";
    ctx.beginPath();
    ctx.moveTo(cx + size * 0.05, cy - size * 0.28);
    ctx.lineTo(cx + size * 0.12, cy - size * 0.4);
    ctx.lineTo(cx + size * 0.2, cy - size * 0.26);
    ctx.fill();
    // 嘴
    ctx.fillStyle = "#e09030";
    ctx.beginPath();
    ctx.moveTo(cx + size * 0.28, cy - size * 0.1);
    ctx.lineTo(cx + size * 0.4, cy - size * 0.06);
    ctx.lineTo(cx + size * 0.28, cy - size * 0.02);
    ctx.fill();
    // 眼
    ctx.fillStyle = "#1a1810";
    ctx.fillRect(cx + size * 0.16, cy - size * 0.16, 2, 2);

    // 受击火花
    if (flash) {
      for (let i = 0; i < 4; i++) {
        const a = timeSec * 20 + i * 1.6;
        const px = cx + Math.cos(a) * (size * 0.4);
        const py = cy + Math.sin(a) * (size * 0.3) - 4;
        ctx.fillStyle = "rgba(255, 220, 120, 0.9)";
        ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
      }
    }

    ctx.restore();

    // 血条
    if (c.hp < c.maxHp) {
      const bw = size;
      const bh = 3;
      const bx = x;
      const by = y - 5;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
      ctx.fillStyle = "#3a1010";
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = "#e05050";
      ctx.fillRect(bx, by, Math.round(bw * (c.hp / c.maxHp)), bh);
    }
  }
}
