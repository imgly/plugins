import type CreativeEditorSDK from '@cesdk/cesdk-js';

import { PLUGIN_ACTION_VECTORIZE_LABEL } from './manifest';


import {
  getPluginMetadata,
  isBlockSupported,
  isMetadataConsistent,
  recoverInitialImageData,
  setPluginMetadata

} from './utils';

import { runInWorker } from './utils/worker.shared';
import { createVectorPathBlocks } from './utils/cesdk+utils';


// FIXME: The vectorize technically does not need image fills, it can vectorize every block by rendering the block and then processing the image
const vectorize = async (cesdk: CreativeEditorSDK, params: { blockIds?: number[] }) => {
  const uploader = cesdk.unstable_upload.bind(cesdk)
  const engine = cesdk.engine; // the only function that needs the ui is the upload function
  const blockApi = engine.block;

  // this shouldn't be necessay here
  const blockIds = params.blockIds ?? engine.block.findAllSelected();

  blockIds.forEach(async blockId => {
    // this should happen before already and only be called if the feature is enabled for a certain block
    if (!isBlockSupported(engine, blockId)) return;


    if (!blockApi.hasFill(blockId))
      throw new Error('Block has no fill to vectorize');

    const fillId = blockApi.getFill(blockId);

    // FIXME: Tis is only needed to tell the engin that we are processing something and it cannot export or save the scene file.
    // Practicalle, we are not using the images directly but render the visible part of the block and then process this image
    // Get the current image URI and source set as initial values.
    const initialSourceSet = blockApi.getSourceSet(fillId, 'fill/image/sourceSet');
    const initialImageFileURI = blockApi.getString(fillId, 'fill/image/imageFileURI');
    const initialPreviewFileURI = blockApi.getString(fillId, 'fill/image/previewFileURI');


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
      // @ts-ignore
      const blob = await engine.block.export(blockId, "image/png");

      // go into busy state
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

      const vectorized: Blob = await runInWorker(blob)

      if (
        getPluginMetadata(engine, blockId).status !== 'PROCESSING' ||
        !isMetadataConsistent(engine, blockId)
      ) return;
      if (engine.block.isValid(blockId)) {
        setPluginMetadata(engine, blockId, {
          version: PLUGIN_VERSION,
          initialSourceSet,
          initialImageFileURI,
          blockId,
          fillId,
          status: 'PROCESSED',
        });
      }


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

        // Workaround Processing is done, restore state of the initial block
        blockApi.setSourceSet(fillId, 'fill/image/sourceSet', initialSourceSet);
        blockApi.setString(fillId, 'fill/image/imageFileURI', initialImageFileURI);
        blockApi.setString(fillId, 'fill/image/previewFileURI', initialPreviewFileURI);

        setPluginMetadata(engine, blockId, {
          version: PLUGIN_VERSION,
          initialSourceSet,
          initialImageFileURI,
          blockId,
          fillId,
          status: 'PROCESSED',
        });

        blockApi.setString(fillId, 'fill/image/imageFileURI', url);
      } else if (vectorized.type === 'application/json') {

        const json = await vectorized.text()
        const blocks = JSON.parse(json)
        const blockIds = createVectorPathBlocks(engine, blocks)

        const origRotation = engine.block.getRotation(blockId)
        const origX = engine.block.getPositionX(blockId)
        const origY = engine.block.getPositionY(blockId)
        const origSelected = engine.block.isSelected(blockId)

        switch (engine.block.getType(blockId)) {
          case "//ly.img.ubq/page":
            {
              const parentId = blockId;
              const containerId = engine.block.group(blockIds);
              engine.block.appendChild(parentId, containerId);
              const scale = engine.block.getFrameWidth(blockId) / engine.block.getFrameWidth(containerId)
              engine.block.setPositionX(containerId, origX)
              engine.block.setPositionY(containerId, origY)
              engine.block.setRotation(containerId, origRotation)
              engine.block.scale(containerId, scale)
              engine.block.setFillEnabled(parentId, false)
              engine.block.setSelected(containerId, origSelected)
              break;
            }
          case "//ly.img.ubq/graphic":
          default: { // replace the current block with the a new group of the vectors
            const parentId = engine.block.getParent(blockId)!
            const containerId = engine.block.group(blockIds);
            engine.block.appendChild(parentId, containerId);
            const scale = engine.block.getFrameWidth(blockId) / engine.block.getFrameWidth(containerId)
            engine.block.setPositionX(containerId, origX)
            engine.block.setPositionY(containerId, origY)
            engine.block.setRotation(containerId, origRotation)
            engine.block.scale(containerId, scale)
            engine.block.destroy(blockId)
            engine.block.setSelected(containerId, origSelected)
            break;
          }
        }
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
  })
}


export default { [PLUGIN_ACTION_VECTORIZE_LABEL]: vectorize }
