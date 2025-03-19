import { type Provider } from '@imgly/plugin-utils-ai-generation';
import { type MinimaxVideo01ImageToVideoInput } from '@fal-ai/client/endpoints';
import { PluginConfiguration } from '../type';
import schema from './schemas/minimax-video-01-live-image-to-video.json';
import createVideoProvider from '../createVideoProvider';
import CreativeEditorSDK from '@cesdk/cesdk-js';

function getProvider(
  cesdk: CreativeEditorSDK,
  config: PluginConfiguration
): Provider<
  'video',
  MinimaxVideo01ImageToVideoInput,
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
