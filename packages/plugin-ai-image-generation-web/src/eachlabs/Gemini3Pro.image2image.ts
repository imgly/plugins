import {
  type Provider,
  type ImageOutput,
  CommonProperties,
  getPanelId,
  setDefaultTranslations} from '@imgly/plugin-ai-generation-web';
import { getImageDimensionsFromURL } from '@imgly/plugin-utils';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
// @ts-ignore - JSON import
import Gemini3ProImage2ImageSchema from './Gemini3Pro.image2image.json';
import createImageProvider from './createImageProvider';
import { EachLabsProviderConfiguration } from './types';

/**
 * Input interface for Gemini 3 Pro image-to-image
 */
export type Gemini3ProImage2ImageInput = {
  prompt: string;
  image_url?: string;
  image_urls?: string[];
};

/**
 * Gemini 3 Pro Image Edit - Transform images using Google Gemini via EachLabs
 *
 * Features:
 * - High-quality image transformation
 * - Supports multiple reference images (up to 10)
 */
export function Gemini3ProImage2Image(
  config: EachLabsProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', Gemini3ProImage2ImageInput, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const providerId = 'eachlabs/gemini-3-pro-image/edit';

    // Set translations for the panel
    setDefaultTranslations(cesdk, {
      en: {
        [`panel.${getPanelId(providerId)}.imageSelection`]:
          'Select Image To Edit',
        [`libraries.${getPanelId(providerId)}.history.label`]:
          'Generated From Image'
      }
    });

    return createImageProvider<Gemini3ProImage2ImageInput>(
      {
        modelSlug: 'gemini-3-pro-image-preview-edit',
        modelVersion: '0.0.1',
        providerId,
        name: 'Gemini 3 Pro Image Edit',
        // @ts-ignore - JSON schema types are compatible at runtime
        schema: Gemini3ProImage2ImageSchema,
        inputReference: '#/components/schemas/Gemini3ProImage2ImageInput',
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
          // gemini-3-pro-image-preview-edit uses image_urls array
          const imageUrl = input.image_url ?? input.image_urls?.[0];
          const apiInput: Record<string, unknown> = {
            prompt: input.prompt,
            num_images: 1,
            output_format: 'png'
          };

          // Map to image_urls array format
          if (input.image_urls && input.image_urls.length > 0) {
            apiInput.image_urls = input.image_urls;
          } else if (imageUrl) {
            apiInput.image_urls = [imageUrl];
          }

          return apiInput;
        }
      },
      config
    );
  };
}

export default Gemini3ProImage2Image;
