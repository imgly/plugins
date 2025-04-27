import CreativeEditorSDK from '@cesdk/cesdk-js';
import { InferenceMetadata, QuickActionMenu, ApplyCallbacks } from './types';
import {
  getFeatureIdForQuickAction,
  INFERENCE_AI_METADATA_KEY,
  removeDuplicatedSeparators
} from './utils';
import { Metadata } from '@imgly/plugin-utils';
import Provider, { Output, OutputKind } from '../provider';
import { isAbortError } from '../../utils';
import { InitProviderConfiguration } from '../types';
import handleGenerationError from '../handleGenerationError';
import generate from './generate';

function registerQuickActionMenuComponent<
  K extends OutputKind,
  I,
  O extends Output
>(
  options: {
    cesdk: CreativeEditorSDK;
    quickActionMenu: QuickActionMenu;
    provider: Provider<K, I, O>;
  },
  config: InitProviderConfiguration
) {
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
                  handleGenerationError: (error) => {
                    handleGenerationError(
                      error,
                      {
                        cesdk,
                        provider
                      },
                      config
                    );
                  },
                  generate: async (input, generateOptions) => {
                    try {
                      const { returnValue, applyCallbacks, dispose } =
                        await generate(
                          {
                            input,
                            quickAction,
                            quickActionMenu,
                            provider,
                            cesdk,
                            abortSignal: createAbortSignal(),
                            blockIds: generateOptions?.blockIds ?? blockIds,
                            confirmationComponentId
                          },
                          config
                        );

                      shared.unlock = dispose;
                      shared.applyCallbacks = applyCallbacks;

                      return returnValue;
                    } catch (error) {
                      if (!isAbortError(error)) {
                        handleGenerationError(
                          error,
                          {
                            cesdk,
                            provider
                          },
                          config
                        );
                      }
                      throw error;
                    }
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
                      handleGenerationError: (error) => {
                        handleGenerationError(
                          error,
                          {
                            cesdk,
                            provider
                          },
                          config
                        );
                      },
                      toggleExpand: () => {
                        toggleExpandedState.setValue(quickAction.id);
                      },
                      generate: async (input, generateOptions) => {
                        try {
                          const { returnValue, applyCallbacks, dispose } =
                            await generate(
                              {
                                input,
                                quickAction,
                                quickActionMenu,
                                provider,
                                cesdk,
                                abortSignal: createAbortSignal(),
                                blockIds: generateOptions?.blockIds ?? blockIds,
                                confirmationComponentId
                              },
                              config
                            );

                          shared.unlock = dispose;
                          shared.applyCallbacks = applyCallbacks;
                          return returnValue;
                        } catch (error) {
                          if (!isAbortError(error)) {
                            handleGenerationError(
                              error,
                              {
                                cesdk,
                                provider
                              },
                              config
                            );
                          }
                          throw error;
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

export default registerQuickActionMenuComponent;
