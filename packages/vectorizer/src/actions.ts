import type CreativeEditorSDK from '@cesdk/cesdk-js';

import {
  getPluginMetadata,
  isBlockSupported,
  isMetadataConsistent,
  recoverInitialImageData,
  setPluginMetadata
} from './utils';

import { runInWorker } from './worker.shared';
import { createVectorPathBlocks } from './cesdk+utils';
/**
 * Apply the vectorization process to the image.
 */

/**
 * Triggers the vectiorize process.
 */
export async function vectorizeAction(
  cesdk: CreativeEditorSDK,
  params: { blockId: number }
) {
  const uploader = cesdk.unstable_upload.bind(cesdk)
  const engine = cesdk.engine; // the only function that needs the ui is the upload function
  const blockApi = engine.block;

  let { blockId } = params ?? {};
  if (blockId === undefined) {
    const selected = engine.block.findAllSelected()
    if (selected.length !== 1) {
      return;
    }
    blockId = selected[0];
  }
  const isValid = engine.block.isValid(blockId)
  if (!isValid) return

  if (!isBlockSupported(engine, blockId)) return;


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
  const initialPreviewFileURI = blockApi.getString(
    fillId,
    'fill/image/previewFileURI'
  );


  const uriToProcess =
    // Source sets have priority in the engine
    initialSourceSet.length > 0
      ? // Choose the highest resolution image in the source set
      initialSourceSet.sort(
        (a, b) => b.width * b.height - a.height * a.width
      )[0].uri
      : initialImageFileURI;

  if (uriToProcess === undefined || uriToProcess === '')
    return; // We shall return early if the uri is not defined or invalid



  try {
    // Clear values in the engine to trigger the loading spinner
    blockApi.setString(fillId, 'fill/image/imageFileURI', '');
    blockApi.setSourceSet(fillId, 'fill/image/sourceSet', []);
    // ensure we show the last image while processsing. Some images don't have the preview set
    if (initialPreviewFileURI === undefined || initialPreviewFileURI === '') {
      blockApi.setString(fillId, 'fill/image/previewFileURI', uriToProcess);
    }
    const metadata = getPluginMetadata(engine, blockId);
    setPluginMetadata(engine, blockId, {
      ...metadata,
      version: PLUGIN_VERSION,
      initialSourceSet,
      initialImageFileURI,
      blockId,
      fillId,
      status: 'PROCESSING'
    });

    const vectorized: Blob = await runInWorker(uriToProcess)

    if (
      getPluginMetadata(engine, blockId).status !== 'PROCESSING' ||
      !isMetadataConsistent(engine, blockId)
    )
      return;


    if (vectorized.type.length === 0 || vectorized.type === 'image/svg+xml') {
      const pathname = new URL(uriToProcess).pathname;
      const parts = pathname.split('/');
      const filename = parts[parts.length - 1];

      const uploadedAssets = await uploader(
        new File([vectorized], filename, { type: vectorized.type }),
        () => {
          // TODO Delegate process to UI component
        }
      );

      // Check for externally changed state while we were uploading and
      // do not proceed if the state was reset.
      if (
        getPluginMetadata(engine, blockId).status !== 'PROCESSING' ||
        !isMetadataConsistent(engine, blockId)
      )
        return;

      const url = uploadedAssets.meta?.uri;;
      if (url == null) {
        throw new Error('Could not upload vectorized image');
      }

      setPluginMetadata(engine, blockId, {
        version: PLUGIN_VERSION,
        initialSourceSet,
        initialImageFileURI,
        blockId,
        fillId,
        status: 'PROCESSED',
        // processedAsset: url
      });

      blockApi.setString(fillId, 'fill/image/imageFileURI', url);
    } else if (vectorized.type === 'application/json') {
      const json = await vectorized.text()
      const blocks = JSON.parse(json)
      const groupId = createVectorPathBlocks(engine, blocks)
      const parentId = engine.block.getParent(blockId)!
      engine.block.appendChild(parentId, groupId);


      const origWidth = engine.block.getFrameWidth(blockId)
      const origHeight = engine.block.getFrameHeight(blockId)
      const origRotation = engine.block.getRotation(blockId)
      const origX = engine.block.getPositionX(blockId)
      const origY = engine.block.getPositionY(blockId)
      const groupWidth = engine.block.getFrameWidth(groupId)
      const groupHeight = engine.block.getFrameHeight(groupId)
      engine.block.setPositionX(groupId, origX)
      engine.block.setPositionY(groupId, origY)
      engine.block.setRotation(groupId, origRotation)
      engine.block.scale(groupId, origWidth / groupWidth)
      //remove original block
      engine.block.destroy(blockId)
      
      // must be assigned to a scene to work... why?


      blockApi.setString(fillId, 'fill/image/imageFileURI', initialImageFileURI);

      setPluginMetadata(engine, blockId, {
        version: PLUGIN_VERSION,
        initialSourceSet,
        initialImageFileURI,
        blockId,
        fillId,
        status: 'PROCESSED',
      });
    }
    // Finally, create an undo step
    engine.editor.addUndoStep();

  } catch (error) {
    if (engine.block.isValid(blockId)) {
      setPluginMetadata(engine, blockId, {
        version: PLUGIN_VERSION,
        initialSourceSet,
        initialImageFileURI,
        blockId,
        fillId,
        status: 'ERROR'
      });

      recoverInitialImageData(engine, blockId);
    }
    // eslint-disable-next-line no-console
    console.error(error);
  }
}
