import {
  QuickActionDefinition,
  setDefaultTranslations
} from '@imgly/plugin-ai-generation-web';
import translate, { LOCALES } from '../prompts/translate';
import { GetQuickActionDefinition } from './types';

/**
 * The action name.
 */
const ACTION_NAME = 'translate';

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
  language: string;
};

const languageOptions = LOCALES.map((locale) => ({
  id: locale
}));

const Translate: GetQuickActionDefinition<InputType> = ({ cesdk }) => {
  // Set feature default for this quick action
  cesdk.feature.enable(
    'ly.img.plugin-ai-text-generation-web.quickAction.translate',
    true
  );

  setDefaultTranslations(cesdk, {
    en: {
      [`${I18N_DEFAULT_PREFIX}`]: 'Translate',
      [`${I18N_DEFAULT_PREFIX}.en_US`]: 'English (US)',
      [`${I18N_DEFAULT_PREFIX}.en_UK`]: 'English (UK)',
      [`${I18N_DEFAULT_PREFIX}.es`]: 'Spanish',
      [`${I18N_DEFAULT_PREFIX}.fr`]: 'French',
      [`${I18N_DEFAULT_PREFIX}.de`]: 'German',
      [`${I18N_DEFAULT_PREFIX}.pt`]: 'Portuguese',
      [`${I18N_DEFAULT_PREFIX}.it`]: 'Italian',
      [`${I18N_DEFAULT_PREFIX}.ru`]: 'Russian',
      [`${I18N_DEFAULT_PREFIX}.zh`]: 'Mandarin Chinese',
      [`${I18N_DEFAULT_PREFIX}.ja`]: 'Japanese'
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
        icon: '@imgly/Language',
        labelAlignment: 'left',
        variant: 'plain',
        trailingIcon: '@imgly/ChevronRight',
        placement: 'right',
        children: () => {
          builder.Section(`${ID}.popover.section`, {
            children: () => {
              experimental.builder.Menu(`${ID}.popover.menu`, {
                children: () => {
                  languageOptions.forEach((option) => {
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
                            prompt: translate(currentText, option.id as any),
                            language: option.id
                          });
                        } catch (error) {
                          // eslint-disable-next-line no-console
                          console.error('Generation error:', error);
                          cesdk.ui.showNotification({
                            type: 'error',
                            message:
                              (error as Error).message ||
                              'Failed to translate text. Please try again.',
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

export default Translate;
