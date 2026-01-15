import {
  type Provider,
  type ImageOutput,
  CommonProperties,
  getPanelId,
  setDefaultTranslations
} from '@imgly/plugin-ai-generation-web';
import { getImageDimensionsFromURL } from '@imgly/plugin-utils';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
// @ts-ignore - JSON import
import Flux2FlexImage2ImageSchema from './Flux2Flex.image2image.json';
import createImageProvider from './createImageProvider';
import { EachLabsProviderConfiguration } from './types';

/**
 * Input interface for Flux 2 Flex image-to-image
 */
export type Flux2FlexImage2ImageInput = {
  prompt: string;
  image_url?: string;
  image_urls?: string[];
};

/**
 * Flux 2 Flex Edit - Transform images using AI via EachLabs with prompt expansion
 *
 * Features:
 * - Automatic prompt expansion using the model's knowledge
 * - Automatic image size detection ("auto" mode)
 * - Supports up to 10 reference images
 */
export function Flux2FlexImage2Image(
  config: EachLabsProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', Flux2FlexImage2ImageInput, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const providerId = 'eachlabs/flux-2-flex/edit';

    // Set translations for the panel
    setDefaultTranslations(cesdk, {
      en: {
        [`panel.${getPanelId(providerId)}.imageSelection`]:
          'Select Image To Edit',
        [`libraries.${getPanelId(providerId)}.history.label`]:
          'Generated From Image'
      }
    });

    return createImageProvider<Flux2FlexImage2ImageInput>(
      {
        modelSlug: 'flux-2-flex-edit',
        modelVersion: '0.0.1',
        providerId,
        name: 'Flux 2 Flex Edit',
        // @ts-ignore - JSON schema types are compatible at runtime
        schema: Flux2FlexImage2ImageSchema,
        inputReference: '#/components/schemas/Flux2FlexImage2ImageInput',
        cesdk,
        middleware: config.middlewares ?? [],
        renderCustomProperty: CommonProperties.ImageUrl(providerId, {
          cesdk
        }),
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
          },
          'ly.img.combineImages': {
            mapInput: (input) => ({
              prompt: input.prompt,
              image_urls: input.uris
            })
          }
        },
        getBlockInput: async (input) => {
          // Get first image URL from either single or array input
          const firstImageUrl = input.image_url ?? input.image_urls?.[0];
          if (firstImageUrl == null) {
            throw new Error('No image URL provided');
          }

          // Get dimensions from input image for UI placeholder
          const { width, height } = await getImageDimensionsFromURL(
            firstImageUrl,
            cesdk.engine
          );
          return Promise.resolve({
            image: {
              width,
              height
            }
          });
        },
        mapInput: (input) => {
          // Map to EachLabs API format
          // flux-2-flex-edit uses image_urls (array) for image input
          const imageUrls =
            input.image_urls ?? (input.image_url ? [input.image_url] : []);
          return {
            prompt: input.prompt,
            image_urls: imageUrls,
            // Use auto image size to let the model determine output dimensions
            image_size: 'auto',
            // Enable prompt expansion by default (key Flex feature)
            enable_prompt_expansion: true
          };
        }
      },
      config
    );
  };
}

export default Flux2FlexImage2Image;
