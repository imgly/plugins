import {
  ImageOutput,
  Middleware,
  QuickAction,
  QuickActionBaseSelect,
  QuickActionSwapImageBackground,
  QuickActionChangeImage,
  QuickActionImageVariant,
  enableQuickActionForImageFill,
  type Provider,
  enhanceProvider
} from '@imgly/plugin-ai-generation-web';
import schema from './GeminiFlashEdit.json';
import { getImageDimensionsFromURL } from '@imgly/plugin-utils';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createImageProvider from './createImageProvider';

type GeminiFlashEditInput = {
  prompt: string;
  image_url: string;
};

type ProviderConfiguration = {
  proxyUrl: string;
  debug?: boolean;
  middleware?: Middleware<GeminiFlashEditInput, ImageOutput>[];
};

const MODEL_KEY = 'fal-ai/gemini-flash-edit';

export const GeminiFlashEdit = enhanceProvider(getProvider, {
  canvasMenu: {
    image: {
      id: 'ly.img.ai.image.canvasMenu',
      children: [
        `${MODEL_KEY}.styleTransfer`,
        `${MODEL_KEY}.artists`,
        'ly.img.separator',
        `${MODEL_KEY}.changeImage`,
        `${MODEL_KEY}.createVariant`
      ]
    }
  }
});

function getProvider(
  cesdk: CreativeEditorSDK,
  config: ProviderConfiguration
): Provider<'image', GeminiFlashEditInput, ImageOutput> {
  const quickActions = createGeminiFlashEditQuickActions(cesdk);

  return createImageProvider(
    {
      modelKey: MODEL_KEY,
      name: 'Change Image',
      // @ts-ignore
      schema,
      inputReference: '#/components/schemas/GeminiFlashEditInput',
      cesdk,
      quickActions,
      middleware: config.middleware,
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

function createGeminiFlashEditQuickActions(
  cesdk: CreativeEditorSDK
): QuickAction<GeminiFlashEditInput, ImageOutput>[] {
  cesdk.i18n.setTranslations({
    en: {
      [`ly.img.ai.quickAction.${MODEL_KEY}.styleTransfer`]: 'Change Art Style',
      [`ly.img.ai.quickAction.${MODEL_KEY}.artists`]: 'Painted By'
    }
  });

  return [
    QuickActionSwapImageBackground<GeminiFlashEditInput, ImageOutput>({
      id: `${MODEL_KEY}.swapBackground`,
      mapInput: (input) => ({ ...input, image_url: input.uri }),
      cesdk
    }),
    QuickActionChangeImage<GeminiFlashEditInput, ImageOutput>({
      id: `${MODEL_KEY}.changeImage`,
      mapInput: (input) => ({ ...input, image_url: input.uri }),
      cesdk
    }),
    QuickActionImageVariant<GeminiFlashEditInput, ImageOutput>({
      id: `${MODEL_KEY}.createVariant`,
      onApply: async ({ prompt, uri, duplicatedBlockId }, context) => {
        // Generate a variant for the duplicated block
        return context.generate(
          {
            prompt,
            image_url: uri
          },
          {
            blockIds: [duplicatedBlockId]
          }
        );
      },
      cesdk
    }),

    QuickActionBaseSelect<GeminiFlashEditInput, ImageOutput>({
      quickAction: {
        id: `${MODEL_KEY}.styleTransfer`,
        version: '1',
        enable: enableQuickActionForImageFill(),
        scopes: ['fill/change'],
        confirmation: true,
        lockDuringConfirmation: false
      },
      mapInput: (input) => ({
        prompt: input.item.prompt,
        image_url: input.uri,
        blockId: input.blockId
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
      ],
      cesdk
    }),

    QuickActionBaseSelect<GeminiFlashEditInput, ImageOutput>({
      quickAction: {
        id: `${MODEL_KEY}.artists`,
        version: '1',
        enable: enableQuickActionForImageFill(),
        scopes: ['fill/change'],
        confirmation: true,
        lockDuringConfirmation: false
      },
      mapInput: (input) => ({
        prompt: input.item.prompt,
        image_url: input.uri,
        blockId: input.blockId
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
      ],
      cesdk
    })
  ];
}

export default getProvider;
