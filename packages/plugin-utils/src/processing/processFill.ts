import type CreativeEditorSDK from '@cesdk/cesdk-js';
import { type Source } from '@cesdk/cesdk-js';
import type FillProcessingMetadata from '../metadata/FillProcessingMetadata';
import { Optional } from '../types/Optional';

export default async function processFill<T>(
  cesdk: CreativeEditorSDK,
  blockId: number,
  metadata: FillProcessingMetadata,
  process: (
    sourceSet: Optional<Source, 'width' | 'height'>[],
    preprocessedData: T
  ) => Promise<Blob[]>,
  preprocess: (uri: string) => Promise<T> = () =>
    Promise.resolve(undefined as T)
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

    const preprocessedData = await preprocess(uriToProcess);
    // Creating the mask from the highest resolution image
    // const mask = await segmentForeground(uriToProcess, configuration);

    if (initialSourceSet.length > 0) {
      // Source set code path
      // ====================
      const processedData = await process(initialSourceSet, preprocessedData);
      // Check for externally changed state while we were applying the mask and
      // do not proceed if the state was reset.
      if (
        metadata.get(blockId).status !== 'PROCESSING' ||
        !metadata.isConsistent(blockId)
      )
        return;

      const uploaded = await upload(
        cesdk,
        processedData.map((blob, index) => [blob, initialSourceSet[index]])
      );

      // Check for externally changed state while we were uploading and
      // do not proceed if the state was reset.
      if (
        metadata.get(blockId).status !== 'PROCESSING' ||
        !metadata.isConsistent(blockId)
      )
        return;

      if (uploaded == null) return;

      if (uploaded.every((url) => url == null)) {
        throw new Error('Could not upload any fill processed data');
      }

      const newSourceSet = initialSourceSet.map((source, index) => {
        return {
          ...source,
          uri: uploaded[index]
        };
      });

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
      const sourceSet = [{ uri: uriToProcess }];
      // ImageFileURI code path
      // ======================
      const processedData = await process(sourceSet, preprocessedData);

      // Check for externally changed state while we were applying the mask and
      // do not proceed if the state was reset.
      if (
        metadata.get(blockId).status !== 'PROCESSING' ||
        !metadata.isConsistent(blockId)
      )
        return;

      const uploaded = await upload(
        cesdk,
        processedData.map((blob, index) => [blob, sourceSet[index]])
      );

      // Check for externally changed state while we were uploading and
      // do not proceed if the state was reset.
      if (
        metadata.get(blockId).status !== 'PROCESSING' ||
        !metadata.isConsistent(blockId)
      )
        return;

      if (uploaded == null) return;

      const uploadedUrl = uploaded[0];
      if (uploadedUrl == null) {
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
        processed: uploadedUrl
      });
      blockApi.setString(fillId, 'fill/image/imageFileURI', uploadedUrl);
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
    // eslint-disable-next-line no-console
    console.log(error);
  }
}

async function upload<T extends { uri: string }>(
  cesdk: CreativeEditorSDK,
  data: [Blob, T][]
): Promise<string[]> {
  const uploaded = await Promise.all(
    data.map(async ([blob, source]): Promise<string> => {
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
        throw new Error('Could not upload processed fill');
      }
      return url;
    })
  );
  return uploaded;
}
