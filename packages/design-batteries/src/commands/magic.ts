// https://github.com/jwagner/smartcrop.js

import { PluginContext } from "@imgly/plugin-api-utils";



export const logCrop = (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const { blockIds = ctx.engine.block.findAllSelected() } = params;

    blockIds.forEach((id: number) => {
        const fillId = ctx.engine.block.getFill(id)
        const isValid = ctx.engine.block.isValid(fillId)
        if (!isValid) return;

        const isImageFill = ctx.engine.block.getType(fillId) === "//ly.img.ubq/fill/image"
        if (!isImageFill) return;

        const x = ctx.engine.block.getCropTranslationX(id)
        const y = ctx.engine.block.getCropTranslationY(id)
        const scaleX = ctx.engine.block.getCropScaleX(id)
        const scaleY = ctx.engine.block.getCropScaleY(id)
        const fillMode = ctx.engine.block.getContentFillMode(id)
        
    
        
        console.log(x, y, scaleX, scaleY, fillMode)
    });

}