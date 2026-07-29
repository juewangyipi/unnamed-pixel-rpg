# Game beta0.01

网页单机 · 俯视像素 · 开局可玩垂直切片。

**版本策略：** 当前为 **beta0.01**（玩法/系统试做）。有更完整的正式故事背景后，再升到 **v0.1**。

工程目录：`beta0.01/`（与对外版本号一致）。

## 在线试玩（GitHub Pages）

推送到 `main` 后自动部署：

**https://juewangyipi.github.io/unnamed-pixel-rpg/**

## 技术

- Vite + TypeScript + Canvas 2D
- 本地存档：`localStorage`（键 `game-beta0.01-save`）
- 像素资源：`public/assets/*.png`（源文件见上级 `art/`）

## 开发

```bash
cd beta0.01
npm install
npm run dev
```

## 操作摘要

| 键 | 作用 |
|----|------|
| WASD | 移动 |
| E | 互动 / 采集 |
| B / I | 背包 |
| R | 技能面板 |
| Esc | 暂停菜单 / 关面板 |

地图：村子上森林、下河边、右草地、**左矿区**。
