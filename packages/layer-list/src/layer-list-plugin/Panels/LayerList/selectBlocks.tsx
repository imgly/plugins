import { CreativeEngine } from "@cesdk/cesdk-js";

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
