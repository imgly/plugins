import {
  CommonPluginConfiguration,
  GetProvider,
  Output
} from '@imgly/plugin-ai-generation-web';

/**
 * Configuration to set provider and models for video generation.
 */
export interface PluginConfiguration<I, O extends Output>
  extends CommonPluginConfiguration<'video', I, O> {
  /**
   * Provider of a model for video generation just from a (prompt) text.
   */
  text2video?: GetProvider<'video'>[] | GetProvider<'video'>;

  /**
   * Provider of a model for video generation from a given image.
   */
  image2video?: GetProvider<'video'>[] | GetProvider<'video'>;
}
