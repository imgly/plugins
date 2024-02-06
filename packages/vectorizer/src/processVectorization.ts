import type CreativeEditorSDK from '@cesdk/cesdk-js';
import { imageToSvg } from '@imgly/vectorizer';

import {
  getPluginMetadata,
  isMetadataConsistent,
  recoverInitialImageData,
  setPluginMetadata
} from './utils';

/**
 * Apply the vectorization process to the image.
 */
async function vectorize(uri: string): Promise<Blob> {
  console.log('Vectorizing', uri);
  // const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><circle cx="25" cy="25" r="20"/></svg>`;
  // const blob = new Blob([svg], { type: 'image/svg+xml' });
  const blob = await fetch(uri).then((res) => res.blob())
  const svg = await imageToSvg(blob); 
  console.log("SVG", svg)
  const outBlob = new Blob([svg], { type: 'image/svg+xml' });
  return outBlob;
}

/**
 * Triggers the vectiorize process.
 */
export async function processVectorization(
  cesdk: CreativeEditorSDK,
  blockId: number
) {
  const blockApi = cesdk.engine.block;
  if (!blockApi.hasFill(blockId))
    throw new Error('Block has no fill to vectorize');

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

  try {
    // Clear values in the engine to trigger the loading spinner
    +9
    blockApi.setString(fillId, 'fill/image/imageFileURI', '');
    blockApi.setSourceSet(fillId, 'fill/image/sourceSet', []);

    const metadata = getPluginMetadata(cesdk, blockId);
    setPluginMetadata(cesdk, blockId, {
      ...metadata,
      version: PLUGIN_VERSION,
      initialSourceSet,
      initialImageFileURI,
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

    // Creating the mask from the highest resolution image
    const vectorized = await vectorize(uriToProcess);

    // Check for externally changed state while we were uploading and
    // do not proceed if the state was reset.
    if (
      getPluginMetadata(cesdk, blockId).status !== 'PROCESSING' ||
      !isMetadataConsistent(cesdk, blockId)
    )
      return;

    const pathname = new URL(uriToProcess).pathname;
    const parts = pathname.split('/');
    const filename = parts[parts.length - 1];

    const uploadedAssets = await cesdk.unstable_upload(
      new File([vectorized], filename, { type: vectorized.type }),
      () => {
        // TODO Delegate process to UI component
      }
    );

    // Check for externally changed state while we were uploading and
    // do not proceed if the state was reset.
    if (
      getPluginMetadata(cesdk, blockId).status !== 'PROCESSING' ||
      !isMetadataConsistent(cesdk, blockId)
    )
      return;

    const url = uploadedAssets.meta?.uri;
    console.log("URL", url)
    if (url == null) {
      throw new Error('Could not upload vectorized image');
    }

    setPluginMetadata(cesdk, blockId, {
      version: PLUGIN_VERSION,
      initialSourceSet,
      initialImageFileURI,
      blockId,
      fillId,
      status: 'PROCESSED_TOGGLE_ON',
      processedAsset: url
    });
    blockApi.setString(fillId, 'fill/image/imageFileURI', url);
    // Finally, create an undo step
    cesdk.engine.editor.addUndoStep();
  } catch (error) {
    if (cesdk.engine.block.isValid(blockId)) {
      setPluginMetadata(cesdk, blockId, {
        version: PLUGIN_VERSION,
        initialSourceSet,
        initialImageFileURI,
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
