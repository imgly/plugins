import type CreativeEditorSDK from '@cesdk/cesdk-js';

import {
  initializeFillProcessing,
  registerFillProcessingComponents
} from '@imgly/plugin-utils';

import {
  processBackgroundRemoval,
  type BackgroundRemovalProvider
} from './processBackgroundRemoval';
import { UserInterfaceConfiguration } from './types';

export const PLUGIN_ID = '@imgly/plugin-background-removal-web';

export interface PluginConfiguration {
  ui?: UserInterfaceConfiguration;
  provider?: BackgroundRemovalProvider;
}

export default (pluginConfiguration: PluginConfiguration = {}) => {
  return {
    initialize() {},

    update() {},

    initializeUserInterface({ cesdk }: { cesdk: CreativeEditorSDK }) {
      initializeFillProcessing(cesdk, {
        pluginId: PLUGIN_ID,
        process: (blockId, metadata) => {
          processBackgroundRemoval(
            cesdk,
            blockId,
            metadata,
            pluginConfiguration.provider ?? {
              type: '@imgly/background-removal'
            }
          );
        }
      });

      const { translationsKeys } = registerFillProcessingComponents(cesdk, {
        pluginId: PLUGIN_ID,
        icon: '@imgly/icons/BGRemove',
        locations: pluginConfiguration.ui?.locations
      });

      cesdk.setTranslations({
        en: {
          [translationsKeys.canvasMenuLabel]: 'BG Removal'
        }
      });
    }
  };
};
