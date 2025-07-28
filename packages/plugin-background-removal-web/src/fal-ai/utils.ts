import { fal } from '@fal-ai/client';
import { mimeTypeToExtension } from '@imgly/plugin-utils';
import CreativeEditorSDK from '@cesdk/cesdk-js';

export async function uploadImageInputToFalIfNeeded(
  imageUrl?: string,
  cesdk?: CreativeEditorSDK
): Promise<string | undefined> {
  if (imageUrl == null) return undefined;
  if (imageUrl.startsWith('blob:')) {
    const mimeType =
      cesdk != null
        ? await cesdk.engine.editor.getMimeType(imageUrl)
        : 'image/png';
    const imageUrlResponse = await fetch(imageUrl);
    const imageUrlBlob = await imageUrlResponse.blob();
    const imageUrlFile = new File(
      [imageUrlBlob],
      `image.${mimeTypeToExtension(mimeType)}`,
      {
        type: mimeType
      }
    );
    return fal.storage.upload(imageUrlFile);
  }
  if (cesdk != null && imageUrl.startsWith('buffer:')) {
    const mimeType = await cesdk.engine.editor.getMimeType(imageUrl);
    const length = cesdk.engine.editor.getBufferLength(imageUrl);
    const data = cesdk.engine.editor.getBufferData(imageUrl, 0, length);
    const imageUrlFile = new File(
      [data],
      `image.${mimeTypeToExtension(mimeType)}`,
      {
        type: mimeType
      }
    );
    return fal.storage.upload(imageUrlFile);
  }

  return imageUrl;
}
