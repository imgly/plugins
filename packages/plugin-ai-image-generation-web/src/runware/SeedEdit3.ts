import {
  Provider,
  getPanelId,
  ImageOutput
} from '@imgly/plugin-ai-generation-web';
import { getImageDimensionsFromURL } from '@imgly/plugin-utils';
import schema from './SeedEdit3.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createImageProvider from './createImageProvider';
import { RunwareProviderConfiguration } from './types';

type SeedEdit3Input = {
  image_url: string;
  prompt: string;
  resolution?: string;
};

export function SeedEdit3(
  config: RunwareProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', SeedEdit3Input, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const providerId = 'runware/bytedance/seededit-3';

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
        modelAIR: 'bytedance:4@1',
        providerId,
        name: 'SeedEdit 3.0',
        // @ts-ignore
        schema,
        inputReference: '#/components/schemas/SeedEdit3Input',
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

export default SeedEdit3;
