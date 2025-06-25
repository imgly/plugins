import { type EditorPlugin } from '@cesdk/cesdk-js';
import {
  initializeProviders,
  Output,
  registerDockComponent
} from '@imgly/plugin-ai-generation-web';
import { PluginConfiguration } from './types';
import { toArray } from '@imgly/plugin-utils';

export { PLUGIN_ID } from './constants';

const VIDEO_GENERATION_PANEL_ID = 'ly.img.ai/video-generation';

export function VideoGeneration<I, O extends Output>(
  config: PluginConfiguration<I, O>
): Omit<EditorPlugin, 'name' | 'version'> {
  return {
    async initialize({ cesdk }) {
      if (cesdk == null) return;

      cesdk.setTranslations({
        en: {
          [`panel.${VIDEO_GENERATION_PANEL_ID}`]: 'Video Generation',
          [`${VIDEO_GENERATION_PANEL_ID}.dock.label`]: 'AI Video'
        }
      });

      const text2videoProviders = await Promise.all(
        toArray(config.text2video).map((getProvider) => getProvider({ cesdk }))
      );
      const image2videoProviders = await Promise.all(
        toArray(config.image2video).map((getProvider) => getProvider({ cesdk }))
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

      if (initializedResult.panel.builderRenderFunction != null) {
        cesdk.ui.registerPanel(
          VIDEO_GENERATION_PANEL_ID,
          initializedResult.panel.builderRenderFunction
        );

        registerDockComponent({
          cesdk,
          panelId: VIDEO_GENERATION_PANEL_ID
        });
      }
    }
  };
}

export default VideoGeneration;
