import type CreativeEditorSDK from '@cesdk/cesdk-js';
import { FalAiProviderConfiguration } from './provider/fal-ai/fal-ai';
import { BuilderRenderFunctionContext, CreativeEngine } from '@cesdk/cesdk-js';

/**
 * An implementation of a provider for generating images.
 */
export interface Provider<I> {
  /**
   * The unique identifier of the provider. Is used to generate other
   * identifiers, like the panel ID or keys for translation.
   */
  id: string | ((options: { config: PluginConfiguration<I> }) => string);

  /**
   * Initialize the provider when the plugin is loaded.
   * Can be used to initialize libraries, and register UI components.
   */
  initialize: (options: {
    config: PluginConfiguration<I>;
    engine: CreativeEngine;
    cesdk?: CreativeEditorSDK;
  }) => Promise<void>;

  /**
   * Is called to render custom UI components for the image generation panel.
   *
   * @returns A function that returns the current input state as the generated size when called.
   *
   * @example
   *
     ```ts
     renderPanel: ({ builder, state }, options) => {
       const promptState = state('prompt', '');
       builder.TextArea('prompt', {
         label: 'Prompt',
         ...promptState
       });

       return () => ({
         input: {
           prompt: promptState.value
         },
         imageSize: {
           width: 1024,
           height: 1024
         }
       });
     }
     ```
   */
  renderPanel: (
    context: BuilderRenderFunctionContext<any>,
    options: {
      config: PluginConfiguration<I>;
      engine: CreativeEngine;
      cesdk: CreativeEditorSDK;
    }
  ) => () => {
    input: I;
    imageSize: {
      width: number;
      height: number;
    };
  };

  /**
   * Generate an image based on the input and the provider configuration.
   *
   * @returns The URL of the generated image.
   */
  generate: (
    input: I,
    options: {
      config: PluginConfiguration<I>;
      engine: CreativeEngine;
      cesdk?: CreativeEditorSDK;
    }
  ) => Promise<string>;
}

export interface CustomProviderConfiguration<I> extends Provider<I> {
  type: 'custom';
}

export type ImageGenerationProvider<I> =
  | FalAiProviderConfiguration
  | CustomProviderConfiguration<I>;

export interface PluginConfiguration<I> {
  /**
   * Prepopulate the prompt input field with this value.
   */
  defaultPrompt?: string;

  /**
   * Render console logs for debugging purposes.
   */
  debug?: boolean;

  /**
   * If true the generation process wll be replaced with a dummy generation.
   * Useful for testing the UI without actually generating images.
   */
  dryRun?: boolean;

  /**
   * The provider for generating images.
   */
  provider?: ImageGenerationProvider<I>;

  /**
   * Is called after an error occurred during the generation process.
   * Can be used to show an error message to the user, e.g. with the
   * Dialog or Notification API
   *
   * The default implementation logs the error to the console and
   * shows a notification to the user.
   */
  onError?: (error: any) => void;

  /**
   * The ID of the asset source where the generated images should be stored.
   *
   * If not set or `true`, a new local asset source will be created with
   * the provider id and the suffix `.history`, e.g.
   * `fal-ai/recraft-v3.history`.
   *
   * If `false`, the generated images will not be stored in an asset source.
   *
   * If a string, the asset source with this ID will be used.
   *
   */
  historyAssetSourceId?: boolean | string;

  uploadGeneratedAsset?: 'configured' | ((url: string) => Promise<string>);
}

export type SelectValue = {
  id: string;
  label: string;
};
