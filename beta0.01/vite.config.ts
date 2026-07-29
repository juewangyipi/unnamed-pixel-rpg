import { defineConfig } from "vite";

/**
 * GitHub Pages 项目页地址形如：
 *   https://<user>.github.io/unnamed-pixel-rpg/
 * 生产构建必须用仓库名作 base，开发时用 /。
 */
const repoBase = "/unnamed-pixel-rpg/";

export default defineConfig({
  base: process.env.GITHUB_ACTIONS === "true" ? repoBase : "/",
});
