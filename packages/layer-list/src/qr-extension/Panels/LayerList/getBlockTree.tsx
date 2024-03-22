import { CreativeEngine } from "@cesdk/cesdk-js";
import { IBlockTree } from "./utils";

export function getBlockTree(engine: CreativeEngine, block: number) {
  const tree: IBlockTree = {
    id: block,
    children: [],
    type: engine.block.getType(block),
  };
  const children = engine.block.getChildren(block);
  // iterate from the last child to the first
  for (let i = children.length - 1; i >= 0; i--) {
    // if child is a page, append to reverse the order:
    if (engine.block.getType(children[i]) === "//ly.img.ubq/page") {
      // add page as first child
      tree.children.unshift(getBlockTree(engine, children[i]));
    } else {
      tree.children.push(getBlockTree(engine, children[i]));
    }
  }
  return tree;
}
