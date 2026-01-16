import {
  VideoOutput,
  type Provider,
  CommonProviderConfiguration,
  getPanelId,
  setDefaultTranslations
} from '@imgly/plugin-ai-generation-web';
import schema from './Veo31FastImageToVideo.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createVideoProvider from './createVideoProvider';

type Veo31FastImageToVideoInput = {
  prompt: string;
  image_url: string;
  aspect_ratio?: '9:16' | '16:9' | '1:1';
  resolution?: '720p' | '1080p';
  duration?: '8s';
  generate_audio?: boolean;
  negative_prompt?: string;
  enhance_prompt?: boolean;
  seed?: number;
  auto_fix?: boolean;
};

interface ProviderConfiguration
  extends CommonProviderConfiguration<
    Veo31FastImageToVideoInput,
    VideoOutput
  > {}

export function Veo31FastImageToVideo(
  config: ProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'video', Veo31FastImageToVideoInput, VideoOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const modelKey = 'fal-ai/veo3.1/fast/image-to-video';

    // Set translations
    setDefaultTranslations(cesdk, {
      en: {
        [`panel.${getPanelId(modelKey)}.imageSelection`]:
          'Select Image To Animate',
        [`panel.${modelKey}.imageSelection`]: 'Select Image To Animate',
        [`libraries.${getPanelId(modelKey)}.history.label`]:
          'Generated From Image'
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
  Veo31FastImageToVideoInput,
  { kind: 'video'; url: string }
> {
  return createVideoProvider(
    {
      modelKey: 'fal-ai/veo3.1/fast/image-to-video',
      name: 'Veo 3.1 Fast',
      // @ts-ignore
      schema,
      inputReference: '#/components/schemas/Veo31FastImageToVideoInput',
      cesdk,
      headers: config.headers,
      middlewares: config.middlewares,
      supportedQuickActions: {
        'ly.img.createVideo': {
          mapInput: (input) => {
            return {
              prompt: '',
              image_url: input.uri
            };
          }
        }
      },
      getBlockInput: async (input) => {
        // Parse resolution
        const resolution = input.resolution ?? '720p';
        const resolutionMap = {
          '720p': 720,
          '1080p': 1080
        };
        const resolutionHeight = resolutionMap[resolution];

        // Parse aspect ratio
        const aspectRatio = input.aspect_ratio ?? '16:9';
        const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);

        // Calculate dimensions based on aspect ratio and resolution
        const height = resolutionHeight;
        const width = Math.round((height * widthRatio) / heightRatio);

        // Parse duration from string format (e.g., "8s" -> 8)
        const durationString = input.duration ?? '8s';
        const duration = parseInt(durationString.replace('s', ''), 10);

        return Promise.resolve({
          video: {
            width,
            height,
            duration
          }
        });
      }
    },
    config
  );
}

export default getProvider;
