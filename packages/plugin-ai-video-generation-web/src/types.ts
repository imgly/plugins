import type CreativeEditorSDK from '@cesdk/cesdk-js';
import {
  type Provider,
  type GenerationMiddleware
} from '@imgly/plugin-ai-generation-web';

type AiVideoProvider = (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'video', any, any>>;

/**
 * Configuration to set provider and models for video generation.
 */
export interface PluginConfiguration {
  /**
   * Provider of a model for video generation just from a (prompt) text.
   */
  text2video?: AiVideoProvider;

  /**
   * Provider of a model for video generation from a given image.
   */
  image2video?: AiVideoProvider;

  /**
   * Render console logs for debugging purposes.
   */
  debug?: boolean;

  /**
   * Dry run mode. If set to true, the plugin will not make any API calls.
   */
  dryRun?: boolean;

  /**
   * Is called when the generation process is started. Can be used to
   * extend the generation process with additional steps.
   *
   * @param generate A function that starts the actual generation process.
   * @param context The context of the generation process.
   */
  middleware?: GenerationMiddleware;
}
