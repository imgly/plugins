import { EditorPlugin } from '@cesdk/cesdk-js';
import { fal } from '@fal-ai/client';
import addAssets from './addAssets';
import { PANEL_ID, PLUGIN_ICON_SET } from './constants';
import generate from './generate';
import iconSprite from './iconSprite';
import registerComponents from './registerComponents';
import registerPanels from './registerPanels';
import { PluginConfiguration } from './types';

export { PLUGIN_ID } from './constants';

export default (
  config: PluginConfiguration = {}
): Omit<EditorPlugin, 'name' | 'version'> => {
  return {
    initialize({ cesdk }) {
      if (cesdk == null) return;

      fal.config({
        // @ts-ignore
        proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
      });

      addAssets(cesdk);
      registerComponents(cesdk, config);
      registerPanels(cesdk, config, (input) => generate(cesdk, config, input));

      cesdk.ui.addIconSet(PLUGIN_ICON_SET, iconSprite);

      cesdk.setTranslations({
        en: {
          [`panel.${PANEL_ID}`]: 'AI Image Generator',
          [`panel.${PANEL_ID}.prompt`]: 'Prompt',
          [`panel.${PANEL_ID}.type`]: 'Type',
          [`panel.${PANEL_ID}.type.image`]: 'Image',
          [`panel.${PANEL_ID}.type.vector`]: 'Vector',
          [`panel.${PANEL_ID}.style`]: 'Style',
          [`panel.${PANEL_ID}.format`]: 'Format',
          [`panel.${PANEL_ID}.format.custom.width`]: 'Width',
          [`panel.${PANEL_ID}.format.custom.height`]: 'Height',
          [`panel.${PANEL_ID}.generate`]: 'Generate'
        }
      });
    }
  };
};
