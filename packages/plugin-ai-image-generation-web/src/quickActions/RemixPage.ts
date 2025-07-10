import { QuickActionDefinition } from '@imgly/plugin-ai-generation-web';

import { GetQuickActionDefinition } from './types';

/**
 * The action name.
 */
const ACTION_NAME = 'remixPage';

/**
 * The ID of the quick action.
 */
export const ID = `ly.img.${ACTION_NAME}`;

/**
 * The i18n prefix for the quick action.
 */
export const I18N_PREFIX = `ly.img.ai.quickAction.${ACTION_NAME}`;

/**
 * The input generated from this quick action which needs
 * to be mapped to the specific provider.
 */
export type InputType = {
  prompt: string;
  uri: string;
};

const RemixPage: GetQuickActionDefinition<InputType> = ({ cesdk }) => {
  cesdk.i18n.setTranslations({
    en: {
      [`${I18N_PREFIX}`]: 'Turn Page into Image'
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
    description: 'Convert the page into a single image',
    enable: ({ engine }) => {
      const blockIds = engine.block.findAllSelected();
      if (blockIds.length !== 1) return false;
      const blockId = blockIds[0];
      const type = engine.block.getType(blockId);
      return type === '//ly.img.ubq/page';
    },
    scopes: ['lifecycle/duplicate'],

    render: ({ builder, generate, engine, close }) => {
      builder.Button(`${ID}.button`, {
        label: `${I18N_PREFIX}`,
        icon: '@imgly/Sparkle',
        labelAlignment: 'left',
        variant: 'plain',
        onClick: async () => {
          try {
            const [page] = engine.block.findAllSelected();

            const exportedPageBlob = await engine.block.export(page);
            const exportedPageUrl = URL.createObjectURL(exportedPageBlob);

            const duplicatedPage = engine.block.duplicate(page);
            engine.block.getChildren(duplicatedPage).forEach((childId) => {
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
                prompt:
                  "Follow instructions but don't add the instructions for the image",
                uri: exportedPageUrl
              },
              {
                blockIds: [rasterizedPageBlock]
              }
            );

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

export default RemixPage;
