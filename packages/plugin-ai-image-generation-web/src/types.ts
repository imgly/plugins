import type CreativeEditorSDK from '@cesdk/cesdk-js';
import {
  CommonPluginConfiguration,
  Output,
  type Provider
} from '@imgly/plugin-ai-generation-web';

type AiImageProvider = (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', any, any>>;

/**
 * Configuration to set provider and models for image generation.
 */
export interface PluginConfiguration<I, O extends Output>
  extends CommonPluginConfiguration<'image', I, O> {
  /**
   * Provider of a model for image generation just from a (prompt) text.
   */
  text2image?: AiImageProvider;

  /**
   * Provider of a model for image generation from a given image.
   */
  image2image?: AiImageProvider;
}
