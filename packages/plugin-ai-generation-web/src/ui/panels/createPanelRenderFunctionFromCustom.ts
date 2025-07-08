import { BuilderRenderFunction } from '@cesdk/cesdk-js';
import { OutputKind, PanelInputCustom, type Output } from '../../core/provider';
import renderGenerationComponents, {
  isGeneratingStateKey
} from '../components/renderGenerationComponents';
import { InitializationContext } from '../../types';
import { Generate } from '../../generation/createGenerateFunction';

async function createPanelRenderFunctionFromCustom<
  K extends OutputKind,
  I,
  O extends Output
>(
  {
    options,
    provider,
    panelInput,
    config
  }: InitializationContext<K, I, O, PanelInputCustom<K, I>>,

  generate: Generate<I, O>
): Promise<BuilderRenderFunction<any> | undefined> {
  if (panelInput == null) {
    return undefined;
  }

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
      generate,
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

  return builderRenderFunction;
}

export default createPanelRenderFunctionFromCustom;
