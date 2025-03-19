import CreativeEditorSDK from '@cesdk/cesdk-js';
import { MagicEntry } from '@imgly/plugin-utils-ai-generation';

function createMagicEntryForText(options: {
  cesdk: CreativeEditorSDK;
  id: string;
  label?: string;
  icon: string;
  infer: (
    text: string,
    signal: AbortSignal,
    payload?: any
  ) => Promise<AsyncGenerator<string, void, unknown>>;
  parameter?: {
    id: string;
    icon?: string;
  }[];
  renderEditState?: MagicEntry['renderEditState'];
}) {
  const cesdk = options.cesdk;
  const entry: MagicEntry = {
    id: options.id,
    getBlockId: () => {
      const blockIds = cesdk.engine.block.findAllSelected();
      if (blockIds.length !== 1) {
        return undefined;
      }

      const [blockId] = blockIds;
      if (cesdk.engine.block.getType(blockId) !== '//ly.img.ubq/text') {
        return undefined;
      }

      return blockId;
    },
    renderEditState: options.renderEditState,
    renderMenuEntry: (context, { applyInference, toggleEditState }) => {
      if (options.renderEditState != null) {
        context.builder.Button(`${options.id}.button`, {
          icon: options.icon,
          labelAlignment: 'left',
          variant: 'plain',
          label: options.label ?? `ly.img.ai.inference.${options.id}`,
          onClick: toggleEditState
        });

        return;
      }

      if (options.parameter == null) {
        context.builder.Button(`${options.id}.button`, {
          icon: options.icon,
          labelAlignment: 'left',
          variant: 'plain',
          label: options.label ?? `ly.img.ai.inference.${options.id}`,
          onClick: applyInference
        });
      } else {
        context.experimental.builder.Popover(
          `${options.id}.parameter.popover`,
          {
            icon: options.icon,
            labelAlignment: 'left',
            variant: 'plain',
            label: options.label ?? `ly.img.ai.inference.${options.id}`,
            trailingIcon: '@imgly/ChevronRight',
            placement: 'right',
            children: () => {
              context.builder.Section(
                `${options.id}.parameter.popover.section`,
                {
                  children: () => {
                    context.experimental.builder.Menu(
                      `${options.id}.parameter.popover.menu`,
                      {
                        children: () => {
                          options.parameter?.forEach(({ id, icon }) => {
                            context.builder.Button(
                              `${options.id}.parameter.popover.menu.${id}`,
                              {
                                label: `ly.img.ai.inference.${options.id}.type.${id}`,
                                icon,
                                labelAlignment: 'left',
                                variant: 'plain',
                                onClick: async () => {
                                  applyInference(id);
                                }
                              }
                            );
                          });
                        }
                      }
                    );
                  }
                }
              );
            }
          }
        );
      }
    },

    applyInference: async (block, { abortSignal, payload }) => {
      const texteBefore = cesdk.engine.block.getString(block, 'text/text');

      let inferredText = '';
      const stream = await options.infer(texteBefore, abortSignal, payload);
      for await (const chunk of stream) {
        if (abortSignal.aborted) {
          break;
        }
        inferredText += chunk;

        cesdk.engine.block.setString(block, 'text/text', inferredText);
      }

      const setTextBefore = () =>
        cesdk.engine.block.setString(block, 'text/text', texteBefore);
      const setTextAfter = () =>
        cesdk.engine.block.setString(block, 'text/text', inferredText);

      return {
        onCancel: setTextBefore,
        onBefore: setTextBefore,
        onAfter: setTextAfter,
        onApply: setTextAfter
      };
    }
  };

  return entry;
}

export default createMagicEntryForText;
