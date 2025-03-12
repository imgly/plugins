import type CreativeEditorSDK from '@cesdk/cesdk-js';
import { type EditorPlugin } from '@cesdk/cesdk-js';
import iconSprite, { PLUGIN_ICON_SET_ID } from './iconSprite';
import registerComponents from './registerComponents';
import { PluginConfiguration, Provider } from './types';
import falAiProvider from './provider/fal-ai/fal-ai';
import registerGenerationPanel from './registerGenerationPanel';
import { registerHistoryAssetSource } from './history';
import { RecraftV3Input } from '@fal-ai/client/endpoints';

export { PLUGIN_ID } from './constants';

export default <I>(
  config: PluginConfiguration<I> = {}
): Omit<EditorPlugin, 'name' | 'version'> => {
  return {
    async initialize({ cesdk }) {
      if (cesdk == null) return;

      let providerId: string | undefined;
      switch (config.provider?.type) {
        case 'fal.ai': {
          providerId = await initializeProvider(falAiProvider, {
            config: config as unknown as PluginConfiguration<RecraftV3Input>,
            cesdk
          });
          break;
        }
        case 'custom': {
          providerId = await initializeProvider(config.provider, {
            config,
            cesdk
          });
          break;
        }
        default: {
          throw new Error('Invalid provider type');
        }
      }
      registerComponents({ cesdk, providerId });
      registerHistoryAssetSource({ config, cesdk, providerId });

      cesdk.ui.addIconSet(PLUGIN_ICON_SET_ID, iconSprite);
      cesdk.setTranslations({
        en: {
          [`panel.${providerId}`]: 'AI Image Generator',
          [`panel.${providerId}.prompt`]: 'Prompt',
          [`panel.${providerId}.type`]: 'Type',
          [`panel.${providerId}.type.image`]: 'Image',
          [`panel.${providerId}.type.vector`]: 'Vector',
          [`panel.${providerId}.style`]: 'Style',
          [`panel.${providerId}.styleSelection`]: 'Select a Style',
          [`panel.${providerId}.format`]: 'Format',
          [`panel.${providerId}.format.custom.width`]: 'Width',
          [`panel.${providerId}.format.custom.height`]: 'Height',
          [`panel.${providerId}.generate`]: 'Generate'
        }
      });
    }
  };
};

/**
 * Initialize the give provider and register its panel.
 *
 * @returns The provider ID.
 */
async function initializeProvider<I>(
  provider: Provider<I>,
  options: {
    historyAssetSourceId?: string;
    config: PluginConfiguration<I>;
    cesdk: CreativeEditorSDK;
  }
): Promise<string> {
  const { config, cesdk } = options;
  const providerId =
    typeof provider.id === 'function' ? provider.id({ config }) : provider.id;

  await provider.initialize({ config, cesdk, engine: cesdk.engine });
  registerGenerationPanel(provider, { cesdk, config, providerId });

  return providerId;
}
