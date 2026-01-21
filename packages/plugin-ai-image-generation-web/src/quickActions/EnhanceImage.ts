/**
 * EnhanceImage Quick Action
 * One-click AI-powered image enhancement for PerfectlyClear and similar providers
 */

import {
  enableQuickActionForImageFill,
  QuickActionDefinition
} from '@imgly/plugin-ai-generation-web';
import { getImageUri } from '@imgly/plugin-utils';

import { GetQuickActionDefinition } from './types';

/**
 * The action name.
 */
const ACTION_NAME = 'enhanceImage';

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
 * The input generated from this quick action.
 * Simple URI-only input since enhancement requires no configuration.
 */
export type InputType = {
  uri: string;
};

/**
 * Get i18n label with fallback keys.
 */
function getI18nLabel(modelKey: string, suffix?: string) {
  const basePath = `ly.img.plugin-ai-image-generation-web`;
  const actionPath = `quickAction.${ACTION_NAME}`;
  const fullPath = suffix ? `${actionPath}.${suffix}` : actionPath;

  return [
    `${basePath}.${modelKey}.${fullPath}`,
    `${basePath}.${fullPath}`,
    `${basePath}.${modelKey}.defaults.${fullPath}`,
    `${basePath}.defaults.${fullPath}`
  ];
}

const EnhanceImage: GetQuickActionDefinition<InputType> = ({ cesdk }) => {
  // Set feature default for this quick action
  cesdk.feature.enable(
    'ly.img.plugin-ai-image-generation-web.quickAction.enhanceImage',
    true
  );

  cesdk.i18n.setTranslations({
    en: {
      [`${I18N_DEFAULT_PREFIX}`]: 'Enhance Image',
      [`${I18N_DEFAULT_PREFIX}.description`]:
        'AI-powered automatic image enhancement',
      [`${I18N_DEFAULT_PREFIX}.apply`]: 'Enhance'
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
      generate,
      engine,
      close,
      providerId,
      isExpanded
    }) => {
      // Simple one-click action - no expanded state needed
      // Enhancement runs with automatic settings, no user input required
      if (!isExpanded) {
        builder.Button(`${ID}.button`, {
          label: getI18nLabel(providerId),
          icon: '@imgly/Sparkle',
          labelAlignment: 'left',
          variant: 'plain',
          onClick: async () => {
            try {
              const [blockId] = engine.block.findAllSelected();
              const uri = await getImageUri(blockId, engine, {
                throwErrorIfSvg: true
              });

              await generate({ uri });
              close();
            } catch (error) {
              // eslint-disable-next-line no-console
              console.error('Enhancement error:', error);
              cesdk.ui.showNotification({
                type: 'error',
                message:
                  (error as Error).message || 'Failed to enhance image',
                duration: 'medium'
              });
            }
          }
        });
      }
      // No expanded state - this is a one-click action
    }
  };

  return quickAction;
};

/**
 * Extend ImageQuickActionInputs with this action's input type.
 * This ensures type safety in the ImageProvider.
 */
declare module '../types' {
  interface ImageQuickActionInputs {
    [ID]: InputType;
  }
}

export default EnhanceImage;
