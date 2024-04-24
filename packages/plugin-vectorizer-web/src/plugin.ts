import type CreativeEditorSDK from '@cesdk/cesdk-js';

import {
  initializeFillProcessing,
  registerFillProcessingComponents,
  type UserInterfaceConfiguration
} from '@imgly/plugin-utils';

import { processVectorization } from './processVectorization';

export const PLUGIN_ID = '@imgly/plugin-vectorizer-web';

export interface PluginConfiguration {
  ui?: UserInterfaceConfiguration;
}

export default (pluginConfiguration: PluginConfiguration = {}) => {
  return {
    initialize() {},

    update() {},

    initializeUserInterface({ cesdk }: { cesdk: CreativeEditorSDK }) {
      initializeFillProcessing(cesdk, {
        pluginId: PLUGIN_ID,
        process: (blockId, metadata) => {
          processVectorization(cesdk, blockId, metadata);
        }
      });

      const { translationsKeys } = registerFillProcessingComponents(cesdk, {
        pluginId: PLUGIN_ID,
        icon: '@imgly/icons/Vectorize',
        locations: pluginConfiguration.ui?.locations
      });

      cesdk.setTranslations({
        en: {
          [translationsKeys.canvasMenuLabel]: 'Vectorizer'
        }
      });
    }
  };
};
