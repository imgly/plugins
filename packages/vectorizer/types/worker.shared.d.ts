export interface MessageBody {
    method?: string;
    data?: any;
    error?: Error;
}
export declare const runInWorker: (uri: string) => Promise<Blob>;
