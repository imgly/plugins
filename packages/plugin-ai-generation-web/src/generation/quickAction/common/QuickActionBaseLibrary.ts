import CreativeEditorSDK, { AssetResult, ButtonOptions } from '@cesdk/cesdk-js';
import { Output, QuickAction, QuickActionContext } from '../../provider';
import { getImageUri } from '@imgly/plugin-utils';

/**
 * Quick action base for quick actions that require a selection of items
 * from a library.
 */
function QuickActionBaseLibrary<I, O extends Output>(options: {
  cesdk: CreativeEditorSDK;
  entries: string[];
  buttonOptions?: ButtonOptions;
  quickAction: Omit<QuickAction<I, O>, 'render' | 'renderExpanded'>;
  mapInput?: (input: {
    assetResult: AssetResult;
    uri: string;
    blockId: number;
  }) => I;
  onApply?: (
    options: { assetResult: AssetResult; uri: string; blockId: number },
    context: QuickActionContext<I, O>
  ) => Promise<O>;
}): QuickAction<I, O> {
  const id = options.quickAction.id;

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

  return {
    ...options.quickAction,
    render: ({ builder, experimental }, context) => {
      experimental.builder.Popover(`${id}.popover`, {
        label: `ly.img.ai.quickAction.${id}`,
        icon: '@imgly/Appearance',
        labelAlignment: 'left',
        variant: 'plain',
        trailingIcon: '@imgly/ChevronRight',
        placement: 'right',
        ...options.buttonOptions,
        children: () => {
          builder.Library(`${id}.popover.library`, {
            entries: options.entries,
            onSelect: async (assetResult) => {
              const { generate, closeMenu, handleGenerationError } = context;
              try {
                closeMenu();
                const [blockId] = options.cesdk.engine.block.findAllSelected();
                const uri = await getImageUri(blockId, options.cesdk.engine, {
                  throwErrorIfSvg: true
                });

                if (options.mapInput) {
                  const input = options.mapInput({
                    assetResult,
                    uri,
                    blockId
                  });
                  await generate(input);
                } else if (options.onApply) {
                  await options.onApply(
                    {
                      assetResult,
                      uri,
                      blockId
                    },
                    context
                  );
                } else {
                  throw new Error('Please provide either mapInput or onApply');
                }
              } catch (error) {
                handleGenerationError(error);
              }
            }
          });
        }
      });
    }
  };
}

export default QuickActionBaseLibrary;
