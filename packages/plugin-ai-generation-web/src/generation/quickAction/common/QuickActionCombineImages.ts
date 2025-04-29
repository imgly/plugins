import CreativeEditorSDK from '@cesdk/cesdk-js';
import { ImageOutput, QuickAction, QuickActionContext } from '../../provider';
import QuickActionBasePrompt from './QuickActionBasePrompt';
import enableImageFill from './enableImageFill';
import { getImageUri } from '@imgly/plugin-utils';

function QuickActionCombineImages<I, O extends ImageOutput>(options: {
  id?: string;
  mapInput?: (input: {
    prompt: string;
    uris: string[];
    duplicatedBlockId: number;
  }) => I;
  onApply?: (
    options: { prompt: string; uris: string[]; duplicatedBlockId: number },
    context: QuickActionContext<I, O>
  ) => Promise<O>;
  cesdk: CreativeEditorSDK;
}): QuickAction<I, O> {
  const id = options.id ?? 'combineImages';

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
      [`ly.img.ai.quickAction.${id}.apply`]: 'Combine',
      [`ly.img.ai.quickAction.${id}`]: 'Combine Images...',
      [`ly.img.ai.quickAction.${id}.prompt.inputLabel`]:
        'Image Combination Instructions',
      [`ly.img.ai.quickAction.${id}.prompt.placeholder`]:
        'e.g., add character to the left of the mountain scene'
    }
  });

  return QuickActionBasePrompt<I, O>({
    buttonOptions: {
      icon: '@imgly/ImageVariation'
    },
    quickAction: {
      id,
      version: '1',
      confirmation: false,
      lockDuringConfirmation: false,
      scopes: ['lifecycle/duplicate', 'fill/change'],
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
            context.engine.block.getType(fillBlock) !==
            '//ly.img.ubq/fill/image'
          ) {
            return false;
          }

          if (
            !options.cesdk.feature.isEnabled('ly.img.duplicate', {
              engine: context.engine
            })
          ) {
            return false;
          }
          if (
            !context.engine.block.isAllowedByScope(
              blockId,
              'lifecycle/duplicate'
            )
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
      }
    },
    onApply: async (prompt, context) => {
      const engine = options.cesdk.engine;
      const blockIds = engine.block.findAllSelected();

      // Duplicate the selected block
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
      const offset = 0.02 * Math.min(parentWidth, parentHeight) * offsetFactor;

      engine.block.setPositionX(
        duplicated,
        engine.block.getPositionX(duplicated) + offset
      );
      engine.block.setPositionY(
        duplicated,
        engine.block.getPositionY(duplicated) + offset
      );

      const uris = await Promise.all(
        blockIds.map((blockId) =>
          getImageUri(blockId, options.cesdk.engine, {
            throwErrorIfSvg: true
          })
        )
      );

      if (options.mapInput) {
        const input = options.mapInput({
          prompt,
          uris,
          duplicatedBlockId: duplicated
        });
        return context.generate(input);
      } else if (options.onApply) {
        return options.onApply(
          {
            prompt,
            uris,
            duplicatedBlockId: duplicated
          },
          context
        );
      } else {
        throw new Error('Please provide either mapInput or onApply');
      }
    }
  });
}

export default QuickActionCombineImages;
