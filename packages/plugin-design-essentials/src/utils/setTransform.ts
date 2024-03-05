import { PluginContext } from "@imgly/plugin-core";

export const setTransform = (ctx: PluginContext, bId: number, transform: any) => {
    const { block } = ctx.engine;
    const { x, y, width, height } = transform;
    x && block.setPositionX(bId, x);
    y && block.setPositionY(bId, y);
    width && block.setWidth(bId, width);
    height && block.setHeight(bId, height);
};
