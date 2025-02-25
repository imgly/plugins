import type CreativeEditorSDK from '@cesdk/cesdk-js';

async function uploadBlob(
  blob: Blob,
  initialUri: string,
  cesdk: CreativeEditorSDK
) {
  const pathname = new URL(initialUri).pathname;
  const parts = pathname.split('/');
  const filename = parts[parts.length - 1];

  const uploadedAssets = await cesdk.unstable_upload(
    new File([blob], filename, { type: blob.type }),
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

export default uploadBlob;
