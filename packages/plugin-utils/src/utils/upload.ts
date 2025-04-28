import type CreativeEditorSDK from '@cesdk/cesdk-js';
import { CreativeEngine } from '@cesdk/cesdk-js';

/**
 * Uploads a blob with the help of CE.SDK
 */
export async function uploadBlob(
  blob: Blob,
  initialUri: string,
  cesdk: CreativeEditorSDK
) {
  const pathname = new URL(initialUri).pathname;
  const parts = pathname.split('/');
  const extension = mimeTypeToExtension(blob.type);
  const filename = parts[parts.length - 1]?.split('.')?.[0] ?? 'asset';
  const filenameWithExtension = `${filename}.${extension}`;

  const uploadedAssets = await cesdk.unstable_upload(
    new File([blob], filenameWithExtension, { type: blob.type }),
    () => {
      // TODO Delegate process to UI component
    }
  );

  const url = uploadedAssets.meta?.uri;
  if (url == null) {
    throw new Error('Could not upload processed fill');
  }
  return url;
}

/**
 * Returns the file extension for a given mime type.
 */
export function mimeTypeToExtension(mimeType: string): string {
  const extensions: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg'
  };
  return extensions[mimeType] ?? 'png';
}

export async function fetchImageBlob(uri: string): Promise<Blob> {
  return fetch(uri).then((response) => response.blob());
}

/**
 *  Converts a buffer URI to a object url.
 */
export async function bufferURIToObjectURL(
  uri: string,
  engine: CreativeEngine
): Promise<string> {
  if (uri.startsWith('buffer:')) {
    const mimeType = await engine.editor.getMimeType(uri);
    const length = engine.editor.getBufferLength(uri);
    const data = engine.editor.getBufferData(uri, 0, length);
    const blob = new Blob([data], { type: mimeType });
    return URL.createObjectURL(blob);
  } else {
    return uri;
  }
}
