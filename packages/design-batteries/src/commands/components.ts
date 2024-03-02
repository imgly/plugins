import { MimeType } from "@cesdk/cesdk-js";
import { PluginContext } from "@imgly/plugin-api-utils";
import { downloadBlob, loadAsBlob } from "../utils/download";

import { inferBlockName } from "../utils/computeBlockName";
import { exportBlockAs } from "../utils/exportBlockAs";

export const exportComponentToFile = async (ctx: PluginContext, params: { blockIds?: number[]; }) => {
    const { block } = ctx.engine;
    const { blockIds = block.findAllSelected() } = params;

    const componentData = await Promise.all(blockIds.map(async (bId) => {

        const thumbnail = await exportBlockAs(ctx, { blockIds: [bId], mimeType: "image/png" as MimeType, width: 256, height: 256 });
        const cesdk = await exportBlockAs(ctx, { blockIds: [bId], mimeType: "application/x-cesdk" });
        const json = await exportBlockAs(ctx, { blockIds: [bId], mimeType: "application/json" });
        // const zip = await exportBlockAs(ctx, { blockIds: [bId], mimeType: "application/zip" as MimeType })
        return {
            thumbnail: thumbnail[0],
            cesdk: cesdk[0],
            json: json[0],
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

export const importComponent = async (ctx: PluginContext, _params: { blockIds?: number[]; }) => {
    const { engine } = ctx;
    const { scene, block } = engine;


    const data = await loadAsBlob();
    const str = await data.text();
    const bIds = await ctx.engine.block.loadFromString(str);

    const pId = scene.getCurrentPage()!;
    bIds.forEach((bId) => {
        const name = ctx.engine.block.getName(bId) || ctx.engine.block.getUUID(bId);
        console.log("Inserting Block", name);
        block.appendChild(pId, bId);
    });





};
export const exportComponentLibrary = async (ctx: PluginContext, _params: { blockIds?: number[]; }) => {
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



