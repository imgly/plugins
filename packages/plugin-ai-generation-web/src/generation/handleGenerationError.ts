import CreativeEditorSDK from '@cesdk/cesdk-js';
import Provider, { GetInput, Output, OutputKind } from '../core/provider';
import { extractErrorMessage } from '../utils/utils';

function handleGenerationError<K extends OutputKind, I, O extends Output>(
  error: unknown,
  options: {
    cesdk: CreativeEditorSDK;
    provider: Provider<K, I, O>;
    getInput?: GetInput<I>;
  }
) {
  const { cesdk, provider, getInput } = options;

  // eslint-disable-next-line no-console
  console.error('Generation failed:', error);
  const shown = showErrorNotification(
    cesdk,
    provider.output.notification,
    () => ({
      input: getInput?.().input,
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

function showErrorNotification<I, O extends Output>(
  cesdk: CreativeEditorSDK,
  notifications: Provider<any, I, O>['output']['notification'],
  createContext: () => { input?: I; error: unknown }
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
      : errorNotification.message ?? 'common.ai-generation.failed';

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

export default handleGenerationError;
