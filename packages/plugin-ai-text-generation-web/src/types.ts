import type CreativeEditorSDK from '@cesdk/cesdk-js';
import {
  CommonPluginConfiguration,
  Output,
  type Provider
} from '@imgly/plugin-ai-generation-web';

export interface PluginConfiguration<I, O extends Output>
  extends CommonPluginConfiguration<'text', I, O> {
  /**
   * The provider to use for text2text AI generation.
   */
  provider: (context: {
    cesdk: CreativeEditorSDK;
  }) => Promise<Provider<'text', I, O>>;
}
