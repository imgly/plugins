import {
  CommonPluginConfiguration,
  GetProvider,
  Output
} from '@imgly/plugin-ai-generation-web';

export interface PluginConfiguration<I, O extends Output>
  extends CommonPluginConfiguration<'text', I, O> {
  /**
   * The provider to use for text2text AI generation.
   */
  provider: GetProvider<'text'>;
}
