import { QuickAction, Output } from '@imgly/plugin-ai-generation-web';
import CreativeEditorSDK from '@cesdk/cesdk-js';

type GeminiFlashEditInput = {
  prompt: string;
  image_url: string;
  blockId?: number;
};

type GeminiFlashEditOutput = {
  kind: 'image';
  url: string;
};

export function createGeminiFlashEditQuickActions(
  cesdk: CreativeEditorSDK
): QuickAction<GeminiFlashEditInput, GeminiFlashEditOutput>[] {
  cesdk.i18n.setTranslations({
    en: {
      'ly.img.ai.inference.change': 'Change',
      'ly.img.ai.inference.generate': 'Generate',
      'ly.img.ai.inference.create': 'Create',
      'ly.img.ai.inference.changeArtStyle': 'Change Art Style',
      'ly.img.ai.inference.paintedBy': 'Painted By',
      'ly.img.ai.inference.changeImage': 'Edit Image...',
      'ly.img.ai.inference.changeImage.prompt.inputLabel': 'Change image...',
      'ly.img.ai.inference.changeImage.prompt.placeholder':
        'Describe what you want to change...',
      'ly.img.ai.inference.createVariant': 'Create Variant...',
      'ly.img.ai.inference.createVariant.prompt.inputLabel':
        'Describe Your Variant',
      'ly.img.ai.inference.createVariant.prompt.placeholder':
        'e.g., same character with arms raised',
      'ly.img.ai.inference.createVideo': 'Create Video...'
    }
  });

  return [
    ChangeImageQuickAction(cesdk),
    CreateVariantQuickAction(cesdk),
    CreateVideoQuickAction(cesdk),
    StyleTransferQuickAction(cesdk),
    ArtistStyleQuickAction(cesdk)
  ];
}

// Common enable function for image-based quick actions
function getImageEnableFunction() {
  return ({ engine }: { engine: any }) => {
    const blockIds = engine.block.findAllSelected();
    if (blockIds == null || blockIds.length !== 1) return false;

    const [blockId] = blockIds;
    if (
      engine.block.getType(blockId) !== '//ly.img.ubq/graphic' &&
      !engine.block.supportsFill(blockId)
    ) {
      return false;
    }

    const fillBlock = engine.block.getFill(blockId);
    return engine.block.getType(fillBlock) === '//ly.img.ubq/fill/image';
  };
}

// Helper to create base configuration for all quick actions
function createBaseQuickAction<I, O extends Output>(
  id: string
): Pick<
  QuickAction<I, O>,
  'id' | 'version' | 'confirmation' | 'lockDuringConfirmation' | 'enable'
> {
  return {
    id,
    version: '1',
    confirmation: true,
    lockDuringConfirmation: false,
    enable: getImageEnableFunction()
  };
}

// Helper to get image source from a block
async function getImageSource(blockId: number, cesdk: CreativeEditorSDK) {
  const fillBlock = cesdk.engine.block.getFill(blockId);
  const sourceSet = cesdk.engine.block.getSourceSet(
    fillBlock,
    'fill/image/sourceSet'
  );
  const [source] = sourceSet;
  if (source == null) {
    throw new Error('No image source found');
  }

  // Check if the image is SVG (not supported)
  const mimeType = await cesdk.engine.editor.getMimeType(source.uri);
  if (mimeType === 'image/svg+xml') {
    throw new Error('SVG images are not supported');
  }

  return source;
}

// Change Image Quick Action (with text input)
function ChangeImageQuickAction(
  cesdk: CreativeEditorSDK
): QuickAction<GeminiFlashEditInput, GeminiFlashEditOutput> {
  const baseConfig = createBaseQuickAction('changeImage');

  return {
    ...baseConfig,
    render: ({ builder }, { toggleExpand }) => {
      builder.Button(`changeImage.button`, {
        label: 'ly.img.ai.inference.changeImage',
        icon: '@imgly/plugin-ai-generation/image',
        labelAlignment: 'left',
        variant: 'plain',
        onClick: toggleExpand
      });
    },
    renderExpanded: (
      { builder, state, experimental },
      { generate, toggleExpand, handleGenerationError }
    ) => {
      const promptState = state('changeImage.prompt', '');

      builder.TextArea('changeImage.textarea', {
        inputLabel: 'ly.img.ai.inference.changeImage.prompt.inputLabel',
        placeholder: 'ly.img.ai.inference.changeImage.prompt.placeholder',
        ...promptState
      });

      builder.Separator('changeImage.separator');

      experimental.builder.ButtonRow('changeImage.footer', {
        justifyContent: 'space-between',
        children: () => {
          builder.Button('changeImage.footer.cancel', {
            label: 'common.back',
            icon: '@imgly/ChevronLeft',
            onClick: toggleExpand
          });

          builder.Button('changeImage.footer.apply', {
            label: 'ly.img.ai.inference.change',
            icon: '@imgly/MagicWand',
            color: 'accent',
            onClick: async () => {
              try {
                const prompt = promptState.value;
                if (!prompt) return;

                const [blockId] = cesdk.engine.block.findAllSelected();
                const source = await getImageSource(blockId, cesdk);

                generate({
                  prompt,
                  image_url: source.uri,
                  blockId
                });

                toggleExpand();
              } catch (error) {
                handleGenerationError(error);
              }
            }
          });
        }
      });
    }
  };
}

// Create Variant Quick Action
function CreateVariantQuickAction(
  cesdk: CreativeEditorSDK
): QuickAction<GeminiFlashEditInput, GeminiFlashEditOutput> {
  const baseConfig = createBaseQuickAction('createVariant');

  return {
    ...baseConfig,
    confirmation: false,
    enable: () => {
      if (typeof baseConfig.enable === 'boolean' && !baseConfig.enable) {
        return false;
      }
      if (
        typeof baseConfig.enable === 'function' &&
        !baseConfig.enable({ engine: cesdk.engine })
      ) {
        return false;
      }

      const [blockId] = cesdk.engine.block.findAllSelected();
      if (
        !cesdk.feature.isEnabled('ly.img.duplicate', { engine: cesdk.engine })
      ) {
        return false;
      }
      if (
        !cesdk.engine.block.isAllowedByScope(blockId, 'lifecycle/duplicate')
      ) {
        return false;
      }

      const parent = cesdk.engine.block.getParent(blockId);
      const isBackgroundClip =
        parent != null &&
        cesdk.engine.block.getType(parent) === '//ly.img.ubq/track' &&
        cesdk.engine.block.isPageDurationSource(parent);

      if (isBackgroundClip) {
        return false;
      }

      const blockType = cesdk.engine.block.getType(blockId);
      if (blockType === '//ly.img.ubq/page') return false;
      return true;
    },
    render: ({ builder }, { toggleExpand }) => {
      builder.Button(`createVariant.button`, {
        label: 'ly.img.ai.inference.createVariant',
        icon: '@imgly/ImageVariation',
        labelAlignment: 'left',
        variant: 'plain',
        onClick: toggleExpand
      });
    },
    renderExpanded: (
      { builder, state, experimental, engine },
      { generate, toggleExpand, handleGenerationError }
    ) => {
      const promptState = state('createVariant.prompt', '');

      builder.TextArea('createVariant.textarea', {
        inputLabel: 'ly.img.ai.inference.createVariant.prompt.inputLabel',
        placeholder: 'ly.img.ai.inference.createVariant.prompt.placeholder',
        ...promptState
      });

      builder.Separator('createVariant.separator');

      experimental.builder.ButtonRow('createVariant.footer', {
        justifyContent: 'space-between',
        children: () => {
          builder.Button('createVariant.footer.cancel', {
            label: 'common.back',
            icon: '@imgly/ChevronLeft',
            onClick: toggleExpand
          });

          builder.Button('createVariant.footer.apply', {
            label: 'ly.img.ai.inference.create',
            icon: '@imgly/MagicWand',
            color: 'accent',
            onClick: async () => {
              try {
                const prompt = promptState.value;
                if (!prompt) return;

                const [blockId] = engine.block.findAllSelected();

                // Duplicate the selected block
                const duplicated = engine.block.duplicate(blockId);
                engine.block.setSelected(blockId, false);
                engine.block.setSelected(duplicated, true);

                // Offset the duplicated block
                const parent = engine.block.getParent(duplicated);
                if (parent == null) throw new Error('Parent not found');

                const offsetFactor = 1.0;
                const parentWidth = engine.block.getWidth(parent);
                const parentHeight = engine.block.getHeight(parent);
                const offset =
                  0.02 * Math.min(parentWidth, parentHeight) * offsetFactor;

                engine.block.setPositionX(
                  duplicated,
                  engine.block.getPositionX(duplicated) + offset
                );
                engine.block.setPositionY(
                  duplicated,
                  engine.block.getPositionY(duplicated) + offset
                );

                // Get the source of the duplicated block
                const source = await getImageSource(duplicated, cesdk);

                // Generate a variant for the duplicated block
                generate(
                  {
                    prompt,
                    image_url: source.uri,
                    blockId: duplicated
                  },
                  {
                    blockIds: [duplicated]
                  }
                );

                toggleExpand();
              } catch (error) {
                handleGenerationError(error);
              }
            }
          });
        }
      });
    }
  };
}

// Create Video Quick Action
function CreateVideoQuickAction(
  cesdk: CreativeEditorSDK
): QuickAction<GeminiFlashEditInput, GeminiFlashEditOutput> {
  const baseConfig = createBaseQuickAction('createVideo');

  return {
    ...baseConfig,
    render: ({ builder }, { closeMenu, handleGenerationError }) => {
      builder.Button(`createVideo.button`, {
        label: 'ly.img.ai.inference.createVideo',
        icon: '@imgly/plugin-ai-generation/video',
        labelAlignment: 'left',
        variant: 'plain',
        onClick: async () => {
          try {
            const [blockId] = cesdk.engine.block.findAllSelected();
            const source = await getImageSource(blockId, cesdk);

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
          } catch (error) {
            handleGenerationError(error);
          }
        }
      });
    }
  };
}

// Style Transfer Quick Action
function StyleTransferQuickAction(
  cesdk: CreativeEditorSDK
): QuickAction<GeminiFlashEditInput, GeminiFlashEditOutput> {
  const baseConfig = createBaseQuickAction('styleTransfer');

  // Style transfer parameters
  const styleParams = [
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
  ];

  return {
    ...baseConfig,
    render: (
      { builder, experimental },
      { generate, closeMenu, handleGenerationError }
    ) => {
      experimental.builder.Popover('styleTransfer.popover', {
        label: 'ly.img.ai.inference.changeArtStyle',
        icon: '@imgly/Appearance',
        labelAlignment: 'left',
        variant: 'plain',
        trailingIcon: '@imgly/ChevronRight',
        placement: 'right',
        children: () => {
          builder.Section('styleTransfer.popover.section', {
            children: () => {
              experimental.builder.Menu('styleTransfer.popover.menu', {
                children: () => {
                  styleParams.forEach((style) => {
                    builder.Button(`styleTransfer.popover.menu.${style.id}`, {
                      label: style.label,
                      labelAlignment: 'left',
                      variant: 'plain',
                      onClick: async () => {
                        try {
                          closeMenu();
                          const [blockId] =
                            cesdk.engine.block.findAllSelected();
                          const source = await getImageSource(blockId, cesdk);

                          generate({
                            prompt: style.prompt,
                            image_url: source.uri,
                            blockId
                          });
                        } catch (error) {
                          handleGenerationError(error);
                        }
                      }
                    });
                  });
                }
              });
            }
          });
        }
      });
    }
  };
}

// Artist Style Quick Action
function ArtistStyleQuickAction(
  cesdk: CreativeEditorSDK
): QuickAction<GeminiFlashEditInput, GeminiFlashEditOutput> {
  const baseConfig = createBaseQuickAction('artists');

  // Artist style parameters
  const artistParams = [
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
  ];

  return {
    ...baseConfig,
    render: (
      { builder, experimental },
      { generate, closeMenu, handleGenerationError }
    ) => {
      experimental.builder.Popover('artists.popover', {
        label: 'ly.img.ai.inference.paintedBy',
        icon: '@imgly/MixingPlate',
        labelAlignment: 'left',
        variant: 'plain',
        trailingIcon: '@imgly/ChevronRight',
        placement: 'right',
        children: () => {
          builder.Section('artists.popover.section', {
            children: () => {
              experimental.builder.Menu('artists.popover.menu', {
                children: () => {
                  artistParams.forEach((artist) => {
                    builder.Button(`artists.popover.menu.${artist.id}`, {
                      label: artist.label,
                      labelAlignment: 'left',
                      variant: 'plain',
                      onClick: async () => {
                        try {
                          closeMenu();
                          const [blockId] =
                            cesdk.engine.block.findAllSelected();
                          const source = await getImageSource(blockId, cesdk);

                          generate({
                            prompt: artist.prompt,
                            image_url: source.uri,
                            blockId
                          });
                        } catch (error) {
                          handleGenerationError(error);
                        }
                      }
                    });
                  });
                }
              });
            }
          });
        }
      });
    }
  };
}
