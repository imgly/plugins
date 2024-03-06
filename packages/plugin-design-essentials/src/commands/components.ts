import { MimeType } from "@cesdk/cesdk-js";
import { Context } from "@imgly/plugin-core";
import { downloadBlob , UploadAsBlob , inferBlockName , exportBlockAs } from "@imgly/plugin-utils";



export const exportComponentToFile = async (ctx: Context, params: { blockIds?: number[]; }) => {
    const { block } = ctx.engine;
    const { blockIds = block.findAllSelected() } = params;

    const componentData = await Promise.all(blockIds.map(async (bId) => {

        const thumbnail = await exportBlockAs(ctx, { blockIds: [bId], mimeType: "image/png" as MimeType, width: 256, height: 256 });
        const cesdk = await exportBlockAs(ctx, { blockIds: [bId], mimeType: "application/x-cesdk" });
        return {
            thumbnail: thumbnail[0],
            cesdk: cesdk[0],
            
            // zip: zip[0],
        };
    }));

    componentData.forEach((data, index) => {
        const blockId = blockIds[index];
        const filename = inferBlockName(ctx.engine.block, blockId);
        downloadBlob(data.thumbnail, `${filename}.png`);
        downloadBlob(data.cesdk, `${filename}.cesdk`);
    });
};

export const importComponent = async (ctx: Context, _params: { blockIds?: number[]; }) => {
    const { engine } = ctx;
    const { scene, block } = engine;

    const data = await UploadAsBlob();
    const str = await data.text();
    const bIds = await ctx.engine.block.loadFromString(str);

    const pId = scene.getCurrentPage()!;
    bIds.forEach((bId) => {
        const name = ctx.engine.block.getName(bId) || ctx.engine.block.getUUID(bId);
        const type = ctx.engine.block.getType(bId);
        const isGroup = type === "//ly.img.ubq/group";
        console.log("Inserting Block", name);
        console.log("Block Type", type);    
        if (isGroup) { // // ugly workaround for groups after loading. How does duplicate work?
            const childIds = block.getChildren(bId);
            block.ungroup(bId)
            childIds.forEach((childId) => {
                block.appendChild(pId, childId);
            })
            block.group(childIds);
        } else{
            block.appendChild(pId, bId);
        }
    });





};
export const exportComponentLibrary = async (ctx: Context, _params: { blockIds?: number[]; }) => {
    const { block } = ctx.engine;
    const libs = block.findByType("//ly.img.ubq/page");

    libs.forEach(async (pId) => {
        const pName = block.getName(pId) || block.getUUID(pId);
        const bIds = block.getChildren(pId);
        bIds.forEach(async (bId) => {
            const bName = block.getName(bId) || block.getUUID(bId);
            const thumbnail = await exportBlockAs(ctx, { blockIds: [bId], mimeType: "image/png" as MimeType, width: 256, height: 256 });
            const cesdk = await exportBlockAs(ctx, { blockIds: [bId], mimeType: "application/x-cesdk" });
            const filename = `${pName}-${bName}`;
            downloadBlob(thumbnail[0], `${filename}.png`);
            downloadBlob(cesdk[0], `${filename}.cesdk`);
        });
    });


};



