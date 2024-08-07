import CreativeEditorSDK from '@cesdk/cesdk-js';
import { FillProcessingMetadata } from '..';
import {
  PluginStatusProcessed,
  PluginStatusProcessing
} from '../metadata/types';

interface FillProcessor<T> {
  processFill(metadataState: PluginStatusProcessing): Promise<T>;

  commitProcessing(
    data: T,
    metadataState: PluginStatusProcessed
  ): number | void;
}

async function fillProcessing<T>(
  blockId: number,
  cesdk: CreativeEditorSDK,
  metadata: FillProcessingMetadata,
  processor: FillProcessor<T>
) {
  const blockApi = cesdk.engine.block;
  if (!blockApi.hasFill(blockId))
    throw new Error('Block does not support fill');

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
    cesdk.engine.block.setState(fillId, {
      type: 'Pending',
      progress: 0
    });

    const status: PluginStatusProcessing = {
      ...metadata.get(blockId),
      version: PLUGIN_VERSION,
      initialSourceSet,
      initialImageFileURI,
      initialPreviewFileURI,
      blockId,
      fillId,
      status: 'PROCESSING'
    };

    metadata.set(blockId, status);

    const processedData = await processor.processFill(status);
    // Check for externally changed state while we were applying the mask and
    // do not proceed if the state was reset.
    if (
      metadata.get(blockId).status !== 'PROCESSING' ||
      !metadata.isConsistent(blockId)
    )
      return;

    // Check for externally changed state while we were uploading and
    // do not proceed if the state was reset.
    if (
      metadata.get(blockId).status !== 'PROCESSING' ||
      !metadata.isConsistent(blockId)
    )
      return;

    if (processedData == null) return;

    const metadataStateProcessed: PluginStatusProcessed = {
      version: PLUGIN_VERSION,
      initialSourceSet,
      initialImageFileURI,
      initialPreviewFileURI,
      blockId,
      fillId,
      status: 'PROCESSED'
    };

    const blockIdOrVoid = processor.commitProcessing(
      processedData,
      metadataStateProcessed
    );

    // If a new block was created, we do not update the metadata.
    if (blockIdOrVoid == null || blockIdOrVoid === blockId) {
      metadata.set(blockId, metadataStateProcessed);
    }

    // Finally, create an undo step
    cesdk.engine.editor.addUndoStep();
  } catch (error) {
    if (cesdk.engine.block.isValid(blockId)) {
      metadata.set(blockId, {
        version: PLUGIN_VERSION,
        initialSourceSet,
        initialImageFileURI,
        initialPreviewFileURI,
        blockId,
        fillId,
        status: 'ERROR'
      });

      metadata.recoverInitialImageData(blockId);
    }

    if (
      error != null &&
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message === 'string'
    ) {
      const message =
        error.message === 'signal timed out'
          ? 'Processing canceled due to timeout'
          : error.message;
      cesdk.ui.showNotification({
        type: 'error',
        message
      });
    }

    // eslint-disable-next-line no-console
    console.log(error);
  } finally {
    if (cesdk.engine.block.isValid(fillId)) {
      cesdk.engine.block.setState(fillId, { type: 'Ready' });
    }
  }
}

export default fillProcessing;
