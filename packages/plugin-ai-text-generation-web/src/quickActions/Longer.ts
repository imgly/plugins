import { QuickActionDefinition, setDefaultTranslations } from '@imgly/plugin-ai-generation-web';
import longer from '../prompts/longer';
import { GetQuickActionDefinition } from './types';

/**
 * The action name.
 */
const ACTION_NAME = 'longer';

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
};

const Longer: GetQuickActionDefinition<InputType> = ({ cesdk }) => {
  // Set feature default for this quick action
  cesdk.feature.enable(
    'ly.img.plugin-ai-text-generation-web.quickAction.longer',
    true
  );

  setDefaultTranslations(cesdk, {
    en: {
      [`${I18N_DEFAULT_PREFIX}`]: 'Make Longer'
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

    render: ({ builder, generate, engine, close, providerId }) => {
      builder.Button(`${ID}.button`, {
        label: getI18nLabel(providerId),
        icon: '@imgly/TextLonger',
        labelAlignment: 'left',
        variant: 'plain',
        onClick: async () => {
          try {
            const [blockId] = engine.block.findAllSelected();
            const currentText = engine.block.getString(blockId, 'text/text');

            await generate({
              prompt: longer(currentText)
            });

            close();
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Generation error:', error);
            cesdk.ui.showNotification({
              type: 'error',
              message:
                (error as Error).message ||
                'Failed to make text longer. Please try again.',
              duration: 'medium'
            });
          }
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

export default Longer;
