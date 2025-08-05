import { type EditorPlugin } from '@cesdk/cesdk-js';
import {
  ActionRegistry,
  Output,
  initializeProviders,
  registerDockComponent,
  extractTranslationsFromSchema,
  checkAiPluginVersion
} from '@imgly/plugin-ai-generation-web';
import { PluginConfiguration } from './types';
import { toArray } from '@imgly/plugin-utils';
import { PLUGIN_ID } from './constants';

export { PLUGIN_ID } from './constants';

const SPEECH_GENERATION_PANEL_ID = 'ly.img.ai.audio-generation.speech';
const SOUND_GENERATION_PANEL_ID = 'ly.img.ai.audio-generation.sound';

export function AudioGeneration<I, O extends Output>(
  config: PluginConfiguration<I, O>
): Omit<EditorPlugin, 'name' | 'version'> {
  return {
    async initialize({ cesdk }) {
      if (cesdk == null) return;

      // Check AI plugin version consistency
      checkAiPluginVersion(cesdk, PLUGIN_ID, PLUGIN_VERSION);

      printConfigWarnings(config);

      const registry = ActionRegistry.get();
      const disposeSoundApp = registry.register({
        type: 'plugin',
        sceneMode: 'Video',

        id: `${PLUGIN_ID}/sound`,
        pluginId: PLUGIN_ID,

        label: 'Generate Sound',
        meta: { panelId: SOUND_GENERATION_PANEL_ID },

        execute: () => {
          if (cesdk.ui.isPanelOpen(SOUND_GENERATION_PANEL_ID)) {
            cesdk.ui.closePanel(SOUND_GENERATION_PANEL_ID);
          } else {
            cesdk.ui.openPanel(SOUND_GENERATION_PANEL_ID);
          }
        }
      });

      const disposeSpeechApp = registry.register({
        type: 'plugin',
        sceneMode: 'Video',

        id: `${PLUGIN_ID}/speech`,
        pluginId: PLUGIN_ID,

        label: 'AI Voice',
        meta: { panelId: SPEECH_GENERATION_PANEL_ID },

        execute: () => {
          if (cesdk.ui.isPanelOpen(SPEECH_GENERATION_PANEL_ID)) {
            cesdk.ui.closePanel(SPEECH_GENERATION_PANEL_ID);
          } else {
            cesdk.ui.openPanel(SPEECH_GENERATION_PANEL_ID);
          }
        }
      });

      const text2speech = config.providers?.text2speech ?? config.text2speech;
      const text2sound = config.providers?.text2sound ?? config.text2sound;

      const text2speechProviders = await Promise.all(
        toArray(text2speech).map((getProvider) => getProvider({ cesdk }))
      );
      const text2soundProviders = await Promise.all(
        toArray(text2sound).map((getProvider) => getProvider({ cesdk }))
      );

      // Check if any providers are configured
      const hasSpeechProviders = text2speechProviders.length > 0;
      const hasSoundProviders = text2soundProviders.length > 0;

      if (!hasSpeechProviders && !hasSoundProviders) {
        disposeSoundApp();
        disposeSpeechApp();
        return; // Don't continue if no providers are configured
      }

      // Dispose unused apps based on provider availability
      if (!hasSoundProviders) {
        disposeSoundApp();
      }
      if (!hasSpeechProviders) {
        disposeSpeechApp();
      }

      const text2SpeechInitializedResult = await initializeProviders(
        'audio',
        text2speechProviders,
        { cesdk },
        config
      );
      const text2SoundInitializedResult = await initializeProviders(
        'audio',
        text2soundProviders,
        { cesdk },
        config
      );

      const allProviders = [...text2speechProviders, ...text2soundProviders];
      const allTranslations: Record<string, any> = {};

      const genericTranslations: Record<string, string> = {};
      if (config.customTranslations?.en) {
        Object.keys(config.customTranslations.en).forEach((key) => {
          if (key.startsWith('ai.property.')) {
            genericTranslations[key] = config.customTranslations!.en![key];
          }
        });
      }

      allProviders.forEach((provider) => {
        if (
          provider.input?.panel?.type === 'schema' &&
          provider.input?.panel?.document &&
          provider.input?.panel?.inputReference
        ) {
          try {
            const translations = extractTranslationsFromSchema(
              provider.id,
              provider.input.panel.document as any,
              provider.input.panel.inputReference,
              genericTranslations
            );
            Object.assign(allTranslations, translations);
          } catch (error) {
            if (config.debug) {
              // eslint-disable-next-line no-console
              console.warn(
                `Failed to extract translations for provider ${provider.id}:`,
                error
              );
            }
          }
        }
      });

      cesdk.i18n.setTranslations({
        en: {
          [`panel.${SPEECH_GENERATION_PANEL_ID}`]: 'AI Voice',
          [`panel.${SOUND_GENERATION_PANEL_ID}`]: 'Sound Generation',
          ...allTranslations,
          ...(config.customTranslations?.en || {})
        }
      });

      if (text2SoundInitializedResult.panel.builderRenderFunction != null) {
        cesdk.ui.registerPanel(
          SOUND_GENERATION_PANEL_ID,
          text2SoundInitializedResult.panel.builderRenderFunction
        );

        registerDockComponent({
          cesdk,
          panelId: SOUND_GENERATION_PANEL_ID
        });
      } else {
        disposeSoundApp();
      }

      if (text2SpeechInitializedResult.panel.builderRenderFunction != null) {
        cesdk.ui.registerPanel(
          SPEECH_GENERATION_PANEL_ID,
          text2SpeechInitializedResult.panel.builderRenderFunction
        );

        registerDockComponent({
          cesdk,
          panelId: SPEECH_GENERATION_PANEL_ID
        });
      } else {
        disposeSpeechApp();
      }
    }
  };
}

function printConfigWarnings<I, O extends Output>(
  config: PluginConfiguration<I, O>
) {
  if (!config.debug) return;

  if (config.providers?.text2speech != null && config.text2speech != null) {
    // eslint-disable-next-line no-console
    console.warn(
      '[AudioGeneration]: Both `providers.text2speech` and `text2speech` configuration is provided. Since `text2speech` is deprecated, only `providers.text2speech` will be used.'
    );
  }
  if (config.providers?.text2sound != null && config.text2sound != null) {
    // eslint-disable-next-line no-console
    console.warn(
      '[AudioGeneration]: Both `providers.text2sound` and `text2sound` configuration is provided. Since `text2sound` is deprecated, only `providers.text2sound` will be used.'
    );
  }
}

export default AudioGeneration;
