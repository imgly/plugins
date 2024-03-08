import { Context } from "@imgly/plugin-core";
import { setBlockTransform } from "@imgly/plugin-utils";

export const centerBlockInParent = (ctx: Context, bId: number, pId: number) => {
    const { block, scene } = ctx.engine;
    const width = block.getFrameWidth(pId) / 2;
    const height = block.getFrameHeight(pId) / 2;
    const x = width - width / 2;
    const y = height - height / 2;
    setBlockTransform(ctx, bId, { x, y, width, height });
};
