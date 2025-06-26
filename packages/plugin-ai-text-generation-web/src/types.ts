import {
  CommonPluginConfiguration,
  GetProvider,
  Output
} from '@imgly/plugin-ai-generation-web';

export interface PluginConfiguration<I, O extends Output>
  extends CommonPluginConfiguration<'text', I, O> {
  providers?: {
    /**
     * The provider to use for text2text AI generation.
     */
    text2text: GetProvider<'text'>;
  };
  /**
   * The provider to use for text2text AI generation.
   * @deprecated Use `providers.text2text` instead.
   */
  provider?: GetProvider<'text'>;
}
