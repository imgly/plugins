import { type Provider } from '@imgly/plugin-utils-ai-generation';
import { type Recraft20bInput } from '@fal-ai/client/endpoints';
import { PluginConfiguration } from '../type';

import schema from './schemas/recraft-20b.json';
import createImageGenerationProvider from './createImageGenerationProvider';

function getProvider(
  config: PluginConfiguration
): Provider<'image', Recraft20bInput, { kind: 'image'; url: string }> {
  return createImageGenerationProvider<Recraft20bInput>(config, {
    id: 'fal-ai/recraft-20b',
    // @ts-ignore
    document: schema,
    inputReference: '#/components/schemas/Recraft20bInput'
  });
}

export default getProvider;
