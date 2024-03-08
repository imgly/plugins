import { Context } from "@imgly/plugin-core";

export const selectOnlyThisBlock = (ctx: Context, bId: number) => {
    const { block, scene } = ctx.engine;
    block.findAllSelected().forEach((id) => block.setSelected(id, false));
    block.setSelected(bId, true);
};
