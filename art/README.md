# 美术资源说明（beta0.01）

## 怎么改图（推荐流程）

1. 用 **LibreSprite** 打开 `art/ase/*.ase`（每个精灵一份源文件）
2. 改完后 **文件 → 导出 → 导出为 PNG**，覆盖  
   `beta0.01/public/assets/同名.png`
3. 刷新游戏页面即可看到变化（`npm run dev` 下）

也可用命令行从 PNG 再生成 ase：

```bat
D:\Game\LibreSprite\libresprite.exe -b 你的图.png --save-as art\ase\名字.ase
```

## 批量重生成「程序像素稿」

若你改了 `generate_sprites.py` 里的色板或点阵：

```bat
python art\generate_sprites.py
```

会写出：

- `beta0.01/public/assets/*.png` — 游戏实际加载
- `art/src/*.png` — 源备份

然后再用 LibreSprite 转 ase（或重跑之前的批量转换）。

## 规格

| 项目 | 值 |
|------|-----|
| 基础格 | 16×16 px |
| 画面逻辑分辨率 | 320×240（20×15 格） |
| 显示 | CSS 放大 + `image-rendering: pixelated` |
| 风格 | 档位 B：戴夫海感青蓝 × 北欧草地 · 见 `STYLE.md` |
| 格式 | PNG（RGBA）进游戏；ASE 给人改 |

## 文件清单

| 文件 | 用途 |
|------|------|
| `player_*.png` | 角色四向 |
| `slime.png` | 森林史莱姆 |
| `tree.png` / `tree_stump.png` | 可砍树 / 砍完树桩 |
| `fish_spot*.png` | 鱼点 |
| `shop` / `warehouse` / `save_point` | 村落设施 |
| `house.png` | 村落中心小屋（48×32） |
| `tile_*.png` | 地砖平铺 |
| `bush.png` | 装饰灌木 |
| `item_wood` | 背包图标（手绘 `nor_wood_32`） |
| `item_raw_shrimp` | 生虾图标（青灰粉程序稿） |
| `item_cooked_shrimp` | 熟虾图标（手绘 `nor_shrimp_32`） |
| `tree.png` | 可砍树（已用 `nor_trees_32x40`） |
| `focus_ring.png` | 互动高亮框 |

### 从 v0.1（待命名）迁入的手绘资源

完整多尺寸备份在：

- `beta0.01/public/assets/wood/` · `shrimp/` · `trees/` · `maps/`
- `art/src/migrated-from-v0.1/`（源备份）

`generate_sprites.py` 若存在上述备份，会优先用手绘图覆盖 `item_wood` / `item_cooked_shrimp` / `tree`，不会被程序生成稿冲掉。

## 和游戏代码的关系

- 加载：`beta0.01/src/assets/sprites.ts`
- 绘制：`world/renderChunk.ts`、`drawInteractables.ts`、`drawFacilities.ts`、`core/game.ts`（玩家/史莱姆）
- 缺图时自动回退到旧的色块绘制，不会白屏
