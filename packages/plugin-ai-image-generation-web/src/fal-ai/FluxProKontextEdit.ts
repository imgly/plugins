import {
  ImageOutput,
  type Provider,
  type CommonProviderConfiguration,
  getPanelId
} from '@imgly/plugin-ai-generation-web';
import schema from './FluxProKontextEdit.json';
import { getImageDimensionsFromURL } from '@imgly/plugin-utils';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createImageProvider from './createImageProvider';

type FluxProKontextEditInput = {
  prompt: string;
  image_url: string;
};

export function FluxProKontextEdit(
  config: CommonProviderConfiguration<FluxProKontextEditInput, ImageOutput>
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', FluxProKontextEditInput, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const modelKey = 'fal-ai/flux-pro/kontext';

    // Set translations
    cesdk.i18n.setTranslations({
      en: {
        'ly.img.ai.quickAction.styleTransfer': 'Change Art Style',
        'ly.img.ai.quickAction.artists': 'Painted By',
        [`panel.${getPanelId(modelKey)}.imageSelection`]:
          'Select Image To Change',
        [`panel.${modelKey}.imageSelection`]: 'Select Image To Change',
        [`libraries.${getPanelId(modelKey)}.history.label`]:
          'Generated From Image'
      }
    });

    return getProvider(cesdk, config);
  };
}

function getProvider(
  cesdk: CreativeEditorSDK,
  config: CommonProviderConfiguration<FluxProKontextEditInput, ImageOutput>
): Provider<'image', FluxProKontextEditInput, ImageOutput> {
  const modelKey = 'fal-ai/flux-pro/kontext';

  return createImageProvider(
    {
      modelKey,
      name: 'Flux Pro Kontext',
      // @ts-ignore
      schema,
      inputReference: '#/components/schemas/FluxProKontextEditInput',
      cesdk,
      middlewares: config.middlewares,
      headers: config.headers,
      supportedQuickActions: {
        'ly.img.swapBackground': {
          mapInput: (input: any) => ({ ...input, image_url: input.uri })
        },
        'ly.img.editImage': {
          mapInput: (input: any) => ({ ...input, image_url: input.uri })
        },
        'ly.img.createVariant': {
          mapInput: (input: any) => ({ ...input, image_url: input.uri })
        },
        'ly.img.styleTransfer': {
          mapInput: (input: any) => ({
            prompt: input.style || input.item?.prompt,
            image_url: input.uri
          }),
          items: [
            {
              id: 'water',
              label: 'Watercolor Painting',
              prompt: 'Convert to watercolor painting.'
            },
            {
              id: 'oil',
              label: 'Oil Painting',
              prompt: 'Render in oil painting style.'
            },
            {
              id: 'charcoal',
              label: 'Charcoal Sketch',
              prompt: 'Transform into a charcoal sketch.'
            },
            {
              id: 'pencil',
              label: 'Pencil Drawing',
              prompt: 'Apply pencil drawing effect.'
            },
            {
              id: 'pastel',
              label: 'Pastel Artwork',
              prompt: 'Make it look like a pastel artwork.'
            },
            {
              id: 'ink',
              label: 'Ink Wash',
              prompt: 'Turn into a classic ink wash painting.'
            },
            {
              id: 'stained-glass',
              label: 'Stained Glass Window',
              prompt: 'Stylize as a stained glass window.'
            },
            {
              id: 'japanse',
              label: 'Japanese Woodblock Print',
              prompt: 'Repaint as a traditional Japanese woodblock print.'
            }
          ]
        },
        'ly.img.artistTransfer': {
          mapInput: (input: any) => ({
            prompt: input.artist || input.item?.prompt,
            image_url: input.uri
          }),
          items: [
            {
              id: 'van-gogh',
              label: 'Van Gogh',
              prompt:
                'Render this image in the style of Vincent van Gogh, using expressive brushstrokes and swirling motion.'
            },
            {
              id: 'monet',
              label: 'Monet',
              prompt:
                'Transform this image into the soft, impressionistic style of Claude Monet with natural light and delicate color blending.'
            },
            {
              id: 'picasso',
              label: 'Picasso',
              prompt:
                'Apply a Pablo Picasso cubist style with abstract geometry and fragmented shapes.'
            },
            {
              id: 'dali',
              label: 'Dalí',
              prompt:
                "Make this image resemble Salvador Dalí's surrealist style, with dreamlike distortion and soft shadows."
            },
            {
              id: 'matisse',
              label: 'Matisse',
              prompt:
                "Stylize the image using Henri Matisse's bold colors and simplified, flowing shapes."
            },
            {
              id: 'warhol',
              label: 'Warhol',
              prompt:
                "Convert this image into Andy Warhol's pop art style with flat colors, repetition, and bold outlines."
            },
            {
              id: 'michelangelo',
              label: 'Michelangelo',
              prompt:
                'Render the image in the classical Renaissance style of Michelangelo, with dramatic anatomy and fresco-like detail.'
            },
            {
              id: 'da-vinci',
              label: 'Da Vinci',
              prompt:
                'Make this image look like a Leonardo da Vinci painting, using soft transitions, balanced composition, and natural tones.'
            },
            {
              id: 'rembrandt',
              label: 'Rembrandt',
              prompt:
                "Apply Rembrandt's style with rich contrast, warm tones, and dramatic use of light and shadow."
            },
            {
              id: 'mon-drain',
              label: 'Mondrian',
              prompt:
                "Transform the image into Piet Mondrian's abstract geometric style with grids and primary colors."
            },
            {
              id: 'khalo',
              label: 'Frida Kahlo',
              prompt:
                'Stylize this image in the expressive, symbolic style of Frida Kahlo with vivid colors and surreal framing.'
            },
            {
              id: 'hokusai',
              label: 'Hokusai',
              prompt:
                'Render the image in the style of Hokusai, using bold outlines, flat color, and traditional Japanese woodblock aesthetics.'
            }
          ]
        }
      },
      getBlockInput: async (input) => {
        const { width, height } = await getImageDimensionsFromURL(
          input.image_url,
          cesdk.engine
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
