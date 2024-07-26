import type CreativeEditorSDK from '@cesdk/cesdk-js';
import * as vectorizer from '@imgly/vectorizer';

import {
  fillProcessing,
  type FillProcessingMetadata
} from '@imgly/plugin-utils';
import addAsVectorGroup from './addAsVectorGroup';
import { VectorPath } from './types';

const THRESHOLD = 500;
const TIMEOUT = 30000;

/**
 * Triggers the vectorizer process.
 */
export async function processVectorization(
  cesdk: CreativeEditorSDK,
  blockId: number,
  metadata: FillProcessingMetadata,
  vectorizerConfiguration?: vectorizer.Config,
  customThreshold?: number,
  customTimeout?: number
) {
  fillProcessing(blockId, cesdk, metadata, {
    async processFill(metadataState) {
      const sourceSet = metadataState.initialSourceSet;
      const imageFileURI = metadataState.initialImageFileURI;

      const input = sourceSet.length > 0 ? sourceSet[0].uri : imageFileURI;

      const config = {
        signal: AbortSignal.timeout(customTimeout ?? TIMEOUT),
        ...vectorizerConfiguration,
        options: {
          drop_transparent: false,
          ...(vectorizerConfiguration?.options ?? {})
        }
      };

      const inputBlob = await fetchImageBlob(input);

      const converter = new vectorizer.SvgConverter(config);
      await converter.convert(inputBlob);

      const blocks = JSON.parse(converter.to_json());
      if (blocks.length < (customThreshold ?? THRESHOLD)) {
        converter.dispose();
        return blocks as VectorPath[];
      } else {
        const svg = converter.to_svg();
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const uploaded = await uploadBlob(blob, input, cesdk);

        converter.dispose();
        return uploaded;
      }
    },

    commitProcessing(data, metadataState) {
      if (typeof data === 'string') {
        const fillId = metadataState.fillId;
        cesdk.engine.block.setString(fillId, 'fill/image/imageFileURI', data);
        cesdk.engine.block.setSourceSet(fillId, 'fill/image/sourceSet', []);
        // TODO: Generate a thumb/preview uri
        cesdk.engine.block.setString(fillId, 'fill/image/previewFileURI', '');
      } else {
        return addAsVectorGroup(blockId, data, cesdk);
      }
    }
  });
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

async function fetchImageBlob(uri: string): Promise<Blob> {
  return fetch(uri).then((response) => response.blob());
}
