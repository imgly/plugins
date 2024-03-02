import { PluginContext } from "@imgly/plugin-api-utils";
import { readPropValue } from "../utils/cesdk";

export const debugLogBlockProperties = async (ctx: PluginContext, params: { blockIds: number[] }) => {
    const { block, scene } = ctx.engine;
    const { blockIds = block.findAllSelected() } = params;

    blockIds.forEach((bId: number) => {
        const props = block.findAllProperties(bId)
        const propDefinition = new Map<string, { type: string, value: any }>()
        props.forEach((propKey: string) => {
            if (!block.isPropertyReadable(propKey)) return;
            const propType = block.getPropertyType(propKey)
            const propValue = readPropValue(block, bId, propKey, propType)
            propDefinition.set(propKey, { type: propType, value: propValue })
        })
        console.debug("Properties for block", bId, propDefinition)
    })
}

export const debugLogBlockCrop = (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const { block } = ctx.engine;
    const { blockIds = block.findAllSelected() } = params;

    blockIds.forEach((id: number) => {
        const x = block.getCropTranslationX(id)
        const y = block.getCropTranslationY(id)
        const scaleX = block.getCropScaleX(id)
        const scaleY = block.getCropScaleY(id)
        const fillMode = block.getContentFillMode(id)
        const crop = {
            x, y, scaleX, scaleY, fillMode
        }
        console.debug("Crop for block", id, crop)
    });

}



export const debugLogBlockMetadata = async (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const { block } = ctx.engine;
    const { blockIds = block.findAllSelected() } = params;


    blockIds.forEach((id: number) => {
        const keys = block.findAllMetadata(id)
        if (keys.length === 0) {
            console.debug("No metadata for block", id)
            return
        }
        const map = new Map()
        keys.forEach((key: string) => {
            const metadata = block.getMetadata(id, key)
            const obj = JSON.parse(metadata)
            map.set(key, obj)
        })
        console.debug("Metadata for block", id, map)
    })
}
