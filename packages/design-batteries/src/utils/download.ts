import CreativeEditorSDK from "@cesdk/cesdk-js";



export async function loadAsBlob(filter: string = "*") {
    return new Promise<Blob>((resolve, reject) => {
        const upload = document.createElement("input");
        upload.setAttribute("type", "file");
        upload.setAttribute("accept", filter)
        upload.setAttribute("style", "display: none")
        upload.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const buffer = e.target?.result
                    if (buffer instanceof ArrayBuffer) {
                        const blob = new Blob([buffer]);
                        upload.remove()
                        resolve(blob)
                    } else {
                        upload.remove()
                        reject(new Error("Invalid buffer"))
                    }
                }
                reader.readAsArrayBuffer(file);
            }
        }

        upload.click()
    })
}

export function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}
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


