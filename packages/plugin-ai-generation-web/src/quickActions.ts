import { QuickActionDefinition } from './ActionRegistry';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
import { getImageUri } from '@imgly/plugin-utils';

// ===============================
// Quick Action Input Types
// ===============================

/**
 * Input for swapping/changing image background
 */
export interface SwapBackgroundInput {
  prompt: string;
  uri: string;
  blockId: number;
}

/**
 * Input for changing/replacing an image entirely
 */
export interface ChangeImageInput {
  prompt: string;
  uri: string;
  blockId: number;
}

/**
 * Input for creating image variants
 */
export interface ImageVariantInput {
  prompt: string;
  uri: string;
  duplicatedBlockId: number;
}

/**
 * Input for style transfer with predefined styles
 */
export interface StyleTransferInput {
  item: {
    id: string;
    label: string;
    prompt: string;
  };
  uri: string;
  blockId: number;
}

/**
 * Input for artist style application with predefined artists
 */
export interface ArtistStyleInput {
  item: {
    id: string;
    label: string;
    prompt: string;
  };
  uri: string;
  blockId: number;
}

// ===============================
// Helper Functions
// ===============================

/**
 * Enable function for a single image fill block selected.
 */
function enableImageFill() {
  return ({ engine }: { engine: any }) => {
    const blockIds = engine.block.findAllSelected();
    if (blockIds == null || blockIds.length !== 1) return false;

    const [blockId] = blockIds;

    if (!engine.block.supportsFill(blockId)) return false;

    if (
      !['//ly.img.ubq/graphic', '//ly.img.ubq/page'].includes(
        engine.block.getType(blockId)
      )
    ) {
      return false;
    }

    const fillBlock = engine.block.getFill(blockId);
    return engine.block.getType(fillBlock) === '//ly.img.ubq/fill/image';
  };
}

// ===============================
// Quick Action Definitions
// ===============================

/**
 * Swap image background quick action (based on QuickActionSwapImageBackground)
 */
export const swapBackgroundQuickAction: QuickActionDefinition<SwapBackgroundInput> =
  {
    kind: 'image',
    type: 'quick',
    id: 'swapBackground',
    label: 'Change Background...',
    description: 'Swap the background to a new description',
    enable: enableImageFill(),
    scopes: ['fill/change'],

    render: ({
      builder,
      experimental,
      isExpanded,
      toggleExpand,
      generate,
      engine,
      state,
      close
    }) => {
      if (isExpanded) {
        const promptState = state('swapBackground.prompt', '');

        builder.TextArea('swapBackground.textarea', {
          inputLabel: 'Change background...',
          placeholder: 'Describe the background you want...',
          ...promptState
        });

        builder.Separator('swapBackground.separator');

        experimental.builder.ButtonRow('swapBackground.footer', {
          justifyContent: 'space-between',
          children: () => {
            builder.Button('swapBackground.footer.cancel', {
              label: 'Back',
              icon: '@imgly/ChevronLeft',
              onClick: toggleExpand
            });

            builder.Button('swapBackground.footer.apply', {
              label: 'Change',
              icon: '@imgly/MagicWand',
              color: 'accent',
              isDisabled: promptState.value.length === 0,
              onClick: async () => {
                try {
                  const userPrompt = promptState.value;
                  if (!userPrompt) return;

                  const [blockId] = engine.block.findAllSelected();
                  const uri = await getImageUri(blockId, engine, {
                    throwErrorIfSvg: true
                  });

                  const prompt = `Swap the background to ${userPrompt}`;

                  await generate({
                    prompt,
                    uri,
                    blockId
                  });

                  toggleExpand();
                  close();
                } catch (error) {
                  console.error('Generation error:', error);
                }
              }
            });
          }
        });
      } else {
        builder.Button('swapBackground.button', {
          label: 'Change Background...',
          icon: '@imgly/Sparkle',
          labelAlignment: 'left',
          variant: 'plain',
          onClick: toggleExpand
        });
      }
    }
  };

/**
 * Change image quick action (based on QuickActionChangeImage)
 */
export const changeImageQuickAction: QuickActionDefinition<ChangeImageInput> = {
  kind: 'image',
  type: 'quick',
  id: 'changeImage',
  label: 'Edit Image...',
  description: 'Change image based on description',
  enable: enableImageFill(),
  scopes: ['fill/change'],

  render: ({
    builder,
    experimental,
    isExpanded,
    toggleExpand,
    generate,
    engine,
    state,
    close
  }) => {
    if (isExpanded) {
      const promptState = state('changeImage.prompt', '');

      builder.TextArea('changeImage.textarea', {
        inputLabel: 'Change image...',
        placeholder: 'Describe what you want to change...',
        ...promptState
      });

      builder.Separator('changeImage.separator');

      experimental.builder.ButtonRow('changeImage.footer', {
        justifyContent: 'space-between',
        children: () => {
          builder.Button('changeImage.footer.cancel', {
            label: 'Back',
            icon: '@imgly/ChevronLeft',
            onClick: toggleExpand
          });

          builder.Button('changeImage.footer.apply', {
            label: 'Change',
            icon: '@imgly/MagicWand',
            color: 'accent',
            isDisabled: promptState.value.length === 0,
            onClick: async () => {
              try {
                const prompt = promptState.value;
                if (!prompt) return;

                const [blockId] = engine.block.findAllSelected();
                const uri = await getImageUri(blockId, engine, {
                  throwErrorIfSvg: true
                });

                await generate({
                  prompt,
                  uri,
                  blockId
                });

                toggleExpand();
                close();
              } catch (error) {
                console.error('Generation error:', error);
              }
            }
          });
        }
      });
    } else {
      builder.Button('changeImage.button', {
        label: 'Edit Image...',
        icon: '@imgly/Sparkle',
        labelAlignment: 'left',
        variant: 'plain',
        onClick: toggleExpand
      });
    }
  }
};

/**
 * Create image variant quick action (based on QuickActionImageVariant)
 */
function createImageVariantQuickAction(
  cesdk: CreativeEditorSDK
): QuickActionDefinition<ImageVariantInput> {
  return {
    kind: 'image',
    type: 'quick',
    id: 'createVariant',
    label: 'Create Variant...',
    description: 'Generate a variant of the selected image',
    enable: (context) => {
      if (!enableImageFill()(context)) return false;

      const [blockId] = context.engine.block.findAllSelected();
      if (
        !cesdk.feature.isEnabled('ly.img.duplicate', {
          engine: context.engine
        })
      ) {
        return false;
      }
      if (
        !context.engine.block.isAllowedByScope(blockId, 'lifecycle/duplicate')
      ) {
        return false;
      }

      return true;
    },
    scopes: ['lifecycle/duplicate', 'fill/change'],

    render: ({
      builder,
      experimental,
      isExpanded,
      toggleExpand,
      generate,
      engine,
      state,
      close
    }) => {
      if (isExpanded) {
        const promptState = state('createVariant.prompt', '');

        builder.TextArea('createVariant.textarea', {
          inputLabel: 'Describe Your Variant...',
          placeholder: 'e.g., same character with arms raised',
          ...promptState
        });

        builder.Separator('createVariant.separator');

        experimental.builder.ButtonRow('createVariant.footer', {
          justifyContent: 'space-between',
          children: () => {
            builder.Button('createVariant.footer.cancel', {
              label: 'Back',
              icon: '@imgly/ChevronLeft',
              onClick: toggleExpand
            });

            builder.Button('createVariant.footer.apply', {
              label: 'Create',
              icon: '@imgly/MagicWand',
              color: 'accent',
              isDisabled: promptState.value.length === 0,
              onClick: async () => {
                try {
                  const prompt = promptState.value;
                  if (!prompt) return;

                  const [blockId] = engine.block.findAllSelected();
                  const type = engine.block.getType(blockId);

                  // Duplicate the selected block
                  const duplicated = engine.block.duplicate(blockId);
                  if (type === '//ly.img.ubq/page') {
                    engine.block
                      .getChildren(duplicated)
                      .forEach((childId: number) => {
                        engine.block.destroy(childId);
                      });
                  }
                  engine.block.setSelected(blockId, false);
                  engine.block.setSelected(duplicated, true);

                  const parent = engine.block.getParent(duplicated);
                  if (parent == null) throw new Error('Parent not found');

                  const isBackgroundClip =
                    parent != null &&
                    engine.block.getType(parent) === '//ly.img.ubq/track' &&
                    engine.block.isPageDurationSource(parent);

                  // Offset the duplicated block unless it is a background track
                  if (!isBackgroundClip && type !== '//ly.img.ubq/page') {
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
                  }

                  // Get the source of the duplicated block
                  const uri = await getImageUri(duplicated, cesdk.engine, {
                    throwErrorIfSvg: true
                  });

                  await generate({
                    prompt,
                    uri,
                    duplicatedBlockId: duplicated
                  });

                  toggleExpand();
                  close();
                } catch (error) {
                  console.error('Generation error:', error);
                }
              }
            });
          }
        });
      } else {
        builder.Button('createVariant.button', {
          label: 'Create Variant...',
          icon: '@imgly/ImageVariation',
          labelAlignment: 'left',
          variant: 'plain',
          onClick: toggleExpand
        });
      }
    }
  };
}

/**
 * Style transfer quick action (based on QuickActionBaseSelect)
 */
export const styleTransferQuickAction: QuickActionDefinition<StyleTransferInput> =
  {
    kind: 'image',
    type: 'quick',
    id: 'styleTransfer',
    label: 'Change Art Style',
    description: 'Apply different artistic styles to the image',
    enable: enableImageFill(),
    scopes: ['fill/change'],

    render: ({ builder, experimental, generate, engine, close }) => {
      const styles = [
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
          id: 'japanese',
          label: 'Japanese Woodblock Print',
          prompt: 'Repaint as a traditional Japanese woodblock print.'
        }
      ];

      experimental.builder.Popover('styleTransfer.popover', {
        label: 'Change Art Style',
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
                  styles.forEach((style) => {
                    builder.Button(`styleTransfer.popover.menu.${style.id}`, {
                      label: style.label,
                      labelAlignment: 'left',
                      variant: 'plain',
                      onClick: async () => {
                        try {
                          close();
                          const [blockId] = engine.block.findAllSelected();
                          const uri = await getImageUri(blockId, engine, {
                            throwErrorIfSvg: true
                          });

                          await generate({
                            item: style,
                            uri,
                            blockId
                          });
                        } catch (error) {
                          console.error('Generation error:', error);
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

/**
 * Artist style quick action (based on QuickActionBaseSelect)
 */
export const artistStyleQuickAction: QuickActionDefinition<ArtistStyleInput> = {
  kind: 'image',
  type: 'quick',
  id: 'artists',
  label: 'Painted By',
  description: 'Apply famous artist styles to the image',
  enable: enableImageFill(),
  scopes: ['fill/change'],

  render: ({ builder, experimental, generate, engine, close }) => {
    const artists = [
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
        id: 'mondrian',
        label: 'Mondrian',
        prompt:
          "Transform the image into Piet Mondrian's abstract geometric style with grids and primary colors."
      },
      {
        id: 'kahlo',
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

    experimental.builder.Popover('artists.popover', {
      label: 'Painted By',
      icon: '@imgly/Appearance',
      labelAlignment: 'left',
      variant: 'plain',
      trailingIcon: '@imgly/ChevronRight',
      placement: 'right',
      children: () => {
        builder.Section('artists.popover.section', {
          children: () => {
            experimental.builder.Menu('artists.popover.menu', {
              children: () => {
                artists.forEach((artist) => {
                  builder.Button(`artists.popover.menu.${artist.id}`, {
                    label: artist.label,
                    labelAlignment: 'left',
                    variant: 'plain',
                    onClick: async () => {
                      try {
                        close();
                        const [blockId] = engine.block.findAllSelected();
                        const uri = await getImageUri(blockId, engine, {
                          throwErrorIfSvg: true
                        });

                        await generate({
                          item: artist,
                          uri,
                          blockId
                        });
                      } catch (error) {
                        console.error('Generation error:', error);
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

// ===============================
// Export Functions
// ===============================

function quickActions(cesdk: CreativeEditorSDK): QuickActionDefinition[] {
  return [
    swapBackgroundQuickAction,
    changeImageQuickAction,
    createImageVariantQuickAction(cesdk),
    styleTransferQuickAction,
    artistStyleQuickAction
  ];
}

export default quickActions;
