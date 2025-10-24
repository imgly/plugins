import { type EditorPlugin } from '@cesdk/cesdk-js';
import {
  ActionRegistry,
  initializeProviders,
  Output,
  registerDockComponent,
  checkAiPluginVersion
} from '@imgly/plugin-ai-generation-web';
import { PluginConfiguration } from './types';
import { toArray, translateWithFallback } from '@imgly/plugin-utils';
import { PLUGIN_ID } from './constants';
import CreateVideo from './quickActions/CreateVideo';
import AnimateBetweenImages from './quickActions/AnimateBetweenImages';
import translations from '../translations.json';

export { PLUGIN_ID } from './constants';

const VIDEO_GENERATION_PANEL_ID = 'ly.img.ai.video-generation';

export function VideoGeneration<I, O extends Output>(
  config: PluginConfiguration<I, O>
): Omit<EditorPlugin, 'name' | 'version'> {
  return {
    async initialize({ cesdk }) {
      if (cesdk == null) return;

      // Check AI plugin version consistency
      checkAiPluginVersion(cesdk, PLUGIN_ID, PLUGIN_VERSION);

      // Initialize Feature API for video generation plugin
      // Enable all features by default for backward compatibility
      cesdk.feature.enable(
        'ly.img.plugin-ai-video-generation-web.fromText',
        true
      );
      cesdk.feature.enable(
        'ly.img.plugin-ai-video-generation-web.fromImage',
        true
      );
      cesdk.feature.enable(
        'ly.img.plugin-ai-video-generation-web.providerSelect',
        true
      );
      cesdk.feature.enable(
        'ly.img.plugin-ai-video-generation-web.quickAction',
        true
      );
      cesdk.feature.enable(
        'ly.img.plugin-ai-video-generation-web.quickAction.providerSelect',
        true
      );

      const ACTION_LABEL_KEY = `${PLUGIN_ID}.action.label`;

      // Load all translations from translations.json
      cesdk.i18n.setTranslations(translations);

      cesdk.setTranslations({
        en: {
          [`panel.${VIDEO_GENERATION_PANEL_ID}`]: 'Video Generation',
          [`${VIDEO_GENERATION_PANEL_ID}.dock.label`]: 'AI Video',
          [ACTION_LABEL_KEY]: 'Generate Video',
          'ly.img.ai.video.generation.hint':
            "Video generation may take up to a few minutes. This panel can be closed and you'll be notified when it's ready."
        }
      });

      printConfigWarnings(config);

      const registry = ActionRegistry.get();
      const disposeApp = registry.register({
        type: 'plugin',
        sceneMode: 'Video',

        id: PLUGIN_ID,
        pluginId: PLUGIN_ID,

        label: translateWithFallback(cesdk, ACTION_LABEL_KEY, 'Generate Video'),
        meta: { panelId: VIDEO_GENERATION_PANEL_ID },

        execute: () => {
          if (cesdk.ui.isPanelOpen(VIDEO_GENERATION_PANEL_ID)) {
            cesdk.ui.closePanel(VIDEO_GENERATION_PANEL_ID);
          } else {
            cesdk.ui.openPanel(VIDEO_GENERATION_PANEL_ID);
          }
        }
      });

      const text2video = config.providers?.text2video ?? config.text2video;
      const image2video = config.providers?.image2video ?? config.image2video;

      const text2videoProviders = await Promise.all(
        toArray(text2video).map((getProvider) => getProvider({ cesdk }))
      );
      const image2videoProviders = await Promise.all(
        toArray(image2video).map((getProvider) => getProvider({ cesdk }))
      );

      // Check if any providers are configured
      const hasProviders =
        text2videoProviders.length > 0 || image2videoProviders.length > 0;
      if (!hasProviders) {
        disposeApp();
        return; // Don't continue if no providers are configured
      }

      const initializedResult = await initializeProviders(
        'video',
        {
          fromText: text2videoProviders,
          fromImage: image2videoProviders
        },
        { cesdk },
        config
      );

      // Register video quick actions
      ActionRegistry.get().register(CreateVideo({ cesdk }));
      ActionRegistry.get().register(AnimateBetweenImages({ cesdk }));

      if (initializedResult.panel.builderRenderFunction != null) {
        cesdk.ui.registerPanel(
          VIDEO_GENERATION_PANEL_ID,
          initializedResult.panel.builderRenderFunction
        );

        registerDockComponent({
          cesdk,
          panelId: VIDEO_GENERATION_PANEL_ID
        });
      } else {
        disposeApp();
      }
    }
  };
}

function printConfigWarnings<I, O extends Output>(
  config: PluginConfiguration<I, O>
) {
  if (!config.debug) return;

  if (config.providers?.text2video != null && config.text2video != null) {
    // eslint-disable-next-line no-console
    console.warn(
      '[VideoGeneration]: Both `providers.text2video` and `text2video` configuration is provided. Since `text2video` is deprecated, only `providers.text2video` will be used.'
    );
  }
  if (config.providers?.image2video != null && config.image2video != null) {
    // eslint-disable-next-line no-console
    console.warn(
      '[VideoGeneration]: Both `providers.image2video` and `image2video` configuration is provided. Since `image2video` is deprecated, only `providers.image2video` will be used.'
    );
  }
}

export default VideoGeneration;
