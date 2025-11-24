import { Provider, addIconSetOnce } from '@imgly/plugin-ai-generation-web';
import { Icons } from '@imgly/plugin-utils';
import schema from './Imagen4Ultra.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createImageProvider from './createImageProvider';
import {
  RunwareProviderConfiguration,
  getImageDimensionsFromAspectRatio
} from './types';

type Imagen4UltraInput = {
  prompt: string;
  aspect_ratio?: string;
};

export function Imagen4Ultra(config: RunwareProviderConfiguration) {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

    return createImageProvider<Imagen4UltraInput>(
      {
        modelAIR: 'google:2@2',
        providerId: 'runware/google/imagen-4-ultra',
        name: 'Imagen 4 Ultra',
        // @ts-ignore
        schema,
        inputReference: '#/components/schemas/Imagen4UltraInput',
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

export default Imagen4Ultra;
