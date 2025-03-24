import { type MinimaxVideo01LiveImageToVideoInput } from '@fal-ai/client/endpoints';
import { VideoOutput, type Provider } from '@imgly/plugin-utils-ai-generation';
import schema from './MinimaxVideo01LiveImageToVideo.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createVideoProvider from './createVideoProvider';

type ProviderConfiguration = {
  proxyUrl: string;
  debug?: boolean;
};

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
      // @ts-ignore
      schema,
      inputReference:
        '#/components/schemas/MinimaxVideo01LiveImageToVideoInput',
      cesdk,
      getBlockInput: () => {
        return Promise.resolve({
          video: {
            width: 1280,
            height: 720,
            duration: 5
          }
        });
      }
    },
    config
  );
}

export default getProvider;
