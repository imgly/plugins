
import { MimeType } from "@cesdk/cesdk-js";
import { Context } from "@imgly/plugin-core";
import * as errors from "../errors";
import { downloadBlob, UploadAsBlob, BlobType, inferBlockName, exportBlockAs, setBlockTransform } from "@imgly/plugin-utils";

export const componentSelectionExport = async (ctx: Context, params: { blockIds?: number[]; }) => {
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


export const componentLibraryExport = async (ctx: Context, _params: { blockIds?: number[]; }) => {
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



