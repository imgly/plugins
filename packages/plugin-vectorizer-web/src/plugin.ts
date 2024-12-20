import { type Config } from '@imgly/vectorizer';

import {
  initializeFillProcessing,
  registerFillProcessingComponents,
  type UserInterfaceConfiguration
} from '@imgly/plugin-utils';

import CreativeEditorSDK, { EditorPlugin } from '@cesdk/cesdk-js';
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

      addIconSet(cesdk);

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
          [translationsKeys.inspectorBarLabel]: 'Vectorizer',
          [translationsKeys.navigationBarLabel]: 'Vectorizer',
          [translationsKeys.canvasBarLabel]: 'Vectorizer',
          [translationsKeys.canvasMenuLabel]: 'Vectorizer',
          [translationsKeys.dockLabel]: 'Vectorizer'
        }
      });
    }
  };
};

function addIconSet(cesdk: CreativeEditorSDK) {
  cesdk.ui.addIconSet(
    '@imgly/plugin/vectorizer',
    `
        <svg>
          <symbol
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            id="@imgly/icons/Vectorize"
          >
          <rect x="11" y="2" width="2" height="20" fill="currentColor"/>
          <path d="M13.6776 5.26764L19.9611 12L13.6776 18.7324L15.3224 20.2676L23.0389 12L15.3224 3.73242L13.6776 5.26764Z" fill="currentColor"/>
          <path d="M4 10.5H1V13.5H4V16.5H7V19.5H10V16.5H7V13.5H4V10.5Z" fill="currentColor"/>
          <path d="M4 10.5V7.50003H7V10.5H4Z" fill="currentColor"/>
          <path d="M7 7.50003V4.50003H10V7.50003H7Z" fill="currentColor"/>
          </symbol>
        </svg>
      `
  );
}
