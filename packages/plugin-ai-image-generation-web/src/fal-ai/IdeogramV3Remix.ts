import {
  CommonProviderConfiguration,
  type Provider,
  addIconSetOnce
} from '@imgly/plugin-ai-generation-web';
import { Icons } from '@imgly/plugin-utils';
import IdeogramV3RemixSchema from './IdeogramV3Remix.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import { getImageDimensions } from './IdeogramV3Remix.constants';
import createImageProvider from './createImageProvider';
import { isCustomImageSize } from './utils';

type IdeogramV3RemixUIInput = {
  prompt: string;
  image_url: string;
  style?: 'AUTO' | 'GENERAL' | 'REALISTIC' | 'DESIGN';
  image_size?: string | { width: number; height: number };
  rendering_speed?: 'TURBO' | 'BALANCED' | 'QUALITY';
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

  // Add aspect ratio icons
  addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

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
      supportedQuickActions: {
        'ly.img.editImage': {
          mapInput: (input: any) => ({
            ...input,
            image_url: input.uri,
            style: input.style ?? 'AUTO',
            rendering_speed: input.rendering_speed ?? 'BALANCED',
            strength: input.strength ?? 0.8,
            image_size: input.image_size ?? 'square_hd'
          })
        },
        'ly.img.createVariant': {
          mapInput: (input: any) => ({
            ...input,
            image_url: input.uri,
            style: input.style ?? 'AUTO',
            rendering_speed: input.rendering_speed ?? 'BALANCED',
            strength: input.strength ?? 0.6,
            image_size: input.image_size ?? 'square_hd'
          })
        },
        'ly.img.swapBackground': {
          mapInput: (input: any) => ({
            ...input,
            image_url: input.uri,
            style: input.style ?? 'AUTO',
            rendering_speed: input.rendering_speed ?? 'BALANCED',
            strength: input.strength ?? 0.7,
            image_size: input.image_size ?? 'square_hd'
          })
        }
      },
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
