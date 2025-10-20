import {
  VideoOutput,
  type Provider,
  CommonProviderConfiguration,
  getPanelId
} from '@imgly/plugin-ai-generation-web';
import { getImageDimensionsFromURL } from '@imgly/plugin-utils';
import schema from './Veo31FastImageToVideo.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createVideoProvider from './createVideoProvider';

type Veo31FastImageToVideoInput = {
  prompt: string;
  image_url: string;
  aspect_ratio?: 'auto' | '9:16' | '16:9' | '1:1';
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
    cesdk.i18n.setTranslations({
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
        const imageDimensions = await getImageDimensionsFromURL(
          input.image_url as string,
          cesdk.engine
        );

        // If aspect_ratio is 'auto', use the image dimensions
        // Otherwise, calculate based on specified aspect ratio
        let width: number;
        let height: number;

        const resolution = input.resolution ?? '720p';
        const resolutionMap = {
          '720p': 720,
          '1080p': 1080
        };
        const resolutionHeight = resolutionMap[resolution];

        if (input.aspect_ratio === 'auto' || !input.aspect_ratio) {
          // Use image dimensions, but scale to target resolution
          const imageAspectRatio =
            (imageDimensions.width ?? 1280) / (imageDimensions.height ?? 720);
          width = Math.round(resolutionHeight * imageAspectRatio);
          height = resolutionHeight;
        } else {
          // Parse specified aspect ratio
          const aspectRatio = input.aspect_ratio;
          const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);

          // Calculate width based on aspect ratio
          width = Math.round((resolutionHeight * widthRatio) / heightRatio);
          height = resolutionHeight;
        }

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
