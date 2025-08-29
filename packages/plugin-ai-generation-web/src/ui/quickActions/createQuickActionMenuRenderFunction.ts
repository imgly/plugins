import CreativeEditorSDK, {
  BuilderRenderFunction,
  CreativeEngine,
  SelectValue
} from '@cesdk/cesdk-js';
import {
  ActionRegistry,
  QuickActionDefinition
} from '../../core/ActionRegistry';
import { Output, OutputKind } from '../../core/provider';
import { isDefined } from '@imgly/plugin-utils';
import { AI_EDIT_MODE } from './utils';
import compactSeparators from '../../utils/compactSeparators';
import getQuickActionOrder from './getQuickActionOrder';
import { ProviderInitializationResult } from '../../providers/initializeProvider';
import handleGenerateFromQuickAction from '../../generation/handleGenerateFromQuickAction';
import { Middleware } from '../../middleware/middleware';
import { ProviderRegistry } from '../../core/ProviderRegistry';

type SupportedQuickAction<K extends OutputKind, I, O extends Output> = {
  definition: QuickActionDefinition<any>;
  /**
   * If defined this provider is used to render the quick action.
   * Otherwise the quick action is rendered with the main provider
   * defined one level up.
   *
   * Used for quick actions that have been defined from a provider
   * that is not the main kind/provider, e.g. a video plugin
   * that defines a quick action for the image provider.
   */
  providerInitializationResult?: ProviderInitializationResult<K, I, O>;
};

type SupportedProviderQuickActions<
  K extends OutputKind,
  I,
  O extends Output
> = {
  /**
   * The main provider from the provider selection
   */
  providerInitializationResult: ProviderInitializationResult<K, I, O>;
  quickActions: (SupportedQuickAction<K, I, O> | 'ly.img.separator')[];
}[];

function createQuickActionMenuRenderFunction<
  K extends OutputKind,
  I,
  O extends Output
>(context: {
  kind: K;
  providerInitializationResults: ProviderInitializationResult<K, I, O>[];

  cesdk: CreativeEditorSDK;
  engine: CreativeEngine;

  debug?: boolean;
  dryRun?: boolean;
  defaultOrder?: string[];
}): Promise<BuilderRenderFunction<any>> {
  const prefix = `ly.img.ai.${context.kind}}`;

  context.cesdk.i18n.setTranslations({
    en: {
      [`ly.img.plugin-ai-generation-web.defaults.quickAction.providerSelect.label`]:
        'Provider'
    }
  });

  const builderRenderFunction: BuilderRenderFunction<{
    children: ('ly.img.separator' | (string & {}))[];
  }> = (builderContext) => {
    if (builderContext.engine.editor.getEditMode() === AI_EDIT_MODE) {
      return;
    }

    const blockIds = builderContext.engine.block.findAllSelected();
    if (blockIds.length === 0) return;

    const { payload } = builderContext;
    const order =
      getQuickActionOrder({
        kind: context.kind,
        cesdk: context.cesdk,
        payload,
        defaultOrder: context.defaultOrder
      }) ?? [];

    if (order.length === 0) return;

    // Get ordered and filtered list of defined quick actions
    const orderedQuickActions = getOrderedQuickActionDefinitions(order).filter(
      (quickActionDefinition) => {
        if (quickActionDefinition === 'ly.img.separator') return true;

        const scopes = quickActionDefinition.scopes;
        if (scopes != null && scopes.length > 0) {
          const isAllowedByScopes = blockIds.every((blockId) => {
            return scopes.every((scope) => {
              return context.engine.block.isAllowedByScope(blockId, scope);
            });
          });
          if (!isAllowedByScopes) return false;
        }

        if (quickActionDefinition.enable != null) {
          if (typeof quickActionDefinition.enable === 'function') {
            return quickActionDefinition.enable({
              engine: context.engine
            });
          } else if (typeof quickActionDefinition.enable === 'boolean') {
            return quickActionDefinition.enable;
          }
        }

        return true;
      }
    );

    // Collect quick actions that are defined by the main provider
    // in case the main provider does not support any quick actions
    // and we just want to render these.
    const quickActionsFromOtherProviders: SupportedQuickAction<K, I, O>[] = [];

    // Collect all provider with their supported quick actions
    const supportedProviderQuickActions =
      context.providerInitializationResults.reduce(
        (
          acc: SupportedProviderQuickActions<K, I, O>,
          providerInitializationResult
        ) => {
          if (providerInitializationResult.provider.kind !== context.kind)
            return acc;

          let quickActions = orderedQuickActions
            .map((quickAction) => {
              if (quickAction === 'ly.img.separator') return quickAction;

              // Check if the main provider supports this quick action
              if (
                providerInitializationResult.provider.input?.quickActions
                  ?.supported?.[quickAction.id] != null
              ) {
                return {
                  definition: quickAction
                };
              } else {
                // Check if this quick action comes from another provider that
                // is not the main provider.
                const otherProviderInitializationResult = ProviderRegistry.get()
                  .getAll()
                  .filter((registeredProvider) => {
                    return (
                      // We are looking for provider from another kind
                      // and assume that all provider from the same kind
                      // have been passed as main provider
                      registeredProvider.provider.kind !== context.kind &&
                      registeredProvider.provider.id !==
                        providerInitializationResult.provider.id
                    );
                  })
                  .find((registeredProvider) => {
                    return (
                      registeredProvider.provider.input?.quickActions
                        ?.supported?.[quickAction.id] != null
                    );
                  });
                if (otherProviderInitializationResult != null) {
                  const quickActionSupport: SupportedQuickAction<K, I, O> = {
                    definition: quickAction,
                    providerInitializationResult:
                      otherProviderInitializationResult
                  };
                  quickActionsFromOtherProviders.push(quickActionSupport);
                  return quickActionSupport;
                } else {
                  return undefined;
                }
              }
            })
            .filter(isDefined);
          // Clean up the quick action list so we can render it directly
          quickActions = compactSeparators(quickActions);

          if (
            quickActions.length === 0 ||
            quickActions.every((entry) => entry === 'ly.img.separator')
          )
            return acc;

          if (
            quickActions.every(
              (quickAction) =>
                quickAction === 'ly.img.separator' ||
                quickAction.providerInitializationResult != null
            )
          ) {
            // This provider has no quick actions from the current main provider.
            // We do not want to add the main provider to the selection
            // list with just actions from other providers.
            return acc;
          }

          acc.push({
            providerInitializationResult,
            quickActions
          });

          return acc;
        },
        []
      );

    if (supportedProviderQuickActions.length === 0) {
      if (quickActionsFromOtherProviders.length > 0) {
        // Remove duplicates from quickActionsFromOtherProviders
        const seen = new Map<string, SupportedQuickAction<K, I, O>>();
        quickActionsFromOtherProviders.forEach((quickAction) => {
          const id = quickAction.definition.id;
          if (!seen.has(id)) {
            seen.set(id, quickAction);
          }
        });
        const uniqueQuickActions = Array.from(seen.values());

        // If we have quick actions from other providers, we can render them
        supportedProviderQuickActions.push({
          // Use the first provider as main but since we do not want to
          // render the provider selection, we do not care what provider it is.
          // The actual provider used is the one defined in the object.
          providerInitializationResult:
            uniqueQuickActions[0].providerInitializationResult ??
            context.providerInitializationResults[0],
          quickActions: uniqueQuickActions
        });
      } else {
        // Noting to do
        return;
      }
    }

    const providerValues: SelectValue[] = supportedProviderQuickActions.map(
      ({ providerInitializationResult }) => ({
        id: providerInitializationResult.provider.id,
        label:
          providerInitializationResult.provider.name ??
          providerInitializationResult.provider.id
      })
    );

    const currentProviderState = builderContext.experimental.global(
      `${prefix}.currentProvider`,
      providerValues[0]
    );
    const currentSupportedQuickActions = supportedProviderQuickActions.find(
      ({
        providerInitializationResult: {
          provider: { id }
        }
      }) => id === currentProviderState.value?.id
    );

    const isEveryBlockInReadyState = blockIds.every((blockId) => {
      return builderContext.engine.block.getState(blockId).type === 'Ready';
    });

    const { builder, experimental, state } = builderContext;

    const isGeneratingState = state<boolean>(`${prefix}.isGenerating`, false);
    const toggleExpandedState = state<string | undefined>(
      `${prefix}.toggleExpandedState`,
      undefined
    );

    // Middleware to track generation status
    const isGeneratingMiddleware: Middleware<I, O> = async (
      input,
      options,
      next
    ) => {
      isGeneratingState.setValue(true);
      try {
        const result = await next(input, options);
        return result;
      } finally {
        isGeneratingState.setValue(false);
      }
    };

    experimental.builder.Popover(`${prefix}.popover`, {
      icon: '@imgly/Sparkle',
      variant: 'plain',
      isDisabled: !isEveryBlockInReadyState,
      isLoading: isGeneratingState.value,
      trailingIcon: null,
      children: ({ close }) => {
        if (toggleExpandedState.value !== undefined) {
          // ==========================================
          // === RENDER EXPANDED QUICK ACTION STATE ===
          // ==========================================

          const expandedQuickAction =
            currentSupportedQuickActions?.quickActions.find(
              (quickAction) =>
                quickAction !== 'ly.img.separator' &&
                quickAction.definition.id === toggleExpandedState.value
            ) as SupportedQuickAction<K, I, O> | undefined;

          if (
            expandedQuickAction == null ||
            expandedQuickAction.definition.render == null
          ) {
            return;
          }

          // Use only providers that support the current expanded quick action
          const providerValuesForExpandedQuickAction: SelectValue[] =
            supportedProviderQuickActions
              .filter(({ quickActions }) =>
                quickActions.some(
                  (qa) =>
                    qa !== 'ly.img.separator' &&
                    qa.definition.id === expandedQuickAction.definition.id
                )
              )
              .map(({ providerInitializationResult }) => ({
                id: providerInitializationResult.provider.id,
                label:
                  providerInitializationResult.provider.name ??
                  providerInitializationResult.provider.id
              }));

          if (providerValuesForExpandedQuickAction.length > 1) {
            builder.Section(`${prefix}.popover.expanded.header`, {
              children: () => {
                builder.Select(`${prefix}.expanded.providerSelect.select`, {
                  inputLabel: [
                    `ly.img.plugin-ai-${context.kind}-generation-web.quickAction.providerSelect.label`,
                    `ly.img.plugin-ai-generation-web.defaults.quickAction.providerSelect.label`
                  ],
                  values: providerValuesForExpandedQuickAction,
                  ...currentProviderState
                });
              }
            });
          }
          builder.Section(`${prefix}.popover.expanded.section`, {
            children: () => {
              return expandedQuickAction.definition.render({
                ...builderContext,
                toggleExpand: () => {
                  toggleExpandedState.setValue(undefined);
                },
                isExpanded: true,
                generate: handleGenerateFromQuickAction({
                  blockIds,
                  providerInitializationResult:
                    expandedQuickAction.providerInitializationResult ??
                    currentSupportedQuickActions?.providerInitializationResult,
                  quickAction: expandedQuickAction.definition,
                  middlewares: [isGeneratingMiddleware],

                  confirmation:
                    expandedQuickAction.definition.defaults?.confirmation ??
                    true,

                  lock: expandedQuickAction.definition.defaults?.lock ?? true,

                  close,
                  cesdk: context.cesdk,
                  debug: context.debug,
                  dryRun: context.dryRun
                }),
                close,
                providerId: currentProviderState.value.id
              });
            }
          });
        } else {
          // =========================================
          // === RENDER REGULAR QUICK ACTIONS MENU ===
          // =========================================
          if (providerValues.length > 1) {
            builder.Section(`${prefix}.popover.header`, {
              children: () => {
                builder.Select(`${prefix}.providerSelect.select`, {
                  inputLabel: [
                    `ly.img.plugin-ai-${context.kind}-generation-web.quickAction.providerSelect.label`,
                    `ly.img.plugin-ai-generation-web.defaults.quickAction.providerSelect.label`
                  ],
                  values: providerValues,
                  ...currentProviderState
                });
              }
            });
          }
          builder.Section(`${prefix}.popover.section`, {
            children: () => {
              experimental.builder.Menu(`${prefix}.menu`, {
                children: () => {
                  currentSupportedQuickActions?.quickActions.forEach(
                    (quickAction) => {
                      if (quickAction === 'ly.img.separator') {
                        builder.Separator(
                          `${prefix}.separator.${Math.random().toString()}`
                        );
                        return;
                      }
                      if (quickAction.definition.render == null) return;
                      quickAction.definition.render({
                        ...builderContext,
                        toggleExpand: () => {
                          toggleExpandedState.setValue(
                            quickAction.definition.id
                          );
                        },
                        isExpanded: false,
                        generate: handleGenerateFromQuickAction({
                          blockIds,
                          providerInitializationResult:
                            quickAction.providerInitializationResult ??
                            currentSupportedQuickActions?.providerInitializationResult,
                          quickAction: quickAction.definition,
                          middlewares: [isGeneratingMiddleware],

                          confirmation:
                            quickAction.definition.defaults?.confirmation ??
                            true,

                          close,
                          cesdk: context.cesdk,
                          debug: context.debug,
                          dryRun: context.dryRun
                        }),
                        close,
                        providerId: currentProviderState.value.id
                      });
                    }
                  );
                }
              });
            }
          });
        }
      }
    });
  };
  return Promise.resolve(builderRenderFunction);
}

function getOrderedQuickActionDefinitions(
  order: string[]
): (QuickActionDefinition<any> | 'ly.img.separator')[] {
  return order
    .map((quickActionId) => {
      if (quickActionId === 'ly.img.separator')
        return quickActionId as 'ly.img.separator';

      const quickAction = ActionRegistry.get().getBy({
        id: quickActionId,
        type: 'quick'
      })[0];

      return quickAction;
    })
    .filter(isDefined);
}

export default createQuickActionMenuRenderFunction;
