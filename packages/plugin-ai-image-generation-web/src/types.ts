import {
  CommonPluginConfiguration,
  GetProvider,
  Output
} from '@imgly/plugin-ai-generation-web';

/**
 * Configuration to set provider and models for image generation.
 */
export interface PluginConfiguration<I, O extends Output>
  extends CommonPluginConfiguration<'image', I, O> {
  providers: {
    /**
     * Provider of a model for image generation just from a (prompt) text.
     */
    text2image?: GetProvider<'image'>[] | GetProvider<'image'>;

    /**
     * Provider of a model for image generation from a given image.
     */
    image2image?: GetProvider<'image'>[] | GetProvider<'image'>;
  };
  /**
   * Provider of a model for image generation just from a (prompt) text.
   * @deprecated Use `providers.text2image` instead.
   */
  text2image?: GetProvider<'image'>[] | GetProvider<'image'>;

  /**
   * Provider of a model for image generation from a given image.
   * @deprecated Use `providers.image2image` instead.
   */
  image2image?: GetProvider<'image'>[] | GetProvider<'image'>;
}
