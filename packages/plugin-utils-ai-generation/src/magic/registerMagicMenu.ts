import CreativeEditorSDK from '@cesdk/cesdk-js';
import applyInference from './applyInference';
import { ApplyInferenceResult, InferenceMetadata, MagicMenu } from './types';
import {
  INFERENCE_AI_EDIT_MODE,
  INFERENCE_AI_METADATA_KEY,
  INFERENCE_CONFIRMATION_COMPONENT_ID
} from './utils';
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

  let unlock: () => void = () => {};
  let abort: () => void = () => {};
  let applyInferenceResult: ApplyInferenceResult | undefined;

  const createAbortSignal = () => {
    const controller = new AbortController();
    const signal = controller.signal;
    abort = () => {
      controller.abort();
    };
    return signal;
  };

  cesdk.ui.registerComponent(
    INFERENCE_CONFIRMATION_COMPONENT_ID,
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
              abort();
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
              unlock();
              applyInferenceResult?.onCancel();
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
                  applyInferenceResult?.onBefore();
                  inferenceComparingState.setValue('before');
                }
              });
              builder.Button('confirmation.compare.after', {
                label: `ly.img.ai.inference.after`,
                variant: 'regular',
                isActive: inferenceComparingState.value === 'after',
                onClick: () => {
                  applyInferenceResult?.onAfter();
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
              unlock();
              applyInferenceResult?.onApply();
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

  cesdk.ui.setCanvasMenuOrder([INFERENCE_CONFIRMATION_COMPONENT_ID], {
    editMode: INFERENCE_AI_EDIT_MODE
  });

  const canvasMenuComponentId = `ly.img.ai.${magicMenu.id}.canvasMenu`;
  cesdk.ui.registerComponent(canvasMenuComponentId, (context) => {
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
                    const result = await applyInference(
                      cesdk,
                      magicEntry,
                      createAbortSignal(),
                      payload
                    );
                    if (result != null) {
                      unlock = result.unlock;
                      applyInferenceResult = result.appltInferenceResult;
                    }
                  }
                });

                return;
              }
            }
            experimental.builder.Menu('ly.img.ai.magic.menu', {
              children: () => {
                magicMenu.getMagicOrder().forEach((magicId) => {
                  if (magicId === 'ly.img.separator') {
                    builder.Separator(
                      `ly.img.ai.magic.separator.${Math.random().toString()}`
                    );
                  } else {
                    const magicEntry = magicMenu.getMagicEntry(magicId);

                    if (
                      magicEntry != null &&
                      magicEntry.getBlockId({ cesdk }) != null
                    ) {
                      magicEntry.renderMenuEntry(context, {
                        closeMenu: close,
                        toggleEditState: () => {
                          if (toggleEditState.value === magicId) {
                            toggleEditState.setValue(undefined);
                          } else {
                            toggleEditState.setValue(magicId);
                          }
                        },
                        applyInference: async (payload) => {
                          const result = await applyInference(
                            cesdk,
                            magicEntry,
                            createAbortSignal(),
                            payload
                          );
                          if (result != null) {
                            unlock = result.unlock;
                            applyInferenceResult = result.appltInferenceResult;
                          }
                        }
                      });
                    }
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
