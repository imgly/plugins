import {
  QuickActionDefinition,
  setDefaultTranslations
} from '@imgly/plugin-ai-generation-web';
import changeTextTo from '../prompts/changeTextTo';
import { GetQuickActionDefinition } from './types';

/**
 * The action name.
 */
const ACTION_NAME = 'changeTextTo';

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
  customPrompt: string;
};

const ChangeTextTo: GetQuickActionDefinition<InputType> = ({ cesdk }) => {
  // Set feature default for this quick action
  cesdk.feature.enable(
    'ly.img.plugin-ai-text-generation-web.quickAction.changeTextTo',
    true
  );

  setDefaultTranslations(cesdk, {
    en: {
      [`${I18N_DEFAULT_PREFIX}`]: 'Change Text to...',
      [`${I18N_DEFAULT_PREFIX}.prompt`]: 'Change Text to...',
      [`${I18N_PREFIX}.prompt.placeholder`]:
        'e.g. "a list of bullet points", "a formal announcement"'
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
      experimental,
      isExpanded,
      toggleExpand,
      generate,
      engine,
      state,
      close,
      providerId
    }) => {
      if (isExpanded) {
        const promptState = state(`${ID}.prompt`, '');

        builder.TextArea(`${ID}.prompt`, {
          inputLabel: getI18nLabel(providerId, 'prompt'),
          placeholder: getI18nLabel(providerId, 'prompt.placeholder')[1],
          ...promptState
        });

        builder.Separator(`${ID}.separator`);

        experimental.builder.ButtonRow(`${ID}.footer`, {
          justifyContent: 'space-between',
          children: () => {
            builder.Button(`${ID}.footer.cancel`, {
              label: 'common.back',
              icon: '@imgly/ChevronLeft',
              onClick: toggleExpand
            });

            builder.Button(`${ID}.footer.apply`, {
              label: 'common.apply',
              icon: '@imgly/MagicWand',
              color: 'accent',
              isDisabled: promptState.value.length === 0,
              onClick: async () => {
                try {
                  const customPrompt = promptState.value;
                  if (!customPrompt) return;

                  const [blockId] = engine.block.findAllSelected();
                  const currentText = engine.block.getString(
                    blockId,
                    'text/text'
                  );

                  await generate({
                    prompt: changeTextTo(currentText, customPrompt),
                    customPrompt
                  });

                  toggleExpand();
                  close();
                } catch (error) {
                  // eslint-disable-next-line no-console
                  console.error('Generation error:', error);
                  cesdk.ui.showNotification({
                    type: 'error',
                    message:
                      (error as Error).message ||
                      'Failed to change text. Please try again.',
                    duration: 'medium'
                  });
                }
              }
            });
          }
        });
      } else {
        builder.Button(`${ID}.button`, {
          label: getI18nLabel(providerId),
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

export default ChangeTextTo;
