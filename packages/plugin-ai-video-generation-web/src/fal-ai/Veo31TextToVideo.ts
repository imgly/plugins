import {
  CommonProviderConfiguration,
  VideoOutput,
  type Provider,
  getPanelId
} from '@imgly/plugin-ai-generation-web';
import schema from './Veo31TextToVideo.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createVideoProvider from './createVideoProvider';

interface ProviderConfiguration
  extends CommonProviderConfiguration<Veo31TextToVideoInput, VideoOutput> {}

type Veo31TextToVideoInput = {
  prompt: string;
  aspect_ratio?: '16:9' | '9:16' | '1:1';
  duration?: '4s' | '6s' | '8s';
  resolution?: '720p' | '1080p';
  generate_audio?: boolean;
  negative_prompt?: string;
  enhance_prompt?: boolean;
  seed?: number;
  auto_fix?: boolean;
};

export function Veo31TextToVideo(
  config: ProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'video', Veo31TextToVideoInput, VideoOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const modelKey = 'fal-ai/veo3.1';

    // Set translations
    cesdk.i18n.setTranslations({
      en: {
        [`panel.${getPanelId(modelKey)}.prompt`]: 'Enter your prompt',
        [`panel.${modelKey}.prompt`]: 'Enter your prompt',
        [`libraries.${getPanelId(modelKey)}.history.label`]: 'Generated Videos'
      }
    });

    return getProvider(cesdk, config);
  };
}

function getProvider(
  cesdk: CreativeEditorSDK,
  config: ProviderConfiguration
): Provider<'video', Veo31TextToVideoInput, { kind: 'video'; url: string }> {
  return createVideoProvider(
    {
      modelKey: 'fal-ai/veo3.1',
      name: 'Veo 3.1',
      // @ts-ignore
      schema,
      inputReference: '#/components/schemas/Veo31TextToVideoInput',
      cesdk,
      headers: config.headers,
      middlewares: config.middlewares,
      getBlockInput: (input) => {
        // Parse aspect ratio
        const aspectRatio = input.aspect_ratio ?? '16:9';
        const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);

        // Parse resolution
        const resolution = input.resolution ?? '720p';
        const resolutionMap = {
          '720p': 720,
          '1080p': 1080
        };
        const resolutionHeight = resolutionMap[resolution];

        // Calculate width based on aspect ratio
        const width = Math.round((resolutionHeight * widthRatio) / heightRatio);

        // Parse duration from string format (e.g., "8s" -> 8)
        const durationString = input.duration ?? '8s';
        const duration = parseInt(durationString.replace('s', ''), 10);

        return Promise.resolve({
          video: {
            width,
            height: resolutionHeight,
            duration
          }
        });
      }
    },
    config
  );
}

export default getProvider;
