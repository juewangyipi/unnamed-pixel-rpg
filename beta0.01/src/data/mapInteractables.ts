import { CONFIG } from "../core/config.ts";
import type { Interactable, InteractKind } from "../entities/interactable.ts";
import type { ChunkId } from "../world/chunk.ts";

const T = CONFIG.tileSize;

function node(
  id: string,
  kind: InteractKind,
  chunkId: ChunkId,
  tileX: number,
  tileY: number,
): Interactable {
  return {
    id,
    kind,
    chunkId,
    x: tileX * T,
    y: tileY * T,
    size: T,
    depletedUntil: 0,
    progress: 0,
    hits: 0,
  };
}

function tree(
  id: string,
  chunkId: ChunkId,
  tileX: number,
  tileY: number,
): Interactable {
  return node(id, "tree", chunkId, tileX, tileY);
}

function fish(
  id: string,
  chunkId: ChunkId,
  tileX: number,
  tileY: number,
): Interactable {
  return node(id, "fish_spot", chunkId, tileX, tileY);
}

/**
 * 各图互动物布局。
 * forest 砍树 · riverside 钓鱼 · mine 采矿 · grassland 可选树。
 */
export function createMapInteractables(): Interactable[] {
  return [
    // 草地：路边一棵
    tree("gl_tree_1", "grassland", 6, 4),

    // 河边：靠近水域的鱼点
    fish("rv_fish_1", "riverside", 14, 4),
    fish("rv_fish_2", "riverside", 15, 7),
    fish("rv_fish_3", "riverside", 14, 11),

    // 森林：多棵树
    tree("ft_tree_1", "forest", 3, 3),
    tree("ft_tree_2", "forest", 7, 2),
    tree("ft_tree_3", "forest", 12, 4),
    tree("ft_tree_4", "forest", 16, 3),
    tree("ft_tree_5", "forest", 4, 8),
    tree("ft_tree_6", "forest", 9, 9),
    tree("ft_tree_7", "forest", 15, 8),
    tree("ft_tree_8", "forest", 5, 12),
    tree("ft_tree_9", "forest", 11, 12),
    tree("ft_tree_10", "forest", 17, 11),

    // 矿区：符文精华（快）+ 铜矿石（慢）
    node("mn_rune_1", "rune_node", "mine", 4, 4),
    node("mn_rune_2", "rune_node", "mine", 8, 3),
    node("mn_rune_3", "rune_node", "mine", 12, 5),
    node("mn_rune_4", "rune_node", "mine", 6, 8),
    node("mn_rune_5", "rune_node", "mine", 14, 9),

    node("mn_copper_1", "copper_node", "mine", 5, 11),
    node("mn_copper_2", "copper_node", "mine", 10, 10),
    node("mn_copper_3", "copper_node", "mine", 15, 12),
    node("mn_copper_4", "copper_node", "mine", 3, 13),
  ];
}
