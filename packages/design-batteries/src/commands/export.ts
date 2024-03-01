import { PluginContext } from "@imgly/plugin-api-utils";
import { MimeType } from "@cesdk/cesdk-js";
import { downloadBlob, loadAsBlob } from "../utils/download";


export const myNewFunctionForTheEditor = async (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const {block, scene} = ctx.engine;

    const pId = scene.getCurrentPage()

    const bId = block.create("//ly.img.ubq/text")
    block.setName(bId, "Hello World")
    block.setTextColor(bId, {r: 1, g: 0, b: 0, a: 1})
    block.replaceText(bId, "Hello World")


    block.appendChild(pId, bId)

}




export const exportPngToClipboard = async (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const items = (await exportBlockAs(ctx, { ...params, mimeType: "image/png" as MimeType })).map((blob) => {
        return new ClipboardItem({
            ["image/png"]: blob,
        }, { presentationStyle: "attachment" });
    })
    await navigator.clipboard.write(items);
};

export const exportSceneToClipboard = async (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const items = (await exportBlockAs(ctx, { ...params, mimeType: "application/x-cesdk" })).map((blob) => {
        return new ClipboardItem({
            ["text/plain"]: blob,
        }, { presentationStyle: "attachment" });
    })
    await navigator.clipboard.write(items);
};

export const exportJsonToClipboard = async (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const items = (await exportBlockAs(ctx, { ...params, mimeType: "application/json" })).map((blob) => {
        return new ClipboardItem({
            ["text/plain"]: blob,
        }, { presentationStyle: "attachment" });
    })
    await navigator.clipboard.write(items);
};

export const exportPngToFile = async (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const items = (await exportBlockAs(ctx, { ...params, mimeType: "image/png" as MimeType }))
    items.forEach((blob, index) => { downloadBlob(blob, `block-${index}.png`) });
}

export const exportJpegToFile = async (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const items = (await exportBlockAs(ctx, { ...params, mimeType: "image/jpeg" as MimeType }))
    items.forEach((blob, index) => { downloadBlob(blob, `block-${index}.jpeg`) });
}

export const exportWebpToFile = async (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const items = (await exportBlockAs(ctx, { ...params, mimeType: "image/webp" as MimeType }))
    items.forEach((blob, index) => { downloadBlob(blob, `block-${index}.webp`) });
}

export const exportPdfToFile = async (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const items = (await exportBlockAs(ctx, { ...params, mimeType: "application/pdf" as MimeType }))
    items.forEach((blob, index) => { downloadBlob(blob, `block-${index}.pdf`) });
}


export const exportRgba8ToFile = async (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const items = (await exportBlockAs(ctx, { ...params, mimeType: "application/octet-stream" as MimeType }))
    items.forEach((blob, index) => { downloadBlob(blob, `block-${index}.rgba8`) });
}


export const exportSceneToFile = async (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const items = (await exportBlockAs(ctx, { ...params, mimeType: "application/x-cesdk" }))
    items.forEach((blob, index) => { downloadBlob(blob, `block-${index}.cesdk`) });
}


export const exportJsonToFile = async (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const items = (await exportBlockAs(ctx, { ...params, mimeType: "application/json" }))
    items.forEach((blob, index) => { downloadBlob(blob, `block-${index}.json`) });
}



export const exportComponentToFile = async (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const { block } = ctx.engine;
    const { blockIds = block.findAllSelected() } = params;

    const componentData = await Promise.all(blockIds.map(async (bId) => {

        const thumbnail = await exportBlockAs(ctx, { blockIds: [bId], mimeType: "image/png" as MimeType, width: 256, height: 256 })
        const cesdk = await exportBlockAs(ctx, { blockIds: [bId], mimeType: "application/x-cesdk" })
        const json = await exportBlockAs(ctx, { blockIds: [bId], mimeType: "application/json" })
        // const zip = await exportBlockAs(ctx, { blockIds: [bId], mimeType: "application/zip" as MimeType })

        return {
            thumbnail: thumbnail[0],
            cesdk: cesdk[0],
            json: json[0],
            // zip: zip[0],
        }
    }))

    componentData.forEach((data, index) => {
        const blockId = blockIds[index];
        const filename = inferBlockName(ctx, blockId)
        downloadBlob(data.thumbnail, `${filename}.png`)
        downloadBlob(data.cesdk, `${filename}.cesdk`)
    });
}

export const importComponent =  async (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const { engine } = ctx;
    const { editor, scene, block } = engine;
    
    
    const data = await loadAsBlob()
    const str  = await data.text()
    const bIds = await ctx.engine.block.loadFromString(str)
    
    const pId = scene.getCurrentPage()
    bIds.forEach((bId) => {
        const name = ctx.engine.block.getName(bId) || ctx.engine.block.getUUID(bId)
        console.log("Inserting Block", name)
        block.appendChild(pId, bId)
    })
    



    
}
export const exportComponentLibrary = async (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const { block } = ctx.engine;
    const libs = block.findByType("//ly.img.ubq/page")
    const libNames = libs.map((id) => block.getName(id) || block.getUUID(id));

    libs.forEach(async (pId, pIdx) => {
        const pName = block.getName(pId) || block.getUUID(pId)
        const bIds = block.getChildren(pId);
        bIds.forEach(async (bId, bIdx) => {
            const bName = block.getName(bId) || block.getUUID(bId);
            const thumbnail = await exportBlockAs(ctx, { blockIds: [bId], mimeType: "image/png" as MimeType, width: 256, height: 256 })
            const cesdk = await exportBlockAs(ctx, { blockIds: [bId], mimeType: "application/x-cesdk" })
            const filename = `${pName}-${bName}`
            downloadBlob(thumbnail[0], `${filename}.png`)
            downloadBlob(cesdk[0], `${filename}.cesdk`)
        })
    })


}

// Utils 


const inferBlockName = (ctx: PluginContext, blockId: number) => {
    const { block } = ctx.engine;
    const uuid = block.getUUID(blockId);
    const name = block.getName(blockId)
    return name || uuid || blockId
}

const exportBlockAs = async (ctx: PluginContext, params: { blockIds?: number[], mimeType?: MimeType | 'application/x-cesdk' | 'application/json', width?: number, height?: number }) => {
    const { block } = ctx.engine;
    const {
        blockIds = block.findAllSelected(),
        mimeType = "image/png" as MimeType,
        width,
        height
    } = params;
    blockIds.length === 0 && blockIds.push(ctx.engine.scene.get()!);
    return await Promise.all(blockIds.map(async (bId: number) => {
        switch (mimeType) {
            case "application/x-cesdk": {
                const str = await block.saveToString([bId]);
                return new Blob([str], { type: mimeType });

            }
            case "application/json": {
                const str = await block.saveToString([bId]);
                const json = str.substring(4)
                const decoded = atob(json)
                return new Blob([decoded], { type: mimeType });

            }
            default:
                return await block.export(bId, mimeType, { targetHeight: height, targetWidth: width });
        }

    }));
};

