import CreativeEditorSDK from '@cesdk/cesdk-js';
import applyInference from './applyInference';
import { ApplyInferenceResult, InferenceMetadata, MagicMenu } from './types';
import { INFERENCE_AI_EDIT_MODE, INFERENCE_AI_METADATA_KEY } from './utils';
import { Metadata } from '@imgly/plugin-utils';

function registerMagicMenu(cesdk: CreativeEditorSDK, magicMenu: MagicMenu) {
  cesdk.setTranslations({
    en: {
      'ly.img.ai.inference.apply': 'Apply',
      'ly.img.ai.inference.before': 'Before',
      'ly.img.ai.inference.after': 'After',
      'ly.img.ai.inference.cancel': 'Cancel',
      'ly.img.ai.inference.processing': 'Generating...'
    }
  });
  const confirmationComponentId = `ly.img.ai.${magicMenu.id}.confirmation.canvasnMenu`;

  const shared: {
    unlock: () => void;
    abort: () => void;
    applyInferenceResult: ApplyInferenceResult | undefined;
  } = {
    unlock: () => {},
    abort: () => {},
    applyInferenceResult: undefined
  };

  const createAbortSignal = () => {
    const controller = new AbortController();
    const signal = controller.signal;
    shared.abort = () => {
      controller.abort();
    };
    return signal;
  };

  cesdk.ui.registerComponent(
    confirmationComponentId,
    ({ builder, engine, state }) => {
      const [selectedId] = engine.block.findAllSelected();
      if (selectedId == null) return null;

      const md = new Metadata<InferenceMetadata>(
        cesdk.engine,
        INFERENCE_AI_METADATA_KEY
      );

      const metadata = md.get(selectedId);

      if (metadata == null) return null;

      switch (metadata.status) {
        case 'processing': {
          builder.Button('processing.spinner', {
            label: [
              `ly.img.ai.inference.${metadata.entryId}.processing`,
              'ly.img.ai.inference.processing'
            ],
            isLoading: true
          });
          builder.Separator('processing.separator');
          builder.Button('processing.cancel', {
            icon: '@imgly/Cross',
            tooltip: 'ly.img.ai.inference.cancel',
            onClick: () => {
              shared.abort();
              md.clear(selectedId);
            }
          });

          break;
        }

        case 'confirmation': {
          const inferenceComparingState = state<'before' | 'after'>(
            'ly.img.ai.inference.comparing',
            'after'
          );

          builder.Button('confirmation.cancel', {
            icon: '@imgly/Cross',
            tooltip: 'ly.img.ai.inference.cancel',
            onClick: () => {
              shared.unlock();
              shared.applyInferenceResult?.onCancel();
              md.clear(selectedId);
            }
          });

          builder.ButtonGroup('confirmation.compare', {
            children: () => {
              builder.Button('confirmation.compare.before', {
                label: `ly.img.ai.inference.before`,
                variant: 'regular',
                isActive: inferenceComparingState.value === 'before',
                onClick: () => {
                  shared.applyInferenceResult?.onBefore();
                  inferenceComparingState.setValue('before');
                }
              });
              builder.Button('confirmation.compare.after', {
                label: `ly.img.ai.inference.after`,
                variant: 'regular',
                isActive: inferenceComparingState.value === 'after',
                onClick: () => {
                  shared.applyInferenceResult?.onAfter();
                  inferenceComparingState.setValue('after');
                }
              });
            }
          });

          builder.Button('confirmation.apply', {
            icon: '@imgly/Checkmark',
            tooltip: 'ly.img.ai.inference.apply',
            color: 'accent',
            isDisabled: inferenceComparingState.value !== 'after',
            onClick: () => {
              shared.unlock();
              shared.applyInferenceResult?.onApply();
              engine.editor.addUndoStep();
              md.clear(selectedId);
            }
          });

          break;
        }

        default: {
          // noop
        }
      }
    }
  );

  const canvasMenuComponentId = `ly.img.ai.${magicMenu.id}.canvasMenu`;
  cesdk.ui.registerComponent(canvasMenuComponentId, (context) => {
    const magicEntries = magicMenu
      .getMagicOrder()
      .map((magicId) => {
        if (magicId === 'ly.img.separator') return magicId;
        const magicEntry = magicMenu.getMagicEntry(magicId);
        if (magicEntry == null) return null;

        const blockId = magicEntry.getBlockId({ cesdk });
        if (blockId == null) return null;

        return { blockId, magicEntry };
      })
      .filter((entry) => entry != null);

    if (
      magicEntries.length === 0 ||
      !magicEntries.some(
        (entry) => typeof entry !== 'string' && entry.blockId != null
      ) ||
      magicEntries.every((entry) => entry === 'ly.img.separator')
    ) {
      return null;
    }

    const { builder, experimental, state } = context;
    const toggleEditState = state<string | undefined>(
      'ly.img.ai.magic.toggleEditState',
      undefined
    );

    experimental.builder.Popover('ly.img.ai.magic.popover', {
      icon: '@imgly/Sparkle',
      variant: 'plain',
      trailingIcon: null,
      children: ({ close }) => {
        builder.Section('ly.img.ai.magic.popover.section', {
          children: () => {
            if (toggleEditState.value != null) {
              const editStateMagicId = toggleEditState.value;
              const magicEntry = magicMenu.getMagicEntry(editStateMagicId);

              if (magicEntry != null && magicEntry.renderEditState != null) {
                magicEntry.renderEditState(context, {
                  closeMenu: close,
                  toggleEditState: () => {
                    toggleEditState.setValue(undefined);
                  },
                  applyInference: async (payload) => {
                    cesdk.ui.setCanvasMenuOrder([confirmationComponentId], {
                      editMode: INFERENCE_AI_EDIT_MODE
                    });

                    const result = await applyInference(
                      cesdk,
                      magicEntry,
                      createAbortSignal(),
                      payload
                    );
                    if (result != null) {
                      shared.unlock = result.unlock;
                      shared.applyInferenceResult = result.appltInferenceResult;
                    }
                  }
                });

                return;
              }
            }
            experimental.builder.Menu('ly.img.ai.magic.menu', {
              children: () => {
                magicEntries.forEach((magicEntry) => {
                  if (magicEntry === 'ly.img.separator') {
                    builder.Separator(
                      `ly.img.ai.magic.separator.${Math.random().toString()}`
                    );
                  } else {
                    magicEntry.magicEntry.renderMenuEntry(context, {
                      closeMenu: close,
                      toggleEditState: () => {
                        if (
                          toggleEditState.value === magicEntry.magicEntry.id
                        ) {
                          toggleEditState.setValue(undefined);
                        } else {
                          toggleEditState.setValue(magicEntry.magicEntry.id);
                        }
                      },
                      applyInference: async (payload) => {
                        if (magicEntry.magicEntry.applyInference == null)
                          return;

                        cesdk.ui.setCanvasMenuOrder([confirmationComponentId], {
                          editMode: INFERENCE_AI_EDIT_MODE
                        });
                        const result = await applyInference(
                          cesdk,
                          magicEntry.magicEntry,
                          createAbortSignal(),
                          payload
                        );
                        if (result != null) {
                          shared.unlock = result.unlock;
                          shared.applyInferenceResult =
                            result.appltInferenceResult;
                        }
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
  });

  return { canvasMenuComponentId };
}

export default registerMagicMenu;
