import {
  CommonProviderConfiguration,
  type Provider
} from '@imgly/plugin-ai-generation-web';
import IdeogramV3Schema from './IdeogramV3.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import { getImageDimensions } from './IdeogramV3.constants';
import createImageProvider from './createImageProvider';
import { isCustomImageSize } from './utils';

type IdeogramV3Input = {
  prompt: string;
  style?: 'AUTO' | 'GENERAL' | 'REALISTIC' | 'DESIGN';
  image_size?: string | { width: number; height: number };
  rendering_speed?: 'TURBO' | 'BALANCED' | 'QUALITY';
};

type IdeogramV3Output = {
  kind: 'image';
  url: string;
};

interface ProviderConfiguration
  extends CommonProviderConfiguration<IdeogramV3Input, IdeogramV3Output> {}

export function IdeogramV3(
  config: ProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', IdeogramV3Input, IdeogramV3Output>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    return getProvider(cesdk, config);
  };
}

function getProvider(
  cesdk: CreativeEditorSDK,
  config: ProviderConfiguration
): Provider<'image', IdeogramV3Input, IdeogramV3Output> {
  const modelKey = 'fal-ai/ideogram/v3';

  cesdk.i18n.setTranslations({
    en: {
      [`${modelKey}.prompt`]: 'Prompt',
      [`${modelKey}.style`]: 'Style',
      [`${modelKey}.style.AUTO`]: 'Auto',
      [`${modelKey}.style.GENERAL`]: 'General',
      [`${modelKey}.style.REALISTIC`]: 'Realistic',
      [`${modelKey}.style.DESIGN`]: 'Design',
      [`${modelKey}.image_size`]: 'Format'
    }
  });

  return createImageProvider(
    {
      modelKey,
      name: 'Ideogram V3',
      // @ts-ignore
      schema: IdeogramV3Schema,
      inputReference: '#/components/schemas/IdeogramV3Input',
      middleware: config.middlewares ?? config.middleware ?? [],
      headers: config.headers,
      userFlow: 'placeholder',
      getBlockInput: (input) => {
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

export default getProvider;
