import {
  initializeFillProcessing,
  registerFillProcessingComponents
} from '@imgly/plugin-utils';

import { EditorPlugin } from '@cesdk/cesdk-js';
import { processFill, ProviderConfig } from './process';

import { UserInterfaceConfiguration } from './types';

import { PLUGIN_ID, PLUGIN_LABEL, PLUGIN_ICON } from './constants';

export default (pluginConfiguration?: PluginConfiguration) => ({
  name: PLUGIN_ID,
  version: PLUGIN_VERSION,
  ...createPlugin(pluginConfiguration)
});

export interface PluginConfiguration {
  ui?: UserInterfaceConfiguration;
  provider?: ProviderConfig;
}

const createPlugin = (
  pluginConfiguration: PluginConfiguration = {}
): Omit<EditorPlugin, 'name' | 'version'> => {
  return {
    initialize({ cesdk }) {
      if (cesdk == null) return;

      initializeFillProcessing(cesdk, {
        pluginId: PLUGIN_ID,
        process: (blockId, metadata) => {
          processFill(
            cesdk,
            blockId,
            metadata,
            pluginConfiguration.provider
          );
        }
      });

      const { translationsKeys } = registerFillProcessingComponents(cesdk, {
        pluginId: PLUGIN_ID,
        icon: PLUGIN_ICON,
        locations: pluginConfiguration.ui?.locations
      });

      cesdk.setTranslations({
        en: {
          [translationsKeys.canvasMenuLabel]: PLUGIN_LABEL
        }
      });
    }
  };
};