import { Provider, addIconSetOnce } from '@imgly/plugin-ai-generation-web';
import { Icons } from '@imgly/plugin-utils';
import schema from './Kolors20.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createImageProvider from './createImageProvider';
import {
  RunwareProviderConfiguration,
  getImageDimensionsFromAspectRatio
} from './types';

type Kolors20Input = {
  prompt: string;
  aspect_ratio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
};

type Kolors20Output = {
  kind: 'image';
  url: string;
};

export function Kolors20(config: RunwareProviderConfiguration) {
  return async ({
    cesdk
  }: {
    cesdk: CreativeEditorSDK;
  }): Promise<Provider<'image', Kolors20Input, Kolors20Output>> => {
    addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

    return createImageProvider(
      {
        modelAIR: 'klingai:5@10',
        providerId: 'runware/klingai/kolors-20',
        name: 'Kolors 2.0',
        // @ts-ignore
        schema,
        inputReference: '#/components/schemas/Kolors20Input',
        cesdk,
        middleware: config.middlewares ?? [],
        getImageSize: (input) => {
          return getImageDimensionsFromAspectRatio(input.aspect_ratio ?? '1:1');
        },
        mapInput: (input) => {
          const dims = getImageDimensionsFromAspectRatio(
            input.aspect_ratio ?? '1:1'
          );
          return {
            positivePrompt: input.prompt,
            width: dims.width,
            height: dims.height
          };
        }
      },
      config
    );
  };
}

export default Kolors20;
