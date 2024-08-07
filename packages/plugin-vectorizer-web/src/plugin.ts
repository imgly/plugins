import { type Config } from '@imgly/vectorizer';

import {
  initializeFillProcessing,
  registerFillProcessingComponents,
  type UserInterfaceConfiguration
} from '@imgly/plugin-utils';

import { EditorPlugin } from '@cesdk/cesdk-js';
import { processVectorization } from './processVectorization';

export const PLUGIN_ID = '@imgly/plugin-vectorizer-web';

export interface PluginConfiguration {
  ui?: UserInterfaceConfiguration;
  /**
   * Configuration for the vectorizer.
   */
  vectorizer?: Config;

  /**
   * The maximal number of paths for which we create a group instead of
   * inserting a SVG file
   */
  groupingThreshold?: number;

  /**
   * Timeout in milliseconds for the vectorization process.
   */
  timeout?: number;
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
          processVectorization(
            cesdk,
            blockId,
            metadata,
            pluginConfiguration?.vectorizer,
            pluginConfiguration?.groupingThreshold,
            pluginConfiguration?.timeout
          );
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
