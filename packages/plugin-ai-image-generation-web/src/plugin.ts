import { type EditorPlugin } from '@cesdk/cesdk-js';
import {
  initializeProviders,
  Output,
  registerDockComponent
} from '@imgly/plugin-ai-generation-web';
import { PluginConfiguration } from './types';
import iconSprite, { PLUGIN_ICON_SET_ID } from './iconSprite';
import { toArray } from '@imgly/plugin-utils';

export { PLUGIN_ID } from './constants';

const IMAGE_GENERATION_PANEL_ID = 'ly.img.ai/image-generation';

export function ImageGeneration<I, O extends Output>(
  config: PluginConfiguration<I, O>
): Omit<EditorPlugin, 'name' | 'version'> {
  return {
    async initialize({ cesdk }) {
      if (cesdk == null) return;

      cesdk.ui.addIconSet(PLUGIN_ICON_SET_ID, iconSprite);
      cesdk.i18n.setTranslations({
        en: {
          [`panel.${IMAGE_GENERATION_PANEL_ID}`]: 'Image Generation',
          [`${IMAGE_GENERATION_PANEL_ID}.dock.label`]: 'AI Image'
        }
      });

      printConfigWarnings(config);

      const text2image = config.providers?.text2image ?? config.text2image;
      const image2image = config.providers?.image2image ?? config.image2image;

      const text2imageProviders = await Promise.all(
        toArray(text2image).map((getProvider) => getProvider({ cesdk }))
      );
      const image2imageProviders = await Promise.all(
        toArray(image2image).map((getProvider) => getProvider({ cesdk }))
      );
      const initializedResult = await initializeProviders(
        'image',
        {
          fromText: text2imageProviders,
          fromImage: image2imageProviders
        },
        { cesdk },
        config
      );

      if (initializedResult.panel.builderRenderFunction != null) {
        cesdk.ui.registerPanel(
          IMAGE_GENERATION_PANEL_ID,
          initializedResult.panel.builderRenderFunction
        );

        registerDockComponent({
          cesdk,
          panelId: IMAGE_GENERATION_PANEL_ID
        });
      }
    }
  };
}

function printConfigWarnings<I, O extends Output>(
  config: PluginConfiguration<I, O>
) {
  if (!config.debug) return;

  if (config.providers?.text2image != null && config.text2image != null) {
    // eslint-disable-next-line no-console
    console.warn(
      '[ImageGeneration]: Both `providers.text2image` and `text2image` configuration is provided. Since `text2image` is deprecated, only `providers.text2image` will be used.'
    );
  }
  if (config.providers?.image2image != null && config.image2image != null) {
    // eslint-disable-next-line no-console
    console.warn(
      '[ImageGeneration]: Both `providers.image2image` and `image2image` configuration is provided. Since `image2image` is deprecated, only `providers.image2image` will be used.'
    );
  }
}

export default ImageGeneration;
