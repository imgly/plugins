import Provider, { Output, OutputKind } from './generation/provider';
import { Middleware } from './generation/middleware/middleware';
import { GetProvider } from './generation/types';

/**
 * Configuration to set provider and models for image generation.
 */
export interface CommonPluginConfiguration<
  K extends OutputKind,
  I,
  O extends Output
> {
  /**
   * Provider of a model for image generation just from a (prompt) text.
   */
  fromText?: GetProvider<K>[] | GetProvider<K>;

  /**
   * Provider of a model for image generation from a given image.
   */
  fromImage?: GetProvider<K>[] | GetProvider<K>;

  /**
   * Middlewares to add to the provider generation
   */
  middlewares?:
    | Middleware<I, O>[]
    | ((provider: Provider<K, I, O>) => Middleware<I, O>[]);

  /**
   * Render console logs for debugging purposes.
   */
  debug?: boolean;

  /**
   * Dry run mode. If set to true, the plugin will not make any API calls.
   */
  dryRun?: boolean;
}
