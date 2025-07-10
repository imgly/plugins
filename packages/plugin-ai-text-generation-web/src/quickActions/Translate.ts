import { QuickActionDefinition } from '@imgly/plugin-ai-generation-web';
import translate, { LANGUAGES, LOCALES } from '../anthropic/prompts/translate';
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
export const I18N_PREFIX = `ly.img.ai.quickAction.text.${ACTION_NAME}`;

/**
 * The input generated from this quick action which needs
 * to be mapped to the specific provider.
 */
export type InputType = {
  prompt: string;
  language: string;
};

const languageOptions = LOCALES.map((locale) => ({
  id: locale,
  label: LANGUAGES[locale]
}));

const Translate: GetQuickActionDefinition<InputType> = ({ cesdk }) => {
  cesdk.i18n.setTranslations({
    en: {
      [`${I18N_PREFIX}.label`]: 'Translate'
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
