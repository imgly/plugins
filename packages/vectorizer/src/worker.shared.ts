export interface MessageBody {
    method?: string,
    data?: any;
    error?: Error
}
// 


export const runInWorker = (uri: string) => new Promise<Blob>((resolve, reject) => {
  const worker = new Worker(new URL('./worker', import.meta.url), { type: 'module' });
  worker.postMessage({ data: uri })
  worker.onmessage = (e: MessageEvent<MessageBody>) => {
    const msg = e.data
    if (msg.error) {
      reject(msg.error)
      return;
    }
    resolve(msg.data)
    // when done terminate
    worker.terminate()
  }

})
