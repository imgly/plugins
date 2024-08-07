import {
  initializeFillProcessing,
  registerFillProcessingComponents
} from '@imgly/plugin-utils';

import { EditorPlugin } from '@cesdk/cesdk-js';
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

export default (
  pluginConfiguration: PluginConfiguration = {}
): Omit<EditorPlugin, 'name' | 'version'> => {
  return {
    initialize({ cesdk }) {
      if (cesdk == null) return;

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
