import { type Provider, type CommonProviderConfiguration } from '@imgly/plugin-ai-generation-web';
import SeedreamV4Schema from './SeedreamV4.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import { getImageDimensions } from './SeedreamV4.constants';
import createImageProvider from './createImageProvider';
import { isCustomImageSize } from './utils';

// Define input interface based on Seedream v4 API schema
export interface SeedreamV4TextToImageInput {
  prompt: string;
  image_size?:
    | 'square_hd'
    | 'square'
    | 'portrait_4_3'
    | 'portrait_16_9'
    | 'landscape_4_3'
    | 'landscape_16_9'
    | {
        width: number;
        height: number;
      };
  num_images?: number;
  max_images?: number;
  seed?: number;
  sync_mode?: boolean;
  enable_safety_checker?: boolean;
}

type SeedreamV4Output = {
  kind: 'image';
  url: string;
};

export function SeedreamV4(
  config: CommonProviderConfiguration<SeedreamV4TextToImageInput, SeedreamV4Output>
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', SeedreamV4TextToImageInput, SeedreamV4Output>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    return getProvider(cesdk, config);
  };
}

function getProvider(
  cesdk: CreativeEditorSDK,
  config: CommonProviderConfiguration<SeedreamV4TextToImageInput, SeedreamV4Output>
): Provider<'image', SeedreamV4TextToImageInput, SeedreamV4Output> {
  const modelKey = 'fal-ai/bytedance/seedream/v4/text-to-image';

  return createImageProvider(
    {
      modelKey,
      name: 'Seedream V4',
      // @ts-ignore
      schema: SeedreamV4Schema,
      inputReference: '#/components/schemas/SeedreamV4Input',
      middleware: config.middlewares ?? config.middleware ?? [],
      headers: config.headers,
      userFlow: 'placeholder',
      getBlockInput: (input) => {
        if (isCustomImageSize(input.image_size)) {
          return Promise.resolve({
            image: {
              width: input.image_size.width ?? 2048,
              height: input.image_size.height ?? 2048
            }
          });
        }

        const imageDimension = getImageDimensions(
          (input.image_size as string) ?? 'square_hd'
        );

        return Promise.resolve({
          image: imageDimension
        });
      }
    },
    config
  );
}

export default getProvider;