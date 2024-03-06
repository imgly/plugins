import { Context } from "@imgly/plugin-core";

export const setBlockTransform = (ctx: Context, bId: number, transform: any) => {
    const { block } = ctx.engine;
    const { x, y, width, height } = transform;
    if (x) block.setPositionX(bId, x);
    if (y) block.setPositionY(bId, y);
    if (width) block.setWidth(bId, width);
    if (height) block.setHeight(bId, height);
};
