# 美术资源说明（v0.1）

## 怎么改图（推荐流程）

1. 用 **LibreSprite** 打开 `art/ase/*.ase`（每个精灵一份源文件）
2. 改完后 **文件 → 导出 → 导出为 PNG**，覆盖  
   `v0.1/public/assets/同名.png`
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

- `v0.1/public/assets/*.png` — 游戏实际加载
- `art/src/*.png` — 源备份

然后再用 LibreSprite 转 ase（或重跑之前的批量转换）。

## 规格

| 项目 | 值 |
|------|-----|
| 基础格 | 16×16 px |
| 画面逻辑分辨率 | 320×240（20×15 格） |
| 显示 | CSS 放大 + `image-rendering: pixelated` |
| 风格 | 北欧奇幻感 · 统一色板 · 透明底 |
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
| `item_wood` / `item_fish` | 背包图标 |
| `focus_ring.png` | 互动高亮框 |

## 和游戏代码的关系

- 加载：`v0.1/src/assets/sprites.ts`
- 绘制：`world/renderChunk.ts`、`drawInteractables.ts`、`drawFacilities.ts`、`core/game.ts`（玩家/史莱姆）
- 缺图时自动回退到旧的色块绘制，不会白屏
