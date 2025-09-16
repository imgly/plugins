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

interface ByteDanceSeedanceV1ProImageToVideoOutput {
  video: {
    url: string;
    content_type?: string;
    file_name?: string;
    file_size?: number;
  };
  seed: number;
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
        const imageDimension = await getImageDimensionsFromURL(
          input.image_url as string,
          cesdk.engine
        );

        // Calculate video dimensions based on resolution and aspect ratio
        let width = imageDimension.width ?? 1920;
        let height = imageDimension.height ?? 1080;

        // Apply resolution scaling if specified
        if (input.resolution) {
          const resolutionMap = {
            '480p': { height: 480 },
            '720p': { height: 720 },
            '1080p': { height: 1080 }
          };

          const targetHeight = resolutionMap[input.resolution].height;
          const aspectRatio = width / height;
          height = targetHeight;
          width = Math.round(height * aspectRatio);
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