import { BlockAPI } from "@cesdk/cesdk-js";


export function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}
export const downloadBlocks = (block: BlockAPI, blobs: Blob[], options: { mimeType: string; pages?: number[]; }) => {
    const postfix = options.mimeType.split("/")[1];
    const pageIds = options.pages ?? [];

    blobs.forEach((blob, index) => {
        const pageId = pageIds[index];
        let pageName = `page-${index}`;
        if (pageId) {
            const name = block.getName(pageId);
            pageName = name?.length ? name : pageName;
        }
        const filename = `${pageName}.${postfix}`;
        downloadBlob(blob, filename);
    });
    return Promise.resolve();
};


