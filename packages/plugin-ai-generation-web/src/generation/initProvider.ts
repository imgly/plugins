import type Provider from './provider';
import {
  OutputKind,
  PanelInput,
  QuickActionsInput,
  type Output
} from './provider';
import registerPanelInputSchema from './registerPanelInputSchema';
import registerPanelInputCustom from './registerPanelInputCustom';
import { InitProviderConfiguration, Options, UIOptions } from './types';
import { BuilderRenderFunction, type CreativeEngine } from '@cesdk/cesdk-js';
import { IndexedDBAssetSource } from '@imgly/plugin-utils';
import icons from '../icons';
import getQuickActionRegistry from './quickAction/getQuickActionRegistry';
import { getFeatureIdForQuickAction } from './quickAction/utils';
import registerQuickActionMenuComponent from './quickAction/registerQuickActionMenuComponent';
import { QuickActionMenu } from './quickAction/types';
import createGenerateFunction from './quickAction/generate';
import { createHandleGenerationError } from './handleGenerationError';

type RenderBuilderFunctions = {
  panel?: BuilderRenderFunction<any>;
};

/**
 * Initialize the provider. Based on the given options and configuration
 * it will register panels and components that is used to render
 * the provider in the UI.
 *
 * @param provider The provider to initialize.
 * @param options The options to use for the provider.
 * @param config The configuration to use for the provider.
 */
async function initProvider<K extends OutputKind, I, O extends Output>(
  provider: Provider<K, I, O>,
  options: Options,
  config: InitProviderConfiguration
): Promise<{
  renderBuilderFunctions?: RenderBuilderFunctions;
}> {
  await provider.initialize?.(options);
  const historyAssetSourceId = await initHistory(
    options.engine,
    provider.id,
    provider.output.history ?? '@imgly/local'
  );

  if (options.cesdk == null) {
    return {};
  }

  const historyAssetLibraryEntryId = historyAssetSourceId
    ? `${provider.id}.history.entry`
    : undefined;
  const uiOptions: UIOptions = {
    ...options,
    cesdk: options.cesdk,
    historyAssetSourceId,
    historyAssetLibraryEntryId,
    i18n: {
      prompt: 'common.ai-generation.prompt.placeholder'
    }
  };

  if (historyAssetLibraryEntryId != null && historyAssetSourceId != null) {
    options.cesdk.ui.addAssetLibraryEntry({
      id: historyAssetLibraryEntryId,
      sourceIds: [historyAssetSourceId],
      sortBy: {
        sortKey: 'insertedAt',
        sortingOrder: 'Descending'
      },
      canRemove: true,
      gridItemHeight: 'square',
      gridBackgroundType: 'cover'
    });
  }

  options.cesdk.i18n.setTranslations({
    en: {
      'common.ai-generation.success': 'Generation Successful',
      'common.ai-generation.failed': 'Generation Failed',
      'common.ai-generation.generate': 'Generate',
      'common.ai-generation.prompt.placeholder':
        'Describe what you want to create...',
      [`panel.${provider.id}`]: getName(provider)
    }
  });

  // Avoid adding the icon set multiple times for different providers
  const globalStateIconSetAddedId = `@imgly/plugin-ai-generation.iconSetAdded`;
  if (
    !options.cesdk.ui.experimental.hasGlobalStateValue(
      globalStateIconSetAddedId
    )
  ) {
    options.cesdk.ui.addIconSet('@imgly/plugin-ai-generation', icons);
    options.cesdk.ui.experimental.setGlobalStateValue(
      globalStateIconSetAddedId,
      true
    );
  }

  const renderBuilderFunctions = await initInputs(provider, uiOptions, config);

  return {
    renderBuilderFunctions
  };
}

function getName(provider: Provider<any, any, any>): string {
  if (provider.name != null) return provider.name;
  switch (provider.kind) {
    case 'image':
      return 'Generate Image';
    case 'video':
      return 'Generate Video';
    case 'audio':
      return 'Generate Audio';
    default:
      return 'Generate Asset';
  }
}

/**
 * Initialize the history for the provider.
 */
async function initHistory(
  engine: CreativeEngine,
  providerId: string,
  history: undefined | false | '@imgly/local' | '@imgly/indexedDB' | string
): Promise<string | undefined> {
  if (history == null || history === false) return undefined;

  if (history === '@imgly/local') {
    const historyId = `${providerId}.history`;
    engine.asset.addLocalSource(historyId);
    return historyId;
  }

  if (history === '@imgly/indexedDB') {
    const historyId = `${providerId}.history`;
    engine.asset.addSource(new IndexedDBAssetSource(historyId, engine));
    return historyId;
  }

  return history;
}

async function initInputs<K extends OutputKind, I, O extends Output>(
  provider: Provider<K, I, O>,
  options: UIOptions,
  config: InitProviderConfiguration
): Promise<{
  panel?: BuilderRenderFunction<any>;
}> {
  const result: {
    panel?: BuilderRenderFunction<any>;
  } = {
    panel: undefined
  };

  if (provider.input?.panel != null) {
    result.panel = await initPanel(
      provider,
      provider.input.panel,
      options,
      config
    );
  }
  if (provider.input?.quickActions != null) {
    if (config.debug) {
      // eslint-disable-next-line no-console
      console.log(
        `Initializing quick actions for provider '${provider.kind}' (${provider.id})`
      );
    }
    initQuickActions(provider, provider.input.quickActions, options, config);
  }

  return result;
}

async function initPanel<K extends OutputKind, I, O extends Output>(
  provider: Provider<K, I, O>,
  panelInput: PanelInput<K, I>,
  options: UIOptions,
  config: InitProviderConfiguration
): Promise<BuilderRenderFunction<any> | undefined> {
  switch (panelInput.type) {
    case 'custom': {
      return registerPanelInputCustom(provider, panelInput, options, config);
    }

    case 'schema': {
      return registerPanelInputSchema(provider, panelInput, options, config);
    }

    default: {
      if (config.debug) {
        // eslint-disable-next-line no-console
        console.warn(
          // @ts-ignore
          `Invalid panel input type '${panelInput.type}' - skipping`
        );
      }
    }
  }
}

async function initQuickActions<K extends OutputKind, I, O extends Output>(
  provider: Provider<K, I, O>,
  quickActionsInput: QuickActionsInput<I, O>,
  options: UIOptions,
  config: InitProviderConfiguration
) {
  const { cesdk } = options;

  const quickActionMenus: { [kind: string]: QuickActionMenu } = {};

  quickActionsInput.actions.forEach((quickAction) => {
    const quickActionMenuId = quickAction.kind ?? provider.kind;
    if (quickActionMenus[quickActionMenuId] == null) {
      quickActionMenus[quickActionMenuId] = getQuickActionRegistry(
        cesdk,
        quickActionMenuId
      );
    }
    const quickActionMenu = quickActionMenus[quickActionMenuId];

    const enable = quickAction.enable ?? true;
    cesdk.feature.enable(
      getFeatureIdForQuickAction({
        quickActionId: quickAction.id,
        quickActionMenuId
      }),
      enable
    );

    const boundGenerate = createGenerateFunction(
      {
        cesdk,
        provider,
        quickAction
      },
      config
    );

    const boundErrorHandler = createHandleGenerationError<K, I, O>(
      {
        cesdk,
        provider
      },
      config
    );

    quickActionMenu.registerQuickAction({
      ...quickAction,
      generate: boundGenerate,
      onError: boundErrorHandler
    });

    if (config.debug) {
      // eslint-disable-next-line no-console
      console.log(
        `Registered quick action: '${quickAction.id}' (v${quickAction.version}) to menu '${quickActionMenuId}'`
      );
    }
  });

  Object.values(quickActionMenus).forEach((quickActionMenu) => {
    const { canvasMenuComponentId } = registerQuickActionMenuComponent({
      cesdk,
      quickActionMenu
    });
    if (config.debug) {
      // eslint-disable-next-line no-console
      console.log(
        `Registered quick action menu component: ${canvasMenuComponentId}`
      );
    }
  });
}

export default initProvider;
