import CreativeEditorSDK from "@cesdk/cesdk-js";
export declare function loadAsBlob(filter?: string): Promise<Blob>;
export declare function downloadBlob(blob: Blob, filename: string): void;
export declare const downloadBlocks: (cesdk: CreativeEditorSDK, blobs: Blob[], options: {
    mimeType: string;
    pages?: number[];
}) => Promise<void>;
