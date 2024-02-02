import type CreativeEditorSDK from '@cesdk/cesdk-js';

import { FEATURE_ID, PLUGIN_ID } from './constants';
import { enableFeatures } from './enableFeatures';
import { processVectorization } from './processVectorization';
import { registerComponents } from './registerComponents';
import {
  clearPluginMetadata,
  fixDuplicateMetadata,
  getPluginMetadata,
  isDuplicate,
  isMetadataConsistent
} from './utils';

export interface PluginConfiguration {}

export default (pluginConfiguration: PluginConfiguration = {}) => {
  return {
    initialize() {},

    update() {},

    initializeUserInterface({ cesdk }: { cesdk: CreativeEditorSDK }) {
      cesdk.engine.event.subscribe([], async (events) => {
        events.forEach((e) => {
          const id = e.block;
          if (
            !cesdk.engine.block.isValid(id) ||
            !cesdk.engine.block.hasMetadata(id, PLUGIN_ID)
          ) {
            return;
          }

          if (e.type === 'Created') {
            const metadata = getPluginMetadata(cesdk, id);
            if (isDuplicate(cesdk, id, metadata)) {
              fixDuplicateMetadata(cesdk, id);
            }
          } else if (e.type === 'Updated') {
            handleUpdateEvent(cesdk, id);
          }
        });
      });

      registerComponents(cesdk);
      enableFeatures(cesdk);
    }
  };
};

/**
 * Handle every possible state of the vectorization state if the block was
 * updated.
 */
async function handleUpdateEvent(cesdk: CreativeEditorSDK, blockId: number) {
  const metadata = getPluginMetadata(cesdk, blockId);

  switch (metadata.status) {
    case 'PENDING': {
      if (
        cesdk.feature.unstable_isEnabled(FEATURE_ID, {
          engine: cesdk.engine
        })
      ) {
        processVectorization(cesdk, blockId);
      }
      break;
    }

    case 'PROCESSING':
    case 'PROCESSED_TOGGLE_OFF':
    case 'PROCESSED_TOGGLE_ON': {
      if (!isMetadataConsistent(cesdk, blockId)) {
        clearPluginMetadata(cesdk, blockId);
      }
      break;
    }

    default: {
      // We do not care about other states
    }
  }
}
