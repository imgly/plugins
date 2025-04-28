import CreativeEditorSDK, { ButtonOptions } from '@cesdk/cesdk-js';
import { Output, QuickAction, QuickActionContext } from '../../provider';
import { getImageUri } from '@imgly/plugin-utils';

interface QuickActionBaseSelectItem {
  id: string;
  label: string;
  icon?: string;
  prompt: string;
}

/**
 * Quick action base for quick actions that require a selection of items.
 */
function QuickActionBaseSelect<I, O extends Output>(options: {
  cesdk: CreativeEditorSDK;
  items: QuickActionBaseSelectItem[];
  buttonOptions?: ButtonOptions;
  quickAction: Omit<QuickAction<I, O>, 'render' | 'renderExpanded'>;
  mapInput?: (input: {
    item: QuickActionBaseSelectItem;
    uri: string;
    blockId: number;
  }) => I;
  onApply?: (
    options: { item: QuickActionBaseSelectItem; uri: string; blockId: number },
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
          builder.Section(`${id}.popover.section`, {
            children: () => {
              experimental.builder.Menu(`${id}.popover.menu`, {
                children: () => {
                  options.items.forEach((item) => {
                    builder.Button(`${id}.popover.menu.${item.id}`, {
                      label: item.label,
                      labelAlignment: 'left',
                      variant: 'plain',
                      icon: item.icon,
                      onClick: async () => {
                        const { generate, closeMenu, handleGenerationError } =
                          context;
                        try {
                          closeMenu();
                          const [blockId] =
                            options.cesdk.engine.block.findAllSelected();
                          const uri = await getImageUri(
                            blockId,
                            options.cesdk.engine,
                            {
                              throwErrorIfSvg: true
                            }
                          );

                          if (options.mapInput) {
                            const input = options.mapInput({
                              item,
                              uri,
                              blockId
                            });
                            return await generate(input);
                          } else if (options.onApply) {
                            return await options.onApply(
                              {
                                item,
                                uri,
                                blockId
                              },
                              context
                            );
                          } else {
                            throw new Error(
                              'Please provide either mapInput or onApply'
                            );
                          }
                        } catch (error) {
                          handleGenerationError(error);
                        }
                      }
                    });
                  });
                }
              });
            }
          });
        }
      });
    }
  };
}

export default QuickActionBaseSelect;
