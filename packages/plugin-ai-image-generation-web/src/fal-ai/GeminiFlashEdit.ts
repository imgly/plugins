import {
  getQuickActionMenu,
  ImageOutput,
  Middleware,
  type Provider
} from '@imgly/plugin-ai-generation-web';
import schema from './GeminiFlashEdit.json';
import { getImageDimensionsFromURL } from '@imgly/plugin-utils';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createImageProvider from './createImageProvider';
import { createGeminiFlashEditQuickActions } from './GeminiFlashEditQuickActions';

type GeminiFlashEditInput = {
  prompt: string;
  image_url: string;
};

type ProviderConfiguration = {
  proxyUrl: string;
  debug?: boolean;
  middleware?: Middleware<GeminiFlashEditInput, ImageOutput>[];
};

export function GeminiFlashEdit(
  config: ProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', GeminiFlashEditInput, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    return getProvider(cesdk, config);
  };
}

function getProvider(
  cesdk: CreativeEditorSDK,
  config: ProviderConfiguration
): Provider<'image', GeminiFlashEditInput, ImageOutput> {
  const modelKey = 'fal-ai/gemini-flash-edit';

  const quickActions = createGeminiFlashEditQuickActions(cesdk);
  const quickActionMenu = getQuickActionMenu(cesdk, 'image');

  quickActionMenu.setQuickActionMenuOrder([
    ...quickActionMenu.getQuickActionMenuOrder(),
    'ly.img.separator',
    'styleTransfer',
    'artists',
    'ly.img.separator',
    'changeImage',
    'createVariant',
    'ly.img.separator',
    'createVideo'
  ]);

  return createImageProvider(
    {
      modelKey,
      name: 'Change Image',
      // @ts-ignore
      schema,
      inputReference: '#/components/schemas/GeminiFlashEditInput',
      cesdk,
      quickActions,
      middleware: config.middleware,
      getBlockInput: async (input) => {
        const { width, height } = await getImageDimensionsFromURL(
          input.image_url,
          cesdk
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

export default getProvider;
