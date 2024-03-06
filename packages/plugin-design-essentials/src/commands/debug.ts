import { PluginContext } from "@imgly/plugin-core";
import { readBlockProperty } from "@imgly/plugin-utils";


export const debugLogBlockProperties = async (ctx: PluginContext, params: { blockIds: number[] }) => {
    const { block } = ctx.engine;
    const { blockIds = block.findAllSelected() } = params;

    blockIds.forEach((bId: number) => {
        const props = block.findAllProperties(bId)
        const propDefinition = new Map<string, any>()
        props.forEach((propKey: string) => {
            if (!block.isPropertyReadable(propKey)) return;
            const propType = block.getPropertyType(propKey)
            const propValue = readBlockProperty(block, bId, propKey, propType)
            propDefinition.set(propKey, propValue)
        })
        console.debug("Properties for block", bId, JSON.stringify(Object.fromEntries(propDefinition.entries()), null, 2))
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
        console.debug("Crop for block", id, JSON.stringify(crop, null, 2))
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
        console.debug("Metadata for block", id, JSON.stringify(Object.fromEntries(map.entries()), null, 2))
    })

}

export const debugLogBlockFill = (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const { block } = ctx.engine;
    const { blockIds = block.findAllSelected() } = params;

    blockIds.forEach((bId: number) => {
        const fId = block.getFill(bId)
        const fillType = block.getType(fId)

        const props = block.findAllProperties(fId);

        const propDefinition = new Map<string, any>()
        props.forEach((propKey: string) => {

            if (!block.isPropertyReadable(propKey)) return;
            const propValue = readBlockProperty(block, fId, propKey)
            propDefinition.set(propKey, propValue)
        })
        console.debug("Fill for block", bId, JSON.stringify(Object.fromEntries(propDefinition.entries()), null, 2))
    });
}

export const debugLogBlockEffects = (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const { block } = ctx.engine;
    const { blockIds = block.findAllSelected() } = params;

    blockIds.forEach((bId: number) => {
        const eIds = block.getEffects(bId)

        eIds.forEach((eId: number) => {
            const props = block.findAllProperties(eId);

            const propDefinition = new Map<string, any>()
            props.forEach((propKey: string) => {

                if (!block.isPropertyReadable(propKey)) return;
                const propValue = readBlockProperty(block, eId, propKey)
                propDefinition.set(propKey, propValue)
            })
            console.debug(`Effects ${eId} for block`, bId, JSON.stringify(Object.fromEntries(propDefinition.entries()), null, 2))
        })


    });
}



export const debugLogBlockBlur = (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const { block } = ctx.engine;
    const { blockIds = block.findAllSelected() } = params;

    blockIds.forEach((bId: number) => {
        if (!block.hasBlur(bId)) {
            console.log("No blur for block", bId)
            return
        };
        const eId = block.getBlur(bId)
        if (!block.isValid(eId)) { // that is an error source
            console.log("No valid blur for block", bId)
            return
        };

        const props = block.findAllProperties(eId);

        const propDefinition = new Map<string, any>()
        props.forEach((propKey: string) => {

            if (!block.isPropertyReadable(propKey)) return;
            const propValue = readBlockProperty(block, eId, propKey)
            propDefinition.set(propKey, propValue)


        })
        console.debug(`Blur for block`, bId, JSON.stringify(Object.fromEntries(propDefinition.entries()), null, 2))

    });
}

export const debugLogSceneHierarchy = async (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const { block, scene } = ctx.engine;
    const { blockIds = block.findAllSelected() } = params;
    const sId = scene.get()!

    const blockInfo = (bId: number) => {
        const name = block.getName(bId) || block.getUUID(bId).toString()
        const type = block.getType(bId)
        const cIds = block.getChildren(bId)
        const children =  cIds.map(blockInfo)
        const hierarchy = {name, type, id: bId, children}
        return hierarchy
    }

    const hierarchy = blockInfo(sId);
    console.debug("Scene Hierarchy", JSON.stringify(hierarchy, null, 2))



}
