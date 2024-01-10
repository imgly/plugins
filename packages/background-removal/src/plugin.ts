import type CreativeEditorSDK from '@cesdk/cesdk-js';

import {
  clearBGRemovalMetadata,
  fixDuplicateMetadata,
  getBGRemovalMetadata,
  isDuplicate,
  isMetadataConsistent
} from './utils';
import { BG_REMOVAL_ID, FEATURE_ID } from './constants';
import { registerComponents } from './registerComponents';
import { enableFeatures } from './enableFeatures';
import { processBackgroundRemoval } from './processBackgroundRemoval';
import type { Config as BackgroundRemovalConfiguration } from '@imgly/background-removal';

export interface PluginConfiguration {
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
            !cesdk.engine.block.hasMetadata(id, BG_REMOVAL_ID)
          ) {
            return;
          }

          if (e.type === 'Created') {
            const metadata = getBGRemovalMetadata(cesdk, id);
            if (isDuplicate(cesdk, id, metadata)) {
              fixDuplicateMetadata(cesdk, id);
            }
          } else if (e.type === 'Updated') {
            handleUpdateEvent(cesdk, id, backgroundRemovalConfiguration);
          }
        });
      });

      registerComponents(cesdk);
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
  const metadata = getBGRemovalMetadata(cesdk, blockId);

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
    case 'PROCESSED_WITH_BG':
    case 'PROCESSED_WITHOUT_BG': {
      if (!isMetadataConsistent(cesdk, blockId)) {
        clearBGRemovalMetadata(cesdk, blockId);
      }
      break;
    }

    default: {
      // We do not care about other states
    }
  }
}
