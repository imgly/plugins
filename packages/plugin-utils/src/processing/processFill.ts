import type CreativeEditorSDK from '@cesdk/cesdk-js';
import { type Source } from '@cesdk/cesdk-js';
import type FillProcessingMetadata from '../metadata/FillProcessingMetadata';

export default async function processFill(
  cesdk: CreativeEditorSDK,
  blockId: number,
  metadata: FillProcessingMetadata,
  processSourceSet: (sourceSet: Source[]) => Promise<Source[]>
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
  const initialPreviewFileURI = blockApi.getString(
    fillId,
    'fill/image/previewFileURI'
  );

  try {
    cesdk.engine.block.setState(fillId, { type: 'Pending', progress: 0 });

    metadata.set(blockId, {
      ...metadata.get(blockId),
      version: PLUGIN_VERSION,
      initialSourceSet,
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

    const uriToProcess = sortedSourceSet[0].uri;

    // If there is no initial preview file URI, set the current URI.
    // It will be used as the image displayed while showing the loading spinner.
    if (!initialPreviewFileURI) {
      blockApi.setString(fillId, 'fill/image/previewFileURI', uriToProcess);
    }

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
      initialPreviewFileURI,
      blockId,
      fillId,
      status: 'PROCESSED',
      processed: newSourceSet
    });

    blockApi.setSourceSet(fillId, 'fill/image/sourceSet', newSourceSet);
    // TODO: Generate a thumb/preview uri
    blockApi.setString(fillId, 'fill/image/previewFileURI', '');

    // Finally, create an undo step
    cesdk.engine.editor.addUndoStep();
  } catch (error) {
    if (cesdk.engine.block.isValid(blockId)) {
      metadata.set(blockId, {
        version: PLUGIN_VERSION,
        initialSourceSet,
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
  } finally {
    cesdk.engine.block.setState(fillId, { type: 'Ready' });
  }
}
