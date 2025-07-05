import {
  bufferURIToObjectURL,
  getImageDimensionsFromURL,
  getImageUri,
  Icons,
  mimeTypeToExtension
} from '@imgly/plugin-utils';
import {
  QuickActionImageVariant,
  QuickActionCombineImages,
  QuickActionChangeImage,
  QuickActionSwapImageBackground,
  CommonProperties,
  getQuickActionMenu,
  QuickActionBasePrompt,
  QuickAction,
  type Provider,
  QuickActionBaseSelect,
  QuickActionBaseLibrary,
  enableQuickActionForImageFill,
  QuickActionBaseButton,
  CommonProviderConfiguration
} from '@imgly/plugin-ai-generation-web';
import GptImage1Schema from './GptImage1.image2image.json';
import CreativeEditorSDK, { MimeType } from '@cesdk/cesdk-js';
import { b64JsonToBlob } from './utils';
import {
  addStyleAssetSource,
  createStyleAssetSource,
  STYLES
} from './GptImage1.styles';

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

  const quickActions = createQuickActions({ cesdk, modelKey });
  const quickActionMenu = getQuickActionMenu(cesdk, 'image');

  const styleAssetSourceId = `${modelKey}/styles`;
  const styleAssetSource = createStyleAssetSource(styleAssetSourceId, {
    baseURL
  });
  addStyleAssetSource(styleAssetSource, { cesdk });

  cesdk.i18n.setTranslations({
    en: {
      'ly.img.ai.quickAction.changeStyle': 'Change Style',
      'ly.img.ai.quickAction.changeStyleLibrary': 'Change Style',
      'ly.img.ai.quickAction.remixPage': 'Turn Page into Image',
      'ly.img.ai.quickAction.remixPageWithPrompt': 'Remix Page',
      'ly.img.ai.quickAction.remixPageWithPrompt.prompt.inputLabel':
        'Remix Page Prompt',
      'ly.img.ai.quickAction.remixPageWithPrompt.prompt.placeholder':
        'e.g. rearrange the layout to...',
      'ly.img.ai.quickAction.remixPageWithPrompt.apply': 'Remix'
    }
  });

  quickActionMenu.setQuickActionMenuOrder([
    'changeStyleLibrary',
    // 'changeStyle',
    'ly.img.separator',
    'swapBackground',
    'changeImage',
    'createVariant',
    'combineImages',
    'ly.img.separator',
    'remixPage',
    'ly.img.separator',
    ...quickActionMenu.getQuickActionMenuOrder()
  ]);

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
        actions: quickActions ?? [],
        supported: {
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
          'ly.img.styleTransfer': {
            mapInput: (input) => ({
              prompt: input.style,
              image_url: input.uri
            })
          },
          'ly.img.artistTransfer': {
            mapInput: (input) => ({
              prompt: input.artist,
              image_url: input.uri
            })
          },
          'ly.img.createVariant': {
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
      middleware: config.middlewares ?? [],
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

function createQuickActions(options: {
  cesdk: CreativeEditorSDK;
  modelKey: string;
}): QuickAction<GptImage1Input, GptImage1Output>[] {
  const { cesdk, modelKey } = options;
  return [
    QuickActionBaseLibrary<GptImage1Input, GptImage1Output>({
      cesdk: options.cesdk,
      entries: [`${modelKey}/styles`],
      quickAction: {
        id: 'changeStyleLibrary',
        version: '1',
        confirmation: true,
        lockDuringConfirmation: false,
        scopes: ['fill/change'],
        enable: enableQuickActionForImageFill()
      },
      onApply: async (input, context) => {
        const [blockId] = cesdk.engine.block.findAllSelected();
        const uri = await getImageUri(blockId, cesdk.engine, {
          throwErrorIfSvg: true
        });

        const styleId = input.assetResult.id;
        const style = STYLES.find(({ id }) => id === styleId);
        if (style == null) {
          throw new Error(`Style not found: ${styleId}`);
        }

        return context.generate({
          prompt: style.prompt,
          image_url: uri
        });
      }
    }),
    QuickActionBaseSelect<GptImage1Input, GptImage1Output>({
      cesdk,
      items: STYLES.filter(({ id }) => id !== 'none'),
      quickAction: {
        id: 'changeStyle',
        version: '1',
        confirmation: true,
        lockDuringConfirmation: false,
        scopes: ['fill/change'],
        enable: enableQuickActionForImageFill()
      },
      onApply: async (input, context) => {
        const [blockId] = cesdk.engine.block.findAllSelected();
        const uri = await getImageUri(blockId, cesdk.engine, {
          throwErrorIfSvg: true
        });

        return context.generate({
          prompt: input.item.prompt,
          image_url: uri
        });
      }
    }),
    // QuickActionEditTextStyle<GptImage1Input, GptImage1Output>({
    //   onApply: async ({ prompt, uri, duplicatedBlockId }, context) => {
    //     // Generate a variant for the duplicated block
    //     return context.generate(
    //       {
    //         prompt,
    //         image_url: uri
    //       },
    //       {
    //         blockIds: [duplicatedBlockId]
    //       }
    //     );
    //   },
    //   cesdk
    // }),
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
    }),
    QuickActionCombineImages<GptImage1Input, GptImage1Output>({
      onApply: async ({ prompt, uris, duplicatedBlockId }, context) => {
        // Generate a variant for the duplicated block
        return context.generate(
          {
            prompt,
            image_url: uris,
            exportFromBlockIds: context.blockIds
          },
          {
            blockIds: [duplicatedBlockId]
          }
        );
      },
      cesdk
    }),
    QuickActionBaseButton<GptImage1Input, GptImage1Output>({
      quickAction: {
        id: 'remixPage',
        version: '1',
        confirmation: false,
        lockDuringConfirmation: false,
        scopes: ['lifecycle/duplicate'],
        enable: ({ engine }) => {
          const blockIds = engine.block.findAllSelected();
          if (blockIds.length !== 1) return false;
          const blockId = blockIds[0];
          const type = engine.block.getType(blockId);
          return type === '//ly.img.ubq/page';
        }
      },
      onClick: async (context) => {
        const engine = cesdk.engine;
        const [page] = engine.block.findAllSelected();

        const exportedPageBlob = await engine.block.export(page);
        const exportedPageUrl = URL.createObjectURL(exportedPageBlob);

        const duplicatedPage = engine.block.duplicate(page);
        engine.block.getChildren(duplicatedPage).forEach((childId) => {
          engine.block.destroy(childId);
        });
        engine.block.setSelected(page, false);

        const width = cesdk.engine.block.getFrameWidth(page);
        const height = cesdk.engine.block.getFrameHeight(page);
        const positionX = cesdk.engine.block.getPositionX(page);
        const positionY = cesdk.engine.block.getPositionY(page);

        const shape = cesdk.engine.block.createShape('rect');
        const rasterizedPageBlock = cesdk.engine.block.create('graphic');

        cesdk.engine.block.setShape(rasterizedPageBlock, shape);
        cesdk.engine.block.appendChild(duplicatedPage, rasterizedPageBlock);
        cesdk.engine.block.setWidth(rasterizedPageBlock, width);
        cesdk.engine.block.setHeight(rasterizedPageBlock, height);
        cesdk.engine.block.setPositionX(rasterizedPageBlock, positionX);
        cesdk.engine.block.setPositionY(rasterizedPageBlock, positionY);

        const fillBlock = cesdk.engine.block.createFill('image');
        cesdk.engine.block.setFill(rasterizedPageBlock, fillBlock);

        cesdk.engine.block.setString(
          fillBlock,
          'fill/image/imageFileURI',
          exportedPageUrl
        );

        engine.block.setSelected(rasterizedPageBlock, true);
        engine.scene.zoomToBlock(rasterizedPageBlock);

        context.generate(
          {
            image_url: exportedPageUrl,
            prompt:
              'Follow instructions but don’t add the instructions for the image'
          },
          {
            blockIds: [rasterizedPageBlock]
          }
        );
      }
    }),
    QuickActionBasePrompt<GptImage1Input, GptImage1Output>({
      quickAction: {
        id: 'remixPageWithPrompt',
        version: '1',
        confirmation: false,
        lockDuringConfirmation: false,
        scopes: ['lifecycle/duplicate'],
        enable: ({ engine }) => {
          const blockIds = engine.block.findAllSelected();
          if (blockIds.length !== 1) return false;
          const blockId = blockIds[0];
          const type = engine.block.getType(blockId);
          return type === '//ly.img.ubq/page';
        }
      },
      onApply: async (prompt, context) => {
        const engine = cesdk.engine;
        const [page] = engine.block.findAllSelected();

        const exportedPageBlob = await engine.block.export(page);
        const exportedPageUrl = URL.createObjectURL(exportedPageBlob);

        const duplicatedPage = engine.block.duplicate(page);
        engine.block.getChildren(duplicatedPage).forEach((childId) => {
          engine.block.destroy(childId);
        });
        engine.block.setSelected(page, false);

        const width = cesdk.engine.block.getFrameWidth(page);
        const height = cesdk.engine.block.getFrameHeight(page);
        const positionX = cesdk.engine.block.getPositionX(page);
        const positionY = cesdk.engine.block.getPositionY(page);

        const shape = cesdk.engine.block.createShape('rect');
        const rasterizedPageBlock = cesdk.engine.block.create('graphic');

        cesdk.engine.block.setShape(rasterizedPageBlock, shape);
        cesdk.engine.block.appendChild(duplicatedPage, rasterizedPageBlock);
        cesdk.engine.block.setWidth(rasterizedPageBlock, width);
        cesdk.engine.block.setHeight(rasterizedPageBlock, height);
        cesdk.engine.block.setPositionX(rasterizedPageBlock, positionX);
        cesdk.engine.block.setPositionY(rasterizedPageBlock, positionY);

        const fillBlock = cesdk.engine.block.createFill('image');
        cesdk.engine.block.setFill(rasterizedPageBlock, fillBlock);

        cesdk.engine.block.setString(
          fillBlock,
          'fill/image/imageFileURI',
          exportedPageUrl
        );

        engine.block.setSelected(rasterizedPageBlock, true);
        engine.scene.zoomToBlock(rasterizedPageBlock);

        return context.generate(
          {
            image_url: exportedPageUrl,
            prompt
          },
          {
            blockIds: [rasterizedPageBlock]
          }
        );
      }
    })
  ];
}

export default getProvider;
