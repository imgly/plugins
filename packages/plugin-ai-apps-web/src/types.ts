import CreativeEditorSDK from '@cesdk/cesdk-js';
import { Provider, OutputKind } from '@imgly/plugin-ai-generation-web';

export type GetProvider<K extends OutputKind> = ({
  cesdk
}: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<K, any, any>>;

/**
 * The provider configuration that maps capabilities
 * to actual provider.
 */
export interface Providers {
  /**
   * Provider for text generation on text blocks.
   */
  text2text?: GetProvider<'text'>;

  /**
   * Provider for image generation based on a prompt alone.
   */
  text2image?: GetProvider<'image'>;
  /**
   * Provider for image generation based on a prompt and an image.
   */
  image2image?: GetProvider<'image'>;

  /**
   * Provider for video generation based on a prompt alone.
   */
  text2video?: GetProvider<'video'>;
  /**
   * Provider for video generation based on a prompt and an image.
   */
  image2video?: GetProvider<'video'>;

  /**
   * Provider for speech generation based on a prompt alone.
   */
  text2speech?: GetProvider<'audio'>;
  /**
   * Provider for sound effect generation based on a prompt alone.
   */
  text2sound?: GetProvider<'audio'>;
}

export interface PluginConfiguration {
  providers: Providers;
  debug?: boolean;
}
