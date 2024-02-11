export interface MessageBody {
    method: 'health' | 'imageToJson' | 'imageToSvg';
    data?: any;
    error?: Error;
}
export declare const runInWorker: (uri: string) => Promise<Blob>;
