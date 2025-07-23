import {
  CommonProviderConfiguration,
  type Provider
} from '@imgly/plugin-ai-generation-web';
import IdeogramV3RemixSchema from './IdeogramV3Remix.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import { getImageDimensions } from './IdeogramV3Remix.constants';
import createImageProvider from './createImageProvider';
import { isCustomImageSize, uploadImageInputToFalIfNeeded } from './utils';

type IdeogramV3RemixUIInput = {
  prompt: string;
  image_url: string;
  style?: 'auto' | 'general' | 'realistic' | 'design';
  image_size?: string | { width: number; height: number };
  rendering_speed?: 'turbo' | 'balanced' | 'quality';
  strength?: number;
};

type IdeogramV3RemixOutput = {
  kind: 'image';
  url: string;
};

interface ProviderConfiguration
  extends CommonProviderConfiguration<
    IdeogramV3RemixUIInput,
    IdeogramV3RemixOutput
  > {}

export function IdeogramV3Remix(
  config: ProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<
  Provider<'image', IdeogramV3RemixUIInput, IdeogramV3RemixOutput>
> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    return getProvider(cesdk, config);
  };
}

function getProvider(
  cesdk: CreativeEditorSDK,
  config: ProviderConfiguration
): Provider<'image', IdeogramV3RemixUIInput, IdeogramV3RemixOutput> {
  const modelKey = 'fal-ai/ideogram/v3/remix';

  return createImageProvider(
    {
      modelKey,
      name: 'Ideogram V3 Remix',
      // @ts-ignore
      schema: IdeogramV3RemixSchema,
      inputReference: '#/components/schemas/IdeogramV3RemixInput',
      cesdk,
      middleware: config.middlewares ?? [],
      headers: config.headers,
      getImageSize: (input) => {
        if (typeof input.image_size === 'string') {
          return getImageDimensions(input.image_size);
        }
        if (isCustomImageSize(input.image_size)) {
          return input.image_size;
        }
        return getImageDimensions('square_hd');
      },
      getBlockInput: async (input) => {
        // Upload image to FAL for processing
        await uploadImageInputToFalIfNeeded(input.image_url, cesdk);

        if (isCustomImageSize(input.image_size)) {
          return Promise.resolve({
            image: {
              width: input.image_size.width ?? 1024,
              height: input.image_size.height ?? 1024
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
