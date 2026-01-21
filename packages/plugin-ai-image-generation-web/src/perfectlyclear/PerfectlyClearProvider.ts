/**
 * PerfectlyClear Provider
 * Enhancement-only provider that works through the EnhanceImage quick action
 */

import {
  ImageOutput,
  type Provider
} from '@imgly/plugin-ai-generation-web';
import CreativeEditorSDK from '@cesdk/cesdk-js';

export type PerfectlyClearInput = {
  uri: string;
};

export interface PerfectlyClearConfiguration {
  apiKey: string;
  cdnUrl: string; // CDN URL for all assets (SDK, workers, models) e.g., 'http://localhost:3005/dist'
  cacheCertificate?: boolean;
  numWorkers?: number;
}

export function PerfectlyClearProvider(
  config: PerfectlyClearConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', PerfectlyClearInput, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {

    const provider: Provider<'image', PerfectlyClearInput, ImageOutput> = {
      id: 'perfectlyclear/enhance',
      kind: 'image',
      name: 'PerfectlyClear Enhance',

      initialize: async () => {
        console.log('TODO: Initialize PerfectlyClear with config', config);
        // TODO: Initialize ImageEnhancer from PerfectlyClear SDK
      },

      input: {
        // Panel input with info message
        // This provider appears in the dropdown but only works via quick actions
        panel: {
          type: 'custom',
          render: (context) => {
            context.builder.Section('perfectlyclear.info', {
              children: () => {
                context.builder.Text('perfectlyclear.info.message', {
                  content:
                    'PerfectlyClear provides one-click AI image enhancement. ' +
                    'To use it, select an image in your canvas and click the ' +
                    '"Enhance Image" button in the quick actions menu (sparkle icon).'
                });
              }
            });

            // Return required functions for custom panel
            return {
              getInput: () => ({ input: { uri: '' } }),
              getBlockInput: async () => ({
                image: { width: 1024, height: 1024 }
              })
            };
          }
        },

        quickActions: {
          supported: {
            // ONLY support enhanceImage - not editImage or other generative actions
            'ly.img.enhanceImage': true
          }
        }
      },

      output: {
        abortable: true,
        history: '@imgly/indexedDB',

        generate: async (input, { abortSignal }) => {
          // TODO: Check if ImageEnhancer is initialized
          try {
            // Download image from URI to Blob
            const response = await fetch(input.uri, { signal: abortSignal });
            if (!response.ok) {
              throw new Error(`Failed to fetch image: ${response.statusText}`);
            }
            const imageBlob = await response.blob();

            // Check abort signal before enhancement
            if (abortSignal?.aborted) {
              throw new Error('Enhancement cancelled');
            }

            // Enhance the image (blob in, blob out)
            // TODO: Enhance with ImageEnhancer
            console.log('TODO: Enhance image blob with PerfectlyClear SDK');
            const enhancedBlob: Blob = imageBlob; 

            // Check abort signal after enhancement
            if (abortSignal?.aborted) {
              throw new Error('Enhancement cancelled');
            }

            // Create object URL for the enhanced image
            const url = URL.createObjectURL(enhancedBlob);

            return {
              kind: 'image',
              url
            };
          } catch (error) {
            if (abortSignal?.aborted) {
              throw new Error('Enhancement cancelled');
            }
            throw new Error(
              `Image enhancement failed: ${(error as Error).message}`
            );
          }
        }
      }
    };

    return provider;
  };
}

export default PerfectlyClearProvider;
