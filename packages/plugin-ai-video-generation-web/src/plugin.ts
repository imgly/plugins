import { type EditorPlugin } from '@cesdk/cesdk-js';
import {
  ActionRegistry,
  initializeProviders,
  Output,
  registerDockComponent,
  checkAiPluginVersion
} from '@imgly/plugin-ai-generation-web';
import { PluginConfiguration } from './types';
import { toArray } from '@imgly/plugin-utils';
import { PLUGIN_ID } from './constants';
import CreateVideo from './quickActions/CreateVideo';

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

      cesdk.setTranslations({
        en: {
          [`panel.${VIDEO_GENERATION_PANEL_ID}`]: 'Video Generation',
          [`${VIDEO_GENERATION_PANEL_ID}.dock.label`]: 'AI Video'
        }
      });

      printConfigWarnings(config);

      const registry = ActionRegistry.get();
      const disposeApp = registry.register({
        type: 'plugin',
        sceneMode: 'Video',

        id: PLUGIN_ID,
        pluginId: PLUGIN_ID,

        label: 'Generate Video',
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
