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
export const groupLayoutHStack = async (ctx: PluginContext, params: { blockIds?: number[], padding?: number }) => {
    const { block } = ctx.engine;
    const {
        blockIds = block.findAllSelected(),
        padding = 0
    } = params;
    if (blockIds.length !== 1) return;

    const blockId = blockIds[0];
    if (block.getType(blockId) !== '//ly.img.ubq/group') return;

    const children = block.getChildren(blockId);
    if (children.length === 0) return;

    let curXPos = block.getPositionX(children[0])
    let curYPos = block.getPositionY(children[0])
    children.forEach((childId: number) => {
        block.setPositionY(childId, curYPos);
        block.setPositionX(childId, curXPos);
        const width = block.getFrameWidth(childId);
        curXPos += width;
        curXPos += padding;
    })
}

export const groupLayoutVStack = async (ctx: PluginContext, params: { blockIds?: number[], padding?: number }) => {
    const { block } = ctx.engine;
    const {
        blockIds = block.findAllSelected(),
        padding = 0
    } = params;
    if (blockIds.length !== 1) return;

    const blockId = blockIds[0];
    if (block.getType(blockId) !== '//ly.img.ubq/group') return;

    const children = block.getChildren(blockId);
    if (children.length === 0) return;

    let curXPos = block.getPositionX(children[0])
    let curYPos = block.getPositionY(children[0])
    children.forEach((childId: number) => {
        block.setPositionX(childId, curXPos);
        block.setPositionY(childId, curYPos);
        const height = block.getFrameHeight(childId);
        curYPos += height;
        curYPos += padding;
    })
}


export const groupLayoutCircle = async (ctx: PluginContext, params: { blockIds?: number[], padding?: number }) => {
    const { block } = ctx.engine;
    const {
        blockIds = block.findAllSelected(),
        padding = 0
    } = params;
    if (blockIds.length !== 1) return;

    const blockId = blockIds[0];
    if (block.getType(blockId) !== '//ly.img.ubq/group') return;

    const children = block.getChildren(blockId);
    if (children.length === 0) return;

    let curXPos = block.getPositionX(children[0])
    let curYPos = block.getPositionY(children[0])
    children.forEach((childId: number) => {
        block.setPositionX(childId, curXPos);
        block.setPositionY(childId, curYPos);
        const height = block.getFrameHeight(childId);
        curYPos += height;
        curYPos += padding;
    })
}