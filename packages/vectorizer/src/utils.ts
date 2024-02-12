import { CreativeEngine } from '@cesdk/cesdk-js';
import isEqual from 'lodash/isEqual';

import { PLUGIN_ID } from './manifest';
import {
  PluginMetadata,
  PluginStatusError,
  PluginStatusProcessed,
  PluginStatusProcessing
} from './utils/types';


export const areBlocksSupported = (engine: CreativeEngine, blockIds: number[]) => {
  return blockIds.some(id => isBlockSupported(engine, id))
}
/**
 * Checks if a block is supported by the given CreativeEngine.
 * @param engine - The CreativeEngine instance.
 * @param blockId - The ID of the block to check.
 * @returns A boolean indicating whether the block is supported or not.
 */
export const isBlockSupported = (engine: CreativeEngine, blockId: number) => {
  if (!engine.block.isValid(blockId)) return false;
  const blockType = engine.block.getType(blockId);
  if (blockType === "//ly.img.ubq/page") return false;  // There is some bug with the page block

  if (engine.block.hasFill(blockId)) {
    const fillId = engine.block.getFill(blockId);
    const fillType = engine.block.getType(fillId);
    if (fillType !== '//ly.img.ubq/fill/image') {
      return false;
    }
    return true
  }

  return false;
}

/**
 * Sets the metadata for the plugin state.
 */
export function setPluginMetadata(
  engine: CreativeEngine,
  id: number,
  metadata: PluginMetadata
) {
  engine.block.setMetadata(id, PLUGIN_ID, JSON.stringify(metadata));
}

/**
 * Returns the current metadata for the plugin state. If no metadata
 * is set on the given block, it will return an IDLE state.
 */
export function getPluginMetadata(
  engine: CreativeEngine,
  id: number
): PluginMetadata {
  if (engine.block.hasMetadata(id, PLUGIN_ID)) {
    return JSON.parse(engine.block.getMetadata(id, PLUGIN_ID));
  } else {
    return {
      status: 'IDLE'
    };
  }
}

/**
 * If plugin metadata is set, it will be cleared.
 */
export function clearPluginMetadata(engine: CreativeEngine, id: number) {
  if (engine.block.hasMetadata(id, PLUGIN_ID)) {
    engine.block.removeMetadata(id, PLUGIN_ID);
  }
}

/**
 * Detect if the block has been duplicated with processed or processing state.
 * In that case the plugin state is still valid, but blockId and fillId have changed.
 */
export function isDuplicate(
  engine: CreativeEngine,
  blockId: number,
  metadata: PluginMetadata
): boolean {
  if (!engine.block.isValid(blockId)) return false;
  if (metadata.status === 'IDLE' || metadata.status === 'ERROR')
    return false;

  if (!engine.block.hasFill(blockId)) return false;
  const fillId = engine.block.getFill(blockId);

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
  engine: CreativeEngine,
  blockId: number
) {
  const fillId = engine.block.getFill(blockId);
  const metadata = getPluginMetadata(engine, blockId);
  if (
    metadata.status === 'IDLE' ||
    // metadata.status === 'PENDING' ||
    metadata.status === 'ERROR'
  )
    return;
  setPluginMetadata(engine, blockId, {
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
  engine: CreativeEngine,
  blockId: number
): boolean {
  // In case the block was removed, we just abort and mark it
  // as reset by returning true
  if (!engine.block.isValid(blockId)) return false;
  const metadata = getPluginMetadata(engine, blockId);
  if (metadata.status === 'IDLE'
    //  || metadata.status === 'PENDING'
  ) return true;

  if (!engine.block.hasFill(blockId)) return false;
  const fillId = engine.block.getFill(blockId);
  if (fillId == null) return false;

  if (blockId !== metadata.blockId || fillId !== metadata.fillId) return false;

  const sourceSet = engine.block.getSourceSet(
    fillId,
    'fill/image/sourceSet'
  );
  const imageFileURI = engine.block.getString(
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
      metadata.status === 'PROCESSED'
    ) {
      // const processedAsset = metadata.processedAsset;
      if (
        // !isEqual(sourceSet, processedAsset) &&
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
    if (metadata.status === 'PROCESSED') {
      if (
        imageFileURI !== metadata.initialImageFileURI
        // &&imageFileURI !== metadata.processedAsset
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
 * Recover the initial values to avoid the loading spinner and have the same
 * state as before the process was started.
 */
export function recoverInitialImageData(
  engine: CreativeEngine,
  blockId: number
) {
  const blockApi = engine.block;
  if (!blockApi.hasFill(blockId)) return; // Nothing to recover (no fill anymore)

  const metadata = getPluginMetadata(engine, blockId);

  if (
    // metadata.status === 'PENDING' || 
    metadata.status === 'IDLE') {
    return;
  }

  const initialSourceSet = metadata.initialSourceSet;
  const initialImageFileURI = metadata.initialImageFileURI;

  const fillId = getValidFill(engine, blockId, metadata);
  if (fillId == null) return;

  if (initialImageFileURI) {
    engine.block.setString(
      fillId,
      'fill/image/imageFileURI',
      initialImageFileURI
    );
  }
  if (initialSourceSet.length > 0) {
    engine.block.setSourceSet(
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
  engine: CreativeEngine,
  blockId: number,
  metadata: PluginStatusProcessing | PluginStatusError | PluginStatusProcessed
): number | undefined {
  if (
    !engine.block.isValid(blockId) ||
    !engine.block.hasFill(blockId) ||
    blockId !== metadata.blockId
  ) {
    return undefined;
  }
  const fillId = engine.block.getFill(blockId);
  if (fillId !== metadata.fillId) {
    return undefined;
  }

  return fillId;
}



// These don't belong here

export class Scheduler<T> {
  #queue?: Promise<T> = undefined

  async schedule(task: () => Promise<T>): Promise<T> {
    if (this.#queue === undefined) {
      this.#queue = task()
    } else {
      this.#queue = this.#queue.then(async () => {
        return await task()
      })
    }
    return this.#queue
  }
}


/**
 * Generates a unique filename.
 * @returns A string representing the unique filename.
 */
export function generateUniqueFilename(): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  return `${timestamp}_${randomString}`;
}