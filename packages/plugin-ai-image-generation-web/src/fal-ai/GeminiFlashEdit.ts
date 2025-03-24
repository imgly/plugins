import { fal } from '@fal-ai/client';
import {
  getMagicMenu,
  ImageOutput,
  MagicEntry,
  MagicMenu,
  registerMagicMenu,
  type Provider
} from '@imgly/plugin-utils-ai-generation';
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
};

export function GeminiFlashEdit(config: {
  proxyUrl: string;
}): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', GeminiFlashEditInput, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    return getProvider(cesdk, config);
  };
}

function getProvider(
  cesdk: CreativeEditorSDK,
  config: ProviderConfiguration
): Provider<'image', GeminiFlashEditInput, ImageOutput> {
  const modelKey = 'fal-ai/gemini-flash-edit';

  cesdk.setTranslations({
    en: {
      'ly.img.ai.inference.changeImage': 'Change Image...'
    }
  });

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

export function createMagicEntry(cesdk: CreativeEditorSDK): MagicMenu {
  const magicMenu = getMagicMenu(cesdk, 'image');
  registerMagicMenu(cesdk, magicMenu);
  magicMenu.setMagicOrder([...magicMenu.getMagicOrder(), 'changeImage']);
  magicMenu.registerMagicEntry(
    createMagicEntryForImage({
      cesdk,
      id: 'changeImage',
      icon: '@imgly/MagicWand'
    })
  );
  return magicMenu;
}

function createMagicEntryForImage(options: {
  cesdk: CreativeEditorSDK;
  id: string;
  label?: string;
  icon: string;
  renderEditState?: MagicEntry['renderEditState'];
}) {
  const cesdk = options.cesdk;
  const entry: MagicEntry = {
    id: options.id,
    getBlockId: () => {
      const blockIds = cesdk.engine.block.findAllSelected();
      if (blockIds.length !== 1) {
        return undefined;
      }

      const [blockId] = blockIds;
      if (
        cesdk.engine.block.getType(blockId) !== '//ly.img.ubq/graphic' &&
        !cesdk.engine.block.supportsFill(blockId)
      ) {
        return undefined;
      }

      const fillBlock = cesdk.engine.block.getFill(blockId);
      if (cesdk.engine.block.getType(fillBlock) !== '//ly.img.ubq/fill/image') {
        return undefined;
      }

      return blockId;
    },
    renderEditState: async (
      { builder, state, experimental },
      { applyInference, toggleEditState }
    ) => {
      const changeTextPrompt = state(
        'ly.img.ai.inference.changeTextMode.changeText.prompt',
        ''
      );
      builder.TextArea('ly.img.ai.inference.changeText.textArea', {
        inputLabel: 'Change image...',
        placeholder: 'Describe what you want to change...',
        ...changeTextPrompt
      });
      builder.Separator('ly.img.ai.inference.changeTextMode.separator.1');
      experimental.builder.ButtonRow(
        'ly.img.ai.inference.changeTextMode.footer',
        {
          justifyContent: 'space-between',
          children: () => {
            builder.Button('ly.img.ai.inference.changeTextMode.footer.cancel', {
              label: 'common.back',
              icon: '@imgly/ChevronLeft',
              onClick: toggleEditState
            });
            builder.Button('ly.img.ai.inference.changeTextMode.footer.apply', {
              label: 'Change',
              icon: '@imgly/MagicWand',
              color: 'accent',
              onClick: async () => {
                const additionalPrompt = changeTextPrompt.value;
                applyInference(additionalPrompt);
                toggleEditState();
              }
            });
          }
        }
      );
    },
    renderMenuEntry: (context, { toggleEditState }) => {
      context.builder.Button(`${options.id}.button`, {
        icon: options.icon,
        labelAlignment: 'left',
        variant: 'plain',
        label: options.label ?? `ly.img.ai.inference.${options.id}`,
        onClick: toggleEditState
      });
    },

    applyInference: async (block, { abortSignal, payload }) => {
      const fillBlock = cesdk.engine.block.getFill(block);
      const sourceSetBefore = cesdk.engine.block.getSourceSet(
        fillBlock,
        'fill/image/sourceSet'
      );
      const [sourceBefore] = sourceSetBefore;

      const { url } = await generate(
        { prompt: payload, image_url: sourceBefore.uri },
        { abortSignal }
      );

      const sourceSetAfter = [
        {
          uri: url,
          width: sourceBefore.width,
          height: sourceBefore.height
        }
      ];
      cesdk.engine.block.setSourceSet(
        fillBlock,
        'fill/image/sourceSet',
        sourceSetAfter
      );

      const setBefore = () => {
        cesdk.engine.block.setSourceSet(
          fillBlock,
          'fill/image/sourceSet',
          sourceSetBefore
        );
      };
      const setAfter = () => {
        cesdk.engine.block.setSourceSet(
          fillBlock,
          'fill/image/sourceSet',
          sourceSetAfter
        );
      };

      return {
        onCancel: setBefore,
        onBefore: setBefore,
        onAfter: setAfter,
        onApply: setAfter
      };
    }
  };

  return entry;
}

async function generate(
  input: { prompt: string; image_url: string },
  { abortSignal }: { abortSignal?: AbortSignal }
) {
  const response = await fal.subscribe('fal-ai/gemini-flash-edit', {
    abortSignal,
    input,
    logs: true
  });

  const images = response?.data?.images;
  if (images != null && Array.isArray(images)) {
    const image = images[0];
    const url: string = image?.url;
    if (url != null)
      return {
        kind: 'image',
        url
      };
  } else {
    const image = response?.data?.image;
    if (image != null) {
      const url = image?.url;
      if (url != null)
        return {
          kind: 'image',
          url
        };
    }
  }

  // eslint-disable-next-line no-console
  console.error('Cannot extract generated image from response:', response);
  throw new Error('Cannot find generated image');
}

export default getProvider;
