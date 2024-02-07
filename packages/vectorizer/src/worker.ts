import { imageToSvg } from '@imgly/vectorizer';

self.onmessage = function (e) {
  const uriToProcess = e.data.data;
  fetch(uriToProcess)
    .then(res => res.blob())
    .then(blob => imageToSvg(blob))
    .then(blob => blob.arrayBuffer())
    .then(blob => {
      postMessage({data: blob});
    })
    .catch(err => {
      postMessage({error: err});
    })
}