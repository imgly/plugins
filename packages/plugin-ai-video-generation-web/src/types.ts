import type CreativeEditorSDK from '@cesdk/cesdk-js';
import {
  CommonPluginConfiguration,
  Output,
  type Provider
} from '@imgly/plugin-ai-generation-web';

type AiVideoProvider = (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'video', any, any>>;

/**
 * Configuration to set provider and models for video generation.
 */
export interface PluginConfiguration<I, O extends Output>
  extends CommonPluginConfiguration<'video', I, O> {
  /**
   * Provider of a model for video generation just from a (prompt) text.
   */
  text2video?: AiVideoProvider;

  /**
   * Provider of a model for video generation from a given image.
   */
  image2video?: AiVideoProvider;
}
