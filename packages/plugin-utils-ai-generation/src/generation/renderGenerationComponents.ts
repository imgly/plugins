import CreativeEditorSDK, {
  type BuilderRenderFunctionContext
} from '@cesdk/cesdk-js';
import type Provider from './provider';
import {
  type GetInput,
  type OutputKind,
  type Output,
  type GetBlockInput
} from './provider';
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
  getInput: GetInput<I>,
  getBlockInput: GetBlockInput<K, I>,
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
        label: [
          'common.ai-generation.generate',
          `panel.${providerId}.generate`
        ],
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

            const result = await generate(
              provider.kind,
              getInput,
              getBlockInput,
              provider,
              options,
              config,
              abortSignal
            );

            if (result.status === 'aborted') {
              return;
            }

            const notification = provider.output.notification;
            showSuccessNotification(cesdk, notification, () => ({
              input: getInput().input,
              output: result.output
            }));
          } catch (error) {
            if (
              config.onError != null &&
              typeof config.onError === 'function'
            ) {
              config.onError(error);
            } else {
              // eslint-disable-next-line no-console
              console.error('Generation failed:', error);
              const shown = showErrorNotification(
                cesdk,
                provider.output.notification,
                () => ({
                  input: getInput().input,
                  error
                })
              );
              if (!shown) {
                cesdk.ui.showNotification({
                  type: 'error',
                  message: extractErrorMessage(error)
                });
              }
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

function showSuccessNotification<I, O extends Output>(
  cesdk: CreativeEditorSDK,
  notifications: Provider<any, I, O>['output']['notification'],
  createContext: () => { input: I; output: O }
): boolean {
  const successNotification = notifications?.success;
  if (successNotification == null) return false;

  const showOnSuccess =
    typeof successNotification.show === 'function'
      ? successNotification.show(createContext())
      : successNotification.show;

  if (!showOnSuccess) return false;

  const message =
    typeof successNotification.message === 'function'
      ? successNotification.message(createContext())
      : successNotification.message ?? 'common.ai-generation.success';

  const action =
    successNotification.action != null
      ? {
          label:
            typeof successNotification.action.label === 'function'
              ? successNotification.action.label(createContext())
              : successNotification.action.label,
          onClick: () => {
            successNotification?.action?.onClick(createContext());
          }
        }
      : undefined;

  cesdk.ui.showNotification({
    type: 'success',
    message,
    action
  });
  return true;
}

function showErrorNotification<I, O extends Output>(
  cesdk: CreativeEditorSDK,
  notifications: Provider<any, I, O>['output']['notification'],
  createContext: () => { input: I; error: unknown }
): boolean {
  const errorNotification = notifications?.error;
  if (errorNotification == null) return false;

  const showOnSuccess =
    typeof errorNotification.show === 'function'
      ? errorNotification.show(createContext())
      : errorNotification.show;

  if (!showOnSuccess) return false;

  const message =
    typeof errorNotification.message === 'function'
      ? errorNotification.message(createContext())
      : errorNotification.message ?? 'common.ai-generation.success';

  const action =
    errorNotification.action != null
      ? {
          label:
            typeof errorNotification.action.label === 'function'
              ? errorNotification.action.label(createContext())
              : errorNotification.action.label,
          onClick: () => {
            errorNotification?.action?.onClick(createContext());
          }
        }
      : undefined;

  cesdk.ui.showNotification({
    type: 'error',
    message,
    action
  });
  return true;
}

export default renderGenerationComponents;
