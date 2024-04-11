import type CreativeEditorSDK from '@cesdk/cesdk-js';

import type { Config as BackgroundRemovalConfiguration } from '@imgly/background-removal';
import { ImageProcessingMetadata } from '@imgly/plugin-utils';

import { FEATURE_ID, PLUGIN_ID } from './constants';
import { enableFeatures } from './enableFeatures';
import { processBackgroundRemoval } from './processBackgroundRemoval';
import { registerComponents } from './registerComponents';
import { UserInterfaceConfiguration } from './types';

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
      const metadata = new ImageProcessingMetadata(cesdk, PLUGIN_ID);

      cesdk.engine.event.subscribe([], async (events) => {
        events.forEach((e) => {
          const id = e.block;
          if (!cesdk.engine.block.isValid(id) || !metadata.hasData(id)) {
            return;
          }

          if (e.type === 'Created') {
            if (metadata.isDuplicate(id)) {
              metadata.fixDuplicate(id);
            }
          } else if (e.type === 'Updated') {
            handleUpdateEvent(
              cesdk,
              id,
              backgroundRemovalConfiguration,
              metadata
            );
          }
        });
      });

      registerComponents(cesdk, metadata, pluginConfiguration.ui);
      enableFeatures(cesdk, metadata);
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
  configuration: BackgroundRemovalConfiguration,
  metadata: ImageProcessingMetadata
) {
  switch (metadata.get(blockId).status) {
    case 'PENDING': {
      if (
        cesdk.feature.unstable_isEnabled(FEATURE_ID, {
          engine: cesdk.engine
        })
      ) {
        processBackgroundRemoval(cesdk, blockId, configuration, metadata);
      }
      break;
    }

    case 'PROCESSING':
    case 'PROCESSED': {
      if (!metadata.isConsistent(blockId)) {
        metadata.clear(blockId);
      }
      break;
    }

    default: {
      // We do not care about other states
    }
  }
}
