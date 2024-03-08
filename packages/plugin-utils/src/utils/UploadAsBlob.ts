
export async function UploadAsBlob(filter: string = "*") {
    return new Promise<Blob>((resolve, reject) => {
        const upload = document.createElement("input");
        upload.setAttribute("type", "file");
        upload.setAttribute("accept", filter);
        upload.setAttribute("style", "display: none");
        upload.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {

                    const buffer = e.target?.result;
                    if (buffer instanceof ArrayBuffer) {
                        const blob = new Blob([buffer], { type: determineMimeTypeFromFile(file) });
                        upload.remove();
                        resolve(blob);
                    } else {
                        upload.remove();
                        reject(new Error("Invalid buffer"));
                    }
                };
                reader.readAsArrayBuffer(file);
            }
        };

        upload.click();
    });
}



export enum BlobType {
    SVG = "image/svg+xml",
    PNG = "image/png",
    JPG = "image/jpeg",
    JPEG = "image/jpeg",
    GIF = "image/gif",
    WEBP = "image/webp",
    TIFF = "image/tiff",
    BMP = "image/bmp",
    ICO = "image/x-icon",
    JSON = "application/json",
    CSV = "text/csv",
    TXT = "text/plain",
    IDML = "application/vnd.adobe.indesign-idml-package",
    PDF = "application/pdf",
    IMGLY = "application/vnd.imgly.component",
    CESDK = "application/vnd.cesdk.component",
    BINARY = "application/octet-stream",
}


const determineMimeTypeFromFile = (file: File) => {

    if (file.type) return file.type;
    const ext = file.name.split(".").pop();
    return BlobType[ext.toUpperCase()] || BlobType.BINARY;

}