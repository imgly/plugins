import type CreativeEditorSDK from '@cesdk/cesdk-js';
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
  processFill<Blob>(
    cesdk,
    blockId,
    metadata,
    async (sources, blob) => {
      const vectorized = await vectorizer.imageToSvg(blob);
      return sources.map(() => vectorized);
    },
    async (uri) => {
      const response = await fetch(uri);
      return response.blob();
    }
  );
}
