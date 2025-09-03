import CreativeEditorSDK from '@cesdk/cesdk-js';
import { FalClient } from './createFalClient';

export async function uploadImageInputToFalIfNeeded(
  client: FalClient,
  imageUrl?: string,
  cesdk?: CreativeEditorSDK
): Promise<string | undefined> {
  if (imageUrl == null) return undefined;
  if (imageUrl.startsWith('blob:')) {
    const imageUrlResponse = await fetch(imageUrl);
    const imageUrlBlob = await imageUrlResponse.blob();
    const imageUrlFile = new File([imageUrlBlob], 'image.png', {
      type: 'image/png'
    });
    return client.storage.upload(imageUrlFile);
  }
  if (cesdk != null && imageUrl.startsWith('buffer:')) {
    const mimeType = await cesdk.engine.editor.getMimeType(imageUrl);
    const length = cesdk.engine.editor.getBufferLength(imageUrl);
    const data = cesdk.engine.editor.getBufferData(imageUrl, 0, length);
    // Create a new Uint8Array with a proper ArrayBuffer to avoid SharedArrayBuffer issues
    const buffer = new Uint8Array(data);
    const imageUrlFile = new File([buffer], 'image.png', {
      type: mimeType
    });
    return client.storage.upload(imageUrlFile);
  }

  return imageUrl;
}
