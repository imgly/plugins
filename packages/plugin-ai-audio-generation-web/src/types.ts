import type CreativeEditorSDK from '@cesdk/cesdk-js';
import {
  type Provider,
  type GenerationMiddleware
} from '@imgly/plugin-utils-ai-generation';

type AiAudioProvider = (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'audio', any, any>>;

export interface PluginConfiguration {
  /**
   * Provider of a model for speech generation just from a (prompt) text.
   */
  text2speech?: AiAudioProvider;

  /**
   * Provider of a model for speech generation just from a (prompt) text.
   */
  text2sound?: AiAudioProvider;

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
