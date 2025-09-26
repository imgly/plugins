import {
  VideoOutput,
  type Provider,
  CommonProviderConfiguration,
  getPanelId
} from '@imgly/plugin-ai-generation-web';
import { getImageDimensionsFromURL } from '@imgly/plugin-utils';
import schema from './MinimaxHailuo02StandardImageToVideo.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createVideoProvider from './createVideoProvider';

// Using locally defined types since fal-ai client doesn't export this specific type yet
interface MinimaxHailuo02StandardImageToVideoInput {
  prompt: string;
  image_url: string;
  duration?: '6' | '10';
  resolution?: '512P' | '768P';
}

interface ProviderConfiguration
  extends CommonProviderConfiguration<
    MinimaxHailuo02StandardImageToVideoInput,
    VideoOutput
  > {}

export function MinimaxHailuo02StandardImageToVideo(
  config: ProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<
  Provider<'video', MinimaxHailuo02StandardImageToVideoInput, VideoOutput>
> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const modelKey = 'fal-ai/minimax/hailuo-02/standard/image-to-video';

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
  MinimaxHailuo02StandardImageToVideoInput,
  { kind: 'video'; url: string }
> {
  return createVideoProvider(
    {
      modelKey: 'fal-ai/minimax/hailuo-02/standard/image-to-video',
      name: 'Minimax Hailuo 02 Standard',
      // @ts-ignore
      schema,
      inputReference:
        '#/components/schemas/MinimaxHailuo02StandardImageToVideoInput',
      cesdk,
      headers: config.headers,
      middleware: config.middlewares ?? [],
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

        const videoDuration = input.duration === '10' ? 10 : 6;
        const videoWidth = input.resolution === '512P' ? 912 : 1280;
        const videoHeight = input.resolution === '512P' ? 512 : 720;

        return Promise.resolve({
          video: {
            width: imageDimension.width ?? videoWidth,
            height: imageDimension.height ?? videoHeight,
            duration: videoDuration
          }
        });
      }
    },
    config
  );
}

export default getProvider;
