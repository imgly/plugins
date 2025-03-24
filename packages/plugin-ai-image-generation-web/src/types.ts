import type CreativeEditorSDK from '@cesdk/cesdk-js';
import { type Provider } from '@imgly/plugin-utils-ai-generation';

type AiImageProvider = (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', any, any>>;

/**
  * Configuration to set provider and models for image generation.
  */
export interface PluginConfiguration {
  /**
    * Provider of a model for image generation just from a (prompt) text.
    */
  text2image?: AiImageProvider;

  /**
    * Provider of a model for image generation from a given image.
    */
  image2image?: AiImageProvider;

  /**
   * Render console logs for debugging purposes.
   */
  debug?: boolean;

  /**
   * Dry run mode. If set to true, the plugin will not make any API calls.
   */
  dryRun?: boolean;
}
