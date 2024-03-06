
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
                        const blob = new Blob([buffer]);
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
