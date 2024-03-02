import { PluginContext } from "@imgly/plugin-api-utils";


export const groupBlocks = async (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const { block } = ctx.engine;
    const {
        blockIds = block.findAllSelected(),
    } = params;
    if (blockIds.length < 1) return;

    const group = block.group(blockIds);
    blockIds.forEach((id: number) => block.isSelected(id) && block.setSelected(id, false));
    block.setSelected(group, true);
}


export const ungroupBlocks = async (ctx: PluginContext, params: { blockIds?: number[] }) => {

    const { block } = ctx.engine;
    const {
        blockIds = block.findAllSelected(),
    } = params;
    if (blockIds.length !== 1) return;

    const blockId = blockIds[0];
    const isSelected = block.isSelected(blockId);
    if (block.getType(blockId) !== '//ly.img.ubq/group') return;
    const childIds = block.getChildren(blockId);
    block.ungroup(blockId); // Note – ungroup should return the IDs
    childIds.forEach((id: number) => block.setSelected(id, isSelected));


}

