import type CreativeEditorSDK from '@cesdk/cesdk-js';

import type { Config as BackgroundRemovalConfiguration } from '@imgly/background-removal';
import {
  initializeFillProcessing,
  registerFillProcessingComponents
} from '@imgly/plugin-utils';

import { processBackgroundRemoval } from './processBackgroundRemoval';
import { UserInterfaceConfiguration } from './types';

export const PLUGIN_ID = '@imgly/plugin-background-removal-web';

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
      initializeFillProcessing(cesdk, {
        pluginId: PLUGIN_ID,
        process: (blockId, metadata) => {
          processBackgroundRemoval(
            cesdk,
            blockId,
            backgroundRemovalConfiguration,
            metadata
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
