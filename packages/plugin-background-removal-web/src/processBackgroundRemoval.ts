import type CreativeEditorSDK from '@cesdk/cesdk-js';
import type { Source } from '@cesdk/cesdk-js';
import {
  applySegmentationMask,
  removeBackground,
  segmentForeground,
  type Config
} from '@imgly/background-removal';

import { processFill, type FillProcessingMetadata } from '@imgly/plugin-utils';

import throttle from 'lodash/throttle';

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

      processFill(
        cesdk,
        blockId,
        metadata,
        // Process the source set
        async (sourceSet) => {
          // Source set is already sorted by resolution
          const highestResolutionUri = sourceSet[0].uri;

          // Preprocessing the image by creating a segmentation mask
          const mask = await segmentForeground(
            highestResolutionUri,
            configuration
          );

          const result = await Promise.all(
            sourceSet.map(async (source): Promise<Source> => {
              // Applying the mask to the original image
              const blob = await applySegmentationMask(
                source.uri,
                mask,
                bgRemovalConfiguration
              );
              const uploaded = await uploadBlob(blob, source.uri, cesdk);
              return {
                ...source,
                uri: uploaded
              };
            })
          );

          return result;
        },
        // Process the image file URI
        async (imageFileURI) => {
          const result = await removeBackground(
            imageFileURI,
            bgRemovalConfiguration
          );
          const uri = await uploadBlob(result, imageFileURI, cesdk);
          return uri;
        }
      );
      break;
    }

    case 'custom': {
      processFill(
        cesdk,
        blockId,
        metadata,
        provider.processSourceSet,
        provider.processImageFileURI
      );
      break;
    }

    default: {
      throw new Error('Unknown background removal provider');
    }
  }
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
