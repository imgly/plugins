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
  text2image?: GetProvider<'image'> | GetProvider<'image'>[];
  /**
   * Provider for image generation based on a prompt and an image.
   */
  image2image?: GetProvider<'image'> | GetProvider<'image'>[];

  /**
   * Provider for video generation based on a prompt alone.
   */
  text2video?: GetProvider<'video'> | GetProvider<'video'>[];
  /**
   * Provider for video generation based on a prompt and an image.
   */
  image2video?: GetProvider<'video'> | GetProvider<'video'>[];

  /**
   * Provider for speech generation based on a prompt alone.
   */
  text2speech?: GetProvider<'audio'> | GetProvider<'audio'>[];
  /**
   * Provider for sound effect generation based on a prompt alone.
   */
  text2sound?: GetProvider<'audio'> | GetProvider<'audio'>[];
}

export interface PluginConfiguration {
  providers: Providers;

  /**
   * Whether to enable debug mode. Will print additional debug information
   */
  debug?: boolean;

  /**
   * If true the generation process wll be replaced with a dummy generation.
   * Useful for testing the UI without actually generating images.
   */
  dryRun?: boolean;

  /**
   * Base URL used for the UI assets used in the plugin.
   *
   * By default, we load the assets from the IMG.LY CDN. You can copy the assets.
   * from the `/assets` folder to your own server and set the base URL to your server.
   */
  baseURL?: string;
}
