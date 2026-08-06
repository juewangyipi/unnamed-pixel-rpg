/**
 * Mystic Woods free 2.2 角色表动画。
 * 格 48×48；左向 = 右向水平翻转。
 * 行：0–2 idle · 3–5 move · 6–8 attack · 9 death（各向 4 帧有效）。
 *
 * 角色只占格中心一小块；裁切后放大，攻击帧用更宽裁切保留挥砍弧。
 */
import type { Facing } from "../entities/player.ts";

const CELL = 48;
const IDLE_COLS = 6;
const MOVE_COLS = 6;
/** 攻击行只有前 4 格有内容 */
const ATTACK_COLS = 4;

const IDLE_ROW: Record<"down" | "right" | "up", number> = {
  down: 0,
  right: 1,
  up: 2,
};
const MOVE_ROW: Record<"down" | "right" | "up", number> = {
  down: 3,
  right: 4,
  up: 5,
};
const ATTACK_ROW: Record<"down" | "right" | "up", number> = {
  down: 6,
  right: 7,
  up: 8,
};

/** idle / walk 内容裁切 */
const CROP = { x: 16, y: 19, w: 16, h: 24 };
/** attack 含挥砍弧（脚底仍在底部） */
const CROP_ATTACK = { x: 8, y: 18, w: 36, h: 30 };

const WALK_FPS = 10;
const IDLE_FPS = 4;
const ATTACK_FPS = 12;
const CAST_FPS = 8;

/** 角色当前播放的动画种类 */
export type PlayerAnimKind = "idle" | "walk" | "attack" | "cast";

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

export function playerFrame(
  facing: Facing,
  anim: PlayerAnimKind,
  walkPhase: number,
): { row: number; col: number; flip: boolean; crop: typeof CROP } {
  const base = baseFacing(facing);
  const flip = facing === "left";
  const t = walkPhase / 9;

  if (anim === "attack") {
    const col = Math.floor(t * ATTACK_FPS) % ATTACK_COLS;
    return { row: ATTACK_ROW[base], col, flip, crop: CROP_ATTACK };
  }
  if (anim === "cast") {
    // 钓鱼：用攻击前 3 帧慢循环，像抛竿/收竿
    const col = Math.floor(t * CAST_FPS) % 3;
    return { row: ATTACK_ROW[base], col, flip, crop: CROP_ATTACK };
  }
  if (anim === "walk") {
    const col = Math.floor(t * WALK_FPS) % MOVE_COLS;
    return { row: MOVE_ROW[base], col, flip, crop: CROP };
  }
  const col = Math.floor(t * IDLE_FPS) % IDLE_COLS;
  return { row: IDLE_ROW[base], col, flip, crop: CROP };
}

/**
 * 绘制一帧。
 * size = 碰撞格边长；攻击帧可略宽于格子以显示挥砍。
 */
export function drawPlayerFrame(
  ctx: CanvasRenderingContext2D,
  facing: Facing,
  anim: PlayerAnimKind,
  walkPhase: number,
  x: number,
  y: number,
  size: number,
): boolean {
  if (!sheet) return false;

  const { row, col, flip, crop } = playerFrame(facing, anim, walkPhase);
  const sx = col * CELL + crop.x;
  const sy = row * CELL + crop.y;
  const sw = crop.w;
  const sh = crop.h;

  const dh = Math.round(size * (anim === "attack" || anim === "cast" ? 1.05 : 1));
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

/** 兼容旧调用：moving → walk/idle */
export function animFromMoving(moving: boolean): PlayerAnimKind {
  return moving ? "walk" : "idle";
}
