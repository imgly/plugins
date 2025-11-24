import {
  Provider,
  getPanelId,
  ImageOutput
} from '@imgly/plugin-ai-generation-web';
import { getImageDimensionsFromURL } from '@imgly/plugin-utils';
import schema from './GptImage1Edit.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createImageProvider from './createImageProvider';
import { RunwareProviderConfiguration } from './types';

type GptImage1EditInput = {
  image_url: string;
  prompt: string;
  size?: string;
};

export function GptImage1Edit(
  config: RunwareProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', GptImage1EditInput, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const providerId = 'runware/openai/gpt-image-1-edit';

    cesdk.i18n.setTranslations({
      en: {
        [`panel.${getPanelId(providerId)}.imageSelection`]:
          'Select Image To Edit',
        [`libraries.${getPanelId(providerId)}.history.label`]:
          'Generated From Image'
      }
    });

    return createImageProvider(
      {
        modelAIR: 'openai:1@1',
        providerId,
        name: 'GPT Image 1 Edit',
        // @ts-ignore
        schema,
        inputReference: '#/components/schemas/GptImage1EditInput',
        cesdk,
        middleware: config.middlewares ?? [],
        supportedQuickActions: {
          'ly.img.editImage': {
            mapInput: (input: any) => ({
              prompt: input.prompt,
              image_url: input.uri
            })
          },
          'ly.img.createVariant': {
            mapInput: (input: any) => ({
              prompt: input.prompt ?? 'Create a variant',
              image_url: input.uri
            })
          },
          'ly.img.styleTransfer': {
            mapInput: (input: any) => ({
              prompt: input.style,
              image_url: input.uri
            })
          },
          'ly.img.artistTransfer': {
            mapInput: (input: any) => ({
              prompt: input.artist,
              image_url: input.uri
            })
          }
        },
        getBlockInput: async (input) => {
          const { width, height } = await getImageDimensionsFromURL(
            input.image_url,
            cesdk.engine
          );
          return { image: { width, height } };
        },
        mapInput: (input) => ({
          positivePrompt: input.prompt,
          seedImage: input.image_url
        })
      },
      config
    );
  };
}

export default GptImage1Edit;
