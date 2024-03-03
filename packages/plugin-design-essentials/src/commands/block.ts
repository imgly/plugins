import { PluginContext } from "@imgly/plugin-core";
import { ary, create } from "lodash";
import { setTransform } from "../utils/setTransform";
import { turnBlockInto } from "../utils/turnBlockInto";

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


export const blockCreateGraphic = async (ctx: PluginContext, _params: { blockIds?: number[] }) => {

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


export const blockCreateText = async (ctx: PluginContext, _params: { blockIds?: number[] }) => {
    const { block, scene } = ctx.engine;
    // const { blockIds = block.findAllSelected() } = params;

    const pId = scene.getCurrentPage() ?? scene.get()!

    const bId = createDefaultBlockByType(ctx, "text")

    const width = block.getFrameWidth(pId) / 2.0
    const height = block.getFrameHeight(pId) / 2.0
    const x = width - width / 2.0
    const y = height - height / 2.0
    setTransform(ctx, bId, { x, y, width, height })
    block.appendChild(pId, bId);
    block.setSelected(bId, true)
}



// UTILS 

export const createDefaultBlockByType = (ctx: PluginContext, type: string) => {
    const { block } = ctx.engine;
    switch (type) {

        case "graphic": {
            const bId = block.create("graphic")
            const sId = block.createShape("rect")
            const fId = block.createFill("//ly.img.ubq/fill/image")
            block.setShape(bId, sId)
            block.setFill(bId, fId)
            block.setName(bId, type.toUpperCase())
            return bId
        }
        case "page": {
            const bId = block.create("page")
            block.setName(bId, type.toUpperCase())
            return bId
        }
        case "text": {
            const bId = block.create("graphic")
            block.replaceText(bId, "Hello World")
            block.setName(bId, type.toUpperCase())
            return bId
        }
        default: throw new Error("Invalid type")
    }
}


