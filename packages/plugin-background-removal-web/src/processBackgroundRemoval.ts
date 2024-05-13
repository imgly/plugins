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

  process: (
    sourceSet: Optional<Source, 'width' | 'height'>[],
    preprocessedData: Blob | undefined
  ) => Promise<Blob[]>;

  preprocess?: (uri: string) => Promise<Blob>;
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
      break;
    }

    case 'custom': {
      processFill<Blob>(
        cesdk,
        blockId,
        metadata,
        provider.process,
        provider.preprocess
      );
      break;
    }

    default: {
      throw new Error('Unknown background removal provider');
    }
  }
}
