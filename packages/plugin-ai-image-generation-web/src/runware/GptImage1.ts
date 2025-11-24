import {
  type Provider,
  type ImageOutput,
  addIconSetOnce
} from '@imgly/plugin-ai-generation-web';
import { Icons } from '@imgly/plugin-utils';
import schema from './GptImage1.json';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
import createImageProvider from './createImageProvider';
import { RunwareProviderConfiguration } from './types';

type GptImage1Input = {
  prompt: string;
  size?: '1024x1024' | '1536x1024' | '1024x1536';
  background?: 'auto' | 'transparent' | 'opaque';
};

export function GptImage1(
  config: RunwareProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', GptImage1Input, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

    return createImageProvider(
      {
        modelAIR: 'openai:1@1',
        providerId: 'runware/openai/gpt-image-1',
        name: 'GPT Image 1',
        // @ts-ignore
        schema,
        inputReference: '#/components/schemas/GptImage1Input',
        cesdk,
        middleware: config.middlewares ?? [],
        getImageSize: (input) => {
          const [w, h] = (input.size ?? '1024x1024').split('x').map(Number);
          return { width: w, height: h };
        },
        mapInput: (input) => {
          const [w, h] = (input.size ?? '1024x1024').split('x').map(Number);
          return {
            positivePrompt: input.prompt,
            width: w,
            height: h
          };
        }
      },
      config
    );
  };
}

export default GptImage1;
