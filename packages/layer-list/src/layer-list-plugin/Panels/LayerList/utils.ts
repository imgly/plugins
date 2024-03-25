import { CreativeEngine, ObjectTypeLonghand } from "@cesdk/cesdk-js";

export interface IBlockTree {
  id: number;
  type: ObjectTypeLonghand;
  children: IBlockTree[];
}

export const EXCLUDE_BLOCKS: ObjectTypeLonghand[] = [
  "//ly.img.ubq/scene",
  // "//ly.img.ubq/page",
  "//ly.img.ubq/camera",
  "//ly.img.ubq/stack",
  "//ly.img.ubq/camera",
];
const NON_SELECTABLE_BLOCK_TYPES: ObjectTypeLonghand[] = [
  "//ly.img.ubq/camera",
  "//ly.img.ubq/stack",
  "//ly.img.ubq/camera",
  "//ly.img.ubq/scene",
];
export function canSelect(type: ObjectTypeLonghand) {
  return !NON_SELECTABLE_BLOCK_TYPES.includes(type);
}
const NON_VISIBILITY_TOGGLE_BLOCK_TYPES: ObjectTypeLonghand[] = [
  "//ly.img.ubq/scene",
];
export function canToggleVisibility(id: number, engine: CreativeEngine) {
  const type = engine.block.getType(id);
  if (NON_VISIBILITY_TOGGLE_BLOCK_TYPES.includes(type)) return false;

  return true;
}
