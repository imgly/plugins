import { Context } from "@imgly/plugin-core";

export const computeMultiSelectionBounds = (ctx: Context, blockIds: number[]) => {

    const { block } = ctx.engine;
    const bounds = blockIds.map((id: number) => {
        return {
            x: block.getFrameX(id),
            y: block.getFrameY(id),
            width: block.getFrameWidth(id),
            height: block.getFrameHeight(id)
        };
    });

    const x = Math.min(...bounds.map(b => b.x));
    const y = Math.min(...bounds.map(b => b.y));
    const width = Math.max(...bounds.map(b => b.x + b.width)) - x;
    const height = Math.max(...bounds.map(b => b.y + b.height)) - y;
    return { x, y, width, height };
};
