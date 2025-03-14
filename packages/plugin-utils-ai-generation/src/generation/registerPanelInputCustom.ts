import type Provider from './provider';
import { OutputKind, PanelInputCustom, type Output } from './provider';
import renderGenerationComponents, {
  isGeneratingStateKey
} from './renderGenerationComponents';
import { InitProviderConfiguration, UIOptions } from './types';

async function registerPanelInputCustom<
  K extends OutputKind,
  I,
  O extends Output
>(
  provider: Provider<K, I, O>,
  panelInput: PanelInputCustom<K, I>,
  options: UIOptions,
  config: InitProviderConfiguration
): Promise<void> {
  const { cesdk } = options;
  const { id: providerId } = provider;

  const render = panelInput.render;

  cesdk.ui.registerPanel(providerId, (context) => {
    const { state } = context;

    const isGenerating = state(isGeneratingStateKey(providerId), {
      isGenerating: false,
      abort: () => {}
    }).value.isGenerating;

    const getInput = render(context, { cesdk, isGenerating });
    renderGenerationComponents(
      context,
      provider,
      getInput,
      {
        ...options,
        includeHistoryLibrary: panelInput.includeHistoryLibrary ?? true
      },
      config
    );

    return getInput;
  });
}

export default registerPanelInputCustom;
