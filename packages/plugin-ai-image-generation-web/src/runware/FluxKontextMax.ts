import {
  Provider,
  addIconSetOnce,
  getPanelId,
  ImageOutput
} from '@imgly/plugin-ai-generation-web';
import { Icons, getImageDimensionsFromURL } from '@imgly/plugin-utils';
import schema from './FluxKontextMax.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createImageProvider from './createImageProvider';
import { RunwareProviderConfiguration } from './types';

type FluxKontextMaxInput = {
  image_url: string;
  prompt: string;
  aspect_ratio?: string;
};

export function FluxKontextMax(
  config: RunwareProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', FluxKontextMaxInput, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const providerId = 'runware/bfl/flux-kontext-max';

    cesdk.i18n.setTranslations({
      en: {
        [`panel.${getPanelId(providerId)}.imageSelection`]:
          'Select Image To Edit',
        [`libraries.${getPanelId(providerId)}.history.label`]:
          'Generated From Image'
      }
    });

    addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

    return createImageProvider(
      {
        modelAIR: 'bfl:4@1',
        providerId,
        name: 'FLUX Kontext Max',
        // @ts-ignore
        schema,
        inputReference: '#/components/schemas/FluxKontextMaxInput',
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

export default FluxKontextMax;
