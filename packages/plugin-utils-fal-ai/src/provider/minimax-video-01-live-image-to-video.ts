import { type Provider } from '@imgly/plugin-utils-ai-generation';
import { type MinimaxVideo01ImageToVideoInput } from '@fal-ai/client/endpoints';
import { PluginConfiguration } from '../type';

import schema from './schemas/minimax-video-01-live-image-to-video.json';
import createVideoGenerationProvider from './createVideoGenerationProvider';

function getProvider(
  config: PluginConfiguration
): Provider<'video', MinimaxVideo01ImageToVideoInput, { kind: 'video'; url: string }> {
  // @ts-ignore
  return createVideoGenerationProvider<MinimaxVideo01ImageToVideoInput>(config, {
    id: 'fal-ai/minimax/video-01-live/image-to-video',
    // @ts-ignore
    document: schema,
    inputReference: '#/components/schemas/MinimaxVideo01LiveImageToVideoInput',
    dimension: {
      width: 1280,
      height: 720
    },
    duration: 5
  });
}

export default getProvider;
