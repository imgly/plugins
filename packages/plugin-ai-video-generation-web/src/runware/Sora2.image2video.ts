import {
  type Provider,
  type VideoOutput,
  getPanelId,
  addIconSetOnce
} from '@imgly/plugin-ai-generation-web';
import { getImageDimensionsFromURL, Icons } from '@imgly/plugin-utils';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
// @ts-ignore - JSON import
import Sora2Schema from './Sora2.image2video.json';
import createVideoProvider from './createVideoProvider';
import { RunwareProviderConfiguration } from './types';

/**
 * Format to dimensions mapping for Sora 2
 * Supported: 1280x720, 720x1280
 */
const SORA2_FORMAT_MAP: Record<string, { width: number; height: number }> = {
  '1280x720': { width: 1280, height: 720 },
  '720x1280': { width: 720, height: 1280 }
};

function getSora2Dimensions(format: string): { width: number; height: number } {
  return SORA2_FORMAT_MAP[format] ?? { width: 1280, height: 720 };
}

/**
 * Determines best format based on input image dimensions
 */
function getBestFormatForImage(
  width: number,
  height: number
): '1280x720' | '720x1280' {
  const isLandscape = width >= height;
  return isLandscape ? '1280x720' : '720x1280';
}

/**
 * Input interface for Sora 2 Image-to-Video
 */
export type Sora2Image2VideoInput = {
  image_url: string;
  prompt?: string;
  format?: '1280x720' | '720x1280';
  duration?: '4' | '8' | '12';
};

/**
 * Sora 2 Image-to-Video - OpenAI's video generation from images
 *
 * AIR: openai:3@1
 *
 * Features:
 * - First frame image input
 * - Accurate physics simulation
 * - Synchronized dialogue and high-fidelity visuals
 *
 * Specifications:
 * - Prompt: 1-4,000 characters
 * - Input image: 300-2048 pixels, 20MB max
 * - Resolutions: 1280x720, 720x1280
 * - Duration: 4, 8, or 12 seconds
 */
export function Sora2Image2Video(
  config: RunwareProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'video', Sora2Image2VideoInput, VideoOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const providerId = 'runware/openai/sora-2/image2video';

    // Add format icons
    addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

    // Required i18n for image selection UI
    cesdk.i18n.setTranslations({
      en: {
        [`panel.${getPanelId(providerId)}.imageSelection`]:
          'Select Image To Animate',
        [`libraries.${getPanelId(providerId)}.history.label`]:
          'Generated From Image'
      }
    });

    return createVideoProvider<Sora2Image2VideoInput>(
      {
        modelId: 'openai:3@1',
        providerId,
        name: 'Sora 2',
        // @ts-ignore - JSON schema types are compatible at runtime
        schema: Sora2Schema,
        inputReference: '#/components/schemas/Sora2Image2VideoInput',
        cesdk,
        middleware: config.middlewares ?? [],

        // Quick action support
        supportedQuickActions: {
          'ly.img.createVideo': {
            mapInput: (input: { uri: string; prompt?: string }) => ({
              image_url: input.uri,
              prompt: input.prompt ?? ''
            })
          }
        },

        // Async - reads dimensions from input image
        getBlockInput: async (input) => {
          const { width, height } = await getImageDimensionsFromURL(
            input.image_url,
            cesdk.engine
          );
          // Use selected format, or determine best format from input image
          const format = input.format ?? getBestFormatForImage(width, height);
          const dims = getSora2Dimensions(format);
          const duration = parseInt(input.duration ?? '8', 10);
          return {
            video: {
              width: dims.width,
              height: dims.height,
              duration
            }
          };
        },

        mapInput: (input) => {
          const dims = getSora2Dimensions(input.format ?? '1280x720');
          const duration = parseInt(input.duration ?? '8', 10);
          return {
            positivePrompt: input.prompt ?? '',
            width: dims.width,
            height: dims.height,
            frameImages: [
              {
                inputImage: input.image_url,
                frame: 'first'
              }
            ],
            duration
          };
        }
      },
      config
    );
  };
}

export default Sora2Image2Video;
