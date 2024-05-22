import type CreativeEditorSDK from '@cesdk/cesdk-js';
import { type Source } from '@cesdk/cesdk-js';
import type FillProcessingMetadata from '../metadata/FillProcessingMetadata';

export default async function processFill(
  cesdk: CreativeEditorSDK,
  blockId: number,
  metadata: FillProcessingMetadata,
  processSourceSet: (sourceSet: Source[]) => Promise<Source[]>,
  processImageFileURI: (imageFileURI: string) => Promise<string>
) {
  const blockApi = cesdk.engine.block;
  if (!blockApi.hasFill(blockId))
    throw new Error('Block has no fill to process');

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

    metadata.set(blockId, {
      ...metadata.get(blockId),
      version: PLUGIN_VERSION,
      initialSourceSet,
      initialImageFileURI,
      initialPreviewFileURI,
      blockId,
      fillId,
      status: 'PROCESSING'
    });

    // Sort the source set by resolution so that the highest resolution image
    // is first.
    const sortedSourceSet = initialSourceSet.sort(
      (a, b) => b.width * b.height - a.height * a.width
    );

    const uriToProcess =
      // Source sets have priority in the engine
      initialSourceSet.length > 0
        ? // Choose the highest resolution image in the source set
          sortedSourceSet[0].uri
        : initialImageFileURI;

    // If there is no initial preview file URI, set the current URI.
    // It will be used as the image displayed while showing the loading spinner.
    if (!initialPreviewFileURI) {
      blockApi.setString(fillId, 'fill/image/previewFileURI', uriToProcess);
    }

    if (initialSourceSet.length > 0) {
      // Source set code path
      // ====================
      const newSourceSet = await processSourceSet(initialSourceSet);
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

      if (newSourceSet == null) return;

      if (newSourceSet.every((url) => url == null)) {
        throw new Error('Empty source set after processing fill');
      }

      metadata.set(blockId, {
        version: PLUGIN_VERSION,
        initialSourceSet,
        initialImageFileURI,
        initialPreviewFileURI,
        blockId,
        fillId,
        status: 'PROCESSED',
        processed: newSourceSet
      });
      blockApi.setSourceSet(fillId, 'fill/image/sourceSet', newSourceSet);
      // TODO: Generate a thumb/preview uri
      blockApi.setString(fillId, 'fill/image/previewFileURI', '');
    } else {
      // ImageFileURI code path
      // ======================
      const newFileURI = await processImageFileURI(uriToProcess);

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

      if (newFileURI == null) {
        throw new Error('Could not upload fill processed data');
      }

      metadata.set(blockId, {
        version: PLUGIN_VERSION,
        initialSourceSet,
        initialImageFileURI,
        initialPreviewFileURI,
        blockId,
        fillId,
        status: 'PROCESSED',
        processed: newFileURI
      });
      blockApi.setString(fillId, 'fill/image/imageFileURI', newFileURI);
      // TODO: Generate a thumb/preview uri
      blockApi.setString(fillId, 'fill/image/previewFileURI', '');
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
      cesdk.ui.showNotification({
        type: 'error',
        message: error.message
      });
    }

    // eslint-disable-next-line no-console
    console.log(error);
  }
}
