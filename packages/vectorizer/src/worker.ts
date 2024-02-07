import { imageToSvg } from '@imgly/vectorizer';
import type { MessageBody } from "./worker.shared";


self.onmessage = function (e: MessageEvent<MessageBody>) {
  const msg = e.data;


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
      fetch(uriToProcess)
        .then(res => res.blob())
        .then(blob => imageToSvg(blob))
        .then(blob => blob.arrayBuffer())
        .then(blob => {
          postMessage({ data: blob });
        })
        .catch(err => {
          postMessage({ error: err });
        })
    }
  }
}