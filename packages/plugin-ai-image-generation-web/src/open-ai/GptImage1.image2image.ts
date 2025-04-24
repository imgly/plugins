import { getImageDimensionsFromURL, Icons } from '@imgly/plugin-utils';
import {
  CommonProperties,
  getQuickActionMenu,
  Middleware,
  type Provider
} from '@imgly/plugin-ai-generation-web';
import GptImage1Schema from './GptImage1.image2image.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import OpenAI from 'openai';
import { createGptImage1QuickActions } from './GptImage1QuickActions';

type GptImage1Input = {
  prompt: string;
  image_url: string;
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

  const quickActions = createGptImage1QuickActions(cesdk);
  const quickActionMenu = getQuickActionMenu(cesdk, 'image');

  quickActionMenu.setQuickActionMenuOrder([
    ...quickActionMenu.getQuickActionMenuOrder(),
    'ly.img.separator',
    'swapBackground',
    'changeImage',
    'createVariant',
    'ly.img.separator',
    'createVideo'
  ]);

  let client: OpenAI | undefined;
  const provider: Provider<'image', GptImage1Input, GptImage1Output> = {
    id: 'open-ai/gpt-image-1/image2image',
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
        renderCustomProperty: {
          ...(cesdk != null
            ? CommonProperties.ImageUrl('gpt-image-1', {
                cesdk
              })
            : {})
        },
        getBlockInput: async (input) => {
          const { width, height } = await getImageDimensionsFromURL(
            input.image_url
          );
          return Promise.resolve({
            image: {
              width,
              height
            }
          });
        },
        userFlow: 'placeholder'
      },
      quickActions: {
        actions: quickActions ?? []
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

        const mimeType = await cesdk.engine.editor.getMimeType(input.image_url);
        const imageUrlResponse = await fetch(input.image_url);
        const imageUrlBlob = await imageUrlResponse.blob();

        const formData = new FormData();
        formData.append(
          'image',
          imageUrlBlob,
          `image.${getFileExtension(mimeType)}`
        );
        formData.append('prompt', input.prompt);
        formData.append('model', 'gpt-image-1');
        formData.append('size', 'auto');
        formData.append('n', '1');

        const response = await fetch(`${config.proxyUrl}/images/edits`, {
          signal: abortSignal,
          method: 'POST',
          body: formData
        });

        const img = await response.json();

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

function getFileExtension(mimeType: string): string {
  const mimeTypeToExtension: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg'
  };
  return mimeTypeToExtension[mimeType] ?? 'png';
}

export default getProvider;
