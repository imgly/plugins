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

      const text2imageProviders = await Promise.all(
        toArray(config.text2image).map((getProvider) => getProvider({ cesdk }))
      );
      const image2imageProviders = await Promise.all(
        toArray(config.image2image).map((getProvider) => getProvider({ cesdk }))
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

export default ImageGeneration;
