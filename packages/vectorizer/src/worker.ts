
import type { MessageBody } from "./worker.shared";
import * as vectorizer from '@imgly/vectorizer';

self.onmessage = async function (e: MessageEvent<MessageBody>) {
  const msg = e.data;0
 const data = msg.data ?? {}
  const method = msg.method ?? '' // default to empty string
  switch (method) {
    case "health": {
      postMessage({ data: 'ok' })
      break;
    }
    case "imageToSvg":
    default: {
      const uriToProcess = data;
      try {
        const res = await fetch(uriToProcess)
        const blob = await res.blob()
        // const svg = await vectorizer.imageToSvg(blob)
        // postMessage({ data: svg });
        const json = await vectorizer.imageToJson(blob)
        postMessage({ data: json });
      } catch (err) {
        postMessage({ error: err });
      }
    }
  }
}