import CreativeEditorSDK from '@cesdk/cesdk-js';
import { Middleware } from '@imgly/plugin-ai-generation-web';
import { fal } from '@fal-ai/client';
import { BackgroundRemovalProvider } from '../processBackgroundRemoval';
import { uploadImageInputToFalIfNeeded } from './utils';

type BackgroundRemovalProviderConfiguration = {
  proxyUrl: string;
  debug?: boolean;
  headers?: Record<string, string>;
  timeout?: number;
  middlewares?: Middleware<any, any>[];
  /**
   * @deprecated Use `middlewares` instead.
   */
  middleware?: Middleware<any, any>[];
};

export function createBackgroundRemovalProvider(
  modelKey: string,
  config: BackgroundRemovalProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<BackgroundRemovalProvider> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    // Configure fal client
    fal.config({
      proxyUrl: config.proxyUrl,
      requestMiddleware: config.headers
        ? async (request) => {
            return {
              ...request,
              headers: {
                ...request.headers,
                ...config.headers
              }
            };
          }
        : undefined
    });

    const provider: BackgroundRemovalProvider = {
      type: 'custom',
      processImageFileURI: async (imageFileURI: string): Promise<string> => {
        try {
          if (config.debug) {
            // eslint-disable-next-line no-console
            console.log('Processing background removal with:', {
              imageFileURI,
              modelKey
            });
          }

          // Upload image if needed (for blob: or buffer: URLs)
          const processedImageUrl = await uploadImageInputToFalIfNeeded(
            imageFileURI,
            cesdk
          );

          const input = {
            image_url: processedImageUrl || imageFileURI,
            sync_mode: true
          };

          const controller = new AbortController();
          const timeoutId = config.timeout
            ? setTimeout(() => controller.abort(), config.timeout)
            : undefined;

          try {
            const response = await fal.subscribe(modelKey, {
              input,
              logs: config.debug,
              abortSignal: controller.signal
            });

            if (timeoutId) clearTimeout(timeoutId);

            if (config.debug) {
              // eslint-disable-next-line no-console
              console.log('Background removal response:', response);
            }

            const resultUrl = response.data?.image?.url;
            if (!resultUrl) {
              throw new Error('No processed image URL in response');
            }

            return resultUrl;
          } finally {
            if (timeoutId) clearTimeout(timeoutId);
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Background removal error:', error);
          throw error;
        }
      },

      processSourceSet: async (sourceSet) => {
        if (sourceSet.length === 0) {
          throw new Error('No sources provided');
        }

        // Process the highest resolution source (first in the sorted array)
        const highestResSource = sourceSet[0];
        const processedUrl = await (provider as any).processImageFileURI(
          highestResSource.uri
        );

        // Return a new source set with the processed image
        return [
          {
            uri: processedUrl,
            width: highestResSource.width,
            height: highestResSource.height
          }
        ];
      }
    };

    return provider;
  };
}

export default createBackgroundRemovalProvider;
