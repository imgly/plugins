import {
  enableQuickActionForImageFill,
  QuickActionDefinition,
  setDefaultTranslations} from '@imgly/plugin-ai-generation-web';
import { getImageUri } from '@imgly/plugin-utils';

import { GetQuickActionDefinition } from './types';

/**
 * The action name.
 */
const ACTION_NAME = 'createVariant';

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

const CreateVariant: GetQuickActionDefinition<InputType> = ({ cesdk }) => {
  // Set feature default for this quick action
  cesdk.feature.enable(
    'ly.img.plugin-ai-image-generation-web.quickAction.createVariant',
    true
  );

  setDefaultTranslations(cesdk, {
    en: {
      [`${I18N_DEFAULT_PREFIX}`]: 'Create Variant...',
      [`${I18N_DEFAULT_PREFIX}.description`]: 'Create a variation of the image',
      [`${I18N_DEFAULT_PREFIX}.prompt`]: 'Create Variant...',
      [`${I18N_PREFIX}.prompt.placeholder`]: 'e.g. "Make it more colorful"',
      [`${I18N_DEFAULT_PREFIX}.apply`]: 'Create'
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
      // First check basic image fill requirements
      if (!enableQuickActionForImageFill()(context)) return false;

      const [blockId] = context.engine.block.findAllSelected();

      // Check if duplicate feature is enabled
      if (
        !cesdk.feature.isEnabled('ly.img.duplicate', {
          engine: context.engine
        })
      ) {
        return false;
      }

      // Check if block allows duplicate scope
      if (
        !context.engine.block.isAllowedByScope(blockId, 'lifecycle/duplicate')
      ) {
        return false;
      }

      return true;
    },
    scopes: ['fill/change', 'lifecycle/duplicate'],

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

                  const [blockId] = engine.block.findAllSelected();
                  const type = engine.block.getType(blockId);

                  // Duplicate the block first (following legacy pattern)
                  const duplicatedBlockId = engine.block.duplicate(blockId);

                  // Handle special case for pages (clear children)
                  if (type === '//ly.img.ubq/page') {
                    engine.block
                      .getChildren(duplicatedBlockId)
                      .forEach((childId) => {
                        engine.block.destroy(childId);
                      });
                  }

                  // Update selection (deselect original, select duplicate)
                  engine.block.setSelected(blockId, false);
                  engine.block.setSelected(duplicatedBlockId, true);

                  // Apply visual offset for non-background clips and non-pages
                  const parent = engine.block.getParent(duplicatedBlockId);
                  if (parent == null) throw new Error('Parent not found');

                  const isBackgroundClip =
                    parent != null &&
                    engine.block.getType(parent) === '//ly.img.ubq/track' &&
                    engine.block.isPageDurationSource(parent);

                  // Offset the duplicated block unless it is a background track
                  if (!isBackgroundClip && type !== '//ly.img.ubq/page') {
                    const offsetFactor = 1.0;
                    const parentWidth = engine.block.getWidth(parent);
                    const parentHeight = engine.block.getHeight(parent);
                    const offset =
                      0.02 * Math.min(parentWidth, parentHeight) * offsetFactor;

                    engine.block.setPositionX(
                      duplicatedBlockId,
                      engine.block.getPositionX(duplicatedBlockId) + offset
                    );
                    engine.block.setPositionY(
                      duplicatedBlockId,
                      engine.block.getPositionY(duplicatedBlockId) + offset
                    );
                  }

                  // Extract image URI from the duplicated block
                  const uri = await getImageUri(duplicatedBlockId, engine, {
                    throwErrorIfSvg: true
                  });

                  // Generate using explicit block targeting
                  await generate(
                    {
                      prompt,
                      uri
                    },
                    {
                      blockIds: [duplicatedBlockId]
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
                      'Failed to create variant. Please try again.',
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

export default CreateVariant;
