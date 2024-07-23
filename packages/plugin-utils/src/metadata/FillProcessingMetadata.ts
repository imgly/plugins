import { isEqual } from 'lodash-es';

import Metadata from './Metadata';
import {
  PluginStatusError,
  PluginStatusMetadata,
  PluginStatusProcessed,
  PluginStatusProcessing
} from './types';

class ImageProcessingMetadata extends Metadata<PluginStatusMetadata> {
  get(blockId: number): PluginStatusMetadata {
    return super.get(blockId) ?? { status: 'IDLE' };
  }

  /**
   * Detect if the block has been duplicated with processed or processing
   * fill processing. In that case the processing state is still
   * valid, but blockId and fillId have changed.
   */
  isDuplicate(blockId: number): boolean {
    if (!this.cesdk.engine.block.isValid(blockId)) return false;

    const metadata = this.get(blockId);

    if (
      metadata.status === 'IDLE' ||
      metadata.status === 'PENDING' ||
      metadata.status === 'ERROR'
    )
      return false;

    if (!this.cesdk.engine.block.hasFill(blockId)) return false;
    const fillId = this.cesdk.engine.block.getFill(blockId);

    // It cannot be a duplicate if the blockId or fillId are the same
    if (metadata.blockId === blockId || metadata.fillId === fillId)
      return false;

    return true;
  }

  /**
   * Fixes the metadata if the block has been duplicated, i.e. the blockId and
   * fillId will be updated to the current block/fill.
   *
   * Please note: Call this method only on duplicates (see isDuplicate).
   */
  fixDuplicate(blockId: number) {
    const fillId = this.cesdk.engine.block.getFill(blockId);
    const metadata = this.get(blockId);
    if (
      metadata.status === 'IDLE' ||
      metadata.status === 'PENDING' ||
      metadata.status === 'ERROR'
    )
      return;
    this.set(blockId, {
      ...metadata,
      blockId,
      fillId
    });

    // If it is currently processing the best we can do is to just recover
    // the initial image data, since no processing will update this block and
    // it will be stuck in the processing state.
    if (metadata.status === 'PROCESSING') {
      this.recoverInitialImageData(blockId);
      this.clear(blockId);
    }
  }

  /**
   * Check if the image has a consisten metadata state. A inconsistent state is
   * caused by outside changes of the fill data.
   *
   * @returns true if the metadata is consistent, false otherwise
   */
  isConsistent(blockId: number): boolean {
    // In case the block was removed, we just abort and mark it
    // as reset by returning true
    if (!this.cesdk.engine.block.isValid(blockId)) return false;
    const metadata = this.get(blockId);
    if (metadata.status === 'IDLE' || metadata.status === 'PENDING')
      return true;

    if (!this.cesdk.engine.block.hasFill(blockId)) return false;
    const fillId = this.cesdk.engine.block.getFill(blockId);
    if (fillId == null) return false;

    if (blockId !== metadata.blockId || fillId !== metadata.fillId)
      return false;

    const sourceSet = this.cesdk.engine.block.getSourceSet(
      fillId,
      'fill/image/sourceSet'
    );

    const initialSourceSet = metadata.initialSourceSet;
    // If we have already processed the image, we need to check if the source set
    // we need to check against both source sets, the removed and the initial
    if (metadata.status === 'PROCESSED') {
      if (
        !isEqual(sourceSet, metadata.processed) &&
        !isEqual(sourceSet, initialSourceSet)
      ) {
        return false;
      }
    } else {
      if (!isEqual(sourceSet, initialSourceSet)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Recover the initial values to avoid the loading spinner and have the same
   * state as before the fill processing was started.
   */
  recoverInitialImageData(blockId: number) {
    const blockApi = this.cesdk.engine.block;
    if (!blockApi.hasFill(blockId)) return; // Nothing to recover (no fill anymore)

    const metadata = this.get(blockId);

    if (metadata.status === 'PENDING' || metadata.status === 'IDLE') {
      return;
    }

    const initialSourceSet = metadata.initialSourceSet;
    const initialPreviewFileURI = metadata.initialPreviewFileURI;

    const fillId = this.getValidFill(blockId, metadata);
    if (fillId == null) return;

    if (initialPreviewFileURI) {
      this.cesdk.engine.block.setString(
        fillId,
        'fill/image/previewFileURI',
        initialPreviewFileURI
      );
    }
    if (initialSourceSet.length > 0) {
      this.cesdk.engine.block.setSourceSet(
        fillId,
        'fill/image/sourceSet',
        initialSourceSet
      );
    }
  }

  /**
   * Returns the fill id of the block if it has a valid fill that was used for
   * fill processing. Returns undefined otherwise.
   */
  private getValidFill(
    blockId: number,
    metadata: PluginStatusProcessing | PluginStatusError | PluginStatusProcessed
  ): number | undefined {
    if (
      !this.cesdk.engine.block.isValid(blockId) ||
      !this.cesdk.engine.block.hasFill(blockId) ||
      blockId !== metadata.blockId
    ) {
      return undefined;
    }
    const fillId = this.cesdk.engine.block.getFill(blockId);
    if (fillId !== metadata.fillId) {
      return undefined;
    }

    return fillId;
  }
}

export default ImageProcessingMetadata;
