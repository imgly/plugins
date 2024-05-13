import type CreativeEditorSDK from '@cesdk/cesdk-js';
import type { Source } from '@cesdk/cesdk-js';
import {
  applySegmentationMask,
  segmentForeground,
  type Config
} from '@imgly/background-removal';

import {
  processFill,
  type FillProcessingMetadata,
  type Optional
} from '@imgly/plugin-utils';

import throttle from 'lodash/throttle';

interface IMGLYBackgroundRemovalProviderClientSide {
  type: '@imgly/background-removal';
  configuration?: Config;
}

interface CustomBackgroundRemovalProvider {
  type: 'custom';

  /**
   * Process the source set and return the processed blobs in the same order
   * as the input source set.
   *
   * @param sourceSet - The source set to process. It is sorted so that the highest resolution image uri is first
   * @returns The processed blobs in the same order as the input source set
   */
  process: (
    sourceSet: Optional<Source, 'width' | 'height'>[]
  ) => Promise<Blob[]>;
}

export type BackgroundRemovalProvider =
  | IMGLYBackgroundRemovalProviderClientSide
  | CustomBackgroundRemovalProvider;

/**
 * Triggers the background removal process.
 */
export async function processBackgroundRemoval(
  cesdk: CreativeEditorSDK,
  blockId: number,
  metadata: FillProcessingMetadata,
  provider: BackgroundRemovalProvider
) {
  switch (provider.type) {
    case '@imgly/background-removal': {
      const configuration = provider.configuration ?? {};

      processFill(cesdk, blockId, metadata, async (sources) => {
        // Source set is already sorted by resolution
        const highestResolutionUri = sources[0].uri;
        // Preprocessing the image by creating a segmentation mask
        const mask = await segmentForeground(
          highestResolutionUri,
          configuration
        );
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
      });
      break;
    }

    case 'custom': {
      processFill(cesdk, blockId, metadata, provider.process);
      break;
    }

    default: {
      throw new Error('Unknown background removal provider');
    }
  }
}
