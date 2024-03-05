import { PluginContext } from "@imgly/plugin-core";

export const getTransform = (ctx: PluginContext, bId: number) => {
    const { block } = ctx.engine;
    return {
        x: block.getPositionX(bId),
        y: block.getPositionY(bId),
        width: block.getFrameWidth(bId),
        height: block.getFrameHeight(bId)
    };

};