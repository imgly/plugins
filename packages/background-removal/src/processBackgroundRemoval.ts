import type CreativeEditorSDK from '@cesdk/cesdk-js';
import { type Source } from '@cesdk/cesdk-js';
import {
  applySegmentationMask,
  segmentForeground,
  type Config
} from '@imgly/background-removal';

import throttle from 'lodash/throttle';

import {
  getPluginMetadata,
  isMetadataConsistent,
  recoverInitialImageData,
  setPluginMetadata
} from './utils';

/**
 * Triggers the background removal process.
 */
export async function processBackgroundRemoval(
  cesdk: CreativeEditorSDK,
  blockId: number,
  configuration: Config
) {
  const blockApi = cesdk.engine.block;
  if (!blockApi.hasFill(blockId))
    throw new Error('Block has no fill to remove the background from');

  const fillId = blockApi.getFill(blockId);

  // Get the current image URI and source set as initial values.
  const initialSourceSet = blockApi.getSourceSet(
    fillId,
    'fill/image/sourceSet'
  );
  const initialImageFileURI = blockApi.getString(
    fillId,
    'fill/image/imageFileURI'
  );
  const initialPreviewFileURI = blockApi.getString(
    fillId,
    'fill/image/previewFileURI'
  );

  try {
    // Clear values in the engine to trigger the loading spinner
    blockApi.setString(fillId, 'fill/image/imageFileURI', '');
    blockApi.setSourceSet(fillId, 'fill/image/sourceSet', []);

    const metadata = getPluginMetadata(cesdk, blockId);
    setPluginMetadata(cesdk, blockId, {
      ...metadata,
      version: PLUGIN_VERSION,
      initialSourceSet,
      initialImageFileURI,
      initialPreviewFileURI,
      blockId,
      fillId,
      status: 'PROCESSING'
    });

    const uriToProcess =
      // Source sets have priority in the engine
      initialSourceSet.length > 0
        ? // Choose the highest resolution image in the source set
          initialSourceSet.sort(
            (a, b) => b.width * b.height - a.height * a.width
          )[0].uri
        : initialImageFileURI;

    // If there is no initial preview file URI, set the current URI.
    // It will be used as the image displayed while showing the loading spinner.
    if (!initialPreviewFileURI) {
      blockApi.setString(fillId, 'fill/image/previewFileURI', uriToProcess);
    }

    // Creating the mask from the highest resolution image
    const mask = await segmentForeground(uriToProcess, configuration);

    if (initialSourceSet.length > 0) {
      // Source set code path
      // ====================
      const uploaded = await maskSourceSet<Source>(
        cesdk,
        blockId,
        initialSourceSet,
        mask,
        configuration
      );
      if (uploaded == null) return;

      if (uploaded.every((url) => url == null)) {
        throw new Error('Could not upload any BG removed image');
      }

      const newSourceSet = initialSourceSet.map((source, index) => {
        return {
          ...source,
          uri: uploaded[index]
        };
      });

      setPluginMetadata(cesdk, blockId, {
        version: PLUGIN_VERSION,
        initialSourceSet,
        initialImageFileURI,
        initialPreviewFileURI,
        blockId,
        fillId,
        status: 'PROCESSED',
        removedBackground: newSourceSet
      });
      blockApi.setSourceSet(fillId, 'fill/image/sourceSet', newSourceSet);
      // TODO: Generate a thumb/preview uri
      blockApi.setString(fillId, 'fill/image/previewFileURI', '');
    } else {
      // ImageFileURI code path
      // ======================
      const uploaded = await maskSourceSet<{ uri: string }>(
        cesdk,
        blockId,
        [{ uri: uriToProcess }],
        mask,
        configuration
      );
      if (uploaded == null) return;

      const uploadedUrl = uploaded[0];
      if (uploadedUrl == null) {
        throw new Error('Could not upload BG removed image');
      }

      setPluginMetadata(cesdk, blockId, {
        version: PLUGIN_VERSION,
        initialSourceSet,
        initialImageFileURI,
        initialPreviewFileURI,
        blockId,
        fillId,
        status: 'PROCESSED',
        removedBackground: uploadedUrl
      });
      blockApi.setString(fillId, 'fill/image/imageFileURI', uploadedUrl);
      // TODO: Generate a thumb/preview uri
      blockApi.setString(fillId, 'fill/image/previewFileURI', '');
    }
    // Finally, create an undo step
    cesdk.engine.editor.addUndoStep();
  } catch (error) {
    if (cesdk.engine.block.isValid(blockId)) {
      setPluginMetadata(cesdk, blockId, {
        version: PLUGIN_VERSION,
        initialSourceSet,
        initialImageFileURI,
        initialPreviewFileURI,
        blockId,
        fillId,
        status: 'ERROR'
      });

      recoverInitialImageData(cesdk, blockId);
    }
    // eslint-disable-next-line no-console
    console.log(error);
  }
}

async function maskSourceSet<T extends { uri: string }>(
  cesdk: CreativeEditorSDK,
  blockId: number,
  urisOrSources: T[],
  mask: Blob,
  configurationFromArgs: Config
): Promise<string[] | undefined> {
  const configuration = {
    ...configurationFromArgs,
    progress: throttle((key, current, total) => {
      const metadataDuringProgress = getPluginMetadata(cesdk, blockId);
      if (
        metadataDuringProgress.status !== 'PROCESSING' ||
        !isMetadataConsistent(cesdk, blockId)
      )
        return;
      configurationFromArgs.progress?.(key, current, total);
      setPluginMetadata(cesdk, blockId, {
        ...metadataDuringProgress,
        progress: { key, current, total }
      });
    }, 100)
  };

  const masked = await Promise.all(
    urisOrSources.map(async (source): Promise<[Blob, T]> => {
      // Applying the mask to the original image
      const blob = await applySegmentationMask(source.uri, mask, configuration);
      return [blob, source];
    })
  );

  // Check for externally changed state while we were applying the mask and
  // do not proceed if the state was reset.
  if (
    getPluginMetadata(cesdk, blockId).status !== 'PROCESSING' ||
    !isMetadataConsistent(cesdk, blockId)
  )
    return;

  const uploaded = await Promise.all(
    masked.map(async ([blob, source]): Promise<[string, T]> => {
      const pathname = new URL(source.uri).pathname;
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
        throw new Error('Could not upload BG removed image');
      }
      return [url, source];
    })
  );

  // Check for externally changed state while we were uploading and
  // do not proceed if the state was reset.
  if (
    getPluginMetadata(cesdk, blockId).status !== 'PROCESSING' ||
    !isMetadataConsistent(cesdk, blockId)
  )
    return;

  return uploaded.map(([url]) => url);
}
