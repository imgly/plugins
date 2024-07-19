import type CreativeEditorSDK from '@cesdk/cesdk-js';
import type { Source } from '@cesdk/cesdk-js';
import * as vectorizer from '@imgly/vectorizer';

import { processFill, type FillProcessingMetadata } from '@imgly/plugin-utils';

/**
 * Triggers the vectorizer process.
 */
export async function processVectorization(
  cesdk: CreativeEditorSDK,
  blockId: number,
  metadata: FillProcessingMetadata
) {
  processFill(
    cesdk,
    blockId,
    metadata,
    async (sourceSet) => {
      // Source set is already sorted by resolution
      const highestResolutionUri = sourceSet[0].uri;
      const blob = await fetchImageBlob(highestResolutionUri);

      const vectorized = await vectorizer.imageToSvg(blob);
      const result = await Promise.all(
        sourceSet.map(async (source): Promise<Source> => {
          const uploaded = await uploadBlob(vectorized, source.uri, cesdk);
          return {
            ...source,
            uri: uploaded
          };
        })
      );

      return result;
    },
    async (imageFileUri) => {
      const blob = await fetchImageBlob(imageFileUri);
      const vectorized = await vectorizer.imageToSvg(blob);
      const uploaded = await uploadBlob(vectorized, imageFileUri, cesdk);
      return uploaded;
    }
  );
}

async function fetchImageBlob(uri: string): Promise<Blob> {
  return fetch(uri).then((response) => response.blob());
}

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
