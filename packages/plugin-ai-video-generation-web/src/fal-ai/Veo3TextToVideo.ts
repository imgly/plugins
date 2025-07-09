import {
  CommonProviderConfiguration,
  VideoOutput,
  type Provider,
  getPanelId
} from '@imgly/plugin-ai-generation-web';
import schema from './Veo3TextToVideo.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createVideoProvider from './createVideoProvider';

interface ProviderConfiguration
  extends CommonProviderConfiguration<Veo3Input, VideoOutput> {}

type Veo3Input = {
  prompt: string;
  aspect_ratio?: '16:9' | '9:16' | '1:1';
  duration?: '8s';
  generate_audio?: boolean;
};

export function Veo3TextToVideo(
  config: ProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'video', Veo3Input, VideoOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const modelKey = 'fal-ai/veo3';

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
): Provider<'video', Veo3Input, { kind: 'video'; url: string }> {
  return createVideoProvider(
    {
      modelKey: 'fal-ai/veo3',
      name: 'Veo3',
      // @ts-ignore
      schema,
      inputReference: '#/components/schemas/Veo3Input',
      cesdk,
      headers: config.headers,
      middlewares: config.middlewares,
      getBlockInput: (input) => {
        if (input.aspect_ratio != null) {
          const [widthRatio, heightRatio] = input.aspect_ratio
            .split(':')
            .map(Number);

          // Veo3 outputs 720p videos
          const resolutionHeight = 720;
          const width = Math.round(
            (resolutionHeight * widthRatio) / heightRatio
          );

          return Promise.resolve({
            video: {
              width,
              height: resolutionHeight,
              duration: 8 // Veo3 generates 8s videos
            }
          });
        } else {
          // Default to 16:9 if not specified
          return Promise.resolve({
            video: {
              width: 1280,
              height: 720,
              duration: 8
            }
          });
        }
      }
    },
    config
  );
}

export default getProvider;
