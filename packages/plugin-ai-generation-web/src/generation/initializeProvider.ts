import CreativeEditorSDK, { BuilderRenderFunction } from '@cesdk/cesdk-js';
import Provider, { GetInput, Output, OutputKind } from './provider';
import createPanelRenderFunction from './createPanelRenderFunction';
import { CommonPluginConfiguration } from '../types';
import initializeHistoryAssetSource from './initializeHistoryAssetSource';
import initializeHistoryAssetLibraryEntry from './initializeHistoryAssetLibraryEntry';
import { InitializationContext } from './types';

type Result<O> = { status: 'success'; output: O } | { status: 'aborted' };

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
  quickActions?: {
    registered: {
      [kind: string]: string;
    };
    order: {
      [kind: string]: string[];
    };
  };

  // TODO: Expose generate function in the provider interface
  generate?: (getInput: GetInput<I>) => Promise<Result<O>>;
};

async function initializeProvider<K extends OutputKind, I, O extends Output>(
  kind: K,
  provider: Provider<K, I, O>,
  options: {
    cesdk: CreativeEditorSDK;
  },
  config: CommonPluginConfiguration<K, I, O>
): Promise<ProviderInitializationResult<K, I, O>> {
  const context: InitializationContext<K, I, O> = {
    provider,
    panelInput: provider.input?.panel,
    options: {
      cesdk: options.cesdk,
      engine: options.cesdk.engine
    },
    config
  };

  await provider.initialize?.({ ...options, engine: options.cesdk.engine });
  const historyAssetSourceId = initializeHistoryAssetSource(context);
  const historyAssetLibraryEntryId = initializeHistoryAssetLibraryEntry(
    context,
    historyAssetSourceId
  );

  if (kind === 'audio') {
    console.log({
      provider: context.provider,
      kind,
      historyAssetSourceId,
      historyAssetLibraryEntryId
    });
  }

  context.options.historyAssetSourceId = historyAssetSourceId;
  context.options.historyAssetLibraryEntryId = historyAssetLibraryEntryId;

  const builderRenderFunction: BuilderRenderFunction | undefined =
    await createPanelRenderFunction(context);

  return {
    provider,
    panel: {
      builderRenderFunction
    },
    history: {
      assetSourceId: historyAssetSourceId,
      assetLibraryEntryId: historyAssetLibraryEntryId
    }
  };
}

export default initializeProvider;
