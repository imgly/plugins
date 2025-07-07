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
  providers?: {
    /**
     * Provider of a model for video generation just from a (prompt) text.
     */
    text2video?: GetProvider<'video'>[] | GetProvider<'video'>;

    /**
     * Provider of a model for video generation from a given image.
     */
    image2video?: GetProvider<'video'>[] | GetProvider<'video'>;
  };

  /**
   * Provider of a model for video generation just from a (prompt) text.
   * @deprecated Use `providers.text2video` instead.
   */
  text2video?: GetProvider<'video'>[] | GetProvider<'video'>;

  /**
   * Provider of a model for video generation from a given image.
   * @deprecated Use `providers.image2video` instead.
   */
  image2video?: GetProvider<'video'>[] | GetProvider<'video'>;
}

/**
 * Input types for video-specific quick actions
 * This interface is extended by individual quick action files using module augmentation
 */
export interface VideoQuickActionInputs {
  // Individual quick action files will extend this interface using module augmentation
}
