import { type MinimaxVideo01LiveInput } from '@fal-ai/client/endpoints';
import {
  CommonProviderConfiguration,
  VideoOutput,
  type Provider
} from '@imgly/plugin-ai-generation-web';
import schema from './MinimaxVideo01Live.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createVideoProvider from './createVideoProvider';

interface ProviderConfiguration
  extends CommonProviderConfiguration<MinimaxVideo01LiveInput, VideoOutput> {}

export function MinimaxVideo01Live(
  config: ProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'video', MinimaxVideo01LiveInput, VideoOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    return getProvider(cesdk, config);
  };
}

function getProvider(
  cesdk: CreativeEditorSDK,
  config: ProviderConfiguration
): Provider<'video', MinimaxVideo01LiveInput, { kind: 'video'; url: string }> {
  return createVideoProvider(
    {
      modelKey: 'fal-ai/minimax/video-01-live',
      name: 'Minimax Video 01 Live',
      // @ts-ignore
      schema,
      inputReference: '#/components/schemas/MinimaxVideo01LiveInput',

      headers: config.headers,
      middleware: config.middlewares ?? config.middleware ?? [],
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
