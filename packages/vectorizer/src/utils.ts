import type CreativeEditorSDK from '@cesdk/cesdk-js';
import isEqual from 'lodash/isEqual';

import { PLUGIN_ID } from './constants';
import {
  PluginMetadata,
  PluginStatusError,
  PluginStatusProcessed,
  PluginStatusProcessing
} from './types';

/**
 * Sets the metadata for the plugin state.
 */
export function setPluginMetadata(
  cesdk: CreativeEditorSDK,
  id: number,
  metadata: PluginMetadata
) {
  cesdk.engine.block.setMetadata(id, PLUGIN_ID, JSON.stringify(metadata));
}

/**
 * Returns the current metadata for the plugin state. If no metadata
 * is set on the given block, it will return an IDLE state.
 */
export function getPluginMetadata(
  cesdk: CreativeEditorSDK,
  id: number
): PluginMetadata {
  if (cesdk.engine.block.hasMetadata(id, PLUGIN_ID)) {
    return JSON.parse(cesdk.engine.block.getMetadata(id, PLUGIN_ID));
  } else {
    return {
      status: 'IDLE'
    };
  }
}

/**
 * If plugin metadata is set, it will be cleared.
 */
export function clearPluginMetadata(cesdk: CreativeEditorSDK, id: number) {
  if (cesdk.engine.block.hasMetadata(id, PLUGIN_ID)) {
    cesdk.engine.block.removeMetadata(id, PLUGIN_ID);
  }
}

/**
 * Detect if the block has been duplicated with processed or processing state.
 * In that case the plugin state is still valid, but blockId and fillId have changed.
 */
export function isDuplicate(
  cesdk: CreativeEditorSDK,
  blockId: number,
  metadata: PluginMetadata
): boolean {
  if (!cesdk.engine.block.isValid(blockId)) return false;
  if (
    metadata.status === 'IDLE' ||
    metadata.status === 'PENDING' ||
    metadata.status === 'ERROR'
  )
    return false;

  if (!cesdk.engine.block.hasFill(blockId)) return false;
  const fillId = cesdk.engine.block.getFill(blockId);

  // It cannot be a duplicate if the blockId or fillId are the same
  if (metadata.blockId === blockId || metadata.fillId === fillId) return false;

  return true;
}

/**
 * Fixes the metadata if the block has been duplicated, i.e. the blockId and
 * fillId will be updated to the current block/fill.
 *
 * Please note: Call this method only on duplicates (see isDuplicate).
 */
export function fixDuplicateMetadata(
  cesdk: CreativeEditorSDK,
  blockId: number
) {
  const fillId = cesdk.engine.block.getFill(blockId);
  const metadata = getPluginMetadata(cesdk, blockId);
  if (
    metadata.status === 'IDLE' ||
    metadata.status === 'PENDING' ||
    metadata.status === 'ERROR'
  )
    return;
  setPluginMetadata(cesdk, blockId, {
    ...metadata,
    blockId,
    fillId
  });
}

/**
 * Check if the image has a consisten metadata state. A inconsistent state is
 * caused by outside changes of the fill data.
 *
 * @returns true if the metadata is consistent, false otherwise
 */
export function isMetadataConsistent(
  cesdk: CreativeEditorSDK,
  blockId: number
): boolean {
  // In case the block was removed, we just abort and mark it
  // as reset by returning true
  if (!cesdk.engine.block.isValid(blockId)) return false;
  const metadata = getPluginMetadata(cesdk, blockId);
  if (metadata.status === 'IDLE' || metadata.status === 'PENDING') return true;

  if (!cesdk.engine.block.hasFill(blockId)) return false;
  const fillId = cesdk.engine.block.getFill(blockId);
  if (fillId == null) return false;

  if (blockId !== metadata.blockId || fillId !== metadata.fillId) return false;

  const sourceSet = cesdk.engine.block.getSourceSet(
    fillId,
    'fill/image/sourceSet'
  );
  const imageFileURI = cesdk.engine.block.getString(
    fillId,
    'fill/image/imageFileURI'
  );

  if (
    sourceSet.length === 0 &&
    !imageFileURI &&
    metadata.status === 'PROCESSING'
  ) {
    // While we process it is OK to have no image file URI and no source set
    // (which we cleared to show the spinning loader)
    return true;
  }

  // Source sets have precedence over imageFileURI so if we have a source set,
  // we only need to check if it has changed to something else.
  if (sourceSet?.length > 0) {
    const initialSourceSet = metadata.initialSourceSet;
    // If we have already processed the image, we need to check if the source set
    // we need to check against both source sets, the removed and the initial
    if (
      metadata.status === 'PROCESSED_TOGGLE_OFF' ||
      metadata.status === 'PROCESSED_TOGGLE_ON'
    ) {
      const processedAsset = metadata.processedAsset;
      if (
        !isEqual(sourceSet, processedAsset) &&
        !isEqual(sourceSet, initialSourceSet)
      ) {
        return false;
      }
    } else {
      if (!isEqual(sourceSet, initialSourceSet)) {
        return false;
      }
    }
  } else {
    if (
      metadata.status === 'PROCESSED_TOGGLE_OFF' ||
      metadata.status === 'PROCESSED_TOGGLE_ON'
    ) {
      if (
        imageFileURI !== metadata.initialImageFileURI &&
        imageFileURI !== metadata.processedAsset
      ) {
        return false;
      }
    } else {
      if (imageFileURI !== metadata.initialImageFileURI) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Toggle between the vectorized image and the original image if either
 * in the state "PROCESSED_TOGGLE_OFF" or "PROCESSED_TOGGLE_ON". Otherwise do
 * nothing.
 */
export function toggleProcessedData(cesdk: CreativeEditorSDK, blockId: number) {
  const blockApi = cesdk.engine.block;
  if (!blockApi.hasFill(blockId)) return; // Nothing to recover (no fill anymore)
  const fillId = blockApi.getFill(blockId);

  const metadata = getPluginMetadata(cesdk, blockId);

  if (metadata.status === 'PROCESSED_TOGGLE_OFF') {
    setPluginMetadata(cesdk, blockId, {
      ...metadata,
      status: 'PROCESSED_TOGGLE_ON'
    });

    if (typeof metadata.processedAsset === 'string') {
      blockApi.setString(
        fillId,
        'fill/image/imageFileURI',
        metadata.processedAsset
      );
      blockApi.setSourceSet(fillId, 'fill/image/sourceSet', []);
    } else {
      blockApi.setSourceSet(
        fillId,
        'fill/image/sourceSet',
        metadata.processedAsset
      );
    }

    cesdk.engine.editor.addUndoStep();
  } else if (metadata.status === 'PROCESSED_TOGGLE_ON') {
    setPluginMetadata(cesdk, blockId, {
      ...metadata,
      status: 'PROCESSED_TOGGLE_OFF'
    });

    blockApi.setString(
      fillId,
      'fill/image/imageFileURI',
      metadata.initialImageFileURI
    );
    blockApi.setSourceSet(
      fillId,
      'fill/image/sourceSet',
      metadata.initialSourceSet
    );
    cesdk.engine.editor.addUndoStep();
  }
}

/**
 * Recover the initial values to avoid the loading spinner and have the same
 * state as before the process was started.
 */
export function recoverInitialImageData(
  cesdk: CreativeEditorSDK,
  blockId: number
) {
  const blockApi = cesdk.engine.block;
  if (!blockApi.hasFill(blockId)) return; // Nothing to recover (no fill anymore)

  const metadata = getPluginMetadata(cesdk, blockId);

  if (metadata.status === 'PENDING' || metadata.status === 'IDLE') {
    return;
  }

  const initialSourceSet = metadata.initialSourceSet;
  const initialImageFileURI = metadata.initialImageFileURI;

  const fillId = getValidFill(cesdk, blockId, metadata);
  if (fillId == null) return;

  if (initialImageFileURI) {
    cesdk.engine.block.setString(
      fillId,
      'fill/image/imageFileURI',
      initialImageFileURI
    );
  }
  if (initialSourceSet.length > 0) {
    cesdk.engine.block.setSourceSet(
      fillId,
      'fill/image/sourceSet',
      initialSourceSet
    );
  }
}

/**
 * Returns the fill id of the block if it has a valid fill that was used for
 * vectorizing. Returns undefined otherwise.
 */
function getValidFill(
  cesdk: CreativeEditorSDK,
  blockId: number,
  metadata: PluginStatusProcessing | PluginStatusError | PluginStatusProcessed
): number | undefined {
  if (
    !cesdk.engine.block.isValid(blockId) ||
    !cesdk.engine.block.hasFill(blockId) ||
    blockId !== metadata.blockId
  ) {
    return undefined;
  }
  const fillId = cesdk.engine.block.getFill(blockId);
  if (fillId !== metadata.fillId) {
    return undefined;
  }

  return fillId;
}
