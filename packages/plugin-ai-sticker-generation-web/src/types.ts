import {
  CommonPluginConfiguration,
  GetProvider,
  Output
} from '@imgly/plugin-ai-generation-web';

/**
 * Configuration to set provider and models for sticker generation.
 */
export interface PluginConfiguration<I, O extends Output>
  extends CommonPluginConfiguration<any, I, O> {
  providers: {
    /**
     * Provider of a model for sticker generation just from a (prompt) text.
     */
    text2sticker?: GetProvider<'sticker'>[] | GetProvider<'sticker'>;
  };
}

/**
 * Input types for sticker-specific quick actions
 * This interface is extended by individual quick action files using module augmentation
 */
export interface StickerQuickActionInputs {
  // Individual quick action files will extend this interface using module augmentation
}

/**
 * Type-safe support mapping for sticker quick actions
 * Allows `true` or `{}` when the quick action input type extends the provider input type
 */
export type StickerQuickActionSupport<
  I,
  K extends keyof StickerQuickActionInputs
> = StickerQuickActionInputs[K] extends I
  ?
      | true
      | { mapInput: (input: StickerQuickActionInputs[K]) => I }
      | { [key: string]: any } // Allow objects without mapInput when types are compatible
  : { mapInput: (input: StickerQuickActionInputs[K]) => I };

/**
 * Type-safe mapping for sticker quick action support
 */
export type StickerQuickActionSupportMap<I> = {
  [K in keyof StickerQuickActionInputs]?: StickerQuickActionSupport<I, K>;
} & {
  [key: string]:
    | true
    | { mapInput: (input: any) => I }
    | { [key: string]: any };
};

/**
 * Sticker provider extension with type-safe quick action support
 * Only parameterized by K (the quick action key), O is fixed to StickerOutput
 */
export interface StickerProvider<I> {
  input: any & {
    quickActions?: {
      supported?: StickerQuickActionSupportMap<I>;
    };
  };
}
