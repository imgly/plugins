import { QuickActionDefinition } from '@imgly/plugin-ai-generation-web';

import { GetQuickActionDefinition } from './types';

/**
 * The action name.
 */
const ACTION_NAME = 'remixPageWithPrompt';

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

const RemixPageWithPrompt: GetQuickActionDefinition<InputType> = ({
  cesdk
}) => {
  cesdk.i18n.setTranslations({
    en: {
      [`${I18N_DEFAULT_PREFIX}`]: 'Remix Page...',
      [`${I18N_DEFAULT_PREFIX}.prompt`]: 'Remix Page Prompt',
      [`${I18N_PREFIX}.prompt.placeholder`]: 'e.g. rearrange the layout to...',
      [`${I18N_DEFAULT_PREFIX}.apply`]: 'Remix'
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
    enable: ({ engine }) => {
      const blockIds = engine.block.findAllSelected();
      if (blockIds.length !== 1) return false;
      const blockId = blockIds[0];
      const type = engine.block.getType(blockId);
      return type === '//ly.img.ubq/page';
    },
    scopes: ['lifecycle/duplicate'],

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

                  const [page] = engine.block.findAllSelected();

                  const exportedPageBlob = await engine.block.export(page);
                  const exportedPageUrl = URL.createObjectURL(exportedPageBlob);

                  const duplicatedPage = engine.block.duplicate(page);
                  engine.block
                    .getChildren(duplicatedPage)
                    .forEach((childId) => {
                      engine.block.destroy(childId);
                    });
                  engine.block.setSelected(page, false);

                  const width = engine.block.getFrameWidth(page);
                  const height = engine.block.getFrameHeight(page);
                  const positionX = engine.block.getPositionX(page);
                  const positionY = engine.block.getPositionY(page);

                  const shape = engine.block.createShape('rect');
                  const rasterizedPageBlock = engine.block.create('graphic');

                  engine.block.setShape(rasterizedPageBlock, shape);
                  engine.block.appendChild(duplicatedPage, rasterizedPageBlock);
                  engine.block.setWidth(rasterizedPageBlock, width);
                  engine.block.setHeight(rasterizedPageBlock, height);
                  engine.block.setPositionX(rasterizedPageBlock, positionX);
                  engine.block.setPositionY(rasterizedPageBlock, positionY);

                  const fillBlock = engine.block.createFill('image');
                  engine.block.setFill(rasterizedPageBlock, fillBlock);

                  engine.block.setString(
                    fillBlock,
                    'fill/image/imageFileURI',
                    exportedPageUrl
                  );

                  engine.block.setSelected(rasterizedPageBlock, true);
                  engine.scene.zoomToBlock(rasterizedPageBlock);

                  await generate(
                    {
                      prompt,
                      uri: exportedPageUrl
                    },
                    {
                      blockIds: [rasterizedPageBlock]
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
                      'Failed to remix page. Please try again.',
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
          icon: '@imgly/Sparkle',
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

export default RemixPageWithPrompt;
