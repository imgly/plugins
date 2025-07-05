import {
  enableQuickActionForImageFill,
  QuickActionDefinition
} from '@imgly/plugin-ai-generation-web';
import { getImageUri } from '@imgly/plugin-utils';

import { GetQuickActionDefinition } from './types';

/**
 * The ID of the quick action.
 */
export const ID = 'ly.img.styleTransfer';

/**
 * The i18n prefix for the quick action.
 */
export const I18N_PREFIX = `ly.img.ai.quickAction.${ID}`;

/**
 * The input generated from this quick action which needs
 * to be mapped to the specific provider.
 */
export type InputType = {
  style: string;
  uri: string;
};

/**
 * Available art styles for style transfer.
 */
const STYLE_OPTIONS = [
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

const StyleTransfer: GetQuickActionDefinition<InputType> = ({ cesdk }) => {
  cesdk.i18n.setTranslations({
    en: {
      [`${I18N_PREFIX}.label`]: 'Change Art Style',
      [`${I18N_PREFIX}.description`]:
        'Transform image into different art styles'
    }
  });

  const quickAction: QuickActionDefinition<InputType> = {
    id: ID,
    type: 'quick',
    kind: 'image',

    label: `${I18N_PREFIX}.label`,
    description: `${I18N_PREFIX}.description`,
    enable: enableQuickActionForImageFill(),
    scopes: ['fill/change'],

    render: ({ builder, experimental, generate, engine, close }) => {
      experimental.builder.Popover(`${ID}.popover`, {
        label: `${I18N_PREFIX}.label`,
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
                      label: style.label,
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
