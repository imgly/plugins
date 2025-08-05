import {
  bufferURIToObjectURL,
  getImageDimensionsFromURL,
  Icons,
  mimeTypeToExtension
} from '@imgly/plugin-utils';
import {
  CommonProperties,
  type Provider,
  CommonProviderConfiguration
} from '@imgly/plugin-ai-generation-web';
import GptImage1Schema from './GptImage1.image2image.json';
import CreativeEditorSDK, { MimeType } from '@cesdk/cesdk-js';
import { b64JsonToBlob } from './utils';
import { ActionRegistry } from '@imgly/plugin-ai-generation-web';
import ChangeStyleLibrary from './quickActions/ChangeStyleLibrary';

type GptImage1Input = {
  prompt: string;
  image_url: string | string[];
  exportFromBlockIds?: number[];
};

type GptImage1Output = {
  kind: 'image';
  url: string;
};

interface ProviderConfiguration
  extends CommonProviderConfiguration<GptImage1Input, GptImage1Output> {}

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
  const modelKey = 'open-ai/gpt-image-1/image2image';
  cesdk.ui.addIconSet('@imgly/plugin/formats', Icons.Formats);
  const baseURL =
    'https://cdn.img.ly/assets/plugins/plugin-ai-image-generation-web/v1/gpt-image-1/';

  ActionRegistry.get().register(
    ChangeStyleLibrary({
      cesdk,
      modelKey,
      baseURL
    })
  );

  const provider: Provider<'image', GptImage1Input, GptImage1Output> = {
    id: modelKey,
    kind: 'image',
    name: 'GPT Image 1',
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
          if (input.image_url == null || Array.isArray(input.image_url)) {
            throw new Error('Cannot process getBlockInput for multiple images');
          }

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
        supported: {
          'ly.img.gpt-image-1.changeStyleLibrary': {
            mapInput: (input) => ({
              prompt: input.prompt,
              image_url: input.uri
            })
          },
          'ly.img.editImage': {
            mapInput: (input) => ({
              prompt: input.prompt,
              image_url: input.uri
            })
          },
          'ly.img.swapBackground': {
            mapInput: (input) => ({
              prompt: input.prompt,
              image_url: input.uri
            })
          },
          'ly.img.createVariant': {
            mapInput: (input) => ({
              prompt: input.prompt,
              image_url: input.uri
            })
          },
          'ly.img.combineImages': {
            mapInput: (input) => ({
              prompt: input.prompt,
              image_url: input.uris,
              exportFromBlockIds: input.exportFromBlockIds
            })
          },
          'ly.img.remixPage': {
            mapInput: (input) => ({
              prompt: input.prompt,
              image_url: input.uri
            })
          },
          'ly.img.remixPageWithPrompt': {
            mapInput: (input) => ({
              prompt: input.prompt,
              image_url: input.uri
            })
          }
        }
      }
    },
    output: {
      abortable: true,
      history: '@imgly/indexedDB',
      middleware: config.middlewares ?? config.middleware ?? [],
      generate: async (
        input: GptImage1Input,
        { abortSignal }: { abortSignal?: AbortSignal }
      ) => {
        const formData = new FormData();

        if (Array.isArray(input.image_url)) {
          if (input.exportFromBlockIds != null) {
            await Promise.all(
              input.exportFromBlockIds.map(async (blockId) => {
                const exportedBlob = await cesdk.engine.block.export(
                  blockId,
                  MimeType.Jpeg,
                  {
                    targetHeight: 1024,
                    targetWidth: 1024
                  }
                );
                formData.append(
                  'image[]',
                  exportedBlob,
                  `image_${blockId}.jpeg`
                );
              })
            );
          } else {
            await Promise.all(
              input.image_url.map(async (image_url) => {
                const mimeType = await cesdk.engine.editor.getMimeType(
                  image_url
                );
                const resolvedImageUrl = await bufferURIToObjectURL(
                  image_url,
                  cesdk.engine
                );
                const imageUrlResponse = await fetch(resolvedImageUrl);
                const imageUrlBlob = await imageUrlResponse.blob();
                formData.append(
                  'image[]',
                  imageUrlBlob,
                  `image.${mimeTypeToExtension(mimeType)}`
                );
              })
            );
          }
        } else {
          const mimeType = await cesdk.engine.editor.getMimeType(
            input.image_url
          );
          const resolvedImageUrl = await bufferURIToObjectURL(
            input.image_url,
            cesdk.engine
          );
          const imageUrlResponse = await fetch(resolvedImageUrl);
          const imageUrlBlob = await imageUrlResponse.blob();
          formData.append(
            'image',
            imageUrlBlob,
            `image.${mimeTypeToExtension(mimeType)}`
          );
        }

        formData.append('prompt', input.prompt);
        formData.append('model', 'gpt-image-1');
        formData.append('size', 'auto');
        formData.append('n', '1');

        const hasGlobalAPIKey =
          cesdk.ui.experimental.hasGlobalStateValue('OPENAI_API_KEY');

        const baseUrl = hasGlobalAPIKey
          ? 'https://api.openai.com/v1'
          : config.proxyUrl;

        const response = await fetch(`${baseUrl}/images/edits`, {
          signal: abortSignal,
          method: 'POST',
          headers: hasGlobalAPIKey
            ? {
                Authorization: `Bearer ${cesdk.ui.experimental.getGlobalStateValue(
                  'OPENAI_API_KEY'
                )}`,
                ...(config.headers ?? {})
              }
            : {
                ...(config.headers ?? {})
              },
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

export default getProvider;
