import { Context } from "@imgly/plugin-core";
import { createDefaultBlockByType, createDefaultBlockByKind } from "@imgly/plugin-utils";
import { centerBlockInParent, selectOnlyThisBlock } from "../utils";


export const blockCreatePage = async (ctx: Context, _params: { blockIds?: number[] }) => {

    const { block, scene } = ctx.engine;
    const pId = scene.getCurrentPage() ?? scene.get()!
    const bId = createDefaultBlockByKind(ctx, "page")
    centerBlockInParent(ctx, bId, pId)
    block.appendChild(pId, bId);
    selectOnlyThisBlock(ctx, bId);
}

export const blockCreateImage = async (ctx: Context, _params: { blockIds?: number[] }) => {

    const { block, scene } = ctx.engine;
    const pId = scene.getCurrentPage() ?? scene.get()!
    const bId = createDefaultBlockByKind(ctx, "image")
    centerBlockInParent(ctx, bId, pId)
    block.appendChild(pId, bId);
    selectOnlyThisBlock(ctx, bId);
}


export const blockCreateText = async (ctx: Context, _params: { blockIds?: number[] }) => {
    const { block, scene } = ctx.engine;
    const pId = scene.getCurrentPage() ?? scene.get()!
    const bId = createDefaultBlockByKind(ctx, "text")
    centerBlockInParent(ctx, bId, pId)
    selectOnlyThisBlock(ctx, bId);

    block.appendChild(pId, bId);

    
}



