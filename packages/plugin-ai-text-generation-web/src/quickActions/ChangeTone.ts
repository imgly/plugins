import { QuickActionDefinition } from '@imgly/plugin-ai-generation-web';
import changeTone from '../anthropic/prompts/changeTone';
import { GetQuickActionDefinition } from './types';

/**
 * The action name.
 */
const ACTION_NAME = 'changeTone';

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
  type: string;
};

const toneOptions = [
  { id: 'professional', label: `${I18N_PREFIX}.type.professional` },
  { id: 'casual', label: `${I18N_PREFIX}.type.casual` },
  { id: 'friendly', label: `${I18N_PREFIX}.type.friendly` },
  { id: 'serious', label: `${I18N_PREFIX}.type.serious` },
  { id: 'humorous', label: `${I18N_PREFIX}.type.humorous` },
  { id: 'optimistic', label: `${I18N_PREFIX}.type.optimistic` }
];

const ChangeTone: GetQuickActionDefinition<InputType> = ({ cesdk }) => {
  cesdk.i18n.setTranslations({
    en: {
      [`${I18N_PREFIX}.label`]: 'Change Tone',
      [`${I18N_PREFIX}.type.professional`]: 'Professional',
      [`${I18N_PREFIX}.type.casual`]: 'Casual',
      [`${I18N_PREFIX}.type.friendly`]: 'Friendly',
      [`${I18N_PREFIX}.type.serious`]: 'Serious',
      [`${I18N_PREFIX}.type.humorous`]: 'Humorous',
      [`${I18N_PREFIX}.type.optimistic`]: 'Optimistic'
    }
  });

  const quickAction: QuickActionDefinition<InputType> = {
    id: ID,
    type: 'quick',
    kind: 'text',

    scopes: ['text/edit'],

    label: `${I18N_PREFIX}.label`,
    description: `${I18N_PREFIX}.label`,
    enable: ({ engine }) => {
      const blockIds = engine.block.findAllSelected();
      if (blockIds == null || blockIds.length !== 1) return false;
      const [blockId] = blockIds;
      return engine.block.getType(blockId) === '//ly.img.ubq/text';
    },

    render: ({ builder, generate, engine, close, experimental }) => {
      experimental.builder.Popover(`${ID}.popover`, {
        label: `${I18N_PREFIX}.label`,
        icon: '@imgly/Microphone',
        labelAlignment: 'left',
        variant: 'plain',
        trailingIcon: '@imgly/ChevronRight',
        placement: 'right',
        children: () => {
          builder.Section(`${ID}.popover.section`, {
            children: () => {
              experimental.builder.Menu(`${ID}.popover.menu`, {
                children: () => {
                  toneOptions.forEach((option) => {
                    builder.Button(`${ID}.popover.menu.${option.id}`, {
                      label: option.label,
                      labelAlignment: 'left',
                      variant: 'plain',
                      onClick: async () => {
                        try {
                          close();

                          const [blockId] = engine.block.findAllSelected();
                          const currentText = engine.block.getString(
                            blockId,
                            'text/text'
                          );

                          await generate({
                            prompt: changeTone(currentText, option.id),
                            type: option.id
                          });
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
 * Extend TextQuickActionInputs with this action's input type.
 * This will ensure that the types are correctly recognized
 * in the TextProvider.
 */
declare module '../types' {
  interface TextQuickActionInputs {
    [ID]: InputType;
  }
}

export default ChangeTone;
