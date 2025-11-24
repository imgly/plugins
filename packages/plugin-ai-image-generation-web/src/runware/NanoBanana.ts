import { Provider, addIconSetOnce } from '@imgly/plugin-ai-generation-web';
import { Icons } from '@imgly/plugin-utils';
import schema from './NanoBanana.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createImageProvider from './createImageProvider';
import {
  RunwareProviderConfiguration,
  getImageDimensionsFromAspectRatio
} from './types';

type NanoBananaInput = {
  prompt: string;
  aspect_ratio?: string;
};

export function NanoBanana(config: RunwareProviderConfiguration) {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

    return createImageProvider<NanoBananaInput>(
      {
        modelAIR: 'google:4@1',
        providerId: 'runware/google/nano-banana',
        name: 'Nano Banana',
        // @ts-ignore
        schema,
        inputReference: '#/components/schemas/NanoBananaInput',
        cesdk,
        middleware: config.middlewares ?? [],
        getImageSize: (input) =>
          getImageDimensionsFromAspectRatio(input.aspect_ratio ?? '1:1'),
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

export default NanoBanana;
