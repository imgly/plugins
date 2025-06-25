import CreativeEditorSDK, { BuilderRenderFunction } from '@cesdk/cesdk-js';
import Provider, { GetInput, Output, OutputKind } from './provider';
import { CommonProviderConfiguration } from './types';
import createPanelRenderFunction from './createPanelRenderFunction';
import { CommonPluginConfiguration } from '../types';

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
  history?: {
    assetSourceId: string;
    assetLibraryEntryId: string;
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
  await provider.initialize?.({ ...options, engine: options.cesdk.engine });

  const builderRenderFunction: BuilderRenderFunction | undefined =
    await createPanelRenderFunction({
      provider,
      panelInput: provider.input?.panel,
      options: {
        cesdk: options.cesdk,
        engine: options.cesdk.engine
      },
      config
    });

  return {
    provider,
    panel: {
      builderRenderFunction
    }
  };
}

export default initializeProvider;
