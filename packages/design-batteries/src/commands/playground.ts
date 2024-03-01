// EXPORT AS LIBRARY
// SYNC BY NAME - two pages, same name

import { PluginContext } from "@imgly/plugin-api-utils";
import { readPropValue, writePropValue } from "../utils/cesdk";
import { createElement } from "react";
// Idea sync by name... if two have the same name, they sync




const syncProperties = (ctx: PluginContext, propertyKeys: string[], sourceId: number, destIds: number[]) => {
    const { block } = ctx.engine;
    if (!block.isValid(sourceId)) return

    propertyKeys.forEach((propertyKey: string) => {
        const sourceValue = readPropValue(block, sourceId, propertyKey)
        destIds.forEach((receiverBlockId: number) => {
            if (!block.isValid(receiverBlockId)) return
            if (sourceId === receiverBlockId) return;
            const receiverValue = readPropValue(block, receiverBlockId, propertyKey)
            if (receiverValue === sourceValue) return;
            writePropValue(block, receiverBlockId, propertyKey, sourceValue)
        })
    })
}


// name syntax = "label=appearance(other), rotation(other)"
export const syncBlocks = async (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const { block, event } = ctx.engine;
    let { blockIds = block.findAllSelected() } = params
    console.log("syncBlocks", block.findAllProperties(blockIds[0]))
    const properties = [
        "opacity", "blend/mode", "rotation",
        'dropShadow/blurRadius/x', 'dropShadow/blurRadius/y', 'dropShadow/clip', 'dropShadow/color', 'dropShadow/enabled', 'dropShadow/offset/x', 'dropShadow/offset/y']
        
    const unsubscribe = event.subscribe(blockIds, (events) => {
        events.forEach((event) => {
            const bId = event.block;
            switch (event.type) {
                case 'Created': {
                    // throw new Error("Not implemented")
                    // break;
                }
                case 'Updated': {
                    syncProperties(ctx, properties, bId, blockIds)
                    break;
                }
                case "Destroyed": {
                    if (blockIds.includes(bId)) {
                        blockIds.splice(blockIds.indexOf(bId), 1)
                    }
                    if (blockIds.length === 1) {
                        unsubscribe()
                    }
                    break;
                }
            }
        })
    })

}

export const registerAndOpenCustomPanel = async (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const { ui } = ctx;
    ui.unstable_registerCustomPanel('ly.img.foo', (domElement) => {
        domElement.appendChild(document.createTextNode('Hello World'));
        return () => {
            console.log('Apps disposer called');
        };
    });

    ui.openPanel("ly.img.foo")
}


const products = {
    "instagram_story": {
        kind: "story",
        resolution: {
            width: "1080px", height: "1920px"
        },
    },
}


export const productSetInstagram = async (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const { block } = ctx.engine;
    const { blockIds = block.findAllSelected() } = params;
    const resolution = products.instagram_story.resolution;
    const width = parseValueWithUnit(resolution.width)
    const height = parseValueWithUnit(resolution.height)


    blockIds.forEach((id: number) => {
        const widthInDu = unitToDesignUnit(width.value, width.unit, ctx)
        const heightInDu = unitToDesignUnit(height.value, height.unit, ctx)
        console.log(widthInDu, heightInDu)
        block.setHeight(id, heightInDu)
        // block.setHeightMode(id, unitToMode(height.unit))
        block.setWidth(id, widthInDu)
        // block.setWidthMode(id, unitToMode(width.unit))
    })
}

export const playground = async (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const { block, event, scene } = ctx.engine;
    const { blockIds = block.findAllSelected() } = params;

    // check distance to parent edges 
    type Distance = {
        top: number;
        left: number;
        centerX: number;
        centerY: number;
        bottom: number;
        right: number;
    }
    type Anchors = {
        top: boolean;
        left: boolean;
        centerX: boolean;
        centerY: boolean;
        bottom: boolean;
        right: boolean;
    }

    const calcDistance = (fromId, toId) => {
        const bId = fromId
        const pId = toId
        const bX = block.getGlobalBoundingBoxX(bId)
        const bY = block.getGlobalBoundingBoxY(bId)

        const bWidth = block.getGlobalBoundingBoxWidth(bId)
        const bheight = block.getGlobalBoundingBoxHeight(bId)
        const bCenterX = bX + bWidth / 2
        const bCenterY = bY + bheight / 2

        const pX = block.getGlobalBoundingBoxX(pId)
        const pY = block.getGlobalBoundingBoxY(pId)
        const pWidth = block.getGlobalBoundingBoxWidth(pId)
        const pheight = block.getGlobalBoundingBoxHeight(pId)
        const pCenterX = pX + pWidth / 2
        const pCenterY = pY + pheight / 2

        const left = pX - bX
        const top = pY - bY
        const right = pX + pWidth - bX - bWidth
        const bottom = pY + pheight - bY - bheight
        const centerX = bCenterX - pCenterX
        const centerY = bCenterY - pCenterY

        return { left, top, centerX, centerY, right, bottom }
    }

    const distances = blockIds.map((bId: number): Distance => {
        return calcDistance(bId, block.getParent(bId));
    })


    event.subscribe(blockIds, (events) => {
        events.forEach((event) => {
            switch (event.type) {
                case "Created": break;
                case "Updated": {
                    const pId = block.getParent(event.block)
                    const dist = calcDistance(event.block, pId)
                    const height = block.getGlobalBoundingBoxHeight(pId)
                    const width = block.getGlobalBoundingBoxWidth(pId)
                    console.log(width, height, dist)
                    const distInPercent = {
                        top: (dist.top / height) * 100,
                        left: (dist.left / width) * 100,
                        right: (dist.right / width) * 100,
                        bottom: (dist.bottom / height) * 100,
                        centerX: (dist.centerX / width) * 100,
                        centerY: (dist.centerY / height) * 100,
                    };
                    console.log(JSON.stringify(distInPercent, null, 2));

                    const threshold = 1 // percent
                    const anchors: Anchors = {
                        top: Math.abs(distInPercent.top) < threshold,
                        left: Math.abs(distInPercent.left) < threshold,
                        right: Math.abs(distInPercent.right) < threshold,
                        bottom: Math.abs(distInPercent.bottom) < threshold,
                        centerX: Math.abs(distInPercent.centerX) < threshold,
                        centerY: Math.abs(distInPercent.centerY) < threshold,
                    }
                    console.log(JSON.stringify(anchors, null, 2));
                    break;
                }
                case "Destroyed": break;
            }
        })

    })

    // snap to edge with offset 


}












// Utils


type ValueWithUnit = {
    value: number;
    unit: string;
};

function parseValueWithUnit(string: string | number): ValueWithUnit | null {
    const isNumber = typeof string === "number"
    if (isNumber) {
        return {
            value: string,
            unit: ""
        }
    }
    const regex = /^(\d+(?:\.\d+)?)([a-z%]*)$/i;
    const match = string.match(regex);

    if (match) {
        return {
            value: parseFloat(match[1]),
            unit: match[2],
        };
    }
    return null;
}

function unitToMode(unit: string) {
    switch (unit) {
        case "%": return "Percent"
        case "px":
        case "mm":
        case "in":
        default: return "Absolute"
    }
}


function unitToDesignUnit(value: number, unit: string, ctx: PluginContext) {
    switch (unit) {
        case "%": return value
        case "px": return pixelToDesignUnit(ctx.engine, value)
        case "mm": return mmToDesignUnit(ctx.engine, value)
        case "in": return inToDesignUnit(ctx.engine, value)
    }
}





const inToDesignUnit = (engine, inch) => {
    const sceneId = engine.scene.get()!
    const sceneUnit = engine.block.getEnum(sceneId, 'scene/designUnit');
    const dpi = engine.block.getFloat(sceneId, 'scene/dpi')

    switch (sceneUnit) {
        case "Millimeter": return inch * 2.54;
        case "Inch": return inch;
        case "Pixel": return inch * dpi;
    }

};


const mmToDesignUnit = (engine, mm) => {
    const sceneId = engine.scene.get()!
    const sceneUnit = engine.block.getEnum(sceneId, 'scene/designUnit');
    const dpi = engine.block.getFloat(sceneId, 'scene/dpi')

    switch (sceneUnit) {
        case "Millimeter": return mm;
        case "Inch": return mm / 25.4;
        case "Pixel": return mm / 25.4 * dpi;
    }

};


const pixelToDesignUnit = (engine, pixel) => {
    const sceneId = engine.scene.get()
    const sceneUnit = engine.block.getEnum(sceneId, 'scene/designUnit');
    const dpi = engine.block.getFloat(sceneId, 'scene/dpi')

    switch (sceneUnit) {
        case "Millimeter": return pixel * 25.4 / dpi;
        case "Inch": return pixel / dpi;
        case "Pixel": return pixel;
    }
};
