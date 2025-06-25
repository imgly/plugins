import { BuilderRenderFunction } from '@cesdk/cesdk-js';
import type Provider from './provider';
import { OutputKind, PanelInputCustom, type Output } from './provider';
import renderGenerationComponents, {
  isGeneratingStateKey
} from './renderGenerationComponents';
import { CommonProviderConfiguration, UIOptions } from './types';
import { getPanelId } from '../utils';

async function registerPanelInputCustom<
  K extends OutputKind,
  I,
  O extends Output
>(
  provider: Provider<K, I, O>,
  panelInput: PanelInputCustom<K, I>,
  options: UIOptions,
  config: CommonProviderConfiguration<I, O>
): Promise<BuilderRenderFunction<any>> {
  const { cesdk } = options;
  const { id: providerId } = provider;

  const render = panelInput.render;

  const builderRenderFunction: BuilderRenderFunction<any> = (context) => {
    const { state } = context;

    const isGenerating = state(isGeneratingStateKey(providerId), {
      isGenerating: false,
      abort: () => {}
    }).value.isGenerating;

    const { getInput, getBlockInput } = render(context, {
      cesdk,
      isGenerating
    });
    renderGenerationComponents(
      context,
      provider,
      getInput,
      getBlockInput,
      {
        ...options,
        includeHistoryLibrary: panelInput.includeHistoryLibrary ?? true,
        createPlaceholderBlock: panelInput.userFlow === 'placeholder'
      },
      config
    );

    return getInput;
  };

  cesdk.ui.registerPanel(getPanelId(providerId), builderRenderFunction);

  return builderRenderFunction;
}

export default registerPanelInputCustom;
