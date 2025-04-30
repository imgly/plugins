import CreativeEditorSDK from '@cesdk/cesdk-js';
import { ImageOutput, QuickAction, QuickActionContext } from '../../provider';
import QuickActionBasePrompt from './QuickActionBasePrompt';
import enableImageFill from './enableImageFill';
import { getImageUri } from '@imgly/plugin-utils';

function QuickActionImageVariant<I, O extends ImageOutput>(options: {
  id?: string;
  mapInput?: (input: {
    prompt: string;
    uri: string;
    duplicatedBlockId: number;
  }) => I;
  onApply?: (
    options: { prompt: string; uri: string; duplicatedBlockId: number },
    context: QuickActionContext<I, O>
  ) => Promise<O>;
  cesdk: CreativeEditorSDK;
}): QuickAction<I, O> {
  const id = options.id ?? 'createVariant';

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
      [`ly.img.ai.quickAction.${id}.apply`]: 'Create',
      [`ly.img.ai.quickAction.${id}`]: 'Create Variant...',
      [`ly.img.ai.quickAction.${id}.prompt.inputLabel`]:
        'Describe Your Variant...',
      [`ly.img.ai.quickAction.${id}.prompt.placeholder`]:
        'e.g., same character with arms raised'
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
        if (!enableImageFill()(context)) return false;

        const [blockId] = context.engine.block.findAllSelected();
        if (
          !options.cesdk.feature.isEnabled('ly.img.duplicate', {
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

        return true;
      }
    },
    onApply: async (prompt, context) => {
      const engine = options.cesdk.engine;
      const [blockId] = engine.block.findAllSelected();
      const type = engine.block.getType(blockId);

      // Duplicate the selected block
      const duplicated = engine.block.duplicate(blockId);
      if (type === '//ly.img.ubq/page') {
        engine.block.getChildren(duplicated).forEach((childId) => {
          engine.block.destroy(childId);
        });
      }
      engine.block.setSelected(blockId, false);
      engine.block.setSelected(duplicated, true);

      const parent = engine.block.getParent(duplicated);
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
          duplicated,
          engine.block.getPositionX(duplicated) + offset
        );
        engine.block.setPositionY(
          duplicated,
          engine.block.getPositionY(duplicated) + offset
        );
      }

      // Get the source of the duplicated block
      const uri = await getImageUri(duplicated, options.cesdk.engine, {
        throwErrorIfSvg: true
      });

      if (options.mapInput) {
        const input = options.mapInput({
          prompt,
          uri,
          duplicatedBlockId: duplicated
        });
        return context.generate(input);
      } else if (options.onApply) {
        return options.onApply(
          {
            prompt,
            uri,
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

export default QuickActionImageVariant;
