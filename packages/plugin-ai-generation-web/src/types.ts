import { Output, OutputKind } from './generation/provider';
import { Middleware } from './generation/middleware/middleware';
import { GetProvider } from './generation/types';

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
  K extends OutputKind,
  I,
  O extends Output
> extends CommonConfiguration<I, O> {
  /**
   * Provider of a model for image generation just from a (prompt) text.
   */
  fromText?: GetProvider<K>[] | GetProvider<K>;

  /**
   * Provider of a model for image generation from a given image.
   */
  fromImage?: GetProvider<K>[] | GetProvider<K>;
}
