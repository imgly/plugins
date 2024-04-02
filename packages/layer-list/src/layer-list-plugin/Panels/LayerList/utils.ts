import type { CreativeEngine, ObjectTypeLonghand } from '@cesdk/cesdk-js';

export interface IBlockTree {
  id: number;
  type: ObjectTypeLonghand;
  children: IBlockTree[];
}

export const EXCLUDE_BLOCKS: ObjectTypeLonghand[] = [
  '//ly.img.ubq/scene',
  '//ly.img.ubq/camera',
  '//ly.img.ubq/stack',
  '//ly.img.ubq/camera'
];
const NON_SELECTABLE_BLOCK_TYPES: ObjectTypeLonghand[] = [...EXCLUDE_BLOCKS];

export function canSelect(type: ObjectTypeLonghand) {
  return !NON_SELECTABLE_BLOCK_TYPES.includes(type);
}
const NON_VISIBILITY_TOGGLE_BLOCK_TYPES: ObjectTypeLonghand[] = [
  '//ly.img.ubq/scene'
];
export function canToggleVisibility(id: number, engine: CreativeEngine) {
  const type = engine.block.getType(id);
  if (NON_VISIBILITY_TOGGLE_BLOCK_TYPES.includes(type)) return false;

  return true;
}

export function getBlockName(engine: CreativeEngine, block: number) {
  if (engine.block.getName(block)) {
    return engine.block.getName(block);
  }
  // if type is page, use index if not named
  if (engine.block.getType(block) === '//ly.img.ubq/page') {
    const parent = engine.block.getParent(block);
    if (!parent) return '';
    const children = engine.block.getChildren(parent);
    const index = children.indexOf(block);
    return `Page ${index + 1}`;
  }
  return `[${engine.block.getKind(block)}]`;
}

export function getBlockTree(engine: CreativeEngine, block: number) {
  const tree: IBlockTree = {
    id: block,
    children: [],
    type: engine.block.getType(block)
  };
  const children = engine.block.getChildren(block);
  // iterate from the last child to the first
  for (let i = children.length - 1; i >= 0; i--) {
    // if child is a page, append to reverse the order:
    if (engine.block.getType(children[i]) === '//ly.img.ubq/page') {
      // add page as first child
      tree.children.unshift(getBlockTree(engine, children[i]));
    } else {
      tree.children.push(getBlockTree(engine, children[i]));
    }
  }
  return tree;
}

export function selectBlocks(
  engine: CreativeEngine,
  block: number,
  inBetween: boolean
) {
  if (!inBetween) {
    engine.block.select(block);
    return;
  }
  const currentlySelected = engine.block.findAllSelected();
  const haveSameParent = currentlySelected.some((id) => {
    return engine.block.getParent(id) === engine.block.getParent(block);
  });
  if (currentlySelected.length === 0 || !haveSameParent) return;
  const parent = engine.block.getParent(block);
  if (!parent) return;
  const siblings = engine.block.getChildren(parent);
  const currentIndex = siblings.indexOf(block);
  const currentSelectedIndex = siblings.indexOf(currentlySelected[0]);
  const start = Math.min(currentIndex, currentSelectedIndex);
  const end = Math.max(currentIndex, currentSelectedIndex);
  const newSelectedBlocks = siblings.slice(start, end + 1);
  newSelectedBlocks.forEach((id) => {
    engine.block.setSelected(id, true);
  });
}
