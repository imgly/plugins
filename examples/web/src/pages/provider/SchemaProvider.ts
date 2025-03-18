import { type OpenAPIV3 } from 'openapi-types';
import { type Provider, type ImageOutput } from "@imgly/plugin-utils-ai-generation";

import fluxProV11 from './flux-pro-v1-1-ultra.json';

const SchemaProvider: Provider<'image', { prompt: string }, ImageOutput> = {
  id: 'schema',
  kind: 'image',
  initialize: async () => {
    console.log('initialize schema provider');
  },
  input: {
    panel: {
      type: 'schema',
      document: fluxProV11 as any as OpenAPIV3.Document,
      // inputReference: '#/components/schemas/Recraft20bInput',
      inputReference: '#/components/schemas/FluxProV11UltraInput',
      orderExtensionKeyword: 'x-fal-order-properties',
      createInputByKind: () => {
        return {
          image: {
            width: 1024,
            height: 1024
          }
        }
      }
    }
  },

  output: {
    abortable: true,
    history: '@imgly/indexedDB',
    generate: async (input) => {
      console.log('generate schema provider', JSON.stringify(input, undefined, 2));

      const result: { kind: 'image'; url: string } = {
        kind: 'image',
        url: 'https://placehold.co/1024'
      };
      return new Promise<{ kind: 'image'; url: string }>((resolve) => {
        setTimeout(() => {
          resolve(result);
        }, 3000);
      });
    }
  }
};

export default SchemaProvider;
