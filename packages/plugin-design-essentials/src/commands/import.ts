// .txt, .cesdk, .png, .jpg, .jpeg, .webp, .pdf, 
// .csv ... generate a new page from each row and replace the content of the blocks with the values from the row 
import { Context } from "@imgly/plugin-core";
import * as errors from "../errors";
import { UploadAsBlob, BlobType, setBlockTransform } from "@imgly/plugin-utils";
import { createDefaultBlockByKind } from "@imgly/plugin-utils";
import { computeImageSize } from "../utils/computeImageSize";
export const importAnything = async (ctx: Context, _params: { blockIds?: number[]; }) => {

    const data = await UploadAsBlob();

    switch (data.type) {
        case BlobType.CESDK: {
            await importCESDK(ctx, data)
            break
        }
        case BlobType.WEBP:
        case BlobType.JPEG:
        case BlobType.JPG:
        case BlobType.PNG: {
            await importImage(ctx, data)
            break
        }
        case BlobType.TXT: {
            await importText(ctx, data)
            break
        }
        case BlobType.CSV: {
            errors.notImplemented("importCSV")
            break
        }
        case BlobType.PDF: 
        case BlobType.AI:
            errors.notImplemented("importPDF")
            break;

        default: errors.notImplemented(`importAnything: ${data.type}`)
    }

}


const importText = async (ctx: Context, data: Blob) => {
    const { engine } = ctx;
    const { scene, block } = engine;

    const pId = scene.getCurrentPage() ?? scene.get()!
    const bId = createDefaultBlockByKind(ctx, "text")
    const width = block.getFrameWidth(pId) / 2.0
    const height = block.getFrameHeight(pId) / 2.0
    const x = width - width / 2.0
    const y = height - height / 2.0
    setBlockTransform(ctx, bId, { x, y, width, height })
    block.appendChild(pId, bId);
    block.findAllSelected().forEach((id) => block.setSelected(id, false))
    block.setSelected(bId, true)
    block.replaceText(bId, await data.text())

    block.appendChild(pId, bId);
}

const importImage = async (ctx: Context, data: Blob) => {
    const { engine } = ctx;
    const { scene, block } = engine;

    const url = URL.createObjectURL(data)
    const { width: imageWidth, height: imageHeight } = await computeImageSize(url)
    const pId = scene.getCurrentPage() ?? scene.get()!
    const bId = createDefaultBlockByKind(ctx, "image")
    console.log(imageWidth, imageHeight)

    const width = imageWidth
    const height = imageHeight
    const x = block.getFrameWidth(pId)/2 - width / 2.0
    const y = block.getFrameHeight(pId)/2 - height / 2.0
    console.log({ x, y, width, height })
    setBlockTransform(ctx, bId, { x, y, width, height })





    block.appendChild(pId, bId);
    block.findAllSelected().forEach((id) => block.setSelected(id, false))
    block.setSelected(bId, true)
    const fId = block.getFill(bId)!
    block.setString(fId, 'fill/image/imageFileURI', url);
    block.setSourceSet(fId, 'fill/image/sourceSet', []);
    block.appendChild(pId, bId);
}
const insertScene = (ctx: Context, bId: number) => {
    /**
     * 1. import scene and replace scene
     * 2. import all pages from scene and append
     */
    errors.notImplemented("insertScene")

    // const { block, scene } = ctx.engine;
    // const pId = scene.get()!

    // // find insertion point
    // const cIds = block.getChildren(pId)
    // //remove old children
    // const sId = cIds.find((cId) => {
    //     const isStack = (block.getType(cId) === "//ly.img.ubq/stack")
    //     return isStack
    // }) ?? pId; 

    // remove old children
    // block.getChildren(sId).forEach((cId) => block.destroy(cId))


    //append new children to the block
    // block.getChildren(bId).forEach((cId) => block.appendChild(pId, cId))

    // block.destroy(bId) // maybe remove the

}
const insertPage = (ctx: Context, bId: number, pId?: number) => {
    /**
     * 1. import page when scene is selected and append
     * 2. import page "content" into active page or group and resize the page 
     */
    const { block, scene } = ctx.engine;
    pId = scene.get()!;
    const cIds = block.getChildren(pId);
    const sId = cIds.find((cId) => {
        const isStack = (block.getType(cId) === "//ly.img.ubq/stack")
        return isStack
    })
    const hasStack = sId !== -1
    pId = hasStack ? sId! : pId!

    block.appendChild(pId, bId);


}

const insertGraphic = (ctx: Context, gId: number, pId?: number) => {
    const { block, scene, editor } = ctx.engine;
    pId ??= scene.getCurrentPage()!;
    block.appendChild(pId, gId);
}

const insertText = (ctx: Context, gId: number, pId?: number) => {
    const { block, scene } = ctx.engine;
    pId ??= scene.getCurrentPage()!;
    block.appendChild(pId, gId);
}



const insertGroup = (ctx: Context, gId: number, pId?: number) => {

    const { block, scene } = ctx.engine;
    pId ??= scene.getCurrentPage()!;
    const cIds = block.getChildren(gId);
    block.ungroup(gId)
    cIds.forEach((cId) => {
        block.appendChild(pId!, cId);
    })
    block.appendChild(pId, block.group(cIds));
}
const importCESDK = async (ctx: Context, blob: Blob, pId?: number) => {
    const str = await blob.text();
    const bIds = await ctx.engine.block.loadFromString(str);
    bIds.forEach((bId) => {
        const type = ctx.engine.block.getType(bId);
        switch (type) {
            case "//ly.img.ubq/page":
                insertPage(ctx, bId);
                break;
            case "//ly.img.ubq/scene":
                insertScene(ctx, bId);
                break;
            case "//ly.img.ubq/group":
                insertGroup(ctx, bId);
                break;
            case "//ly.img.ubq/graphic":
                insertGraphic(ctx, bId);
                break;
            case "//ly.img.ubq/text":
                insertText(ctx, bId);
                break;
            case "//ly.img.ubq/audio":
                errors.notImplemented("Import audio")
                break;
        }

    });

};