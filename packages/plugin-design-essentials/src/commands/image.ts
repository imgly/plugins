import { ContentFillMode } from "@cesdk/cesdk-js"
import { PluginContext } from "../../../plugin-core/types";

const imageFitWithMode = (ctx: PluginContext, params: { blockIds?: number[], fillMode: ContentFillMode }) => {
    const { block } = ctx.engine;
    const { blockIds = block.findAllSelected(), fillMode } = params;
    blockIds.forEach((id: number) => {
        if (!block.hasContentFillMode(id)) return;
        block.setContentFillMode(id, fillMode)
    })
}

export const imageFitModeCrop = async (ctx: PluginContext, params: { blockIds?: number[] }) =>
    imageFitWithMode(ctx, { ...params, fillMode: 'Crop' })

export const imageFitModeCover = async (ctx: PluginContext, params: { blockIds?: number[] }) => imageFitWithMode(ctx, { ...params, fillMode: 'Cover' })

export const imageFitModeContain = async (ctx: PluginContext, params: { blockIds?: number[] }) => imageFitWithMode(ctx, { ...params, fillMode: 'Contain' })