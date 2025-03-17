import { type BuilderRenderFunctionContext } from '@cesdk/cesdk-js';
import type Provider from './provider';
import { type GetInput, type OutputKind, type Output } from './provider';
import { InitProviderConfiguration, UIOptions } from './types';
import generate from './generate';
import { extractErrorMessage } from '../utils';

export function isGeneratingStateKey(providerId: string): string {
  return `${providerId}.generating`;
}

/**
 * Renders the generation UI components and sets up event handlers
 */
function renderGenerationComponents<K extends OutputKind, I, O extends Output>(
  context: BuilderRenderFunctionContext<any>,
  provider: Provider<K, I, O>,
  getInput: GetInput<K, I>,
  options: UIOptions & {
    includeHistoryLibrary?: boolean;
    requiredInputs?: string[];
  },
  config: InitProviderConfiguration
): void {
  const { builder, experimental } = context;
  const { cesdk, includeHistoryLibrary = true } = options;
  const {
    id: providerId,
    output: { abortable }
  } = provider;
  const generatingState = experimental.global<{
    isGenerating: boolean;
    abort: () => void;
  }>(isGeneratingStateKey(providerId), {
    isGenerating: false,
    abort: () => {}
  });

  let abortController: AbortController | undefined;
  const canAbortNow = generatingState.value.isGenerating && abortable;
  const abort = () => {
    if (canAbortNow) {
      generatingState.value.abort();
      generatingState.setValue({ isGenerating: false, abort: () => {} });
    }
  };

  let isDisabled: boolean | undefined;
  if (options.requiredInputs != null && options.requiredInputs.length > 0) {
    const inputs = getInput();
    isDisabled = options.requiredInputs.every((input) => {
      // @ts-ignore
      const hasInput = !inputs.input[input];
      return hasInput;
    });
  }

  builder.Section(`${providerId}.generate.section`, {
    children: () => {
      builder.Button(`${providerId}.generate`, {
        label: `panel.${providerId}.generate`,
        isLoading: generatingState.value.isGenerating,
        color: 'accent',
        isDisabled,
        suffix: canAbortNow
          ? {
              icon: '@imgly/Cross',
              color: 'danger',
              tooltip: `panel.${providerId}.abort`,
              onClick: () => abort()
            }
          : undefined,
        onClick: async () => {
          try {
            abortController = new AbortController();
            const abortSignal = abortController.signal;
            generatingState.setValue({
              isGenerating: true,
              abort: () => {
                if (config.debug)
                  // eslint-disable-next-line no-console
                  console.log('Aborting generation');
                abortController?.abort();
              }
            });

            await generate(
              provider.kind,
              getInput,
              provider,
              options,
              config,
              abortSignal
            );
          } catch (error) {
            if (
              config.onError != null &&
              typeof config.onError === 'function'
            ) {
              config.onError(error);
            } else {
              // eslint-disable-next-line no-console
              console.error('Generation failed:', error);
              cesdk.ui.showNotification({
                type: 'error',
                message: extractErrorMessage(error)
              });
            }
          } finally {
            abortController = undefined;
            generatingState.setValue({
              isGenerating: false,
              abort: () => {}
            });
          }
        }
      });
    }
  });

  if (includeHistoryLibrary && options.historyAssetLibraryEntryId != null) {
    builder.Library(`${providerId}.history.library`, {
      entries: [options.historyAssetLibraryEntryId]
    });
  }
}

export default renderGenerationComponents;
