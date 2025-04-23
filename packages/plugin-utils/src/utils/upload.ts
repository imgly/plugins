import type CreativeEditorSDK from '@cesdk/cesdk-js';

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

export function mimeTypeToExtension(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/svg+xml':
      return 'svg';
    default:
      return 'jpg';
  }
}

export async function fetchImageBlob(uri: string): Promise<Blob> {
  return fetch(uri).then((response) => response.blob());
}
