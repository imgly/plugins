import { QuickActionDefinition } from '@imgly/plugin-ai-generation-web';
import { getImageUri } from '@imgly/plugin-utils';

import { GetQuickActionDefinition } from './types';

/**
 * The action name.
 */
const ACTION_NAME = 'animateBetweenImages';

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
  firstFrameUri: string;
  lastFrameUri: string;
};

const AnimateBetweenImages: GetQuickActionDefinition<InputType> = ({
  cesdk
}) => {
  // Set feature default for this quick action
  cesdk.feature.enable(
    'ly.img.plugin-ai-video-generation-web.quickAction.animateBetweenImages',
    true
  );

  cesdk.i18n.setTranslations({
    en: {
      [`${I18N_DEFAULT_PREFIX}`]: 'Animate Between Images...',
      [`${I18N_DEFAULT_PREFIX}.description`]:
        'Create a video transitioning between two images'
    }
  });

  const quickAction: QuickActionDefinition<InputType> = {
    id: ID,
    type: 'quick',
    kind: 'image',

    label: `${I18N_PREFIX}`,
    enable: (context) => {
      const blockIds = context.engine.block.findAllSelected();

      // Must have exactly 2 images selected
      if (blockIds == null || blockIds.length !== 2) return false;

      return blockIds.every((blockId) => {
        if (
          context.engine.block.getType(blockId) !== '//ly.img.ubq/graphic' &&
          !context.engine.block.supportsFill(blockId)
        ) {
          return false;
        }

        const fillBlock = context.engine.block.getFill(blockId);
        if (
          context.engine.block.getType(fillBlock) !== '//ly.img.ubq/fill/image'
        ) {
          return false;
        }

        const blockType = context.engine.block.getType(blockId);
        if (blockType === '//ly.img.ubq/page') return false;

        return true;
      });
    },
    scopes: [],

    render: ({ builder, engine, close, providerId }) => {
      builder.Button(`${ID}.button`, {
        label: getI18nLabel(providerId),
        icon: '@imgly/plugin-ai-generation/video',
        labelAlignment: 'left',
        variant: 'plain',
        onClick: async () => {
          try {
            const blockIds = engine.block.findAllSelected();

            if (blockIds.length !== 2) {
              throw new Error('Exactly 2 images must be selected');
            }

            // Get URIs from both selected blocks
            const [firstUri, secondUri] = await Promise.all(
              blockIds.map((blockId) =>
                getImageUri(blockId, engine, {
                  throwErrorIfSvg: true
                })
              )
            );

            // Open the Veo 3.1 panel specifically
            const modelKey = 'fal-ai/veo3.1/fast/first-last-frame-to-video';

            // Set the frame URLs in global state
            cesdk.ui.experimental.setGlobalStateValue(
              `${modelKey}.first_frame_url`,
              firstUri
            );
            cesdk.ui.experimental.setGlobalStateValue(
              `${modelKey}.last_frame_url`,
              secondUri
            );

            // Open the video generation panel with image-to-video mode
            cesdk.ui.openPanel('ly.img.ai.video-generation');
            cesdk.ui.experimental.setGlobalStateValue(
              'ly.img.ai.video-generation.fromType',
              'fromImage'
            );

            // Set the active provider to Veo 3.1
            cesdk.ui.experimental.setGlobalStateValue(
              'ly.img.ai.video-generation.fromImage.activeProvider',
              modelKey
            );

            close();
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error opening video generation panel:', error);
            cesdk.ui.showNotification({
              type: 'error',
              message:
                (error as Error).message ||
                'Failed to open video generation panel. Please try again.',
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

export default AnimateBetweenImages;
