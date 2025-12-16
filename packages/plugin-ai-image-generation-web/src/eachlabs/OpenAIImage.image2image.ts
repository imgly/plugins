import {
  type Provider,
  type ImageOutput,
  CommonProperties,
  getPanelId
} from '@imgly/plugin-ai-generation-web';
import { getImageDimensionsFromURL } from '@imgly/plugin-utils';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
// @ts-ignore - JSON import
import OpenAIImageImage2ImageSchema from './OpenAIImage.image2image.json';
import createImageProvider from './createImageProvider';
import { EachLabsProviderConfiguration } from './types';

/**
 * Input interface for OpenAI GPT Image image-to-image
 */
export type OpenAIImageImage2ImageInput = {
  prompt: string;
  image_url?: string;
  image_urls?: string[];
};

/**
 * OpenAI GPT Image Edit - Transform images using AI via EachLabs
 *
 * Features:
 * - High-quality image transformation
 * - Supports multiple reference images (up to 16)
 */
export function OpenAIImageImage2Image(
  config: EachLabsProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', OpenAIImageImage2ImageInput, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const providerId = 'eachlabs/openai-gpt-image/edit';

    // Set translations for the panel
    cesdk.i18n.setTranslations({
      en: {
        [`panel.${getPanelId(providerId)}.imageSelection`]:
          'Select Image To Edit',
        [`libraries.${getPanelId(providerId)}.history.label`]:
          'Generated From Image'
      }
    });

    return createImageProvider<OpenAIImageImage2ImageInput>(
      {
        modelSlug: 'openai-image-edit',
        modelVersion: '0.0.1',
        providerId,
        name: 'OpenAI GPT Image Edit',
        // @ts-ignore - JSON schema types are compatible at runtime
        schema: OpenAIImageImage2ImageSchema,
        inputReference: '#/components/schemas/OpenAIImageImage2ImageInput',
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
          // openai-image-edit uses image_url_1 for the first image
          const imageUrl = input.image_url ?? input.image_urls?.[0];
          const apiInput: Record<string, unknown> = {
            prompt: input.prompt
          };

          // Map image_urls array to image_url_1, image_url_2, etc.
          if (input.image_urls && input.image_urls.length > 0) {
            input.image_urls.forEach((url, index) => {
              apiInput[`image_url_${index + 1}`] = url;
            });
          } else if (imageUrl) {
            apiInput.image_url_1 = imageUrl;
          }

          return apiInput;
        }
      },
      config
    );
  };
}

export default OpenAIImageImage2Image;
