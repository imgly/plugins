import type CreativeEditorSDK from '@cesdk/cesdk-js';
import { type Provider } from '@imgly/plugin-ai-generation-web';

export interface PluginConfiguration {
  /**
   * The provider to use for text2text AI generation.
   */
  provider: (context: {
    cesdk: CreativeEditorSDK;
  }) => Promise<Provider<'text', any, any>>;

  /**
   * Render console logs for debugging purposes.
   */
  debug?: boolean;
}
