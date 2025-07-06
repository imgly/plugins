import { QuickActionDefinition } from '@imgly/plugin-ai-generation-web';
import improve from '../anthropic/prompts/improve';
import { GetQuickActionDefinition } from './types';

/**
 * The action name.
 */
const ACTION_NAME = 'improve';

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
};

const Improve: GetQuickActionDefinition<InputType> = ({ cesdk }) => {
  cesdk.i18n.setTranslations({
    en: {
      [`${I18N_PREFIX}.label`]: 'Improve Writing'
    }
  });

  const quickAction: QuickActionDefinition<InputType> = {
    id: ID,
    type: 'quick',
    kind: 'text',

    label: `${I18N_PREFIX}.label`,
    description: `${I18N_PREFIX}.label`,
    enable: ({ engine }) => {
      const blockIds = engine.block.findAllSelected();
      if (blockIds == null || blockIds.length !== 1) return false;
      const [blockId] = blockIds;
      return engine.block.getType(blockId) === '//ly.img.ubq/text';
    },

    render: ({ builder, generate, engine, close }) => {
      builder.Button(`${ID}.button`, {
        label: `${I18N_PREFIX}.label`,
        icon: '@imgly/Sparkle',
        labelAlignment: 'left',
        variant: 'plain',
        onClick: async () => {
          try {
            const [blockId] = engine.block.findAllSelected();
            const currentText = engine.block.getString(blockId, 'text/text');

            await generate({
              prompt: improve(currentText)
            });

            close();
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Generation error:', error);
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

export default Improve;
