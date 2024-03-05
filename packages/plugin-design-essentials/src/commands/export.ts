import { PluginContext } from "../../../plugin-core/types";
import { MimeType } from "@cesdk/cesdk-js";
import { downloadBlob } from "../utils/download";
import { exportBlockAs } from "../utils/exportBlockAs";




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

