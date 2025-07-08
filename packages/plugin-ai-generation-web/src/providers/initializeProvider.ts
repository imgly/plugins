import CreativeEditorSDK, { BuilderRenderFunction } from '@cesdk/cesdk-js';
import Provider, { Output, OutputKind } from '../core/provider';
import createPanelRenderFunction from '../ui/panels/createPanelRenderFunction';
import {
  CommonPluginConfiguration,
  InternalPluginConfiguration,
  InitializationContext
} from '../types';
import initializeHistoryAssetSource from '../assets/initializeHistoryAssetSource';
import initializeHistoryAssetLibraryEntry from '../assets/initializeHistoryAssetLibraryEntry';
import icons from '../ui/icons';
import createGenerateFunction, {
  type Generate
} from '../generation/createGenerateFunction';
import { ProviderRegistry } from '../core/ProviderRegistry';

export type ProviderInitializationResult<
  K extends OutputKind,
  I,
  O extends Output
> = {
  provider: Provider<K, I, O>;

  panel: {
    builderRenderFunction?: BuilderRenderFunction;
  };

  history: {
    assetSourceId?: string;
    assetLibraryEntryId?: string;
  };

  generate: Generate<I, O>;
};

/**
 * Initializes a provider with the given configuration and options.
 */
async function initializeProvider<K extends OutputKind, I, O extends Output>(
  _kind: K,
  provider: Provider<K, I, O>,
  options: {
    cesdk: CreativeEditorSDK;
  },
  config: CommonPluginConfiguration<K, I, O>
): Promise<ProviderInitializationResult<K, I, O>> {
  // Create internal config with provider
  const internalConfig: InternalPluginConfiguration<K, I, O> = {
    ...config,
    provider
  };

  const context: InitializationContext<K, I, O> = {
    provider,
    panelInput: provider.input?.panel,
    options: {
      cesdk: options.cesdk,
      engine: options.cesdk.engine
    },
    config: internalConfig
  };

  await provider.initialize?.({ ...options, engine: options.cesdk.engine });

  const historyAssetSourceId = initializeHistoryAssetSource(context);
  const historyAssetLibraryEntryId = initializeHistoryAssetLibraryEntry(
    context,
    historyAssetSourceId
  );

  context.options.historyAssetSourceId = historyAssetSourceId;
  context.options.historyAssetLibraryEntryId = historyAssetLibraryEntryId;

  const generate = createGenerateFunction({
    provider,
    cesdk: options.cesdk,
    engine: options.cesdk.engine
  });

  const builderRenderFunction: BuilderRenderFunction | undefined =
    await createPanelRenderFunction(context, generate);

  //
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

  const providerInitializationResult: ProviderInitializationResult<K, I, O> = {
    provider,
    panel: {
      builderRenderFunction
    },
    history: {
      assetSourceId: historyAssetSourceId,
      assetLibraryEntryId: historyAssetLibraryEntryId
    },
    generate
  };

  ProviderRegistry.get().register(providerInitializationResult);

  return providerInitializationResult;
}

export default initializeProvider;
