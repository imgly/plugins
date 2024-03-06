import CreativeEditorSDK from "@cesdk/cesdk-js";
import { downloadBlob } from "./downloadBlob";




export const downloadBlocks = (cesdk: CreativeEditorSDK, blobs: Blob[], options: { mimeType: string; pages?: number[]; }) => {
    const postfix = options.mimeType.split("/")[1];
    const pageIds = options.pages ?? [];

    blobs.forEach((blob, index) => {
        const pageId = pageIds[index];
        let pageName = `page-${index}`;
        if (pageId) {
            const name = cesdk.engine.block.getName(pageId);
            pageName = name?.length ? name : pageName;
        }
        const filename = `${pageName}.${postfix}`;
        downloadBlob(blob, filename);
    });
    return Promise.resolve();
};
