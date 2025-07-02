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
 */
export interface ImageQuickActionInputs {
  'changeImage': {
    prompt: string;
    uri: string;
  };
}

/**
 * Type-safe support mapping for image quick actions
 */
export interface ImageQuickActionSupport<I, K extends keyof ImageQuickActionInputs> {
  mapInput: (input: ImageQuickActionInputs[K]) => I;
}

/**
 * Image provider extension with type-safe quick action support
 * Only parameterized by K (the quick action key), O is fixed to ImageOutput
 */
export interface ImageProvider<I> extends Provider<'image', I, ImageOutput> {
  input: Provider<'image', I, ImageOutput>['input'] & {
    quickActions?: Provider<'image', I, ImageOutput>['input']['quickActions'] & {
      supported?: {
        [K in keyof ImageQuickActionInputs]?: ImageQuickActionSupport<I, K>;
      };
    };
  };
}
