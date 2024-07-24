import type CreativeEditorSDK from '@cesdk/cesdk-js';
import type { Source } from '@cesdk/cesdk-js';
import { type Config } from '@imgly/background-removal';

import { type FillProcessingMetadata } from '@imgly/plugin-utils';

import { throttle } from 'lodash-es';
import {
  fillProcessingFromImageFileURI,
  fillProcessingFromSourceSet
} from './fillProcessingBackgroundRemoval';

interface IMGLYBackgroundRemovalProviderClientSide {
  type: '@imgly/background-removal';
  configuration?: Config;
}

interface CustomBackgroundRemovalProvider {
  type: 'custom';

  /**
   * Process the image file URI and return the processed image file URI with
   * the background removed.
   *
   * @param imageFileURI - The URI of the image file to process
   * @returns The processed image file URI
   */
  processImageFileURI: (imageFileURI: string) => Promise<string>;

  /**
   * Process the source set and return a new source set as the input source set.
   *
   * @param sourceSet - The source set to process. It is sorted so that the highest resolution image uri is first
   * @returns the new source set with backgrounds removed
   */
  processSourceSet: (sourceSet: Source[]) => Promise<Source[]>;
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
  const blockApi = cesdk.engine.block;
  if (!blockApi.hasFill(blockId))
    throw new Error('Block does not support fill');

  const fillId = blockApi.getFill(blockId);

  const sourceSet = blockApi.getSourceSet(fillId, 'fill/image/sourceSet');
  const imageFileURI = blockApi.getString(fillId, 'fill/image/imageFileURI');

  if (sourceSet.length === 0 && imageFileURI === '')
    throw new Error('No source or image file URI found');

  switch (provider.type) {
    case '@imgly/background-removal': {
      const configuration = provider.configuration ?? {};
      const bgRemovalConfiguration: Config = {
        device: 'gpu',
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

      if (sourceSet.length > 0) {
        fillProcessingFromSourceSet(
          blockId,
          cesdk,
          metadata,
          bgRemovalConfiguration
        );
      } else {
        fillProcessingFromImageFileURI(
          blockId,
          cesdk,
          metadata,
          bgRemovalConfiguration
        );
      }

      break;
    }

    case 'custom': {
      if (sourceSet.length > 0) {
        fillProcessingFromSourceSet(
          blockId,
          cesdk,
          metadata,
          undefined,
          (metadataState) => {
            return provider.processSourceSet(metadataState.initialSourceSet);
          }
        );
      } else {
        fillProcessingFromImageFileURI(
          blockId,
          cesdk,
          metadata,
          undefined,
          (metadataState) => {
            return provider.processImageFileURI(
              metadataState.initialImageFileURI
            );
          }
        );
      }
      break;
    }

    default: {
      throw new Error('Unknown background removal provider');
    }
  }
}
