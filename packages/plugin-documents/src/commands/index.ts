import { PluginContext } from "@imgly/plugin-core";
export const blockDelete = async (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const { block } = ctx.engine;
    const { blockIds = block.findAllSelected() } = params;
    blockIds.forEach((id: number) => {
        ctx.engine.block.isValid(id) && ctx.engine.block.destroy(id)
    });
}
