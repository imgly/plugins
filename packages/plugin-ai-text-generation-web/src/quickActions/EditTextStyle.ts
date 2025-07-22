import {
  QuickActionDefinition,
  ProviderRegistry
} from '@imgly/plugin-ai-generation-web';
import { getImageUri } from '@imgly/plugin-utils';
import { GetQuickActionDefinition } from './types';

/**
 * Helper function to get style descriptions
 */
const getStyleDescription = (styleId: string): string => {
  const styleDescriptions: Record<string, string> = {
    '3d-chrome':
      'Create a 3D chrome effect with metallic shine, depth, and reflective surfaces',
    'neon-glow':
      'Apply bright neon colors with glowing effects and light emission',
    'fire-burning':
      'Simulate burning fire with orange/red flames and heat distortion',
    'ice-frosty':
      'Create icy/frosty appearance with blue/white colors and crystalline texture',
    'metallic-gold':
      'Apply golden metallic finish with shine and luxury appearance',
    'gradient-rainbow':
      'Use rainbow gradient colors transitioning across the text',
    'stone-textured': 'Apply stone/rock texture with rough, natural appearance',
    'wood-textured': 'Create wood grain texture with natural brown tones',
    'glass-transparent':
      'Simulate transparent glass with reflections and refraction',
    'metal-steel':
      'Apply steel metallic finish with industrial, strong appearance',
    'plastic-shiny': 'Create shiny plastic effect with smooth, glossy surface',
    'leather-textured': 'Apply leather texture with natural, worn appearance',
    'fabric-velvet': 'Simulate velvet fabric with soft, textured appearance',
    'crystal-sparkle':
      'Create crystal effect with sparkles and prismatic colors',
    'lava-molten': 'Simulate molten lava with orange/red flowing effects',
    'water-liquid': 'Create liquid water effect with blue tones and flow',
    'smoke-misty': 'Apply smoky/misty effect with gray tones and transparency',
    'electric-bolt':
      'Create electric/lightning effect with bright blue/white bolts',
    holographic: 'Apply holographic effect with rainbow iridescence and shine'
  };
  return (
    styleDescriptions[styleId] || 'Apply custom styling based on user prompt'
  );
};

/**
 * Generate prompt based on user input and selected style
 */
const generateTextStylePrompt = (
  userPrompt: string,
  selectedTextStyle: string,
  originalText: string
): string => {
  const sourceTextTagged = `<source_text>${originalText}</source_text>`;
  const styleInstruction =
    selectedTextStyle === 'custom'
      ? userPrompt
      : getStyleDescription(selectedTextStyle);
  const styleTagged = `<style_instruction>${styleInstruction}</style_instruction>`;

  return `TASK: Apply text styling while preserving layout and transparency.

STEPS:
1. LOCATE the text ${sourceTextTagged} in the source image
2. IDENTIFY the exact text layout, line breaks, and positioning
3. APPLY the style: ${styleTagged}
4. PRESERVE the original text layout and positioning exactly
5. MAINTAIN complete background transparency

REQUIREMENT: Keep background transparent, maintain exact layout.`;
};

/**
 * The action name.
 */
const ACTION_NAME = 'editTextStyle';

/**
 * The ID of the quick action.
 */
export const ID = `ly.img.${ACTION_NAME}`;

/**
 * The i18n prefix for the quick action.
 */
export const I18N_PREFIX = `ly.img.ai.quickAction.text.${ACTION_NAME}`;

/**
 * The input generated from this quick action which needs
 * to be mapped to the specific provider.
 */
export type InputType = {
  prompt: string;
  uri: string;
  duplicatedBlockId: number;
  textStyle?: string;
  originalText?: string;
};

const EditTextStyle: GetQuickActionDefinition<InputType> = ({ cesdk }) => {
  cesdk.i18n.setTranslations({
    en: {
      [`${I18N_PREFIX}.label`]: 'Change Text Style...',
      [`${I18N_PREFIX}.description`]: 'Transform text style with AI',
      [`${I18N_PREFIX}.prompt.label`]: 'Change Text Style...',
      [`${I18N_PREFIX}.prompt.placeholder`]:
        'e.g. "add a 3d texture with wires..."',
      [`${I18N_PREFIX}.apply`]: 'Change',
      [`${I18N_PREFIX}.provider.label`]: 'AI Provider',
      [`${I18N_PREFIX}.provider.placeholder`]: 'Select an AI provider...',
      [`${I18N_PREFIX}.textStyle.label`]: 'Text Style',
      [`${I18N_PREFIX}.textStyle.placeholder`]: 'Select a text style...',
      [`${I18N_PREFIX}.textStyle.custom`]: 'Custom Style'
    }
  });

  const quickAction: QuickActionDefinition<InputType> = {
    id: ID,
    type: 'quick',
    kind: 'text',

    scopes: ['text/edit'],

    label: `${I18N_PREFIX}.label`,
    description: `${I18N_PREFIX}.description`,
    enable: ({ engine }) => {
      const blockIds = engine.block.findAllSelected();
      if (blockIds == null || blockIds.length !== 1) return false;
      const [blockId] = blockIds;
      return engine.block.getType(blockId) === '//ly.img.ubq/text';
    },

    render: ({
      builder,
      experimental,
      isExpanded,
      toggleExpand,
      engine,
      state,
      close
    }) => {
      if (isExpanded) {
        const promptState = state(`${ID}.prompt`, '');

        // Get available image2image providers by filtering based on their capabilities
        // The reliable approach: check which providers support image-to-image operations
        const allImageProviders = ProviderRegistry.get().getByKind('image');

        // Filter for image2image providers that support the editTextStyle quick action
        const image2imageProviders = allImageProviders.filter(
          ({ provider }) => {
            const quickActionSupport =
              provider.input?.quickActions?.supported || {};
            return quickActionSupport['ly.img.editTextStyle'] != null;
          }
        );

        // Create provider options for dropdown
        const providerOptions = image2imageProviders.map(({ provider }) => ({
          id: provider.id,
          label: provider.name || provider.id
        }));

        // Show message if no image2image providers available
        if (providerOptions.length === 0) {
          builder.Text(`${ID}.noProviders`, {
            content:
              'No image editing providers available. Please configure image2image providers in the AI Image Generation plugin.'
          });
          return;
        }

        const selectedProviderState = state(
          `${ID}.provider`,
          providerOptions[0]?.id || ''
        );

        // Define text style options similar to CoolText.com
        const textStyleOptions = [
          { id: 'custom', label: `${I18N_PREFIX}.textStyle.custom` },
          { id: '3d-chrome', label: '3D Chrome' },
          { id: 'neon-glow', label: 'Neon Glow' },
          { id: 'fire-burning', label: 'Fire Burning' },
          { id: 'ice-frosty', label: 'Ice Frosty' },
          { id: 'metallic-gold', label: 'Metallic Gold' },
          { id: 'gradient-rainbow', label: 'Gradient Rainbow' },
          { id: 'stone-textured', label: 'Stone Textured' },
          { id: 'wood-textured', label: 'Wood Textured' },
          { id: 'glass-transparent', label: 'Glass Transparent' },
          { id: 'metal-steel', label: 'Metal Steel' },
          { id: 'plastic-shiny', label: 'Plastic Shiny' },
          { id: 'leather-textured', label: 'Leather Textured' },
          { id: 'fabric-velvet', label: 'Fabric Velvet' },
          { id: 'crystal-sparkle', label: 'Crystal Sparkle' },
          { id: 'lava-molten', label: 'Lava Molten' },
          { id: 'water-liquid', label: 'Water Liquid' },
          { id: 'smoke-misty', label: 'Smoke Misty' },
          { id: 'electric-bolt', label: 'Electric Bolt' },
          { id: 'holographic', label: 'Holographic' }
        ];

        const selectedTextStyleState = state(`${ID}.textStyle`, 'custom');

        builder.TextArea(`${ID}.prompt`, {
          inputLabel: `${I18N_PREFIX}.prompt.label`,
          placeholder: `${I18N_PREFIX}.prompt.placeholder`,
          ...promptState
        });

        // Text Style Selection
        builder.Separator(`${ID}.separator1`);

        const currentTextStyle =
          textStyleOptions.find((s) => s.id === selectedTextStyleState.value) ||
          textStyleOptions[0];
        builder.Select(`${ID}.textStyle`, {
          inputLabel: `${I18N_PREFIX}.textStyle.label`,
          values: textStyleOptions,
          value: currentTextStyle,
          setValue: (value) => selectedTextStyleState.setValue(value.id)
        });

        if (providerOptions.length > 1) {
          builder.Separator(`${ID}.separator2`);

          const currentProvider =
            providerOptions.find((p) => p.id === selectedProviderState.value) ||
            providerOptions[0];
          builder.Select(`${ID}.provider`, {
            inputLabel: `${I18N_PREFIX}.provider.label`,
            values: providerOptions,
            value: currentProvider,
            setValue: (value) => selectedProviderState.setValue(value.id)
          });
        }

        experimental.builder.ButtonRow(`${ID}.footer`, {
          justifyContent: 'space-between',
          children: () => {
            builder.Button(`${ID}.footer.cancel`, {
              label: 'common.back',
              icon: '@imgly/ChevronLeft',
              onClick: toggleExpand
            });

            builder.Button(`${ID}.footer.apply`, {
              label: `${I18N_PREFIX}.apply`,
              icon: '@imgly/MagicWand',
              color: 'accent',
              isDisabled:
                selectedProviderState.value.length === 0 ||
                selectedTextStyleState.value.length === 0 ||
                (selectedTextStyleState.value === 'custom' &&
                  promptState.value.length === 0),
              onClick: async () => {
                try {
                  const prompt = promptState.value;
                  const selectedProviderId = selectedProviderState.value;
                  const selectedTextStyle = selectedTextStyleState.value;

                  // Check if we have the minimum required inputs
                  if (!selectedProviderId || !selectedTextStyle) return;
                  if (selectedTextStyle === 'custom' && !prompt) return;

                  const [blockId] = engine.block.findAllSelected();
                  const parentBlockId = engine.block.getParent(blockId);
                  if (parentBlockId == null) {
                    throw new Error('Parent block not found');
                  }

                  // Extract the original text content before converting to image
                  const originalText =
                    engine.block.getString(blockId, 'text/text') || '';

                  // Export the text block as rasterized image
                  const rasterized = await engine.block.export(blockId);
                  const rasterizedUri = URL.createObjectURL(rasterized);

                  // Get block properties
                  const width = engine.block.getFrameWidth(blockId);
                  const height = engine.block.getFrameHeight(blockId);
                  const positionX = engine.block.getPositionX(blockId);
                  const positionY = engine.block.getPositionY(blockId);

                  // Create new graphic block to replace text
                  const shape = engine.block.createShape('rect');
                  const rasterizedBlock = engine.block.create('graphic');
                  engine.block.setShape(rasterizedBlock, shape);
                  engine.block.appendChild(parentBlockId, rasterizedBlock);
                  engine.block.setWidth(rasterizedBlock, width);
                  engine.block.setHeight(rasterizedBlock, height);
                  engine.block.setPositionX(rasterizedBlock, positionX);
                  engine.block.setPositionY(rasterizedBlock, positionY);

                  // Set image fill
                  const fillBlock = engine.block.createFill('image');
                  engine.block.setString(
                    fillBlock,
                    'fill/image/imageFileURI',
                    rasterizedUri
                  );
                  engine.block.setFill(rasterizedBlock, fillBlock);

                  // Remove original text block and select new one
                  engine.block.destroy(blockId);
                  engine.block.setSelected(rasterizedBlock, true);

                  // Get URI for AI processing
                  const uri = await getImageUri(rasterizedBlock, engine, {
                    throwErrorIfSvg: true
                  });

                  // Find the selected provider and use its generate function
                  const selectedProvider = image2imageProviders.find(
                    ({ provider }) => provider.id === selectedProviderId
                  );

                  if (!selectedProvider) {
                    throw new Error('Selected provider not found');
                  }

                  // Prepare input based on provider type
                  const generateInput: any = {
                    prompt: generateTextStylePrompt(
                      prompt,
                      selectedTextStyle,
                      originalText
                    ),
                    image_url: uri
                  };

                  // Use the selected provider's generate function directly
                  const result = await selectedProvider.generate(generateInput);

                  // Apply the result to the block
                  if (result.status === 'success') {
                    // Handle the result directly since it's already processed
                    const finalResult = result.output;

                    if (finalResult?.url) {
                      const newFillBlock = engine.block.createFill('image');
                      engine.block.setString(
                        newFillBlock,
                        'fill/image/imageFileURI',
                        finalResult.url
                      );
                      engine.block.setFill(rasterizedBlock, newFillBlock);
                    }
                  }

                  toggleExpand();
                  close();
                } catch (error) {
                  // eslint-disable-next-line no-console
                  console.error('Generation error:', error);
                  cesdk.ui.showNotification({
                    type: 'error',
                    message:
                      (error as Error).message ||
                      'Failed to change text style. Please try again.',
                    duration: 'medium'
                  });
                }
              }
            });
          }
        });
      } else {
        builder.Button(`${ID}.button`, {
          label: `${I18N_PREFIX}.label`,
          icon: '@imgly/MagicWand',
          labelAlignment: 'left',
          variant: 'plain',
          onClick: toggleExpand
        });
      }
    }
  };

  return quickAction;
};

/**
 * Extend TextQuickActionInputs with this action's input type.
 * This will ensure that the types are correctly recognized
 * in the TextProvider.
 */
declare module '../types' {
  interface TextQuickActionInputs {
    [ID]: InputType;
  }
}

export default EditTextStyle;
