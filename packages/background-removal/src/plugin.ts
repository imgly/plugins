import type CreativeEditorSDK from '@cesdk/cesdk-js';

import type { Config as BackgroundRemovalConfiguration } from '@imgly/background-removal';
import { FEATURE_ID, PLUGIN_ID } from './constants';
import { enableFeatures } from './enableFeatures';
import { processBackgroundRemoval } from './processBackgroundRemoval';
import { registerComponents } from './registerComponents';
import { UserInterfaceConfiguration } from './types';
import {
  clearPluginMetadata,
  fixDuplicateMetadata,
  getPluginMetadata,
  isDuplicate,
  isMetadataConsistent
} from './utils';

export interface PluginConfiguration {
  ui?: UserInterfaceConfiguration;
  backgroundRemoval?: BackgroundRemovalConfiguration;
}

export default (pluginConfiguration: PluginConfiguration = {}) => {
  const backgroundRemovalConfiguration: BackgroundRemovalConfiguration =
    pluginConfiguration?.backgroundRemoval ?? {};

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
            handleUpdateEvent(cesdk, id, backgroundRemovalConfiguration);
          }
        });
      });

      registerComponents(cesdk, pluginConfiguration.ui);
      enableFeatures(cesdk);
    }
  };
};

/**
 * Handle every possible state of the background removal state if the block was
 * updated.
 */
async function handleUpdateEvent(
  cesdk: CreativeEditorSDK,
  blockId: number,
  configuration: BackgroundRemovalConfiguration
) {
  const metadata = getPluginMetadata(cesdk, blockId);

  switch (metadata.status) {
    case 'PENDING': {
      if (
        cesdk.feature.unstable_isEnabled(FEATURE_ID, {
          engine: cesdk.engine
        })
      ) {
        processBackgroundRemoval(cesdk, blockId, configuration);
      }
      break;
    }

    case 'PROCESSING':
    case 'PROCESSED': {
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
