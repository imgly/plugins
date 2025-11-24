import {
  type Provider,
  addIconSetOnce
} from '@imgly/plugin-ai-generation-web';
import { Icons } from '@imgly/plugin-utils';
import schema from './Flux11ProUltra.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createImageProvider from './createImageProvider';
import {
  RunwareProviderConfiguration,
  getImageDimensionsFromAspectRatio
} from './types';

type Flux11ProUltraInput = {
  prompt: string;
  aspect_ratio?: string;
};

type Flux11ProUltraOutput = {
  kind: 'image';
  url: string;
};

export function Flux11ProUltra(
  config: RunwareProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', Flux11ProUltraInput, Flux11ProUltraOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    // Add aspect ratio icons
    addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

    return createImageProvider(
      {
        modelAIR: 'bfl:2@2',
        providerId: 'runware/bfl/flux-1.1-pro-ultra',
        name: 'FLUX.1.1 Pro Ultra',
        // @ts-ignore
        schema,
        inputReference: '#/components/schemas/Flux11ProUltraInput',
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

export default Flux11ProUltra;
