import {
  CommonPluginConfiguration,
  GetProvider,
  Output,
  Provider,
  TextOutput
} from '@imgly/plugin-ai-generation-web';

export interface PluginConfiguration<I, O extends Output>
  extends CommonPluginConfiguration<'text', I, O> {
  providers?: {
    /**
     * The provider to use for text2text AI generation.
     */
    text2text?: GetProvider<'text'> | GetProvider<'text'>[];
  };
  /**
   * The provider to use for text2text AI generation.
   * @deprecated Use `providers.text2text` instead.
   */
  provider?: GetProvider<'text'> | GetProvider<'text'>[];
}

/**
 * Input types for text-specific quick actions
 * This interface is extended by individual quick action files using module augmentation
 */
export interface TextQuickActionInputs {
  // Individual quick action files will extend this interface using module augmentation
}

/**
 * Type-safe support mapping for text quick actions
 * Allows `true` or `{}` when the quick action input type extends the provider input type
 */
export type TextQuickActionSupport<
  I,
  K extends keyof TextQuickActionInputs
> = TextQuickActionInputs[K] extends I
  ?
      | true
      | { mapInput: (input: TextQuickActionInputs[K]) => I }
      | { [key: string]: any } // Allow objects without mapInput when types are compatible
  : { mapInput: (input: TextQuickActionInputs[K]) => I };

/**
 * Type-safe mapping for text quick action support
 */
export type TextQuickActionSupportMap<I> = {
  [K in keyof TextQuickActionInputs]?: TextQuickActionSupport<I, K>;
} & {
  [key: string]:
    | true
    | { mapInput: (input: any) => I }
    | { [key: string]: any };
};

/**
 * Text provider extension with type-safe quick action support
 * Only parameterized by I (the input type), O is fixed to TextOutput
 */
export interface TextProvider<I> extends Provider<'text', I, TextOutput> {
  input: Omit<Provider<'text', I, TextOutput>['input'], 'quickActions'> & {
    quickActions?: {
      supported?: TextQuickActionSupportMap<I>;
    };
  };
}
