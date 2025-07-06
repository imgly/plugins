import {
  CommonPluginConfiguration,
  GetProvider,
  Output,
  Provider,
  ImageOutput
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

/**
 * Input types for image-specific quick actions
 * This interface is extended by individual quick action files using module augmentation
 */
export interface ImageQuickActionInputs {
  // Individual quick action files will extend this interface using module augmentation
}

/**
 * Type-safe support mapping for image quick actions
 * Allows `true` or `{}` when the quick action input type extends the provider input type
 */
export type ImageQuickActionSupport<
  I,
  K extends keyof ImageQuickActionInputs
> = ImageQuickActionInputs[K] extends I
  ?
      | true
      | { mapInput: (input: ImageQuickActionInputs[K]) => I }
      | { [key: string]: any } // Allow objects without mapInput when types are compatible
  : { mapInput: (input: ImageQuickActionInputs[K]) => I };

/**
 * Type-safe mapping for image quick action support
 */
export type ImageQuickActionSupportMap<I> = {
  [K in keyof ImageQuickActionInputs]?: ImageQuickActionSupport<I, K>;
} & {
  [key: string]:
    | true
    | { mapInput: (input: any) => I }
    | { [key: string]: any };
};

/**
 * Image provider extension with type-safe quick action support
 * Only parameterized by K (the quick action key), O is fixed to ImageOutput
 */
export interface ImageProvider<I> extends Provider<'image', I, ImageOutput> {
  input: Omit<Provider<'image', I, ImageOutput>['input'], 'quickActions'> & {
    quickActions?: {
      supported?: ImageQuickActionSupportMap<I>;
    };
  };
}
