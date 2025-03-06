import type CreativeEditorSDK from '@cesdk/cesdk-js';
import {
  fillProcessing,
  uploadBlob,
  fetchImageBlob,
  type FillProcessingMetadata
} from '@imgly/plugin-utils';
import * as vectorizer from '@imgly/vectorizer';
import { throttle } from 'lodash-es';
import addAsVectorGroup from './addAsVectorGroup';
import { VectorPath } from './types';

// Threshold for the number of paths in the vectorized image before it is considered too complex.
// Since the CE.SDK does not work well with a large number of grouped paths, we use a very low threshold.
// Some really simple images might still be grouped, but this is a trade-off to avoid performance issues and useability problems.
const THRESHOLD = 5;
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

      const config: vectorizer.Config = {
        signal: AbortSignal.timeout(customTimeout ?? TIMEOUT),
        ...vectorizerConfiguration,
        callbacks: {
          ...(vectorizerConfiguration?.callbacks ?? {}),
          progress: throttle((key, current, total) => {
            const currentMetadataInProgress = metadata.get(blockId);
            if (
              currentMetadataInProgress.status !== 'PROCESSING' ||
              !metadata.isConsistent(blockId)
            )
              return;

            vectorizerConfiguration?.callbacks?.progress?.(key, current, total);
            metadata.set(blockId, {
              ...currentMetadataInProgress,
              progress: { key, current, total }
            });
          }, 100)
        },
        options: {
          drop_transparent: false,
          ...(vectorizerConfiguration?.options ?? {})
        }
      };

      let inputBlob;
      if (input.startsWith('buffer:')) {
        const mimeType = await cesdk.engine.editor.getMimeType(input);
        const length = cesdk.engine.editor.getBufferLength(input);
        const data = cesdk.engine.editor.getBufferData(input, 0, length);
        inputBlob = new Blob([data], { type: mimeType });
      } else {
        inputBlob = await fetchImageBlob(input);
      }

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

