import { PluginContext } from "@imgly/plugin-api-utils";

export const blockDelete = async (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const { block } = ctx.engine;
    const { blockIds = block.findAllSelected() } = params;
    blockIds.forEach((id: number) => {
        ctx.engine.block.isValid(id) && ctx.engine.block.destroy(id)
    });
}

export const blockDuplicate = async (ctx: PluginContext, params: { blockIds?: number[] }) => {
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


export const blockRename = async (ctx: PluginContext, params: { blockIds?: number[] }) => {
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
export const blockBringForward = async (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const { block } = ctx.engine;
    const { blockIds = block.findAllSelected() } = params;
    blockIds.forEach((id: number) => {
        block.bringForward(id);
    });
}

export const blockSendBackward = async (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const { block } = ctx.engine;
    const { blockIds = block.findAllSelected() } = params;
    blockIds.forEach((id: number) => {
        block.sendBackward(id);
    });
}

export const blockBringToFront = async (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const { block } = ctx.engine;
    const { blockIds = block.findAllSelected() } = params;
    blockIds.forEach((id: number) => {
        block.bringToFront(id);
    });
}

export const blockSendToBack = async (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const { block } = ctx.engine;
    const { blockIds = block.findAllSelected() } = params;
    blockIds.forEach((id: number) => {
        block.sendToBack(id);
    })
}
