import CreativeEditorSDK from '@cesdk/cesdk-js';
import { ImageOutput, QuickAction, QuickActionContext } from '../../provider';
import QuickActionBasePrompt from './QuickActionBasePrompt';
import { getImageUri } from '@imgly/plugin-utils';

function QuickActionEditTextStyle<I, O extends ImageOutput>(options: {
  id?: string;
  cesdk: CreativeEditorSDK;
  mapInput?: (input: {
    prompt: string;
    uri: string;
    duplicatedBlockId: number;
  }) => I;
  onApply?: (
    options: { prompt: string; uri: string; duplicatedBlockId: number },
    context: QuickActionContext<I, O>
  ) => Promise<O>;
}): QuickAction<I, O> {
  const id = options.id ?? 'changeToImage';

  if (options.mapInput == null && options.onApply == null) {
    throw new Error(
      `QuickAction '${id}': Either mapInput or onApply must be provided to QuickActionChangeImage`
    );
  }

  if (options.mapInput != null && options.onApply != null) {
    throw new Error(
      `QuickAction '${id}': Only one of mapInput or onApply can be provided to QuickActionChangeImage, not both`
    );
  }

  options.cesdk.i18n.setTranslations({
    en: {
      [`ly.img.ai.quickAction.${id}.apply`]: 'Change',
      [`ly.img.ai.quickAction.${id}`]: 'Change Text Style...',
      [`ly.img.ai.quickAction.${id}.prompt.inputLabel`]: 'Change Text Style...',
      [`ly.img.ai.quickAction.${id}.prompt.placeholder`]:
        'e.g. add a 3d texture with wires...'
    }
  });

  return QuickActionBasePrompt<I, O>({
    buttonOptions: {
      icon: '@imgly/plugin-ai-generation/image'
    },
    quickAction: {
      kind: 'text',
      id,
      version: '1',
      confirmation: false,
      // scopes: ['fill/change'],
      enable: ({ engine }) => {
        const blockIds = engine.block.findAllSelected();
        if (blockIds == null || blockIds.length !== 1) return false;
        const [blockId] = blockIds;
        return engine.block.getType(blockId) === '//ly.img.ubq/text';
      }
    },
    onApply: async (prompt, context) => {
      const [blockId] = options.cesdk.engine.block.findAllSelected();
      const parentBlockId = options.cesdk.engine.block.getParent(blockId);
      if (parentBlockId == null) {
        throw new Error('Parent block not found');
      }

      const rasterized = await options.cesdk.engine.block.export(blockId);
      const rasterizedUri = URL.createObjectURL(rasterized);

      const width = options.cesdk.engine.block.getFrameWidth(blockId);
      const height = options.cesdk.engine.block.getFrameHeight(blockId);
      const positionX = options.cesdk.engine.block.getPositionX(blockId);
      const positionY = options.cesdk.engine.block.getPositionY(blockId);

      const shape = options.cesdk.engine.block.createShape('rect');
      const rasterizedBlock = options.cesdk.engine.block.create('graphic');
      options.cesdk.engine.block.setShape(rasterizedBlock, shape);
      options.cesdk.engine.block.appendChild(parentBlockId, rasterizedBlock);
      options.cesdk.engine.block.setWidth(rasterizedBlock, width);
      options.cesdk.engine.block.setHeight(rasterizedBlock, height);
      options.cesdk.engine.block.setPositionX(rasterizedBlock, positionX);
      options.cesdk.engine.block.setPositionY(rasterizedBlock, positionY);
      const fillBlock = options.cesdk.engine.block.createFill('image');

      options.cesdk.engine.block.setString(
        fillBlock,
        'fill/image/imageFileURI',
        rasterizedUri
      );

      options.cesdk.engine.block.setFill(rasterizedBlock, fillBlock);

      options.cesdk.engine.block.destroy(blockId);
      options.cesdk.engine.block.setSelected(rasterizedBlock, true);

      const uri = await getImageUri(rasterizedBlock, options.cesdk.engine, {
        throwErrorIfSvg: true
      });

      if (options.mapInput) {
        const input = options.mapInput({
          prompt,
          uri,
          duplicatedBlockId: rasterizedBlock
        });
        return context.generate(input);
      } else if (options.onApply) {
        return options.onApply(
          {
            prompt,
            uri,
            duplicatedBlockId: rasterizedBlock
          },
          context
        );
      } else {
        throw new Error('Please provide either mapInput or onApply');
      }
    }
  });
}

export default QuickActionEditTextStyle;
