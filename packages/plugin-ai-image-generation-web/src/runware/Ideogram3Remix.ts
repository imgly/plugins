import {
  Provider,
  getPanelId,
  ImageOutput
} from '@imgly/plugin-ai-generation-web';
import { getImageDimensionsFromURL } from '@imgly/plugin-utils';
import schema from './Ideogram3Remix.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createImageProvider from './createImageProvider';
import { RunwareProviderConfiguration } from './types';

type Ideogram3RemixInput = {
  image_url: string;
  prompt: string;
  style?: string;
  resolution?: string;
};

export function Ideogram3Remix(
  config: RunwareProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', Ideogram3RemixInput, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const providerId = 'runware/ideogram/v3-remix';

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
        modelAIR: 'ideogram:4@2',
        providerId,
        name: 'Ideogram 3.0 Remix',
        // @ts-ignore
        schema,
        inputReference: '#/components/schemas/Ideogram3RemixInput',
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

export default Ideogram3Remix;
