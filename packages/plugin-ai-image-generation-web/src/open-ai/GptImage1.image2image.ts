import {
  bufferURIToObjectURL,
  getImageDimensionsFromURL,
  Icons,
  mimeTypeToExtension
} from '@imgly/plugin-utils';
import {
  QuickActionImageVariant,
  QuickActionChangeImage,
  QuickActionSwapImageBackground,
  CommonProperties,
  getQuickActionMenu,
  Middleware,
  QuickAction,
  type Provider
} from '@imgly/plugin-ai-generation-web';
import GptImage1Schema from './GptImage1.image2image.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import { b64JsonToBlob } from './utils';

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

  const quickActions = createQuickActions(cesdk);
  const quickActionMenu = getQuickActionMenu(cesdk, 'image');

  quickActionMenu.setQuickActionMenuOrder([
    'swapBackground',
    'changeImage',
    'createVariant',
    'ly.img.separator',
    ...quickActionMenu.getQuickActionMenuOrder()
  ]);

  const provider: Provider<'image', GptImage1Input, GptImage1Output> = {
    id: 'open-ai/gpt-image-1/image2image',
    kind: 'image',
    name: 'gpt-image-1',
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
            input.image_url,
            cesdk.engine
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
        const mimeType = await cesdk.engine.editor.getMimeType(input.image_url);
        const resolvedImageUrl = await bufferURIToObjectURL(
          input.image_url,
          cesdk.engine
        );
        const imageUrlResponse = await fetch(resolvedImageUrl);
        const imageUrlBlob = await imageUrlResponse.blob();

        const formData = new FormData();
        formData.append(
          'image',
          imageUrlBlob,
          `image.${mimeTypeToExtension(mimeType)}`
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

function createQuickActions(
  cesdk: CreativeEditorSDK
): QuickAction<GptImage1Input, GptImage1Output>[] {
  return [
    QuickActionSwapImageBackground<GptImage1Input, GptImage1Output>({
      mapInput: (input) => ({ ...input, image_url: input.uri }),
      cesdk
    }),
    QuickActionChangeImage<GptImage1Input, GptImage1Output>({
      mapInput: (input) => ({ ...input, image_url: input.uri }),
      cesdk
    }),
    QuickActionImageVariant<GptImage1Input, GptImage1Output>({
      onApply: async ({ prompt, uri, duplicatedBlockId }, context) => {
        // Generate a variant for the duplicated block
        return context.generate(
          {
            prompt,
            image_url: uri
          },
          {
            blockIds: [duplicatedBlockId]
          }
        );
      },
      cesdk
    })
  ];
}

export default getProvider;
