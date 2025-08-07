import {
  enableQuickActionForImageFill,
  QuickActionDefinition
} from '@imgly/plugin-ai-generation-web';
import { getImageUri } from '@imgly/plugin-utils';
import { GetQuickActionDefinition } from './types';

/**
 * The action name.
 */
const ACTION_NAME = 'swapBackground';

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
  prompt: string;
  uri: string;
};

const SwapBackground: GetQuickActionDefinition<InputType> = ({ cesdk }) => {
  cesdk.i18n.setTranslations({
    en: {
      [`${I18N_PREFIX}`]: 'Swap Background...',
      [`${I18N_PREFIX}.description`]: 'Change the background of the image',
      [`${I18N_PREFIX}.prompt`]: 'Swap Background...',
      [`${I18N_PREFIX}.prompt.placeholder`]: 'e.g. "A sunset over mountains"',
      [`${I18N_PREFIX}.apply`]: 'Change'
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
      isExpanded,
      toggleExpand,
      generate,
      engine,
      state,
      close
    }) => {
      if (isExpanded) {
        const promptState = state(`${ID}.prompt`, '');

        builder.TextArea(`${ID}.prompt`, {
          inputLabel: `${I18N_PREFIX}.prompt`,
          placeholder: `${I18N_PREFIX}.prompt.placeholder`,
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
              label: `${I18N_PREFIX}.apply`,
              icon: '@imgly/MagicWand',
              color: 'accent',
              isDisabled: promptState.value.length === 0,
              onClick: async () => {
                try {
                  const userPrompt = promptState.value;
                  if (!userPrompt) return;

                  const [blockId] = engine.block.findAllSelected();
                  const uri = await getImageUri(blockId, engine, {
                    throwErrorIfSvg: true
                  });

                  await generate({
                    prompt: `Swap the background to ${userPrompt}`,
                    uri
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
                      'Failed to swap background. Please try again.',
                    duration: 'medium'
                  });
                }
              }
            });
          }
        });
      } else {
        builder.Button(`${ID}.button`, {
          label: `${I18N_PREFIX}`,
          icon: '@imgly/plugin-ai-generation/image',
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

export default SwapBackground;
