import type CreativeEditorSDK from '@cesdk/cesdk-js';
import {
  CommonPluginConfiguration,
  Output,
  type Provider
} from '@imgly/plugin-ai-generation-web';

type AiAudioProvider = (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'audio', any, any>>;

export interface PluginConfiguration<I, O extends Output>
  extends CommonPluginConfiguration<'audio', I, O> {
  /**
   * Provider of a model for speech generation just from a (prompt) text.
   */
  text2speech?: AiAudioProvider;

  /**
   * Provider of a model for speech generation just from a (prompt) text.
   */
  text2sound?: AiAudioProvider;
}
