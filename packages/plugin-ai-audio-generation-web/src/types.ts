import {
  CommonPluginConfiguration,
  GetProvider,
  Output
} from '@imgly/plugin-ai-generation-web';

export interface PluginConfiguration<I, O extends Output>
  extends CommonPluginConfiguration<'audio', I, O> {
  providers?: {
    /**
     * Provider of a model for speech generation just from a (prompt) text.
     */
    text2speech?: GetProvider<'audio'>[] | GetProvider<'audio'>;

    /**
     * Provider of a model for speech generation just from a (prompt) text.
     */
    text2sound?: GetProvider<'audio'>[] | GetProvider<'audio'>;
  };
  /**
   * Provider of a model for speech generation just from a (prompt) text.
   * @deprecated Use `providers.text2speech` instead.
   */
  text2speech?: GetProvider<'audio'>[] | GetProvider<'audio'>;

  /**
   * Provider of a model for speech generation just from a (prompt) text.
   * @deprecated Use `providers.text2sound` instead.
   */
  text2sound?: GetProvider<'audio'>[] | GetProvider<'audio'>;
}
