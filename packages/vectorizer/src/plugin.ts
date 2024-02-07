import CreativeEditorSDK, { CreativeEngine } from '@cesdk/cesdk-js';

import { PLUGIN_FEATURE_ID, PLUGIN_ID } from './constants';

import { command } from './commands';
import { registerComponents } from './ui';

import {
  clearPluginMetadata,
  fixDuplicateMetadata,
  getPluginMetadata,
  isDuplicate,
  isMetadataConsistent
} from './utils';

export interface PluginConfiguration { 
  // uploader ? 
}

export default (pluginConfiguration: PluginConfiguration = {}) => {
  return {
    initialize(engine: CreativeEngine) {
      engine.event.subscribe([], async (events) => {
        events
          .filter((e) => engine.block.isValid(e.block) && engine.block.hasMetadata(e.block, PLUGIN_ID))
          .forEach((e) => {
            const id = e.block;
            if (e.type === 'Created') {
              const metadata = getPluginMetadata(engine, id);
              if (isDuplicate(engine, id, metadata)) {
                fixDuplicateMetadata(engine, id);
              }
            }
          });
      });
    },

    update() {
      
    },

    initializeUserInterface({ cesdk }: { cesdk: CreativeEditorSDK }) {
      cesdk.engine.event.subscribe([], async (events) => {
        events
          .filter((e) => cesdk.engine.block.isValid(e.block) && cesdk.engine.block.hasMetadata(e.block, PLUGIN_ID))
          .filter((e) => e.type === 'Updated')
          .forEach((e) => { handleUpdateEvent(cesdk, e.block); });
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
  const metadata = getPluginMetadata(cesdk.engine, blockId);

  switch (metadata.status) {
    case 'PENDING': {
      if (
        cesdk.feature.unstable_isEnabled(PLUGIN_FEATURE_ID, {
          engine: cesdk.engine
        })
      ) {
        command(cesdk, blockId);
      }
      break;
    }

    case 'PROCESSING':
    case 'PROCESSED_TOGGLE_OFF':
    case 'PROCESSED_TOGGLE_ON': {
      if (!isMetadataConsistent(cesdk.engine, blockId)) {
        clearPluginMetadata(cesdk.engine, blockId);
      }
      break;
    }

    default: {
      // We do not care about other states
    }
  }
}


export function enableFeatures(cesdk: CreativeEditorSDK) {
  cesdk.feature.unstable_enable(PLUGIN_FEATURE_ID, ({ engine }) => {
    const selectedIds = engine.block.findAllSelected();
    if (selectedIds.length !== 1) {
      return false;
    }
    const [selectedId] = selectedIds;

    if (engine.block.hasFill(selectedId)) {
      const fillId = engine.block.getFill(selectedId);
      const fillType = engine.block.getType(fillId);

      if (fillType !== '//ly.img.ubq/fill/image') {
        return false;
      }
      return true

    }

    return false;
  });
}
