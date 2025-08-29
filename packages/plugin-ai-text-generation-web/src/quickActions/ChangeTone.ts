import { QuickActionDefinition } from '@imgly/plugin-ai-generation-web';
import changeTone from '../prompts/changeTone';
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
export const I18N_PREFIX = `ly.img.plugin-ai-text-generation-web.quickAction.${ACTION_NAME}`;
export const I18N_DEFAULT_PREFIX = `ly.img.plugin-ai-text-generation-web.defaults.quickAction.${ACTION_NAME}`;

/**
 * Get i18n label with fallback keys.
 */
function getI18nLabel(modelKey?: string, suffix?: string) {
  const basePath = `ly.img.plugin-ai-text-generation-web`;
  const actionPath = `quickAction.${ACTION_NAME}`;
  const fullPath = suffix ? `${actionPath}.${suffix}` : actionPath;

  return [
    `${basePath}.${modelKey}.${fullPath}`,
    `${basePath}.${fullPath}`,
    `${basePath}.${modelKey}.defaults.${fullPath}`,
    `${basePath}.defaults.${fullPath}`
  ];
}

/**
 * The input generated from this quick action which needs
 * to be mapped to the specific provider.
 */
export type InputType = {
  prompt: string;
  type: string;
};

const toneOptions = [
  { id: 'professional' },
  { id: 'casual' },
  { id: 'friendly' },
  { id: 'serious' },
  { id: 'humorous' },
  { id: 'optimistic' }
];

const ChangeTone: GetQuickActionDefinition<InputType> = ({ cesdk }) => {
  cesdk.i18n.setTranslations({
    en: {
      [`${I18N_DEFAULT_PREFIX}`]: 'Change Tone',
      [`${I18N_DEFAULT_PREFIX}.professional`]: 'Professional',
      [`${I18N_DEFAULT_PREFIX}.casual`]: 'Casual',
      [`${I18N_DEFAULT_PREFIX}.friendly`]: 'Friendly',
      [`${I18N_DEFAULT_PREFIX}.serious`]: 'Serious',
      [`${I18N_DEFAULT_PREFIX}.humorous`]: 'Humorous',
      [`${I18N_DEFAULT_PREFIX}.optimistic`]: 'Optimistic'
    }
  });

  const quickAction: QuickActionDefinition<InputType> = {
    id: ID,
    type: 'quick',
    kind: 'text',

    scopes: ['text/edit'],

    label: `${I18N_PREFIX}`,
    enable: ({ engine }) => {
      const blockIds = engine.block.findAllSelected();
      if (blockIds == null || blockIds.length !== 1) return false;
      const [blockId] = blockIds;
      return engine.block.getType(blockId) === '//ly.img.ubq/text';
    },

    render: ({
      builder,
      generate,
      engine,
      close,
      experimental,
      providerId
    }) => {
      experimental.builder.Popover(`${ID}.popover`, {
        label: getI18nLabel(providerId),
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
                      label: getI18nLabel(providerId, option.id),
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
                          cesdk.ui.showNotification({
                            type: 'error',
                            message:
                              (error as Error).message ||
                              'Failed to change tone. Please try again.',
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
