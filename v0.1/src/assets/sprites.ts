/**
 * 像素资源加载：PNG 放在 public/assets，可在 art/ 用脚本重生成，
 * 再用 LibreSprite 打开 art/ase/*.ase 手工改。
 */

export type SpriteName =
  | "player_down"
  | "player_up"
  | "player_left"
  | "player_right"
  | "tree"
  | "tree_stump"
  | "fish_spot"
  | "fish_spot_empty"
  | "shop"
  | "warehouse"
  | "save_point"
  | "house"
  | "bush"
  | "tile_grass"
  | "tile_path"
  | "tile_water"
  | "tile_water_edge"
  | "tile_forest"
  | "tile_village"
  | "item_wood"
  | "item_fish"
  | "focus_ring";

const NAMES: SpriteName[] = [
  "player_down",
  "player_up",
  "player_left",
  "player_right",
  "tree",
  "tree_stump",
  "fish_spot",
  "fish_spot_empty",
  "shop",
  "warehouse",
  "save_point",
  "house",
  "bush",
  "tile_grass",
  "tile_path",
  "tile_water",
  "tile_water_edge",
  "tile_forest",
  "tile_village",
  "item_wood",
  "item_fish",
  "focus_ring",
];

const cache = new Map<SpriteName, HTMLImageElement>();
let ready = false;
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

/** 启动时调用一次；失败的单张会跳过，绘制时回退色块。 */
export function loadSprites(): Promise<void> {
  if (ready) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const base = `${import.meta.env.BASE_URL}assets/`;
    await Promise.all(
      NAMES.map(async (name) => {
        try {
          const img = await loadImage(`${base}${name}.png`);
          cache.set(name, img);
        } catch {
          console.warn(`[sprites] missing ${name}.png`);
        }
      }),
    );
    ready = true;
  })();

  return loadPromise;
}

export function getSprite(name: SpriteName): HTMLImageElement | null {
  return cache.get(name) ?? null;
}

export function hasSprites(): boolean {
  return cache.size > 0;
}

export type DrawSpriteOpts = {
  /** 目标宽；默认原图像素宽 */
  w?: number;
  /** 目标高；默认原图像素高 */
  h?: number;
  alpha?: number;
  /**
   * 脚底对齐：用 (x,y,footW,footH) 表示碰撞/占位矩形，
   * 图片底部落在 foot 底边，水平居中（适合比格子更高的树/柱）。
   */
  foot?: { w: number; h: number };
};

/** 像素对齐绘制，避免亚像素模糊。 */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  name: SpriteName,
  x: number,
  y: number,
  opts?: DrawSpriteOpts,
): boolean {
  const img = getSprite(name);
  if (!img) return false;
  const prev = ctx.globalAlpha;
  if (opts?.alpha != null) ctx.globalAlpha = opts.alpha;
  const w = opts?.w ?? img.naturalWidth;
  const h = opts?.h ?? img.naturalHeight;
  let dx = Math.round(x);
  let dy = Math.round(y);
  if (opts?.foot) {
    dx = Math.round(x + (opts.foot.w - w) / 2);
    dy = Math.round(y + opts.foot.h - h);
  }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, dx, dy, w, h);
  ctx.globalAlpha = prev;
  return true;
}

/** 脚下椭圆阴影（增强立体感）。 */
export function drawShadow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
): void {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(Math.round(cx), Math.round(cy), rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** 平铺地砖铺满区域。 */
export function tileSprite(
  ctx: CanvasRenderingContext2D,
  name: SpriteName,
  width: number,
  height: number,
  tile = 16,
): boolean {
  const img = getSprite(name);
  if (!img) return false;
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < height; y += tile) {
    for (let x = 0; x < width; x += tile) {
      ctx.drawImage(img, x, y, tile, tile);
    }
  }
  return true;
}
