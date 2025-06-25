import {
  CommonPluginConfiguration,
  GetProvider,
  Output
} from '@imgly/plugin-ai-generation-web';

export interface PluginConfiguration<I, O extends Output>
  extends CommonPluginConfiguration<'audio', I, O> {
  /**
   * Provider of a model for speech generation just from a (prompt) text.
   */
  text2speech?: GetProvider<'audio'>[] | GetProvider<'audio'>;

  /**
   * Provider of a model for speech generation just from a (prompt) text.
   */
  text2sound?: GetProvider<'audio'>[] | GetProvider<'audio'>;
}
