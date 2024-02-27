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

    const isGroup = (blockIds.length === 1 && block.getType(blockIds[0]) !== '//ly.img.ubq/group')
    const isMultiSelection = blockIds.length > 1

    if (!isGroup && !isMultiSelection) {
        return
    };

    const children = isGroup ? block.getChildren(blockIds[0]) : blockIds;
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
    const isGroup = (blockIds.length === 1 && block.getType(blockIds[0]) !== '//ly.img.ubq/group')
    const isMultiSelection = blockIds.length > 1

    if (!isGroup && !isMultiSelection) {
        return
    };

    const children = isGroup ? block.getChildren(blockIds[0]) : blockIds;
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


export const groupLayoutMasonry = async (ctx: PluginContext, params: { blockIds?: number[], cols?: number, paddingX?: number, paddingY?: number }) => {
    const { block } = ctx.engine;
    const {
        blockIds = block.findAllSelected(),
        paddingX = 16,
        paddingY = 16,
        cols = 2
    } = params;


    const isGroup = (blockIds.length === 1 && block.getType(blockIds[0]) !== '//ly.img.ubq/group')
    const isMultiSelection = blockIds.length > 1

    if (!isGroup && !isMultiSelection) {
        return
    };

    const children = isGroup ? block.getChildren(blockIds[0]) : blockIds;
    const groupWidth = isGroup ? block.getFrameWidth(blockIds[0]) : getMultiSelectionBounds(ctx, blockIds).width;
    const childWidth = groupWidth / cols - paddingX

    console.log(children)
    let rowHeights = []
    for (let i = 0; i < cols; i++) {
        rowHeights.push(0);
    }

    let curXPos = block.getPositionX(children[0])
    let curYPos = block.getPositionY(children[0])
    children.forEach((childId: number) => {
        const w = block.getFrameWidth(childId);
        const h = block.getFrameHeight(childId);
        const aspect = h / w;
        const newWidth = childWidth
        const newHeight = aspect * newWidth;
        block.setWidth(childId, newWidth);
        block.setHeight(childId, newHeight);
        // get column with the "lowest" height 
        const minIndex = rowHeights.indexOf(Math.min(...rowHeights));
        console.log(minIndex, rowHeights[minIndex])
        const xPos = curXPos + minIndex * (childWidth + paddingX);
        const yPos = curYPos + rowHeights[minIndex];
        rowHeights[minIndex] += newHeight + paddingY;
        block.setPositionX(childId, xPos);
        block.setPositionY(childId, yPos);
    })
}


export const groupLayoutCircle = async (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const { block } = ctx.engine;
    const {
        blockIds = block.findAllSelected(),
    } = params;
    const blockId = blockIds[0];
    if (blockIds.length !== 1 || block.getType(blockId) !== '//ly.img.ubq/group') {
        ctx.logger?.info("Only groups are supported")
        return
    };




}


const getMultiSelectionBounds = (ctx: PluginContext, blockIds: number[]) => {

    const { block } = ctx.engine;
    const bounds = blockIds.map((id: number) => {
        return {
            x: block.getFrameX(id),
            y: block.getFrameY(id),
            width: block.getFrameWidth(id),
            height: block.getFrameHeight(id)
        }
    });

    const x = Math.min(...bounds.map(b => b.x));
    const y = Math.min(...bounds.map(b => b.y));
    const width = Math.max(...bounds.map(b => b.x + b.width)) - x;
    const height = Math.max(...bounds.map(b => b.y + b.height)) - y;
    return { x, y, width, height }
}