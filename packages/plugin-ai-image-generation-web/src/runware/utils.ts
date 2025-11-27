import type CreativeEditorSDK from '@cesdk/cesdk-js';

/**
 * Converts a blob: or buffer: URL to a data URI that Runware can accept
 */
export async function convertImageUrlForRunware(
  imageUrl?: string,
  cesdk?: CreativeEditorSDK
): Promise<string | undefined> {
  if (imageUrl == null) return undefined;

  // For blob URLs, convert to data URI
  if (imageUrl.startsWith('blob:')) {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return blobToDataUri(blob);
  }

  // For buffer URLs, convert to data URI
  if (cesdk != null && imageUrl.startsWith('buffer:')) {
    const mimeType = await cesdk.engine.editor.getMimeType(imageUrl);
    const length = cesdk.engine.editor.getBufferLength(imageUrl);
    const data = cesdk.engine.editor.getBufferData(imageUrl, 0, length);
    const buffer = new Uint8Array(data);
    const blob = new Blob([buffer], { type: mimeType });
    return blobToDataUri(blob);
  }

  // For data URIs and regular URLs, pass through
  return imageUrl;
}

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function isCustomImageSize(
  imageSize: any
): imageSize is { width: number; height: number } {
  return (
    imageSize != null &&
    typeof imageSize !== 'string' &&
    'width' in imageSize &&
    'height' in imageSize
  );
}
