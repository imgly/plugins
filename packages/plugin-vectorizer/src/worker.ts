
import type { MessageBody } from "./utils/worker.shared";
import * as vectorizer from '@imgly/vectorizer';

self.onmessage = async function (e: MessageEvent<MessageBody>) {
  try {
    const msg = e.data; 0
    const data = msg.data ?? {}
    const method = msg.method ?? '' // default to empty string
    switch (method) {
      case "health": {
        postMessage({ data: 'ok' })
        break;
      }
      case "imageToJson":
        {
          const json = await vectorizer.imageToJson(data)
          postMessage({ data: json });
          break;
        }
      case "imageToSvg":
        {
          const svg = await vectorizer.imageToSvg(data)
          postMessage({ data: svg });
          
          break;
        }
      default:
        postMessage({ error: new Error("Unknown method") });
    }
  } catch (err) {
    postMessage({ error: err });
  }
}