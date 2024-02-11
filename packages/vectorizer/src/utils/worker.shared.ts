export interface MessageBody {
    method: 'health' | 'imageToJson' | 'imageToSvg' 
    data?: any;
    error?: Error
}



export const runInWorker = (blob: Blob) => new Promise<Blob>((resolve, reject) => {
  const worker = new Worker(new URL('./worker', import.meta.url), { type: 'module' });
  const msg: MessageBody = { method: "imageToJson", data: blob }
  worker.postMessage(msg)
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
