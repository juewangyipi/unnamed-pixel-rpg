import type { ChunkId } from "../world/chunk.ts";

export type FacilityKind =
  | "shop"
  | "warehouse"
  | "save_point"
  | "campfire"
  | "cooking_pot"
  | "alchemy_table"
  | "chicken_coop";

export type Facility = {
  id: string;
  kind: FacilityKind;
  chunkId: ChunkId;
  x: number;
  y: number;
  size: number;
  label: string;
};

export function facilityCenter(f: Facility): { x: number; y: number } {
  return { x: f.x + f.size / 2, y: f.y + f.size / 2 };
}
