import "./style.css";
import { Game } from "./core/game.ts";
import { loadSprites } from "./assets/sprites.ts";
import { loadPlayerSheet } from "./assets/playerAnim.ts";

const app = document.querySelector<HTMLElement>("#app");
const canvas = document.querySelector<HTMLCanvasElement>("#game");
const hud = document.querySelector<HTMLElement>("#hud");

if (!app || !canvas || !hud) {
  throw new Error("缺少 #app / #game / #hud 节点");
}

// 先加载像素图与角色表，再开循环（避免首帧全是色块闪一下）
Promise.all([loadSprites(), loadPlayerSheet()])
  .catch((err) => {
    console.warn("资源加载不完整，将使用色块回退", err);
  })
  .finally(() => {
    const game = new Game(canvas, hud, app);
    game.start();

    if (import.meta.hot) {
      import.meta.hot.dispose(() => game.stop());
    }
  });
