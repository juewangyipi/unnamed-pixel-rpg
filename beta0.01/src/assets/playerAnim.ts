/**
 * Mystic Woods free 2.2 角色表动画。
 * 格 48×48；左向 = 右向水平翻转。
 * 行：0–2 idle（下/右/上），3–5 move，6–8 attack，9 death。
 *
 * 注意：角色像素只占 48 格中心约 15×23，若整格缩到 32 会缩成蚂蚁。
 * 绘制时裁切内容区再放大，体型对齐原先静态四向。
 */
import type { Facing } from "../entities/player.ts";

const CELL = 48;
const COLS = 6;
/** idle 行：下 / 右 / 上 */
const IDLE_ROW: Record<"down" | "right" | "up", number> = {
  down: 0,
  right: 1,
  up: 2,
};
/** move 行 */
const MOVE_ROW: Record<"down" | "right" | "up", number> = {
  down: 3,
  right: 4,
  up: 5,
};

/**
 * 表内角色内容区（相对单格左上，覆盖 idle+move 全部帧 union）。
 * union ≈ (17,20)–(32,43)；四周留 1px，脚底贴裁切底边。
 */
const CROP = { x: 16, y: 19, w: 16, h: 24 };

/** 每秒播放多少帧（6 帧一圈） */
const WALK_FPS = 10;
const IDLE_FPS = 4;

let sheet: HTMLImageElement | null = null;
let loadPromise: Promise<void> | null = null;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

/** 与 loadSprites 并行调用；失败则 draw 回退到单帧 PNG。 */
export function loadPlayerSheet(): Promise<void> {
  if (sheet) return Promise.resolve();
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    const base = `${import.meta.env.BASE_URL}assets/`;
    try {
      sheet = await loadImage(`${base}player_sheet.png`);
    } catch {
      console.warn("[playerAnim] missing player_sheet.png");
      sheet = null;
    }
  })();
  return loadPromise;
}

export function hasPlayerSheet(): boolean {
  return sheet != null && sheet.naturalWidth > 0;
}

function baseFacing(facing: Facing): "down" | "right" | "up" {
  if (facing === "left") return "right";
  return facing;
}

/**
 * 根据移动状态取表内帧。
 * walkPhase：Player 上累计的相位（秒×速率），仅作时间源。
 */
export function playerFrame(
  facing: Facing,
  moving: boolean,
  walkPhase: number,
): { row: number; col: number; flip: boolean } {
  const base = baseFacing(facing);
  const flip = facing === "left";
  // walkPhase 以 dt*9 累加 → 除以 9 得秒，再 ×FPS
  const t = walkPhase / 9;
  if (moving) {
    const col = Math.floor(t * WALK_FPS) % COLS;
    return { row: MOVE_ROW[base], col, flip };
  }
  // 站立：idle 6 帧轻循环
  const col = Math.floor(t * IDLE_FPS) % COLS;
  return { row: IDLE_ROW[base], col, flip };
}

/**
 * 从精灵表画一帧。
 * `size` 为碰撞/落脚格边长；视觉高度拉满该格，脚底对齐格底。
 * 成功返回 true；无表时 false。
 */
export function drawPlayerFrame(
  ctx: CanvasRenderingContext2D,
  facing: Facing,
  moving: boolean,
  walkPhase: number,
  x: number,
  y: number,
  size: number,
): boolean {
  if (!sheet) return false;

  const { row, col, flip } = playerFrame(facing, moving, walkPhase);
  // 源：单格内裁切内容，不要整 48 格
  const sx = col * CELL + CROP.x;
  const sy = row * CELL + CROP.y;
  const sw = CROP.w;
  const sh = CROP.h;

  // 高度铺满格子（≈32），宽度按比例；比整格缩放大约 2 倍
  const dh = Math.round(size);
  const dw = Math.max(1, Math.round((sw / sh) * dh));
  const dx = Math.round(x + (size - dw) / 2);
  const dy = Math.round(y + size - dh);

  ctx.imageSmoothingEnabled = false;
  if (flip) {
    ctx.save();
    ctx.translate(dx + dw, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(sheet, sx, sy, sw, sh, 0, 0, dw, dh);
    ctx.restore();
  } else {
    ctx.drawImage(sheet, sx, sy, sw, sh, dx, dy, dw, dh);
  }
  return true;
}
