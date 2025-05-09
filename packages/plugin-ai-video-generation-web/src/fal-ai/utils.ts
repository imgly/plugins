import { fal } from '@fal-ai/client';
import CreativeEditorSDK from '@cesdk/cesdk-js';

export async function uploadImageInputToFalIfNeeded(
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
    return fal.storage.upload(imageUrlFile);
  }
  if (cesdk != null && imageUrl.startsWith('buffer:')) {
    const mimeType = await cesdk.engine.editor.getMimeType(imageUrl);
    const length = cesdk.engine.editor.getBufferLength(imageUrl);
    const data = cesdk.engine.editor.getBufferData(imageUrl, 0, length);
    const imageUrlFile = new File([data], 'image.png', {
      type: mimeType
    });
    return fal.storage.upload(imageUrlFile);
  }

  return imageUrl;
}
