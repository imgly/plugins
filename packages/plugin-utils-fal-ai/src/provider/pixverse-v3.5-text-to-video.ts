import { type Provider } from '@imgly/plugin-utils-ai-generation';
import { type Recraft20bInput } from '@fal-ai/client/endpoints';
import { PluginConfiguration } from '../type';

import schema from './schemas/pixverse-v3.5-text-to-video.json';
import createVideoGenerationProvider from './createVideoGenerationProvider';

type Input = {
  prompt: string;
  aspect_ratio?: '16:9' | '4:3' | '1:1' | '3:4' | '9:16';
  resolution?: '1080p' | '720p' | '540p' | '360p';
};

function getProvider(
  config: PluginConfiguration
): Provider<'video', Recraft20bInput, { kind: 'video'; url: string }> {
  return createVideoGenerationProvider<Input>(config, {
    id: 'fal-ai/pixverse/v3.5/text-to-video',
    // @ts-ignore
    document: schema,
    inputReference: '#/components/schemas/PixverseV35TextToVideoInput'
  });
}

export default getProvider;
