import type CreativeEditorSDK from '@cesdk/cesdk-js';
import type { Source } from '@cesdk/cesdk-js';

import { type FillProcessingMetadata } from '@imgly/plugin-utils';

import EyeqWebApi from './EyeqWebApi';

import {
  fillProcessingFromImageFileURI,
  fillProcessingFromSourceSet
} from './fillProcessingImageEnhancement';

export interface ProcessImageEnhancementMethods {
  /**
   * Process the image file URI and return the processed image file URI with
   * the image enhanced.
   *
   * @param imageFileURI - The URI of the image file to process
   * @returns The processed image file URI
   */
  processImageFileURI: (imageFileURI: string) => Promise<string>;

  /**
   * Process the source set and return a new source set as the input source set.
   *
   * @param sourceSet - The source set to process. It is sorted so that the highest resolution image uri is first
   * @returns the new source set with image enhanced
   */
  processSourceSet: (sourceSet: Source[]) => Promise<Source[]>;
}

export interface EyeqWebApiProvider {
  type: '@imgly/eyeq-web-api';
  proxyURL: string;
}

export interface CustomProvider extends ProcessImageEnhancementMethods {
  type: 'custom';
}

export type Provider = EyeqWebApiProvider | CustomProvider;

/**
 * Triggers the image enhancement process.
 */
export async function processImageEnhancement(
  cesdk: CreativeEditorSDK,
  blockId: number,
  metadata: FillProcessingMetadata,
  provider: Provider
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
    case '@imgly/eyeq-web-api': {
      const eyeq = new EyeqWebApi(cesdk, provider.proxyURL);
      if (sourceSet.length > 0) {
        fillProcessingFromSourceSet(
          blockId,
          cesdk,
          metadata,
          (metadataState) => {
            return eyeq.processSourceSet(metadataState.initialSourceSet);
          }
        );
      } else {
        fillProcessingFromImageFileURI(
          blockId,
          cesdk,
          metadata,
          (metadataState) => {
            return eyeq.processImageFileURI(metadataState.initialImageFileURI);
          }
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
          (metadataState) => {
            return provider.processSourceSet(metadataState.initialSourceSet);
          }
        );
      } else {
        fillProcessingFromImageFileURI(
          blockId,
          cesdk,
          metadata,
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
      throw new Error('Unknown image enhancement provider');
    }
  }
}
