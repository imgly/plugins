import {
  VideoOutput,
  type Provider,
  CommonProviderConfiguration,
  getPanelId
} from '@imgly/plugin-ai-generation-web';
import { getImageDimensionsFromURL } from '@imgly/plugin-utils';
import schema from './Veo31ImageToVideo.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createVideoProvider from './createVideoProvider';

type Veo31ImageToVideoInput = {
  prompt: string;
  image_url: string;
  aspect_ratio?: 'auto' | '9:16' | '16:9' | '1:1';
  resolution?: '720p' | '1080p';
  duration?: '8s';
  generate_audio?: boolean;
};

interface ProviderConfiguration
  extends CommonProviderConfiguration<Veo31ImageToVideoInput, VideoOutput> {}

export function Veo31ImageToVideo(
  config: ProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'video', Veo31ImageToVideoInput, VideoOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const modelKey = 'fal-ai/veo3.1/image-to-video';

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
): Provider<'video', Veo31ImageToVideoInput, { kind: 'video'; url: string }> {
  return createVideoProvider(
    {
      modelKey: 'fal-ai/veo3.1/image-to-video',
      name: 'Veo 3.1',
      // @ts-ignore
      schema,
      inputReference: '#/components/schemas/Veo31ImageToVideoInput',
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

        let width: number;
        let height: number;

        // Handle aspect ratio selection
        if (input.aspect_ratio && input.aspect_ratio !== 'auto') {
          // User selected a specific aspect ratio
          const [widthRatio, heightRatio] = input.aspect_ratio
            .split(':')
            .map(Number);

          // Calculate width based on the aspect ratio and target height
          height = resolutionHeight;
          width = Math.round((height * widthRatio) / heightRatio);
        } else {
          // Use image dimensions as fallback for 'auto'
          try {
            const imageDimension = await getImageDimensionsFromURL(
              input.image_url as string,
              cesdk.engine
            );

            // Use image dimensions as base
            const imageWidth = imageDimension.width ?? 1920;
            const imageHeight = imageDimension.height ?? 1080;

            // Scale to target resolution while maintaining image aspect ratio
            const imageAspectRatio = imageWidth / imageHeight;
            height = resolutionHeight;
            width = Math.round(height * imageAspectRatio);
          } catch (error) {
            // Fallback to 16:9 if image dimensions cannot be determined
            height = resolutionHeight;
            width = Math.round((height * 16) / 9);
          }
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
