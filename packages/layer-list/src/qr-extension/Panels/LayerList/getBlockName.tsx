import { CreativeEngine } from "@cesdk/cesdk-js";

export function getBlockName(engine: CreativeEngine, block: number) {
  if (engine.block.getName(block)) {
    return engine.block.getName(block);
  }
  // if type is page, use index if not named
  if (engine.block.getType(block) === "//ly.img.ubq/page") {
    const parent = engine.block.getParent(block);
    if (!parent) return "";
    const children = engine.block.getChildren(parent);
    const index = children.indexOf(block);
    return `Page ${index + 1}`;
  }
  return `[${engine.block.getKind(block)}]`;
}
