import {
  ImageOutput,
  type Provider,
  type CommonProviderConfiguration,
  getPanelId,
  addIconSetOnce
} from '@imgly/plugin-ai-generation-web';
import { Icons, getImageDimensionsFromURL } from '@imgly/plugin-utils';
import schema from './QwenImageEdit.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createImageProvider from './createImageProvider';

type QwenImageEditInput = {
  prompt: string;
  image_url: string;
  num_images?: number;
  image_size?: string;
  acceleration?: 'none' | 'regular' | 'high';
  output_format?: 'jpeg' | 'png';
  guidance_scale?: number;
  num_inference_steps?: number;
  sync_mode?: boolean;
  seed?: number;
  negative_prompt?: string;
  enable_safety_checker?: boolean;
};

export function QwenImageEdit(
  config: CommonProviderConfiguration<QwenImageEditInput, ImageOutput>
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', QwenImageEditInput, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const modelKey = 'fal-ai/qwen-image-edit';

    // Set translations
    cesdk.i18n.setTranslations({
      en: {
        [`panel.${getPanelId(modelKey)}.imageSelection`]:
          'Select Image To Edit',
        [`panel.${modelKey}.imageSelection`]: 'Select Image To Generate',
        [`libraries.${getPanelId(modelKey)}.history.label`]: 'Edited With Qwen'
      }
    });

    return getProvider(cesdk, config);
  };
}

function getProvider(
  cesdk: CreativeEditorSDK,
  config: CommonProviderConfiguration<QwenImageEditInput, ImageOutput>
): Provider<'image', QwenImageEditInput, ImageOutput> {
  const modelKey = 'fal-ai/qwen-image-edit';

  // Add aspect ratio icons
  addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

  return createImageProvider(
    {
      modelKey,
      name: 'Qwen Image Edit',
      // @ts-ignore
      schema,
      inputReference: '#/components/schemas/QwenImageEditInput',
      cesdk,
      supportedQuickActions: {
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
      },
      middlewares: config.middlewares ?? config.middleware ?? [],
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

export default getProvider;
