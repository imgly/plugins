import CreativeEditorSDK, { type EditorPlugin } from '@cesdk/cesdk-js';
import iconSprite, { PLUGIN_ICON_SET_ID } from './iconSprite';
import { PluginConfiguration } from './types';
import getProvider from './provider/elevenlabs/getProvider';
import { initProvider } from '@imgly/plugin-utils-ai-generation';

export { PLUGIN_ID } from './constants';

export default (
  config: PluginConfiguration
): Omit<EditorPlugin, 'name' | 'version'> => {
  return {
    async initialize({ cesdk }) {
      if (cesdk == null) return;

      if (config.provider.id !== 'elevenlabs') {
        throw new Error('Only the "elevenlabs" provider is supported for now');
      }

      if (config.provider.proxyUrl == null) {
        throw new Error(
          'The "proxyUrl" is required as the provider configuration.'
        );
      }

      const provider = getProvider(cesdk, config);
      initProvider(provider, { cesdk, engine: cesdk.engine }, {});

      // Add icon set
      cesdk.ui.addIconSet(PLUGIN_ICON_SET_ID, iconSprite);

      // Implementation will be added in the future
    }
  };
};
