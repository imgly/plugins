import {
  getQuickActionMenu,
  ImageOutput,
  QuickAction,
  QuickActionBaseSelect,
  QuickActionSwapImageBackground,
  QuickActionChangeImage,
  QuickActionImageVariant,
  enableQuickActionForImageFill,
  type Provider,
  type CommonProviderConfiguration
} from '@imgly/plugin-ai-generation-web';
import schema from './FluxProKontextMaxEdit.json';
import { getImageDimensionsFromURL } from '@imgly/plugin-utils';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createImageProvider from './createImageProvider';

// Input type limited to prompt & image_url
export type FluxProKontextMaxEditInput = {
  prompt: string;
  image_url: string;
};

export function FluxProKontextMaxEdit(
  config: CommonProviderConfiguration<FluxProKontextMaxEditInput, ImageOutput>
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', FluxProKontextMaxEditInput, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    return getProvider(cesdk, config);
  };
}

function getProvider(
  cesdk: CreativeEditorSDK,
  config: CommonProviderConfiguration<FluxProKontextMaxEditInput, ImageOutput>
): Provider<'image', FluxProKontextMaxEditInput, ImageOutput> {
  const modelKey = 'fal-ai/flux-pro/kontext/max';

  const quickActions = createFluxProKontextMaxEditQuickActions(cesdk);
  const quickActionMenu = getQuickActionMenu(cesdk, 'image');

  quickActionMenu.setQuickActionMenuOrder([
    ...quickActionMenu.getQuickActionMenuOrder(),
    'ly.img.separator',
    'styleTransfer',
    'artists',
    'ly.img.separator',
    'changeImage',
    'createVariant'
  ]);

  return createImageProvider(
    {
      modelKey,
      name: 'Change Image (MAX)',
      // @ts-ignore
      schema,
      inputReference: '#/components/schemas/FluxProKontextMaxEditInput',
      cesdk,
      quickActions,
      middleware: config.middleware,
      headers: config.headers,
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
      }
    },
    config
  );
}

function createFluxProKontextMaxEditQuickActions(
  cesdk: CreativeEditorSDK
): QuickAction<FluxProKontextMaxEditInput, ImageOutput>[] {
  cesdk.i18n.setTranslations({
    en: {
      'ly.img.ai.quickAction.styleTransfer': 'Change Art Style',
      'ly.img.ai.quickAction.artists': 'Painted By'
    }
  });

  return [
    QuickActionSwapImageBackground<FluxProKontextMaxEditInput, ImageOutput>({
      mapInput: (input) => ({ ...input, image_url: input.uri }),
      cesdk
    }),
    QuickActionChangeImage<FluxProKontextMaxEditInput, ImageOutput>({
      mapInput: (input) => ({ ...input, image_url: input.uri }),
      cesdk
    }),
    QuickActionImageVariant<FluxProKontextMaxEditInput, ImageOutput>({
      onApply: async ({ prompt, uri, duplicatedBlockId }, context) => {
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
    // Keep same base selects as original (reuse constants)
    QuickActionBaseSelect<FluxProKontextMaxEditInput, ImageOutput>({
      quickAction: {
        id: 'styleTransfer',
        version: '1',
        enable: enableQuickActionForImageFill(),
        scopes: ['fill/change'],
        confirmation: true,
        lockDuringConfirmation: false
      },
      mapInput: (input) => ({
        prompt: input.item.prompt,
        image_url: input.uri,
        blockId: input.blockId
      }),
      items: [
        {
          id: 'water',
          label: 'Watercolor Painting',
          prompt: 'Convert to watercolor painting.'
        },
        {
          id: 'oil',
          label: 'Oil Painting',
          prompt: 'Render in oil painting style.'
        },
        {
          id: 'charcoal',
          label: 'Charcoal Sketch',
          prompt: 'Transform into a charcoal sketch.'
        },
        {
          id: 'pencil',
          label: 'Pencil Drawing',
          prompt: 'Apply pencil drawing effect.'
        }
      ],
      cesdk
    }),
    QuickActionBaseSelect<FluxProKontextMaxEditInput, ImageOutput>({
      quickAction: {
        id: 'artists',
        version: '1',
        enable: enableQuickActionForImageFill(),
        scopes: ['fill/change'],
        confirmation: true,
        lockDuringConfirmation: false
      },
      mapInput: (input) => ({
        prompt: input.item.prompt,
        image_url: input.uri,
        blockId: input.blockId
      }),
      items: [
        {
          id: 'van-gogh',
          label: 'Van Gogh',
          prompt: 'Render this image in the style of Vincent van Gogh.'
        },
        {
          id: 'monet',
          label: 'Monet',
          prompt:
            'Transform this image into the soft, impressionistic style of Claude Monet.'
        }
      ],
      cesdk
    })
  ];
}

export default getProvider;
