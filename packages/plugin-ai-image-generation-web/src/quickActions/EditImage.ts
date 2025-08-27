import {
  enableQuickActionForImageFill,
  QuickActionDefinition
} from '@imgly/plugin-ai-generation-web';
import { getImageUri } from '@imgly/plugin-utils';

import { GetQuickActionDefinition } from './types';

/**
 * The action name.
 */
const ACTION_NAME = 'editImage';

/**
 * The ID of the quick action.
 */
export const ID = `ly.img.${ACTION_NAME}`;

/**
 * The i18n prefix for the quick action.
 */
export const I18N_PREFIX = `ly.img.plugin-ai-image-generation-web.quickAction.${ACTION_NAME}`;
export const I18N_DEFAULT_PREFIX = `ly.img.plugin-ai-image-generation-web.defaults.quickAction.${ACTION_NAME}`;

/**
 * The input generated from this quick action which needs
 * to be mapped to the specific provider.
 */
export type InputType = {
  prompt: string;
  uri: string;
};

/**
 * Get i18n label with fallback keys.
 */
function getI18nLabel(modelKey?: string, suffix?: string) {
  const basePath = `ly.img.plugin-ai-image-generation-web`;
  const actionPath = `quickAction.${ACTION_NAME}`;
  const fullPath = suffix ? `${actionPath}.${suffix}` : actionPath;
  
  if (!modelKey) {
    return [
      `${basePath}.${fullPath}`,
      `${basePath}.defaults.${fullPath}`
    ];
  }
  
  return [
    `${basePath}.${modelKey}.${fullPath}`,
    `${basePath}.${fullPath}`,
    `${basePath}.${modelKey}.defaults.${fullPath}`,
    `${basePath}.defaults.${fullPath}`
  ];
}

const EditImage: GetQuickActionDefinition<InputType> = ({ cesdk }) => {
  cesdk.i18n.setTranslations({
    en: {
      [`${I18N_DEFAULT_PREFIX}`]: 'Edit Image...',
      [`${I18N_DEFAULT_PREFIX}.description`]: 'Change image based on description',
      [`${I18N_DEFAULT_PREFIX}.prompt`]: 'Edit Image...',
      [`${I18N_PREFIX}.prompt.placeholder`]: 'e.g. "Add a sunset"',
      [`${I18N_DEFAULT_PREFIX}.apply`]: 'Change'
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
          inputLabel: getI18nLabel(undefined, 'prompt'),
          placeholder: getI18nLabel(undefined, 'prompt.placeholder')[0],
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
              label: getI18nLabel(undefined, 'apply'),
              icon: '@imgly/MagicWand',
              color: 'accent',
              isDisabled: promptState.value.length === 0,
              onClick: async () => {
                try {
                  const prompt = promptState.value;
                  if (!prompt) return;

                  const [blockId] = engine.block.findAllSelected();
                  const uri = await getImageUri(blockId, engine, {
                    throwErrorIfSvg: true
                  });

                  await generate({
                    prompt,
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
                      'Failed to edit image. Please try again.',
                    duration: 'medium'
                  });
                }
              }
            });
          }
        });
      } else {
        builder.Button(`${ID}.button`, {
          label: getI18nLabel(),
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

export default EditImage;
