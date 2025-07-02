import CreativeEditorSDK, {
  BuilderRenderFunction,
  CreativeEngine,
  SelectValue
} from '@cesdk/cesdk-js';
import { ActionRegistry, QuickActionDefinition } from '../ActionRegistry';
import Provider, { Output, OutputKind } from './provider';
import { isDefined } from '@imgly/plugin-utils';
import { INFERENCE_AI_EDIT_MODE } from './quickAction/utils';
import compactSeparators from '../compactSeparators';
import getQuickActionOrder from './getQuickActionOrder';

function createQuickActionMenuRenderFunction<
  K extends OutputKind,
  I,
  O extends Output
>(context: {
  kind: K;
  providers?: Provider<K, I, O>[];

  cesdk: CreativeEditorSDK;
  engine: CreativeEngine;
}): Promise<BuilderRenderFunction<any>> {
  const prefix = `ly.img.ai.${context.kind}}`;
  const registry = ActionRegistry.get();

  const builderRenderFunction: BuilderRenderFunction<{
    children: ('ly.img.separator' | (string & {}))[];
  }> = (builderContext) => {
    if (builderContext.engine.editor.getEditMode() === INFERENCE_AI_EDIT_MODE) {
      return;
    }

    const { payload } = builderContext;
    const quickActionOrder =
      getQuickActionOrder({
        kind: context.kind,
        cesdk: context.cesdk,
        payload
      }) ?? [];

    if (quickActionOrder.length === 0) return;

    const blockIds = builderContext.engine.block.findAllSelected();
    if (blockIds.length === 0) return;

    const providerValues: SelectValue[] = context.providers.map((provider) => ({
      id: provider.id,
      label: provider.name ?? provider.id
    }));

    const currentProviderState = builderContext.state(
      `${prefix}.currentProvider`,
      providerValues[0]
    );
    const currentProvider = context.providers.find(
      ({ id }) => id === currentProviderState.value?.id
    );

    let quickActions: (QuickActionDefinition | 'ly.img.separator')[] =
      quickActionOrder
        .map((quickActionId) => {
          if (quickActionId === 'ly.img.separator')
            return quickActionId as 'ly.img.separator';

          const quickAction = registry.getBy({
            id: quickActionId,
            type: 'quick',
            kind: context.kind
          })[0];

          if (quickAction == null) return undefined;

          if (
            currentProvider?.input?.quickActions?.supported?.[quickActionId] ==
            null
          ) {
            return undefined;
          }

          const scopes = quickAction.scopes;
          if (scopes != null && scopes.length > 0) {
            const isAllowedByScopes = blockIds.every((blockId) => {
              return scopes.every((scope) => {
                return context.engine.block.isAllowedByScope(blockId, scope);
              });
            });
            if (!isAllowedByScopes) return undefined;
          }

          return quickAction;
        })
        .filter(isDefined);

    if (
      quickActions.length === 0 ||
      quickActions.every((entry) => entry === 'ly.img.separator')
    ) {
      return null;
    }

    quickActions = compactSeparators(quickActions);

    const isEveryBlockInReadyState = blockIds.every((blockId) => {
      return builderContext.engine.block.getState(blockId).type === 'Ready';
    });

    const { builder, experimental, state } = builderContext;

    const toggleExpandedState = state<string | undefined>(
      `${prefix}.toggleExpandedState`,
      undefined
    );

    experimental.builder.Popover(`${prefix}.popover`, {
      icon: '@imgly/Sparkle',
      variant: 'plain',
      isDisabled: !isEveryBlockInReadyState,
      trailingIcon: null,
      children: ({ close }) => {
        builder.Section(`${prefix}.popover.section`, {
          children: () => {
            if (context.providers.length > 1) {
              builder.Select(`${prefix}.providerSelect.select`, {
                inputLabel: 'Provider',
                values: providerValues,
                ...currentProviderState
              });
            }

            if (toggleExpandedState.value !== undefined) {
              const expandedQuickAction = quickActions.find(
                (quickAction) =>
                  quickAction !== 'ly.img.separator' &&
                  quickAction.id === toggleExpandedState.value
              ) as QuickActionDefinition | undefined;

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
                  generate: async (input: any) => {
                    // TODO: Implement provider capability matching
                    throw new Error(
                      'Generate function not yet implemented for global quick actions'
                    );
                  },
                  close
                });
              }
              return;
            }
            experimental.builder.Menu(`${prefix}.menu`, {
              children: () => {
                quickActions.forEach((quickAction) => {
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
                    generate: async (input: any) => {
                      // TODO: Implement provider capability matching
                      throw new Error(
                        'Generate function not yet implemented for global quick actions'
                      );
                    },
                    close
                  });
                });
              }
            });
          }
        });
      }
    });
  };
  return Promise.resolve(builderRenderFunction);
}

export default createQuickActionMenuRenderFunction;
