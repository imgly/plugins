import { mimeTypeToExtension } from '@imgly/plugin-utils';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import { FalClient } from './createFalClient';

type CustomImageSize = {
  width: number;
  height: number;
};

export function isCustomImageSize(
  imageSize: any
): imageSize is CustomImageSize {
  return (
    imageSize != null &&
    typeof imageSize !== 'string' &&
    'width' in imageSize &&
    'height' in imageSize
  );
}

export async function uploadImageInputToFalIfNeeded(
  client: FalClient,
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
    return client.storage.upload(imageUrlFile);
  }
  if (cesdk != null && imageUrl.startsWith('buffer:')) {
    const mimeType = await cesdk.engine.editor.getMimeType(imageUrl);
    const length = cesdk.engine.editor.getBufferLength(imageUrl);
    const data = cesdk.engine.editor.getBufferData(imageUrl, 0, length);
    // Create a new Uint8Array with a proper ArrayBuffer to avoid SharedArrayBuffer issues
    const buffer = new Uint8Array(data);
    const imageUrlFile = new File(
      [buffer],
      `image.${mimeTypeToExtension(mimeType)}`,
      {
        type: mimeType
      }
    );
    return client.storage.upload(imageUrlFile);
  }

  return imageUrl;
}

export async function uploadImageArrayToFalIfNeeded(
  client: FalClient,
  imageUrls?: string[],
  cesdk?: CreativeEditorSDK
): Promise<string[] | undefined> {
  if (imageUrls == null || !Array.isArray(imageUrls)) return undefined;

  const uploadedUrls = await Promise.all(
    imageUrls.map((url) => uploadImageInputToFalIfNeeded(client, url, cesdk))
  );

  return uploadedUrls.filter((url): url is string => url != null);
}
