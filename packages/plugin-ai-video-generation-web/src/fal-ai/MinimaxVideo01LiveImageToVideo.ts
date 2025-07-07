import { type MinimaxVideo01LiveImageToVideoInput } from '@fal-ai/client/endpoints';
import {
  VideoOutput,
  type Provider,
  CommonProviderConfiguration
} from '@imgly/plugin-ai-generation-web';
import { getImageDimensionsFromURL } from '@imgly/plugin-utils';
import schema from './MinimaxVideo01LiveImageToVideo.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createVideoProvider from './createVideoProvider';

interface ProviderConfiguration
  extends CommonProviderConfiguration<
    MinimaxVideo01LiveImageToVideoInput,
    VideoOutput
  > {}

export function MinimaxVideo01LiveImageToVideo(
  config: ProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<
  Provider<'video', MinimaxVideo01LiveImageToVideoInput, VideoOutput>
> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    return getProvider(cesdk, config);
  };
}

function getProvider(
  cesdk: CreativeEditorSDK,
  config: ProviderConfiguration
): Provider<
  'video',
  MinimaxVideo01LiveImageToVideoInput,
  { kind: 'video'; url: string }
> {
  return createVideoProvider(
    {
      modelKey: 'fal-ai/minimax/video-01-live/image-to-video',
      name: 'Minimax Video 01 Live',
      // @ts-ignore
      schema,
      inputReference:
        '#/components/schemas/MinimaxVideo01LiveImageToVideoInput',
      cesdk,
      headers: config.headers,
      middleware: config.middlewares,
      getBlockInput: async (input) => {
        const imageDimension = await getImageDimensionsFromURL(
          input.image_url as string,
          cesdk.engine
        );

        return Promise.resolve({
          video: {
            width: imageDimension.width ?? 1280,
            height: imageDimension.height ?? 720,
            duration: 5
          }
        });
      }
    },
    config
  );
}

export default getProvider;
