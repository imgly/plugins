import type CreativeEditorSDK from '@cesdk/cesdk-js';
import {
  applySegmentationMask,
  segmentForeground,
  type Config
} from '@imgly/background-removal';

import { processFill, type FillProcessingMetadata } from '@imgly/plugin-utils';

import throttle from 'lodash/throttle';

/**
 * Triggers the background removal process.
 */
export async function processBackgroundRemoval(
  cesdk: CreativeEditorSDK,
  blockId: number,
  configuration: Config,
  metadata: FillProcessingMetadata
) {
  processFill<Blob>(
    cesdk,
    blockId,
    metadata,
    async (sources, mask) => {
      const bgRemovalConfiguration = {
        ...configuration,
        progress: throttle((key, current, total) => {
          const currentMetadataInProgress = metadata.get(blockId);
          if (
            currentMetadataInProgress.status !== 'PROCESSING' ||
            !metadata.isConsistent(blockId)
          )
            return;

          configuration.progress?.(key, current, total);
          metadata.set(blockId, {
            ...currentMetadataInProgress,
            progress: { key, current, total }
          });
        }, 100)
      };

      const masked = await Promise.all(
        sources.map(async (source): Promise<Blob> => {
          // Applying the mask to the original image
          const blob = await applySegmentationMask(
            source.uri,
            mask,
            bgRemovalConfiguration
          );
          return blob;
        })
      );
      return masked;
    },

    // Preprocessing the image by creating a segmentation mask
    async (uriToProcess): Promise<Blob> => {
      const mask = await segmentForeground(uriToProcess, configuration);
      return mask;
    }
  );
}
