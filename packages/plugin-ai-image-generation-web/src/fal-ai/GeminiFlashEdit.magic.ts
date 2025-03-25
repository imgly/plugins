import { fal } from '@fal-ai/client';
import {
  getMagicMenu,
  MagicEntry,
  MagicMenu,
  registerMagicMenu
} from '@imgly/plugin-utils-ai-generation';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import { uploadImageInputToFalIfNeeded } from './utils';

export function createMagicEntry(cesdk: CreativeEditorSDK): MagicMenu {
  cesdk.setTranslations({
    en: {
      'ly.img.ai.inference.changeImage': 'Edit Image...',
      'ly.img.ai.inference.createVideo': 'Create Video...'
    }
  });

  const magicMenu = getMagicMenu(cesdk, 'image');
  registerMagicMenu(cesdk, magicMenu);
  magicMenu.setMagicOrder([
    ...magicMenu.getMagicOrder(),
    'styleTransfer',
    'artists',
    'ly.img.separator',
    'changeImage',
    'ly.img.separator',
    'createVideo'
  ]);
  magicMenu.registerMagicEntry(
    createMagicEntryForImage({
      cesdk,
      id: 'changeImage',
      icon: '@imgly/plugin-ai-generation/image'
    })
  );
  magicMenu.registerMagicEntry(
    createMagicEntryForVideo({
      cesdk,
      id: 'createVideo',
      icon: '@imgly/plugin-ai-generation/video'
    })
  );
  magicMenu.registerMagicEntry(
    createMagicPromptList(cesdk, {
      id: 'styleTransfer',
      label: 'Change Art Style',
      icon: '@imgly/Appearance',

      // prettier-ignore
      prompts: [
        { id: 'water', label: 'Watercolor Painting', prompt: 'Convert to watercolor painting.' },
        { id: 'oil', label: 'Oil Painting', prompt: 'Render in oil painting style.' },
        { id: 'charcoal', label: 'Charcoal Sketch', prompt: 'Transform into a charcoal sketch.' },
        { id: 'pencil', label: 'Pencil Drawing', prompt: 'Apply pencil drawing effect.' },
        { id: 'pastel', label: 'Pastel Artwork', prompt: 'Make it look like a pastel artwork.' },
        { id: 'ink', label: 'Ink Wash', prompt: 'Turn into a classic ink wash painting.' },
        { id: 'stained-glass', label: 'Stained Glass Window', prompt: 'Stylize as a stained glass window.' },
        { id: 'japanse', label: 'Japanese Woodblock Print', prompt: 'Repaint as a traditional Japanese woodblock print.' }
      ]
    })
  );
  magicMenu.registerMagicEntry(
    createMagicPromptList(cesdk, {
      id: 'artists',
      label: 'Painted By',
      icon: '@imgly/MixingPlate',

      // prettier-ignore
      prompts: [
  {
    "id": "van-gogh",
    "label": "Van Gogh",
    "prompt": "Render this image in the style of Vincent van Gogh, using expressive brushstrokes and swirling motion."
  },
  {
    "id": "monet",
    "label": "Monet",
    "prompt": "Transform this image into the soft, impressionistic style of Claude Monet with natural light and delicate color blending."
  },
  {
    "id": "picasso",
    "label": "Picasso",
    "prompt": "Apply a Pablo Picasso cubist style with abstract geometry and fragmented shapes."
  },
  {
    "id": "dali",
    "label": "Dalí",
    "prompt": "Make this image resemble Salvador Dalí's surrealist style, with dreamlike distortion and soft shadows."
  },
  {
    "id": "matisse",
    "label": "Matisse",
    "prompt": "Stylize the image using Henri Matisse’s bold colors and simplified, flowing shapes."
  },
  {
    "id": "warhol",
    "label": "Warhol",
    "prompt": "Convert this image into Andy Warhol’s pop art style with flat colors, repetition, and bold outlines."
  },
  {
    "id": "michelangelo",
    "label": "Michelangelo",
    "prompt": "Render the image in the classical Renaissance style of Michelangelo, with dramatic anatomy and fresco-like detail."
  },
  {
    "id": "da-vinci",
    "label": "Da Vinci",
    "prompt": "Make this image look like a Leonardo da Vinci painting, using soft transitions, balanced composition, and natural tones."
  },
  {
    "id": "rembrandt",
    "label": "Rembrandt",
    "prompt": "Apply Rembrandt’s style with rich contrast, warm tones, and dramatic use of light and shadow."
  },
  {
    "id": "mon-drain",
    "label": "Mondrian",
    "prompt": "Transform the image into Piet Mondrian’s abstract geometric style with grids and primary colors."
  },
  {
    "id": "khalo",
    "label": "Frida Kahlo",
    "prompt": "Stylize this image in the expressive, symbolic style of Frida Kahlo with vivid colors and surreal framing."
  },
  {
    "id": "hokusai",
    "label": "Hokusai",
    "prompt": "Render the image in the style of Hokusai, using bold outlines, flat color, and traditional Japanese woodblock aesthetics."
  }
      ]
    })
  );
  return magicMenu;
}

interface MagicPrompt {
  id: string;
  prompt: string;
  label?: string;
  icon?: string;
}

function createMagicPromptList(
  cesdk: CreativeEditorSDK,
  options: { id: string; label: string; icon: string; prompts: MagicPrompt[] }
) {
  const entry: MagicEntry = {
    id: options.id,
    getBlockId: () => getImageBlockId(cesdk),
    renderMenuEntry: (context, { applyInference }) => {
      context.experimental.builder.Popover(`${options.id}.parameter.popover`, {
        icon: options.icon,
        labelAlignment: 'left',
        variant: 'plain',
        label: options.label ?? `ly.img.ai.inference.${options.id}`,
        trailingIcon: '@imgly/ChevronRight',
        placement: 'right',
        children: () => {
          context.builder.Section(`${options.id}.parameter.popover.section`, {
            children: () => {
              context.experimental.builder.Menu(
                `${options.id}.parameter.popover.menu`,
                {
                  children: () => {
                    options.prompts?.forEach(({ id, label, icon, prompt }) => {
                      context.builder.Button(
                        `${options.id}.parameter.popover.menu.${id}`,
                        {
                          label:
                            label ??
                            prompt ??
                            `ly.img.ai.inference.${options.id}.type.${id}`,
                          icon,
                          labelAlignment: 'left',
                          variant: 'plain',
                          onClick: async () => {
                            applyInference(prompt);
                          }
                        }
                      );
                    });
                  }
                }
              );
            }
          });
        }
      });
    },

    applyInference: applyInferenceOnSourceSet.bind(null, cesdk)
  };

  return entry;
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
    getBlockId: () => getImageBlockId(cesdk),
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

    applyInference: applyInferenceOnSourceSet.bind(null, cesdk)
  };

  return entry;
}

function createMagicEntryForVideo(options: {
  cesdk: CreativeEditorSDK;
  id: string;
  label?: string;
  icon: string;
}) {
  const cesdk = options.cesdk;
  const entry: MagicEntry = {
    id: options.id,
    getBlockId: () => getImageBlockId(cesdk),
    renderMenuEntry: (context, { blockId, closeMenu }) => {
      context.builder.Button(`${options.id}.button`, {
        icon: options.icon,
        labelAlignment: 'left',
        variant: 'plain',
        label: options.label ?? `ly.img.ai.inference.${options.id}`,
        onClick: async () => {
          const fillBlock = cesdk.engine.block.getFill(blockId);
          const sourceSet = cesdk.engine.block.getSourceSet(
            fillBlock,
            'fill/image/sourceSet'
          );
          const [source] = sourceSet;
          if (source == null) {
            return;
          }

          const mimeType = await cesdk.engine.editor.getMimeType(source.uri);
          if (mimeType === 'image/svg+xml') {
            cesdk.ui.showNotification({
              type: 'warning',
              message:
                'SVG images are not supported. Please choose a different image.'
            });
            return;
          }

          cesdk.ui.openPanel('ly.img.ai/video-generation');
          cesdk.ui.experimental.setGlobalStateValue(
            'ly.img.ai.video-generation.fromType',
            'fromImage'
          );
          cesdk.ui.experimental.setGlobalStateValue(
            'fal-ai/minimax/video-01-live/image-to-video.image_url',
            source.uri
          );

          closeMenu();
        }
      });
    }
  };

  return entry;
}

async function applyInferenceOnSourceSet(
  cesdk: CreativeEditorSDK,
  block: number,
  { abortSignal, payload }: { abortSignal: AbortSignal; payload?: string }
) {
  if (payload == null) {
    throw new Error('Missing payload');
  }
  const fillBlock = cesdk.engine.block.getFill(block);
  const sourceSetBefore = cesdk.engine.block.getSourceSet(
    fillBlock,
    'fill/image/sourceSet'
  );
  const [sourceBefore] = sourceSetBefore;

  const mimeType = await cesdk.engine.editor.getMimeType(sourceBefore.uri);
  if (mimeType === 'image/svg+xml') {
    throw new Error('SVG images are not supported');
  }

  const cropScaleX = cesdk.engine.block.getCropScaleX(block);
  const cropScaleY = cesdk.engine.block.getCropScaleY(block);
  const cropTranslationX = cesdk.engine.block.getCropTranslationX(block);
  const cropTranslationY = cesdk.engine.block.getCropTranslationY(block);
  const cropRotation = cesdk.engine.block.getCropRotation(block);

  const wasAlwaysOnTop = cesdk.engine.block.isAlwaysOnTop(block);
  cesdk.engine.block.setAlwaysOnTop(block, true);

  const applyCrop = () => {
    cesdk.engine.block.setCropScaleX(block, cropScaleX);
    cesdk.engine.block.setCropScaleY(block, cropScaleY);
    cesdk.engine.block.setCropTranslationX(block, cropTranslationX);
    cesdk.engine.block.setCropTranslationY(block, cropTranslationY);
    cesdk.engine.block.setCropRotation(block, cropRotation);
  };

  const { url } = await generate(
    { prompt: payload, image_url: sourceBefore.uri },
    { abortSignal },
    cesdk
  );

  const uri = await fetchImage(cesdk, url);

  const sourceSetAfter = [
    {
      uri,
      width: sourceBefore.width,
      height: sourceBefore.height
    }
  ];
  cesdk.engine.block.setSourceSet(
    fillBlock,
    'fill/image/sourceSet',
    sourceSetAfter
  );
  applyCrop();

  const setBefore = () => {
    cesdk.engine.block.setSourceSet(
      fillBlock,
      'fill/image/sourceSet',
      sourceSetBefore
    );
    applyCrop();
  };
  const setAfter = () => {
    cesdk.engine.block.setSourceSet(
      fillBlock,
      'fill/image/sourceSet',
      sourceSetAfter
    );
    applyCrop();
  };
  const setCancel = () => {
    setBefore();
    cesdk.engine.block.setAlwaysOnTop(block, wasAlwaysOnTop);
  };
  const setApply = () => {
    setAfter();
    cesdk.engine.block.setAlwaysOnTop(block, wasAlwaysOnTop);
  };

  return {
    onCancel: setCancel,
    onBefore: setBefore,
    onAfter: setAfter,
    onApply: setApply
  };
}

async function generate(
  input: { prompt: string; image_url: string },
  { abortSignal }: { abortSignal?: AbortSignal },
  cesdk: CreativeEditorSDK
): Promise<{ kind: 'image'; url: string }> {
  const image_url = await uploadImageInputToFalIfNeeded(input.image_url, cesdk);
  if (image_url == null) throw new Error('Cannot upload image');

  if (image_url.startsWith('buffer:'))
    throw new Error('Cannot process data URLs');

  const response = await fal.subscribe('fal-ai/gemini-flash-edit', {
    abortSignal,
    input: {
      ...input,
      image_url
    },
    logs: true
  });

  const image = response?.data?.image;
  if (image != null) {
    const url = image?.url;
    if (url != null)
      return {
        kind: 'image',
        url
      };
  }

  // eslint-disable-next-line no-console
  console.error('Cannot extract generated image from response:', response);
  throw new Error('Cannot find generated image');
}

function getImageBlockId(cesdk: CreativeEditorSDK) {
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
}

async function fetchImage(
  cesdk: CreativeEditorSDK,
  url: string
): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  const file = new File([blob], 'image.png', { type: 'image/png' });
  const assetDefinition = await cesdk.unstable_upload(file, () => {});
  const uploadedUri = assetDefinition?.meta?.uri;
  if (uploadedUri != null) return uploadedUri;
  // eslint-disable-next-line no-console
  console.warn('Failed to upload image:', assetDefinition);
  return url;
}
