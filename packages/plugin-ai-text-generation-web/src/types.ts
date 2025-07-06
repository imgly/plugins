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
    text2text?: GetProvider<'text'>;
  };
  /**
   * The provider to use for text2text AI generation.
   * @deprecated Use `providers.text2text` instead.
   */
  provider?: GetProvider<'text'>;
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
 */
export interface TextQuickActionSupport<
  I,
  K extends keyof TextQuickActionInputs
> {
  mapInput: (input: TextQuickActionInputs[K]) => I;
}

/**
 * Type-safe mapping for text quick action support
 */
export type TextQuickActionSupportMap<I> = {
  [K in keyof TextQuickActionInputs]?: TextQuickActionSupport<I, K>;
} & {
  [key: string]: {
    mapInput: (input: any) => I;
  };
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
