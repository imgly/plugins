import { type EditorPlugin } from '@cesdk/cesdk-js';
import {
  initializeProviders,
  Output,
  registerDockComponent,
  ActionRegistry,
  checkAiPluginVersion
} from '@imgly/plugin-ai-generation-web';
import { PluginConfiguration } from './types';
import iconSprite, { PLUGIN_ICON_SET_ID } from './iconSprite';
import { toArray, translateWithFallback } from '@imgly/plugin-utils';
import { PLUGIN_ID } from './constants';

export { PLUGIN_ID } from './constants';

const STICKER_GENERATION_PANEL_ID = 'ly.img.ai.sticker-generation';

export function StickerGeneration<I, O extends Output>(
  config: PluginConfiguration<I, O>
): Omit<EditorPlugin, 'name' | 'version'> {
  return {
    async initialize({ cesdk }) {
      if (cesdk == null) return;

      // Check AI plugin version consistency
      checkAiPluginVersion(cesdk, PLUGIN_ID, PLUGIN_VERSION);

      // Initialize Feature API for sticker generation plugin
      // Enable all features by default for backward compatibility
      cesdk.feature.enable(
        'ly.img.plugin-ai-sticker-generation-web.providerSelect',
        true
      );
      cesdk.feature.enable(
        'ly.img.plugin-ai-sticker-generation-web.fromText',
        true
      );
      cesdk.feature.enable(
        'ly.img.plugin-ai-sticker-generation-web.fromImage',
        true
      );

      const registry = ActionRegistry.get();
      const ACTION_LABEL_KEY = `${PLUGIN_ID}.action.label`;

      cesdk.ui.addIconSet(PLUGIN_ICON_SET_ID, iconSprite);
      cesdk.i18n.setTranslations({
        en: {
          [`panel.${STICKER_GENERATION_PANEL_ID}`]: 'Sticker Generation',
          [`${STICKER_GENERATION_PANEL_ID}.dock.label`]: 'AI Sticker',
          [ACTION_LABEL_KEY]: 'Generate Sticker'
        }
      });

      const disposeApp = registry.register({
        type: 'plugin',
        sceneMode: 'Design',

        id: PLUGIN_ID,
        pluginId: PLUGIN_ID,

        label: translateWithFallback(
          cesdk,
          ACTION_LABEL_KEY,
          'Generate Sticker'
        ),
        meta: { panelId: STICKER_GENERATION_PANEL_ID },

        execute: () => {
          if (cesdk.ui.isPanelOpen(STICKER_GENERATION_PANEL_ID)) {
            cesdk.ui.closePanel(STICKER_GENERATION_PANEL_ID);
          } else {
            cesdk.ui.openPanel(STICKER_GENERATION_PANEL_ID);
          }
        }
      });

      const text2sticker = config.providers?.text2sticker;

      const text2stickerProviders = await Promise.all(
        toArray(text2sticker).map((getProvider) => getProvider({ cesdk }))
      );

      // Check if any providers are configured
      const hasProviders = text2stickerProviders.length > 0;
      if (!hasProviders) {
        disposeApp();
        return; // Don't continue if no providers are configured
      }

      const initializedResult = await initializeProviders(
        'sticker',
        {
          fromText: text2stickerProviders,
          fromImage: []
        },
        { cesdk },
        config
      );

      if (initializedResult.history?.assetSourceId != null) {
        // TODO: Add combined asset source for this kind
      }

      if (initializedResult.panel.builderRenderFunction != null) {
        cesdk.ui.registerPanel(
          STICKER_GENERATION_PANEL_ID,
          initializedResult.panel.builderRenderFunction
        );

        registerDockComponent({
          cesdk,
          panelId: STICKER_GENERATION_PANEL_ID
        });
      } else {
        disposeApp();
      }
    }
  };
}

export default StickerGeneration;
