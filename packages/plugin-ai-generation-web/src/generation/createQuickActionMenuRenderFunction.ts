import CreativeEditorSDK, {
  BuilderRenderFunction,
  CreativeEngine,
  SelectValue
} from '@cesdk/cesdk-js';
import { ActionRegistry, QuickActionDefinition } from '../ActionRegistry';
import { Output, OutputKind } from './provider';
import { isDefined } from '@imgly/plugin-utils';
import { AI_EDIT_MODE } from './quickAction/utils';
import compactSeparators from '../compactSeparators';
import getQuickActionOrder from './getQuickActionOrder';
import { ProviderInitializationResult } from './initializeProvider';
import handleGenerateFromQuickAction from './handleGenerateFromQuickAction';
import { Middleware } from './middleware/middleware';

type SupportedProviderQuickActions<
  K extends OutputKind,
  I,
  O extends Output
> = {
  providerInitializationResult: ProviderInitializationResult<K, I, O>;
  quickActions: (QuickActionDefinition<any> | 'ly.img.separator')[];
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
}): Promise<BuilderRenderFunction<any>> {
  const prefix = `ly.img.ai.${context.kind}}`;

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
        payload
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

    // Collect all provider with their supported quick actions
    const supportedProviderQuickActions =
      context.providerInitializationResults.reduce(
        (
          acc: SupportedProviderQuickActions<K, I, O>,
          providerInitializationResult
        ) => {
          if (providerInitializationResult.provider.kind !== context.kind)
            return acc;

          let quickActions = orderedQuickActions.filter((quickAction) => {
            if (quickAction === 'ly.img.separator') return true;

            // Check if the provider supports this quick action
            return (
              providerInitializationResult.provider.input?.quickActions
                ?.supported?.[quickAction.id] != null
            );
          });

          quickActions = compactSeparators(quickActions);

          if (
            quickActions.length === 0 ||
            quickActions.every((entry) => entry === 'ly.img.separator')
          )
            return acc;

          acc.push({
            providerInitializationResult,
            quickActions
          });

          return acc;
        },
        []
      );

    if (supportedProviderQuickActions.length === 0) return;

    const providerValues: SelectValue[] = supportedProviderQuickActions.map(
      ({ providerInitializationResult }) => ({
        id: providerInitializationResult.provider.id,
        label:
          providerInitializationResult.provider.name ??
          providerInitializationResult.provider.id
      })
    );

    const currentProviderState = builderContext.state(
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
        if (toggleExpandedState.value == null && providerValues.length > 1) {
          builder.Section(`${prefix}.popover.section.providerSelect`, {
            children: () => {
              builder.Select(`${prefix}.providerSelect.select`, {
                inputLabel: 'Provider',
                values: providerValues,
                ...currentProviderState
              });
            }
          });
        }
        builder.Section(`${prefix}.popover.section`, {
          children: () => {
            if (toggleExpandedState.value !== undefined) {
              const expandedQuickAction =
                currentSupportedQuickActions?.quickActions.find(
                  (quickAction) =>
                    quickAction !== 'ly.img.separator' &&
                    quickAction.id === toggleExpandedState.value
                ) as QuickActionDefinition<any> | undefined;

              if (
                expandedQuickAction != null &&
                expandedQuickAction.render != null
              ) {
                return expandedQuickAction.render({
                  ...builderContext,
                  toggleExpand: () => {
                    toggleExpandedState.setValue(undefined);
                  },
                  isExpanded: true,
                  generate: handleGenerateFromQuickAction({
                    blockIds,
                    providerInitializationResult:
                      currentSupportedQuickActions?.providerInitializationResult,
                    quickAction: expandedQuickAction,
                    middlewares: [isGeneratingMiddleware],

                    confirmation:
                      expandedQuickAction.defaults?.confirmation ?? true,

                    close,
                    cesdk: context.cesdk,
                    debug: context.debug
                  }),
                  close
                });
              }
              return;
            }
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
                    if (quickAction.render == null) return;
                    quickAction.render({
                      ...builderContext,
                      toggleExpand: () => {
                        toggleExpandedState.setValue(quickAction.id);
                      },
                      isExpanded: false,
                      generate: handleGenerateFromQuickAction({
                        blockIds,
                        providerInitializationResult:
                          currentSupportedQuickActions?.providerInitializationResult,
                        quickAction,
                        middlewares: [isGeneratingMiddleware],

                        confirmation:
                          quickAction.defaults?.confirmation ?? true,

                        close,
                        cesdk: context.cesdk,
                        debug: true // context.debug
                      }),
                      close
                    });
                  }
                );
              }
            });
          }
        });
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
