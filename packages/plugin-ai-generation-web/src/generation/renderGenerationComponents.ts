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
import { UIOptions } from './types';
import generate from './generate';
import { isAbortError } from '../utils';
import handleGenerationError from './handleGenerationError';
import { CommonConfiguration } from '../types';

export function isGeneratingStateKey(providerId: string): string {
  return `${providerId}.generating`;
}

export function abortGenerationStateKey(providerId: string): string {
  return `${providerId}.abort`;
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
    createPlaceholderBlock?: boolean;
    includeHistoryLibrary?: boolean;
    requiredInputs?: string[];
  },
  config: CommonConfiguration<I, O>
): void {
  const { builder, experimental } = context;
  const { cesdk, includeHistoryLibrary = true } = options;
  const {
    id: providerId,
    output: { abortable }
  } = provider;
  const abortState = experimental.global<() => void>(
    abortGenerationStateKey(providerId),
    () => {}
  );
  const generatingState = experimental.global<boolean>(
    isGeneratingStateKey(providerId),
    false
  );

  let abortController: AbortController | undefined;
  const canAbortNow = generatingState.value && abortable;
  const abort = () => {
    if (canAbortNow) {
      abortState.value();
      generatingState.setValue(false);
      abortState.setValue(() => {});
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

  const confirmCancelDialogId = experimental.global<string | undefined>(
    `${providerId}.confirmationDialogId`,
    undefined
  );

  builder.Section(`${providerId}.generate.section`, {
    children: () => {
      builder.Button(`${providerId}.generate`, {
        label: [
          'common.ai-generation.generate',
          `panel.${providerId}.generate`
        ],
        isLoading: generatingState.value,
        color: 'accent',
        isDisabled,
        suffix: canAbortNow
          ? {
              icon: '@imgly/Cross',
              color: 'danger',
              tooltip: [`panel.${providerId}.abort`, 'common.cancel'],
              onClick: () => {
                const confirmationDialogId = cesdk.ui.showDialog({
                  type: 'warning',
                  content: 'panel.ly.img.ai.generation.confirmCancel.content',
                  cancel: {
                    label: 'common.close',
                    onClick: ({ id }) => {
                      cesdk.ui.closeDialog(id);
                      confirmCancelDialogId.setValue(undefined);
                    }
                  },
                  actions: {
                    label: 'panel.ly.img.ai.generation.confirmCancel.confirm',
                    color: 'danger',
                    onClick: ({ id }) => {
                      abort();
                      cesdk.ui.closeDialog(id);
                      confirmCancelDialogId.setValue(undefined);
                    }
                  }
                });
                confirmCancelDialogId.setValue(confirmationDialogId);
              }
            }
          : undefined,
        onClick: async () => {
          abortController = new AbortController();
          const abortSignal = abortController.signal;

          const triggerGeneration = async () => {
            try {
              generatingState.setValue(true);
              abortState.setValue(() => {
                if (config.debug)
                  // eslint-disable-next-line no-console
                  console.log('Aborting generation');
                abortController?.abort();
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
              // Do not treat abort errors as errors
              if (isAbortError(error)) {
                return;
              }

              handleGenerationError(error, {
                cesdk,
                provider,
                getInput
              });
            } finally {
              abortController = undefined;
              generatingState.setValue(false);
              abortState.setValue(() => {});

              if (confirmCancelDialogId.value != null) {
                cesdk.ui.closeDialog(confirmCancelDialogId.value);
                confirmCancelDialogId.setValue(undefined);
              }
            }
          };

          await triggerGeneration();
        }
      });
      if (provider.output.generationHintText != null) {
        builder.Text(`${providerId}.generation-hint`, {
          align: 'center',
          content: provider.output.generationHintText
        });
      }
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
    action,
    duration: successNotification.duration
  });
  return true;
}

export default renderGenerationComponents;
