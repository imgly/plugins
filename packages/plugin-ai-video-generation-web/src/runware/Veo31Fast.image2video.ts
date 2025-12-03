import {
  type Provider,
  type VideoOutput,
  getPanelId,
  addIconSetOnce
} from '@imgly/plugin-ai-generation-web';
import { getImageDimensionsFromURL, Icons } from '@imgly/plugin-utils';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
// @ts-ignore - JSON import
import Veo31FastSchema from './Veo31Fast.image2video.json';
import createVideoProvider from './createVideoProvider';
import { RunwareProviderConfiguration } from './types';

/**
 * Format to dimensions mapping for Veo 3.1 Fast
 * Supported: 1280x720, 720x1280, 1920x1080, 1080x1920
 */
const VEO31_FAST_FORMAT_MAP: Record<string, { width: number; height: number }> =
  {
    '1280x720': { width: 1280, height: 720 },
    '720x1280': { width: 720, height: 1280 },
    '1920x1080': { width: 1920, height: 1080 },
    '1080x1920': { width: 1080, height: 1920 }
  };

function getVeo31FastDimensions(format: string): {
  width: number;
  height: number;
} {
  return VEO31_FAST_FORMAT_MAP[format] ?? { width: 1280, height: 720 };
}

/**
 * Determines best format based on input image dimensions
 */
function getBestFormatForImage(
  width: number,
  height: number
): '1280x720' | '720x1280' | '1920x1080' | '1080x1920' {
  const isLandscape = width >= height;
  // Default to HD resolution
  return isLandscape ? '1280x720' : '720x1280';
}

/**
 * Input interface for Veo 3.1 Fast Image-to-Video
 */
export type Veo31FastImage2VideoInput = {
  image_url: string;
  prompt?: string;
  format?: '1280x720' | '720x1280' | '1920x1080' | '1080x1920';
  generate_audio?: boolean;
};

/**
 * Veo 3.1 Fast Image-to-Video - Google's fast video generation from images
 *
 * AIR: google:3@3
 *
 * Features:
 * - First frame image input
 * - Native audio generation
 * - Optimized for high-speed generation with cinematic quality
 * - Ultra-low latency for rapid creative iteration
 *
 * Specifications:
 * - Prompt: 2-3,000 characters
 * - Input image: 300-2048 pixels, 20MB max
 * - Resolutions: 1280x720, 720x1280, 1920x1080, 1080x1920
 * - Frame rate: 24 FPS
 * - Duration: 8 seconds (fixed)
 */
export function Veo31FastImage2Video(
  config: RunwareProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'video', Veo31FastImage2VideoInput, VideoOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const providerId = 'runware/google/veo-3.1-fast/image2video';

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

    return createVideoProvider<Veo31FastImage2VideoInput>(
      {
        modelAIR: 'google:3@3',
        providerId,
        name: 'Veo 3.1 Fast',
        // @ts-ignore - JSON schema types are compatible at runtime
        schema: Veo31FastSchema,
        inputReference: '#/components/schemas/Veo31FastImage2VideoInput',
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
          const dims = getVeo31FastDimensions(format);
          return {
            video: {
              width: dims.width,
              height: dims.height,
              duration: 8 // Fixed 8 second duration
            }
          };
        },

        mapInput: (input) => {
          // Note: For mapInput we need format, but if not provided we can't read image dims here
          // The format should be selected by user or determined in getBlockInput
          const dims = getVeo31FastDimensions(input.format ?? '1280x720');
          return {
            positivePrompt: input.prompt ?? '',
            width: dims.width,
            height: dims.height,
            // Video uses frameImages instead of seedImage
            frameImages: [
              {
                inputImage: input.image_url,
                frame: 'first'
              }
            ],
            duration: 8,
            fps: 24,
            providerSettings: {
              google: {
                generateAudio: input.generate_audio ?? true
              }
            }
          };
        }
      },
      config
    );
  };
}

export default Veo31FastImage2Video;
