import CreativeEditorSDK from '@cesdk/cesdk-js';
import { InferenceMetadata, QuickActionMenu, ApplyCallbacks } from './types';
import {
  getFeatureIdForQuickAction,
  INFERENCE_AI_EDIT_MODE,
  INFERENCE_AI_METADATA_KEY,
  removeDuplicatedSeparators
} from './utils';
import { Metadata } from '@imgly/plugin-utils';
import Provider, {
  GenerationOptions,
  Output,
  OutputKind,
  QuickAction
} from '../provider';
import { composeMiddlewares } from '../middleware/middleware';
import loggingMiddleware from '../middleware/loggingMiddleware';
import highlightBlocksMiddleware from '../middleware/highlightBlocksMiddleware';
import pendingMiddleware from '../middleware/pendingMiddleware';
import lockMiddleware from '../middleware/lockMiddleware';
import consumeGeneratedResult from './consumeGeneratedResult';
import editModeMiddleware from '../middleware/editModeMiddleware';

function registerQuickActionMenuComponent<
  K extends OutputKind,
  I,
  O extends Output
>(options: {
  cesdk: CreativeEditorSDK;
  quickActionMenu: QuickActionMenu;
  provider: Provider<K, I, O>;
}) {
  const { cesdk, quickActionMenu, provider } = options;

  const prefix = `ly.img.ai.${quickActionMenu.id}`;
  const confirmationPrefix = `${prefix}.confirmation`;
  cesdk.setTranslations({
    en: {
      [`${confirmationPrefix}.apply`]: 'Apply',
      [`${confirmationPrefix}.before`]: 'Before',
      [`${confirmationPrefix}.after`]: 'After',
      [`${prefix}.cancel`]: 'Cancel',
      [`${prefix}.processing`]: 'Generating...'
    }
  });
  const confirmationComponentId = `${confirmationPrefix}.canvasnMenu`;

  const shared: {
    unlock: () => void;
    abort: () => void;
    applyCallbacks: ApplyCallbacks | undefined;
  } = {
    unlock: () => {},
    abort: () => {},
    applyCallbacks: undefined
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
      const blockIds = engine.block.findAllSelected();
      if (blockIds.length === 0) return null;

      const md = new Metadata<InferenceMetadata>(
        cesdk.engine,
        INFERENCE_AI_METADATA_KEY
      );

      // All blocks must have the same metadata
      const metadata = md.get(blockIds[0]);
      if (metadata == null) return null;

      const clearMetadata = () => {
        blockIds.forEach((blockId) => {
          md.clear(blockId);
        });
      };

      switch (metadata.status) {
        case 'processing': {
          builder.Button(`${prefix}.spinner`, {
            label: [
              `ly.img.ai.inference.${metadata.quickActionId}.processing`,
              `${prefix}.cancel`
            ],
            isLoading: true
          });
          builder.Separator(`${prefix}.separator`);
          builder.Button(`${prefix}.cancel`, {
            icon: '@imgly/Cross',
            tooltip: `${prefix}.cancel`,
            onClick: () => {
              shared.abort();
              clearMetadata();
            }
          });

          break;
        }

        case 'confirmation': {
          const comparingState = state<'before' | 'after'>(
            `${confirmationPrefix}.comparing`,
            'after'
          );

          const onCancel = shared.applyCallbacks?.onCancel;
          if (onCancel != null) {
            builder.Button(`${confirmationPrefix}.cancel`, {
              icon: '@imgly/Cross',
              tooltip: `${prefix}.cancel`,
              onClick: () => {
                shared.unlock();
                onCancel();
                clearMetadata();
              }
            });
          }

          const onBefore = shared.applyCallbacks?.onBefore;
          const onAfter = shared.applyCallbacks?.onAfter;

          if (onBefore != null && onAfter != null) {
            builder.ButtonGroup(`${confirmationPrefix}.compare`, {
              children: () => {
                builder.Button(`${confirmationPrefix}.compare.before`, {
                  label: `${confirmationPrefix}.before`,
                  variant: 'regular',
                  isActive: comparingState.value === 'before',
                  onClick: () => {
                    onBefore();
                    comparingState.setValue('before');
                  }
                });
                builder.Button(`${confirmationPrefix}.compare.after`, {
                  label: `${confirmationPrefix}.after`,
                  variant: 'regular',
                  isActive: comparingState.value === 'after',
                  onClick: () => {
                    onAfter();
                    comparingState.setValue('after');
                  }
                });
              }
            });
          }

          const onApply = shared.applyCallbacks?.onApply;
          if (onApply != null) {
            builder.Button(`${confirmationPrefix}.apply`, {
              icon: '@imgly/Checkmark',
              tooltip: `${confirmationPrefix}.apply`,
              color: 'accent',
              isDisabled: comparingState.value !== 'after',
              onClick: () => {
                shared.unlock();
                clearMetadata();

                // Activating the old history happens in the next update lop.
                // @ts-ignore
                cesdk.engine.editor._update();

                onApply();
                engine.editor.addUndoStep();
              }
            });
          }

          break;
        }

        default: {
          // noop
        }
      }
    }
  );

  const canvasMenuComponentId = `${prefix}.canvasMenu`;
  cesdk.ui.registerComponent(canvasMenuComponentId, (context) => {
    const blockIds = context.engine.block.findAllSelected();

    let quickActions = quickActionMenu
      .getQuickActionMenuOrder()
      .map((quickActionId) => {
        if (quickActionId === 'ly.img.separator') return quickActionId;
        const quickAction = quickActionMenu.getQuickAction<I, O>(quickActionId);
        if (quickAction == null) return null;

        const isEnabled = cesdk.feature.isEnabled(
          getFeatureIdForQuickAction({
            quickActionId,
            quickActionMenuId: quickActionMenu.id
          }),
          {
            engine: context.engine
          }
        );
        if (!isEnabled) return null;

        const scopes = quickAction.scopes;
        if (scopes != null && scopes.length > 0) {
          const isAllowedByScopes = blockIds.every((blockId) => {
            return scopes.every((scope) => {
              return context.engine.block.isAllowedByScope(blockId, scope);
            });
          });
          if (!isAllowedByScopes) return null;
        }
        return quickAction;
      })
      .filter((entry) => entry != null);

    quickActions = removeDuplicatedSeparators(quickActions);

    if (
      quickActions.length === 0 ||
      quickActions.every((entry) => entry === 'ly.img.separator')
    ) {
      return null;
    }

    const { builder, experimental, state } = context;
    const toggleExpandedState = state<string | undefined>(
      `${prefix}.toggleExpandedState`,
      undefined
    );

    experimental.builder.Popover(`${prefix}.popover`, {
      icon: '@imgly/Sparkle',
      variant: 'plain',
      trailingIcon: null,
      children: ({ close }) => {
        builder.Section(`${prefix}.popover.section`, {
          children: () => {
            if (toggleExpandedState.value != null) {
              const expandStateForQuickActionId = toggleExpandedState.value;
              const quickAction = quickActionMenu.getQuickAction<I, O>(
                expandStateForQuickActionId
              );

              if (quickAction != null && quickAction.renderExpanded != null) {
                quickAction.renderExpanded(context, {
                  blockIds,
                  closeMenu: close,
                  toggleExpand: () => {
                    toggleExpandedState.setValue(undefined);
                  },
                  generate: async (input, generateOptions) => {
                    const { returnValue, applyCallbacks, dispose } =
                      await triggerGeneration({
                        input,
                        quickAction,
                        quickActionMenu,
                        provider,
                        cesdk,
                        abortSignal: createAbortSignal(),
                        blockIds: generateOptions?.blockIds ?? blockIds,
                        confirmationComponentId
                      });

                    shared.unlock = dispose;
                    shared.applyCallbacks = applyCallbacks;

                    return returnValue;
                  }
                });

                return;
              }
            }

            experimental.builder.Menu(`${prefix}.menu`, {
              children: () => {
                quickActions.forEach((quickAction) => {
                  if (quickAction === 'ly.img.separator') {
                    builder.Separator(
                      `${prefix}.separator.${Math.random().toString()}`
                    );
                  } else {
                    quickAction.render(context, {
                      blockIds,
                      closeMenu: close,
                      toggleExpand: () => {
                        toggleExpandedState.setValue(quickAction.id);
                      },
                      generate: async (input, generateOptions) => {
                        const { returnValue, applyCallbacks, dispose } =
                          await triggerGeneration({
                            input,
                            quickAction,
                            quickActionMenu,
                            provider,
                            cesdk,
                            abortSignal: createAbortSignal(),
                            blockIds: generateOptions?.blockIds ?? blockIds,
                            confirmationComponentId
                          });

                        shared.unlock = dispose;
                        shared.applyCallbacks = applyCallbacks;
                        return returnValue;
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

async function triggerGeneration<
  K extends OutputKind,
  I,
  O extends Output
>(options: {
  input: I;
  blockIds: number[];
  cesdk: CreativeEditorSDK;
  quickAction: QuickAction<I, O>;
  quickActionMenu: QuickActionMenu;
  provider: Provider<K, I, O>;
  abortSignal: AbortSignal;
  confirmationComponentId: string;
}): Promise<{
  dispose: () => void;
  returnValue: O;
  applyCallbacks?: ApplyCallbacks;
}> {
  const {
    cesdk,
    input,
    blockIds,
    provider,
    quickAction,
    confirmationComponentId,
    abortSignal
  } = options;
  if (quickAction.confirmation) {
    cesdk.ui.setCanvasMenuOrder([confirmationComponentId], {
      editMode: INFERENCE_AI_EDIT_MODE
    });
  }

  const metadata = new Metadata<InferenceMetadata>(
    cesdk.engine,
    INFERENCE_AI_METADATA_KEY
  );
  blockIds.forEach((blockId) => {
    metadata.set(blockId, {
      status: 'processing',
      quickActionId: quickAction.id
    });
  });

  const generationOptions: GenerationOptions = {
    cesdk,
    engine: cesdk.engine,
    abortSignal
  };

  const composedMiddlewares = composeMiddlewares<I, O>([
    loggingMiddleware(),
    pendingMiddleware({}),
    ...(quickAction.confirmation
      ? [
          quickAction.lockDuringConfirmation
            ? editModeMiddleware<I, O>({
                editMode: INFERENCE_AI_EDIT_MODE
              })
            : lockMiddleware<I, O>({
                editMode: INFERENCE_AI_EDIT_MODE
              }),
          quickAction.confirmation && highlightBlocksMiddleware<I, O>({})
        ]
      : [])
  ]);

  const { result: generationResult, dispose: generationDispose } =
    await composedMiddlewares(provider.output.generate)(
      input,
      generationOptions
    );

  const { consumedGenerationResult, applyCallbacks } =
    await consumeGeneratedResult(generationResult, {
      abortSignal,
      kind: provider.kind,
      blockIds,
      cesdk
    });

  if (quickAction.confirmation) {
    blockIds.forEach((blockId) => {
      metadata.set(blockId, {
        status: 'confirmation',
        quickActionId: quickAction.id
      });
    });
  } else {
    blockIds.forEach((blockId) => {
      metadata.clear(blockId);
    });
  }

  const dispose = () => {
    generationDispose();
    blockIds.forEach((blockId) => {
      metadata.clear(blockId);
    });
  };

  abortSignal.addEventListener('abort', dispose);

  return {
    dispose,
    returnValue: consumedGenerationResult,
    applyCallbacks
  };
}

export default registerQuickActionMenuComponent;
