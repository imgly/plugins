import {
  CommonPluginConfiguration,
  GetProvider,
  Output,
  Provider,
  VideoOutput
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

/**
 * Type-safe support mapping for image quick actions
 * Allows `true` or `{}` when the quick action input type extends the provider input type
 */
export type VideoQuickActionSupport<
  I,
  K extends keyof VideoQuickActionInputs
> = VideoQuickActionInputs[K] extends I
  ?
      | true
      | { mapInput: (input: VideoQuickActionInputs[K]) => I }
      | { [key: string]: any } // Allow objects without mapInput when types are compatible
  : { mapInput: (input: VideoQuickActionInputs[K]) => I };

/**
 * Type-safe mapping for video quick action support
 */
export type VideoQuickActionSupportMap<I> = {
  [K in keyof VideoQuickActionInputs]?: VideoQuickActionSupport<I, K>;
} & {
  [key: string]:
    | true
    | { mapInput: (input: any) => I }
    | { [key: string]: any };
};

/**
 * Video provider extension with type-safe quick action support
 * Only parameterized by K (the quick action key), O is fixed to VideoOutput
 */
export interface VideoProvider<I> extends Provider<'video', I, VideoOutput> {
  input: Omit<Provider<'video', I, VideoOutput>['input'], 'quickActions'> & {
    quickActions?: {
      supported?: VideoQuickActionSupportMap<I>;
    };
  };
}
