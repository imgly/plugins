import {
  CommonProviderConfiguration,
  VideoOutput,
  type Provider,
  getPanelId
} from '@imgly/plugin-ai-generation-web';
import schema from './Veo31FastTextToVideo.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createVideoProvider from './createVideoProvider';

interface ProviderConfiguration
  extends CommonProviderConfiguration<Veo31FastTextToVideoInput, VideoOutput> {}

type Veo31FastTextToVideoInput = {
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

export function Veo31FastTextToVideo(
  config: ProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'video', Veo31FastTextToVideoInput, VideoOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const modelKey = 'fal-ai/veo3.1/fast';

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
): Provider<
  'video',
  Veo31FastTextToVideoInput,
  { kind: 'video'; url: string }
> {
  return createVideoProvider(
    {
      modelKey: 'fal-ai/veo3.1/fast',
      name: 'Veo 3.1 Fast',
      // @ts-ignore
      schema,
      inputReference: '#/components/schemas/Veo31FastTextToVideoInput',
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
