import { Provider, addIconSetOnce } from '@imgly/plugin-ai-generation-web';
import { Icons } from '@imgly/plugin-utils';
import schema from './Kolors21.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createImageProvider from './createImageProvider';
import {
  RunwareProviderConfiguration,
  getImageDimensionsFromAspectRatio
} from './types';

type Kolors21Input = {
  prompt: string;
  aspect_ratio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
};

type Kolors21Output = {
  kind: 'image';
  url: string;
};

export function Kolors21(config: RunwareProviderConfiguration) {
  return async ({
    cesdk
  }: {
    cesdk: CreativeEditorSDK;
  }): Promise<Provider<'image', Kolors21Input, Kolors21Output>> => {
    addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

    return createImageProvider(
      {
        modelAIR: 'klingai:4@10',
        providerId: 'runware/klingai/kolors-2.1',
        name: 'Kolors 2.1',
        // @ts-ignore
        schema,
        inputReference: '#/components/schemas/Kolors21Input',
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

export default Kolors21;
