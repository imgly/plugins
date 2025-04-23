import { type MinimaxVideo01LiveInput } from '@fal-ai/client/endpoints';
import {
  Middleware,
  VideoOutput,
  type Provider
} from '@imgly/plugin-ai-generation-web';
import schema from './MinimaxVideo01Live.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createVideoProvider from './createVideoProvider';

type ProviderConfiguration = {
  proxyUrl: string;
  debug?: boolean;
  middleware?: Middleware<MinimaxVideo01LiveInput, VideoOutput>[];
};

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
      // @ts-ignore
      schema,
      inputReference: '#/components/schemas/MinimaxVideo01LiveInput',

      middleware: config.middleware,
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
