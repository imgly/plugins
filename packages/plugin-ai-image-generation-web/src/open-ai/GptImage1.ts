import { Icons } from '@imgly/plugin-utils';
import { Middleware, type Provider } from '@imgly/plugin-ai-generation-web';
import GptImage1Schema from './GptImage1.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import OpenAI from 'openai';

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

  /**
   * Base URL used for the UI assets used in the plugin.
   *
   * By default, we load the assets from the IMG.LY CDN You can copy the assets.
   * from the `/assets` folder to your own server and set the base URL to your server.
   */
  baseURL?: string;
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
    id: 'open-ai/gpt-image-1',
    kind: 'image',
    name: 'gpt-image-1',
    initialize: async () => {
      client = new OpenAI({
        baseURL: config.proxyUrl,
        dangerouslyAllowBrowser: true,
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
          }
        },
        userFlow: 'placeholder'
      }
    },
    output: {
      abortable: true,
      history: '@imgly/indexedDB',
      generate: async (
        input: GptImage1Input,
        { abortSignal }: { abortSignal?: AbortSignal }
      ) => {
        if (client == null) {
          throw new Error('Client not initialized');
        }

        const img = await client.images.generate({
          model: 'gpt-image-1',
          prompt: input.prompt,
          n: 1,
          size: input.size,
          background: input.background
        });

        const b64_json = img.data?.[0].b64_json;
        if (b64_json == null) {
          throw new Error('No image data returned');
        }

        const base64Data = b64_json.split(',')[1] || b64_json;

        // Step 2: Decode the base64 string to a byte array
        const byteCharacters = atob(base64Data);
        const byteArrays = [];

        // Step 3: Convert the decoded string to a Uint8Array
        for (let i = 0; i < byteCharacters.length; i++) {
          byteArrays.push(byteCharacters.charCodeAt(i));
        }
        const byteArray = new Uint8Array(byteArrays);

        // Step 4: Create a Blob from the Uint8Array
        // You may need to specify the correct MIME type based on your image
        const blob = new Blob([byteArray], { type: 'image/png' });

        // Step 5: Use the blob as needed - examples:
        // Create an object URL to display the image
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
