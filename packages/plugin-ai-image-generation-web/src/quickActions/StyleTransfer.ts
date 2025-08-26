import {
  enableQuickActionForImageFill,
  QuickActionDefinition
} from '@imgly/plugin-ai-generation-web';
import { getImageUri } from '@imgly/plugin-utils';

import { GetQuickActionDefinition } from './types';

/**
 * The action name.
 */
const ACTION_NAME = 'styleTransfer';

/**
 * The ID of the quick action.
 */
export const ID = `ly.img.${ACTION_NAME}`;

/**
 * The i18n prefix for the quick action.
 */
export const I18N_PREFIX = `ly.img.plugin-ai-image-generation-web.quickAction.${ACTION_NAME}`;

/**
 * The input generated from this quick action which needs
 * to be mapped to the specific provider.
 */
export type InputType = {
  style: string;
  uri: string;
};

/**
 * Get i18n label for style.
 */
function getStyleLabel(modelKey: string, styleId: string) {
  const styleLabel = [
    `${I18N_PREFIX}.${modelKey}.property.style.${styleId}`,
    `${I18N_PREFIX}.property.style.${styleId}`,
    `${I18N_PREFIX}.${modelKey}.defaults.property.style.${styleId}`,
    `${I18N_PREFIX}.defaults.property.style.${styleId}`
  ];

  return styleLabel;
}

/**
 * Available art styles for style transfer.
 */
const STYLE_OPTIONS = [
  {
    id: 'water',
    prompt: 'Convert to watercolor painting.'
  },
  {
    id: 'oil',
    prompt: 'Render in oil painting style.'
  },
  {
    id: 'charcoal',
    prompt: 'Transform into a charcoal sketch.'
  },
  {
    id: 'pencil',
    prompt: 'Apply pencil drawing effect.'
  },
  {
    id: 'pastel',
    prompt: 'Make it look like a pastel artwork.'
  },
  {
    id: 'ink',
    prompt: 'Turn into a classic ink wash painting.'
  },
  {
    id: 'stained-glass',
    prompt: 'Stylize as a stained glass window.'
  },
  {
    id: 'japanese',
    prompt: 'Repaint as a traditional Japanese woodblock print.'
  }
];

const StyleTransfer: GetQuickActionDefinition<InputType> = ({ cesdk }) => {
  cesdk.i18n.setTranslations({
    en: {
      [`${I18N_PREFIX}`]: 'Change Art Style',
      [`${I18N_PREFIX}.description`]:
        'Transform image into different art styles',

      // StyleTransfer style translations
      [`${I18N_PREFIX}.defaults.property.style.water`]: 'Watercolor Painting',
      [`${I18N_PREFIX}.defaults.property.style.oil`]: 'Oil Painting',
      [`${I18N_PREFIX}.defaults.property.style.charcoal`]: 'Charcoal Sketch',
      [`${I18N_PREFIX}.defaults.property.style.pencil`]: 'Pencil Drawing',
      [`${I18N_PREFIX}.defaults.property.style.pastel`]: 'Pastel Artwork',
      [`${I18N_PREFIX}.defaults.property.style.ink`]: 'Ink Wash',
      [`${I18N_PREFIX}.defaults.property.style.stained-glass`]:
        'Stained Glass Window',
      [`${I18N_PREFIX}.defaults.property.style.japanese`]:
        'Japanese Woodblock Print'
    }
  });

  const quickAction: QuickActionDefinition<InputType> = {
    id: ID,
    type: 'quick',
    kind: 'image',

    label: `${I18N_PREFIX}`,
    enable: enableQuickActionForImageFill(),
    scopes: ['fill/change'],

    render: ({
      builder,
      experimental,
      generate,
      engine,
      close,
      providerId
    }) => {
      experimental.builder.Popover(`${ID}.popover`, {
        label: `${I18N_PREFIX}`,
        icon: '@imgly/Appearance',
        labelAlignment: 'left',
        variant: 'plain',
        trailingIcon: '@imgly/ChevronRight',
        placement: 'right',
        children: () => {
          builder.Section(`${ID}.popover.section`, {
            children: () => {
              experimental.builder.Menu(`${ID}.popover.menu`, {
                children: () => {
                  STYLE_OPTIONS.forEach((style) => {
                    builder.Button(`${ID}.popover.menu.${style.id}`, {
                      label: getStyleLabel(providerId, style.id),
                      labelAlignment: 'left',
                      variant: 'plain',
                      onClick: async () => {
                        try {
                          const [blockId] = engine.block.findAllSelected();
                          const uri = await getImageUri(blockId, engine, {
                            throwErrorIfSvg: true
                          });

                          await generate({
                            style: style.prompt,
                            uri
                          });

                          close();
                        } catch (error) {
                          // eslint-disable-next-line no-console
                          console.error('Generation error:', error);
                          cesdk.ui.showNotification({
                            type: 'error',
                            message:
                              (error as Error).message ||
                              'Failed to apply style transfer. Please try again.',
                            duration: 'medium'
                          });
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
  return quickAction;
};

/**
 * Extend ImageQuickActionInputs with this action's input type.
 * This will ensure that the types are correctly recognized
 * in the ImageProvider.
 *
 * COPY this file to other quick action to support type safety
 */
declare module '../types' {
  interface ImageQuickActionInputs {
    [ID]: InputType;
  }
}

export default StyleTransfer;
