import { Output, OutputKind } from './generation/provider';
import { Middleware } from './generation/middleware/middleware';

/**
 * A common configuration used by the plugins and the provider.
 */
export interface CommonConfiguration<I, O extends Output> {
  /**
   * Render console logs for debugging purposes.
   */
  debug?: boolean;

  /**
   * Dry run mode. If set to true, the plugin will not make any API calls.
   */
  dryRun?: boolean;

  /**
   * Middlewares to add to the provider generation
   */
  middlewares?: Middleware<I, O>[];
}

/**
 * Configuration to set provider and models for image generation.
 */
export interface CommonPluginConfiguration<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  K extends OutputKind,
  I,
  O extends Output
> extends CommonConfiguration<I, O> {
  /**
   * Base URL used for the UI assets used in the plugin.
   *
   * By default, we load the assets from the IMG.LY CDN. You can copy the assets.
   * from the `/assets` folder to your own server and set the base URL to your server.
   */
  baseURL?: string;
}
