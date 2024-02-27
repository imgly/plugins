import {CreativeEngine} from "@cesdk/cesdk-js";

import {
  clearPluginMetadata,
  getPluginMetadata,
  isMetadataConsistent
} from './utils/common';
/**
 * Handle every possible state of the vectorization state if the block was
 * updated.
 */
export async function update(engine: CreativeEngine, blockId: number) {
    const metadata = getPluginMetadata(engine, blockId);
    switch (metadata.status) {
      case 'PROCESSING':
      case 'PROCESSED': {
        if (!isMetadataConsistent(engine, blockId)) {
          clearPluginMetadata(engine, blockId);
        }
        break;
      }
  
      default: {
        // We do not care about other states
      }
    }
  }
  