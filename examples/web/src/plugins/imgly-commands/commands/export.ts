import { PluginContext } from "@imgly/plugin-api-utils";
import { MimeType } from "@cesdk/cesdk-js";
import { downloadBlob } from "../../../utils/download";

// const __template = async (ctx: PluginContext, params: { blockIds?: number[] }) => {


const exportAsPngs = async (ctx: PluginContext, params: { blockIds?: number[], mimeType?: MimeType }) => {
    const { block } = ctx.engine;
    const { blockIds = block.findAllSelected(), mimeType = "image/png" as MimeType } = params;
    blockIds.length === 0 && blockIds.push(ctx.engine.scene.get()!);

    return await Promise.all(blockIds.map(async (bId: number) => {
        return await block.export(bId, mimeType);
    }));
};


export const exportPngToClipboard = async (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const items = (await exportAsPngs(ctx, { ...params, mimeType: "image/png" as MimeType })).map((blob) => {
        return new ClipboardItem({
            ["image/png"]: blob,
        }, { presentationStyle: "attachment" });
    })
    await navigator.clipboard.write(items);
};

export const exportPngToFile = async (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const items = (await exportAsPngs(ctx, { ...params, mimeType: "image/png" as MimeType }))
    items.forEach((blob, index) => { downloadBlob(blob, `block-${index}.png`) });
}

export const exportJpegToFile = async (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const items = (await exportAsPngs(ctx, { ...params, mimeType: "image/jpeg" as MimeType }))
    items.forEach((blob, index) => { downloadBlob(blob, `block-${index}.jpeg`) });
}

export const exportWebpToFile = async (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const items = (await exportAsPngs(ctx, { ...params, mimeType: "image/webp" as MimeType }))
    items.forEach((blob, index) => { downloadBlob(blob, `block-${index}.webp`) });
}

export const exportPdfToFile = async (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const items = (await exportAsPngs(ctx, { ...params, mimeType: "application/pdf" as MimeType }))
    items.forEach((blob, index) => { downloadBlob(blob, `block-${index}.pdf`) });
}


export const exportRgba8ToFile = async (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const items = (await exportAsPngs(ctx, { ...params, mimeType: "application/octet-stream" as MimeType }))
    items.forEach((blob, index) => { downloadBlob(blob, `block-${index}.rgba8`) });
}


export const exportSceneToClipboard = async (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const { block } = ctx.engine;
    const { blockIds = block.findAllSelected() } = params;
    blockIds.length === 0 && blockIds.push(ctx.engine.scene.get()!);
    const blob = new Blob([await block.saveToString(blockIds)], { type: "application/x-cesdk" });
    await navigator.clipboard.writeText(await blob.text());
};


export const exportJSONToClipboard = async (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const { block } = ctx.engine;
    const { blockIds = block.findAllSelected() } = params;
    blockIds.length === 0 && blockIds.push(ctx.engine.scene.get()!);

    const str = await block.saveToString(blockIds);
    const base64 = str.substring(4);
    const json = atob(base64);
    const blob = new Blob([json], { type: "application/json" });
    await navigator.clipboard.writeText(await blob.text());
};

