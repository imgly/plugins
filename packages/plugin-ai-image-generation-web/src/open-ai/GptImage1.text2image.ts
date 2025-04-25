import { Icons } from '@imgly/plugin-utils';
import { Middleware, type Provider } from '@imgly/plugin-ai-generation-web';
import GptImage1Schema from './GptImage1.text2image.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import OpenAI from 'openai';
import { b64JsonToBlob } from './utils';

type GptImage1Input = {
  prompt: string;
  size: 'auto' | '1024x1024' | '1536x1024' | '1024x1536';
  background: 'transparent' | 'opaque' | 'auto';
};

type GptImage1Output = {
  kind: 'image';
  url: string;
};

type ProviderConfiguration = {
  proxyUrl: string;
  debug?: boolean;
  middleware?: Middleware<GptImage1Input, GptImage1Output>[];
};

export function GptImage1(
  config: ProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', GptImage1Input, GptImage1Output>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    return getProvider(cesdk, config);
  };
}

function getProvider(
  cesdk: CreativeEditorSDK,
  config: ProviderConfiguration
): Provider<'image', GptImage1Input, GptImage1Output> {
  cesdk.ui.addIconSet('@imgly/plugin/formats', Icons.Formats);

  let client: OpenAI | undefined;
  const provider: Provider<'image', GptImage1Input, GptImage1Output> = {
    id: 'open-ai/gpt-image-1/text2image',
    kind: 'image',
    name: 'gpt-image-1',
    initialize: async () => {
      client = new OpenAI({
        baseURL: config.proxyUrl,
        dangerouslyAllowBrowser: true,
        // Will be inserted by the proxy
        apiKey: ''
      });
    },
    input: {
      panel: {
        type: 'schema',
        // @ts-ignore
        document: GptImage1Schema,
        inputReference: '#/components/schemas/GptImage1Input',
        includeHistoryLibrary: true,
        orderExtensionKeyword: 'x-order-properties',
        getBlockInput: (input) => {
          switch (input.size) {
            case 'auto':
              return Promise.resolve({ image: { width: 512, height: 512 } });
            case '1024x1024':
              return Promise.resolve({ image: { width: 1024, height: 1024 } });
            case '1536x1024':
              return Promise.resolve({ image: { width: 1536, height: 1024 } });
            case '1024x1536':
              return Promise.resolve({ image: { width: 1024, height: 1536 } });
            default: {
              throw new Error('Invalid image size');
            }
          }
        },
        userFlow: 'placeholder'
      }
    },
    output: {
      abortable: true,
      history: '@imgly/indexedDB',
      middleware: config.middleware ?? [],
      generate: async (
        input: GptImage1Input,
        { abortSignal }: { abortSignal?: AbortSignal }
      ) => {
        if (client == null) {
          throw new Error('Client not initialized');
        }

        const img = await client.images.generate(
          {
            model: 'gpt-image-1',
            prompt: input.prompt,
            n: 1,
            size: input.size,
            background: input.background
          },
          {
            signal: abortSignal
          }
        );

        const b64_json = img.data?.[0].b64_json;
        if (b64_json == null) {
          throw new Error('No image data returned');
        }

        const blob = b64JsonToBlob(b64_json, 'image/png');
        const imageUrl = URL.createObjectURL(blob);

        return {
          kind: 'image',
          url: imageUrl
        };
      }
    }
  };

  return provider;
}

export default getProvider;
