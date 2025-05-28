import CreativeEditorSDK from '@cesdk/cesdk-js';
import Provider, { Output, OutputKind } from './provider';
import { GetProvider } from './types';
import { QuickActionCanvasMenuComponents } from './quickAction/types';
import addToCanvasMenu from './addToCanvasMenu';

const ADD_TO_CANVAS_DEFAULT = true;

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
): ((
  config: C & {
    // Add
    addToCanvasMenu?: boolean;
  }
) => GetProvider<K, I, O>) & {
  canvasMenu: Required<NonNullable<typeof options.canvasMenu>>;
} {
  const configureGetProvider = (
    config: C & {
      addToCanvasMenu?: boolean;
    }
  ): GetProvider<K, I, O> => {
    return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
      if (
        (config.addToCanvasMenu ?? ADD_TO_CANVAS_DEFAULT) &&
        options.canvasMenu != null
      ) {
        addToCanvasMenu(cesdk, options.canvasMenu);
      }
      return getProvider(cesdk, config);
    };
  };
  const canvasMenu = {
    ...EMPTY_COMPONENTS,
    ...(options.canvasMenu ?? {})
  };

  return Object.assign(configureGetProvider, { canvasMenu });
}

const EMPTY_COMPONENTS: Required<QuickActionCanvasMenuComponents> = {
  image: { id: 'ly.img.ai.image.canvasMenu', children: [] },
  text: { id: 'ly.img.ai.text.canvasMenu', children: [] },
  video: { id: 'ly.img.ai.video.canvasMenu', children: [] },
  audio: { id: 'ly.img.ai.audio.canvasMenu', children: [] }
};

export default enhanceProvider;
