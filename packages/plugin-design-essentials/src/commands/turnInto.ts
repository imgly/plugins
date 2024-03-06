import { PluginContext } from "@imgly/plugin-core";
import { turnBlockInto } from "@imgly/plugin-utils";

export const blockTurnIntoGraphic = (ctx: PluginContext, params: { blockIds: number[] }) => {
    const { block } = ctx.engine;
    const { blockIds = block.findAllSelected() } = params;

    blockIds.forEach((id) => turnBlockInto(ctx, "graphic", id))

}

export const blockTurnIntoText = (ctx: PluginContext, params: { blockIds: number[] }) => {
    const { block } = ctx.engine;
    const { blockIds = block.findAllSelected() } = params;

    blockIds.forEach((id) => turnBlockInto(ctx, "text", id))
}

export const blockTurnIntoPage = (ctx: PluginContext, params: { blockIds: number[] }) => {
    const { block } = ctx.engine;
    const { blockIds = block.findAllSelected() } = params;

    blockIds.forEach((id) => turnBlockInto(ctx, "page", id))
}