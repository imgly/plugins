import { Provider, addIconSetOnce } from '@imgly/plugin-ai-generation-web';
import { Icons } from '@imgly/plugin-utils';
import schema from './Imagen4Fast.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createImageProvider from './createImageProvider';
import {
  RunwareProviderConfiguration,
  getImageDimensionsFromAspectRatio
} from './types';

type Imagen4FastInput = {
  prompt: string;
  aspect_ratio?: string;
};

export function Imagen4Fast(config: RunwareProviderConfiguration) {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

    return createImageProvider<Imagen4FastInput>(
      {
        modelAIR: 'google:2@3',
        providerId: 'runware/google/imagen-4-fast',
        name: 'Imagen 4 Fast',
        // @ts-ignore
        schema,
        inputReference: '#/components/schemas/Imagen4FastInput',
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

export default Imagen4Fast;
