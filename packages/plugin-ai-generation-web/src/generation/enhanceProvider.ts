import CreativeEditorSDK from '@cesdk/cesdk-js';
import Provider, { Output, OutputKind } from './provider';
import { GetProvider } from './types';
import { QuickActionCanvasMenuComponents } from './quickAction/types';

/**
 * Enhances "to-be-configured" GetProvider by adding additional configuration
 * options that can be easily accessed by the integrator.
 *
 * This should be called right before you export your provider.
 *
 * @param getProvider - A function that returns a provider based on the CESDK instance and configuration.
 * @param options - Additional options to enhance the provider
 * @param options.canvasMenuComponents - Components to be used in the canvas menu order.
 */
function enhanceProvider<C, K extends OutputKind, I, O extends Output>(
  getProvider: (
    cesdk: CreativeEditorSDK,
    config: C
  ) => Promise<Provider<K, I, O>> | Provider<K, I, O>,
  options: {
    canvasMenu?: QuickActionCanvasMenuComponents;
  } = {
    canvasMenu: {}
  }
): ((config: C) => GetProvider<K, I, O>) & {
  canvasMenu: QuickActionCanvasMenuComponents;
} {
  const configureGetProvider = (config: C): GetProvider<K, I, O> => {
    return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
      return getProvider(cesdk, config);
    };
  };
  return Object.assign(configureGetProvider, {
    canvasMenu: options.canvasMenu || {}
  });
}

export default enhanceProvider;
