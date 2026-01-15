import {
  QuickActionDefinition,
  setDefaultTranslations
} from '@imgly/plugin-ai-generation-web';
import { getImageUri } from '@imgly/plugin-utils';

import { GetQuickActionDefinition } from './types';

/**
 * The action name.
 */
const ACTION_NAME = 'combineImages';

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
  uris: string[];
  exportFromBlockIds: number[];
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

const CombineImages: GetQuickActionDefinition<InputType> = ({ cesdk }) => {
  // Set feature default for this quick action
  cesdk.feature.enable(
    'ly.img.plugin-ai-image-generation-web.quickAction.combineImages',
    true
  );

  setDefaultTranslations(cesdk, {
    en: {
      [`${I18N_DEFAULT_PREFIX}.apply`]: 'Combine',
      [`${I18N_DEFAULT_PREFIX}`]: 'Combine Images...',
      [`${I18N_DEFAULT_PREFIX}.prompt`]: 'Image Combination Instructions',
      [`${I18N_PREFIX}.prompt.placeholder`]:
        'e.g., add character to the left of the mountain scene'
    }
  });

  const quickAction: QuickActionDefinition<InputType> = {
    id: ID,
    type: 'quick',
    kind: 'image',

    defaults: {
      confirmation: false,
      lock: false
    },

    label: `${I18N_PREFIX}`,
    enable: (context) => {
      const blockIds = context.engine.block.findAllSelected();

      if (blockIds == null || blockIds.length < 2) return false;

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

        if (
          !cesdk.feature.isEnabled('ly.img.duplicate', {
            engine: context.engine
          })
        ) {
          return false;
        }
        if (
          !context.engine.block.isAllowedByScope(blockId, 'lifecycle/duplicate')
        ) {
          return false;
        }

        const parent = context.engine.block.getParent(blockId);
        const isBackgroundClip =
          parent != null &&
          context.engine.block.getType(parent) === '//ly.img.ubq/track' &&
          context.engine.block.isPageDurationSource(parent);

        if (isBackgroundClip) {
          return false;
        }

        const blockType = context.engine.block.getType(blockId);
        if (blockType === '//ly.img.ubq/page') return false;
        return true;
      });
    },
    scopes: ['lifecycle/duplicate', 'fill/change'],

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
              label: getI18nLabel(providerId, 'apply'),
              icon: '@imgly/MagicWand',
              color: 'accent',
              isDisabled: promptState.value.length === 0,
              onClick: async () => {
                try {
                  const prompt = promptState.value;
                  if (!prompt) return;

                  const blockIds = engine.block.findAllSelected();

                  // Duplicate the first selected block
                  const duplicated = engine.block.duplicate(blockIds[0]);
                  blockIds.forEach((blockId) => {
                    engine.block.setSelected(blockId, false);
                  });
                  engine.block.setSelected(duplicated, true);

                  // Offset the duplicated block
                  const parent = engine.block.getParent(duplicated);
                  if (parent == null) throw new Error('Parent not found');

                  const offsetFactor = 1.0;
                  const parentWidth = engine.block.getWidth(parent);
                  const parentHeight = engine.block.getHeight(parent);
                  const offset =
                    0.02 * Math.min(parentWidth, parentHeight) * offsetFactor;

                  engine.block.setPositionX(
                    duplicated,
                    engine.block.getPositionX(duplicated) + offset
                  );
                  engine.block.setPositionY(
                    duplicated,
                    engine.block.getPositionY(duplicated) + offset
                  );

                  // Get URIs from all selected blocks
                  const uris = await Promise.all(
                    blockIds.map((blockId) =>
                      getImageUri(blockId, engine, {
                        throwErrorIfSvg: true
                      })
                    )
                  );

                  // Generate using explicit block targeting
                  await generate(
                    {
                      prompt,
                      uris,
                      exportFromBlockIds: blockIds
                    },
                    {
                      blockIds: [duplicated]
                    }
                  );

                  toggleExpand();
                  close();
                } catch (error) {
                  // eslint-disable-next-line no-console
                  console.error('Generation error:', error);
                  cesdk.ui.showNotification({
                    type: 'error',
                    message:
                      (error as Error).message ||
                      'Failed to combine images. Please try again.',
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
          icon: '@imgly/ImageVariation',
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

export default CombineImages;
