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
  | "tile_grass2"
  | "tile_path"
  | "tile_path2"
  | "tile_water"
  | "tile_water2"
  | "tile_water_edge"
  | "tile_forest"
  | "tile_forest2"
  | "tile_village"
  | "tile_village2"
  | "item_wood"
  | "item_raw_shrimp"
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
  "tile_grass2",
  "tile_path",
  "tile_path2",
  "tile_water",
  "tile_water2",
  "tile_water_edge",
  "tile_forest",
  "tile_forest2",
  "tile_village",
  "tile_village2",
  "item_wood",
  "item_raw_shrimp",
  "focus_ring",
];

/** 主地砖 → 变体（打破重复感） */
const TILE_VARIANT: Partial<Record<SpriteName, SpriteName>> = {
  tile_grass: "tile_grass2",
  tile_path: "tile_path2",
  tile_water: "tile_water2",
  tile_forest: "tile_forest2",
  tile_village: "tile_village2",
};

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
  w?: number;
  h?: number;
  alpha?: number;
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

/** 双层冷色阴影（接触影 + 柔影）。 */
export function drawShadow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
): void {
  const x = Math.round(cx);
  const y = Math.round(cy);
  ctx.save();
  // 外柔影
  ctx.fillStyle = "rgba(6, 18, 32, 0.16)";
  ctx.beginPath();
  ctx.ellipse(x, y, rx * 1.25, ry * 1.35, 0, 0, Math.PI * 2);
  ctx.fill();
  // 内接触影
  ctx.fillStyle = "rgba(8, 24, 40, 0.34)";
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function hashTile(tx: number, ty: number): number {
  // 稳定伪随机，用于变体选择
  let n = (tx * 374761393 + ty * 668265263) | 0;
  n = (n ^ (n >>> 13)) * 1274126177;
  return (n ^ (n >>> 16)) >>> 0;
}

/**
 * 平铺地砖；若有 *2 变体则按格子交错，减少重复感。
 */
export function tileSprite(
  ctx: CanvasRenderingContext2D,
  name: SpriteName,
  width: number,
  height: number,
  tile = 16,
): boolean {
  const primary = getSprite(name);
  if (!primary) return false;
  const variantName = TILE_VARIANT[name];
  const secondary = variantName ? getSprite(variantName) : null;
  ctx.imageSmoothingEnabled = false;
  const cols = Math.ceil(width / tile);
  const rows = Math.ceil(height / tile);
  for (let ty = 0; ty < rows; ty++) {
    for (let tx = 0; tx < cols; tx++) {
      const useB = secondary && (hashTile(tx, ty) & 1) === 1;
      const img = useB && secondary ? secondary : primary;
      // 偶发水平翻转，进一步打散 tiling
      const flip = (hashTile(tx + 3, ty + 7) & 3) === 0;
      const x = tx * tile;
      const y = ty * tile;
      if (flip) {
        ctx.save();
        ctx.translate(x + tile, y);
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0, tile, tile);
        ctx.restore();
      } else {
        ctx.drawImage(img, x, y, tile, tile);
      }
    }
  }
  return true;
}
