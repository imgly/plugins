import { Context } from "@imgly/plugin-core";
import { setBlockTransform , createDefaultBlockByType } from "@imgly/plugin-utils";


export const blockDelete = async (ctx: Context, params: { blockIds?: number[] }) => {
    const { block } = ctx.engine;
    const { blockIds = block.findAllSelected() } = params;
    blockIds.forEach((id: number) => {
        ctx.engine.block.isValid(id) && ctx.engine.block.destroy(id)
    });
}

export const blockDuplicate = async (ctx: Context, params: { blockIds?: number[] }) => {
    const { block } = ctx.engine;
    const { blockIds = block.findAllSelected() } = params;
    blockIds.forEach((id: number) => {
        block.isValid(id);
        const newBlock = block.duplicate(id);
        const parent = block.getParent(id);
        if (parent && block.isValid(parent)) {
            block.appendChild(parent, newBlock);
        }
        block.setSelected(newBlock, true); // should return the previous state 
        block.setSelected(id, false);

    });
}


export const blockRename = async (ctx: Context, params: { blockIds?: number[] }) => {
    const { block } = ctx.engine;
    const { blockIds = block.findAllSelected() } = params;
    blockIds.forEach((id: number) => {
        block.isValid(id);
        const name = block.getName(id)
        const newName = prompt("Block name", name);
        if (newName) {
            block.setName(id, newName);
        }
    });
}
export const blockBringForward = async (ctx: Context, params: { blockIds?: number[] }) => {
    const { block } = ctx.engine;
    const { blockIds = block.findAllSelected() } = params;
    blockIds.forEach((id: number) => {
        block.bringForward(id);
    });
}

export const blockSendBackward = async (ctx: Context, params: { blockIds?: number[] }) => {
    const { block } = ctx.engine;
    const { blockIds = block.findAllSelected() } = params;
    blockIds.forEach((id: number) => {
        block.sendBackward(id);
    });
}

export const blockBringToFront = async (ctx: Context, params: { blockIds?: number[] }) => {
    const { block } = ctx.engine;
    const { blockIds = block.findAllSelected() } = params;
    blockIds.forEach((id: number) => {
        block.bringToFront(id);
    });
}

export const blockSendToBack = async (ctx: Context, params: { blockIds?: number[] }) => {
    const { block } = ctx.engine;
    const { blockIds = block.findAllSelected() } = params;
    blockIds.forEach((id: number) => {
        block.sendToBack(id);
    })
}


export const blockCreateGraphic = async (ctx: Context, _params: { blockIds?: number[] }) => {

    const { block, scene } = ctx.engine;
    // const { blockIds = block.findAllSelected() } = params;
    const setTransform = (blockId: number, transform: any) => {
        const { x, y, width, height } = transform
        x && block.setPositionX(bId, x)
        y && block.setPositionY(bId, y)
        width && block.setWidth(bId, width)
        height && block.setHeight(bId, height)
    }
    const pId = scene.getCurrentPage() ?? scene.get()!

    const bId = createDefaultBlockByType(ctx, "graphic")
    const width = block.getFrameWidth(pId) / 2.0
    const height = block.getFrameHeight(pId) / 2.0
    const x = width - width / 2.0
    const y = height - height / 2.0
    setTransform(bId, { x, y, width, height })
    block.appendChild(pId, bId);
    block.setSelected(bId, true)
}


export const blockCreateText = async (ctx: Context, _params: { blockIds?: number[] }) => {
    const { block, scene } = ctx.engine;
    // const { blockIds = block.findAllSelected() } = params;

    const pId = scene.getCurrentPage() ?? scene.get()!

    const bId = createDefaultBlockByType(ctx, "text")

    const width = block.getFrameWidth(pId) / 2.0
    const height = block.getFrameHeight(pId) / 2.0
    const x = width - width / 2.0
    const y = height - height / 2.0
    setBlockTransform(ctx, bId, { x, y, width, height })
    block.appendChild(pId, bId);
    block.setSelected(bId, true)
}




