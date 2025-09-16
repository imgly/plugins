import {
  VideoOutput,
  type Provider,
  CommonProviderConfiguration,
  getPanelId
} from '@imgly/plugin-ai-generation-web';
import { getImageDimensionsFromURL } from '@imgly/plugin-utils';
import schema from './ByteDanceSeedanceV1ProImageToVideo.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createVideoProvider from './createVideoProvider';

interface ByteDanceSeedanceV1ProImageToVideoInput {
  prompt: string;
  image_url: string;
  aspect_ratio?: '21:9' | '16:9' | '4:3' | '1:1' | '3:4' | '9:16' | 'auto';
  resolution?: '480p' | '720p' | '1080p';
  duration?: number;
  camera_fixed?: boolean;
  seed?: number;
  enable_safety_checker?: boolean;
}

interface ProviderConfiguration
  extends CommonProviderConfiguration<
    ByteDanceSeedanceV1ProImageToVideoInput,
    VideoOutput
  > {}

export function ByteDanceSeedanceV1ProImageToVideo(
  config: ProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<
  Provider<'video', ByteDanceSeedanceV1ProImageToVideoInput, VideoOutput>
> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const modelKey = 'fal-ai/bytedance/seedance/v1/pro/image-to-video';

    // Set translations
    cesdk.i18n.setTranslations({
      en: {
        [`panel.${getPanelId(modelKey)}.imageSelection`]:
          'Select Image To Generate',
        [`panel.${modelKey}.imageSelection`]: 'Select Image To Generate',
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
  ByteDanceSeedanceV1ProImageToVideoInput,
  { kind: 'video'; url: string }
> {
  return createVideoProvider(
    {
      modelKey: 'fal-ai/bytedance/seedance/v1/pro/image-to-video',
      name: 'ByteDance Seedance v1 Pro',
      // @ts-ignore
      schema,
      inputReference:
        '#/components/schemas/ByteDanceSeedanceV1ProImageToVideoInput',
      cesdk,
      headers: config.headers,
      middleware: config.middlewares ?? config.middleware ?? [],
      supportedQuickActions: {
        'ly.img.createVideo': {
          mapInput: () => {
            throw new Error(
              'This generation should not be triggered by this quick action'
            );
          }
        }
      },
      getBlockInput: async (input) => {
        let width: number;
        let height: number;

        // Determine base resolution from input.resolution or default to 1080p
        const resolutionMap = {
          '480p': { height: 480 },
          '720p': { height: 720 },
          '1080p': { height: 1080 }
        };
        const targetResolution = input.resolution ?? '1080p';
        const baseHeight = resolutionMap[targetResolution].height;

        // Handle aspect ratio selection
        if (input.aspect_ratio && input.aspect_ratio !== 'auto') {
          // User selected a specific aspect ratio
          const [widthRatio, heightRatio] = input.aspect_ratio
            .split(':')
            .map(Number);

          // Calculate width based on the aspect ratio and target height
          height = baseHeight;
          width = Math.round((height * widthRatio) / heightRatio);
        } else {
          // Use image dimensions (auto mode or no aspect ratio specified)
          const imageDimension = await getImageDimensionsFromURL(
            input.image_url as string,
            cesdk.engine
          );

          // Use image dimensions as base
          const imageWidth = imageDimension.width ?? 1920;
          const imageHeight = imageDimension.height ?? 1080;

          // Scale to target resolution while maintaining image aspect ratio
          const imageAspectRatio = imageWidth / imageHeight;
          height = baseHeight;
          width = Math.round(height * imageAspectRatio);
        }

        return Promise.resolve({
          video: {
            width,
            height,
            duration: input.duration ?? 5
          }
        });
      }
    },
    config
  );
}

export default getProvider;
