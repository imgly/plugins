import { PluginContext } from "@imgly/plugin-core";
import { type MimeType } from "@cesdk/cesdk-js";

export const exportBlockAs = async (ctx: PluginContext, params: { blockIds?: number[], mimeType?: MimeType | 'application/x-cesdk' | 'application/json', width?: number, height?: number }) => {
    
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

