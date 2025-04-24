import {
  QuickAction,
  Output,
  ImageOutput
} from '@imgly/plugin-ai-generation-web';
import CreativeEditorSDK from '@cesdk/cesdk-js';

type GptImage1Input = {
  prompt: string;
  image_url: string;
  blockId?: number;
};

export function createGptImage1QuickActions(
  cesdk: CreativeEditorSDK
): QuickAction<GptImage1Input, ImageOutput>[] {
  cesdk.i18n.setTranslations({
    en: {
      'ly.img.ai.inference.change': 'Change',
      'ly.img.ai.inference.generate': 'Generate',
      'ly.img.ai.inference.create': 'Create',
      'ly.img.ai.inference.changeArtStyle': 'Change Art Style',
      'ly.img.ai.inference.paintedBy': 'Painted By',
      'ly.img.ai.inference.swapBackground': 'Change Background...',
      'ly.img.ai.inference.swapBackground.prompt.inputLabel':
        'Change background...',
      'ly.img.ai.inference.swapBackground.prompt.placeholder':
        'Describe the background you want...',
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
    SwapBackgroundQuickAction(cesdk),
    ChangeImageQuickAction(cesdk),
    CreateVariantQuickAction(cesdk),
    CreateVideoQuickAction(cesdk)
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
function SwapBackgroundQuickAction(
  cesdk: CreativeEditorSDK
): QuickAction<GptImage1Input, ImageOutput> {
  const baseConfig = createBaseQuickAction('swapBackground');

  return {
    ...baseConfig,
    render: ({ builder }, { toggleExpand }) => {
      builder.Button(`swapBackground.button`, {
        label: 'ly.img.ai.inference.swapBackground',
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
      const promptState = state('swapBackground.prompt', '');

      builder.TextArea('swapBackground.textarea', {
        inputLabel: 'ly.img.ai.inference.swapBackground.prompt.inputLabel',
        placeholder: 'ly.img.ai.inference.swapBackground.prompt.placeholder',
        ...promptState
      });

      builder.Separator('swapBackground.separator');

      experimental.builder.ButtonRow('swapBackground.footer', {
        justifyContent: 'space-between',
        children: () => {
          builder.Button('swapBackground.footer.cancel', {
            label: 'common.back',
            icon: '@imgly/ChevronLeft',
            onClick: toggleExpand
          });

          builder.Button('swapBackground.footer.apply', {
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
                  prompt: `Swap the background to ${prompt}`,
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

// Change Image Quick Action (with text input)
function ChangeImageQuickAction(
  cesdk: CreativeEditorSDK
): QuickAction<GptImage1Input, ImageOutput> {
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
): QuickAction<GptImage1Input, ImageOutput> {
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
): QuickAction<GptImage1Input, ImageOutput> {
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
