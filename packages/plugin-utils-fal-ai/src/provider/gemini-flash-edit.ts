import { ImageOutput, type Provider } from '@imgly/plugin-utils-ai-generation';
import { PluginConfiguration } from '../type';
import schema from './schemas/gemini-flash-edit.json';
import { getImageDimensionsFromURL } from '../utils';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createImageProvider from '../createImageProvider';

type GeminiFlashEditInput = {
  prompt: string;
  image_url: string;
};

function getProvider(
  cesdk: CreativeEditorSDK,
  config: PluginConfiguration
): Provider<'image', GeminiFlashEditInput, ImageOutput> {
  const modelKey = 'fal-ai/gemini-flash-edit';

  return createImageProvider(
    {
      modelKey,
      name: 'Change Image',
      // @ts-ignore
      schema,
      inputReference: '#/components/schemas/GeminiFlashEditInput',
      cesdk,
      getBlockInput: async (input) => {
        const { width, height } = await getImageDimensionsFromURL(
          input.image_url
        );
        return Promise.resolve({
          image: {
            width,
            height
          }
        });
      }
    },
    config
  );
}

export default getProvider;
