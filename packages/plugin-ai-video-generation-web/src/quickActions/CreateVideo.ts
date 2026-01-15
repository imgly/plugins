import {
  enableQuickActionForImageFill,
  QuickActionDefinition,
  setDefaultTranslations} from '@imgly/plugin-ai-generation-web';
import { getImageUri } from '@imgly/plugin-utils';

import { GetQuickActionDefinition } from './types';

/**
 * The action name.
 */
const ACTION_NAME = 'createVideo';

/**
 * The ID of the quick action.
 */
export const ID = `ly.img.${ACTION_NAME}`;

/**
 * The i18n prefix for the quick action.
 */
export const I18N_PREFIX = `ly.img.plugin-ai-video-generation-web.quickAction.${ACTION_NAME}`;
export const I18N_DEFAULT_PREFIX = `ly.img.plugin-ai-video-generation-web.defaults.quickAction.${ACTION_NAME}`;

/**
 * Get i18n label with fallback keys.
 */
function getI18nLabel(modelKey: string, suffix?: string) {
  const basePath = `ly.img.plugin-ai-video-generation-web`;
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
  uri: string;
};

const CreateVideo: GetQuickActionDefinition<InputType> = ({ cesdk }) => {
  // Set feature default for this quick action
  // Note: Uses 'image' prefix because kind: 'image' (appears in image canvas menu)
  cesdk.feature.enable(
    'ly.img.plugin-ai-image-generation-web.quickAction.createVideo',
    true
  );

  setDefaultTranslations(cesdk, {
    en: {
      [`${I18N_DEFAULT_PREFIX}`]: 'Create Video...',
      [`${I18N_DEFAULT_PREFIX}.description`]: 'Create a video from the image'
    }
  });

  const quickAction: QuickActionDefinition<InputType> = {
    id: ID,
    type: 'quick',
    kind: 'image',

    label: `${I18N_PREFIX}`,
    enable: enableQuickActionForImageFill(),
    scopes: [],

    render: ({ builder, engine, close, providerId }) => {
      builder.Button(`${ID}.button`, {
        label: getI18nLabel(providerId),
        icon: '@imgly/plugin-ai-generation/video',
        labelAlignment: 'left',
        variant: 'plain',
        onClick: async () => {
          try {
            const [blockId] = engine.block.findAllSelected();
            const uri = await getImageUri(blockId, engine, {
              throwErrorIfSvg: true
            });

            cesdk.ui.openPanel('ly.img.ai.video-generation');
            cesdk.ui.experimental.setGlobalStateValue(
              'ly.img.ai.video-generation.fromType',
              'fromImage'
            );
            cesdk.ui.experimental.setGlobalStateValue(
              // TODO: This needs to be generic and work with other property names
              `${providerId}.image_url`,
              uri
            );
            close();
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error opening video generation panel:', error);
          }
        }
      });
    }
  };
  return quickAction;
};

/**
 * Extend VideoQuickActionInputs with this action's input type.
 * This will ensure that the types are correctly recognized
 * in the VideoProvider.
 *
 * COPY this file to other quick action to support type safety
 */
declare module '../types' {
  interface VideoQuickActionInputs {
    [ID]: InputType;
  }
}

export default CreateVideo;
