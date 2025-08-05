import type CreativeEditorSDK from '@cesdk/cesdk-js';
import { type CreativeEngine } from '@cesdk/cesdk-js';
import type Provider from './core/provider';
import { Output, OutputKind, PanelInput } from './core/provider';
import { Middleware } from './middleware/middleware';

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

  /**
   * Custom translations to override schema-based translations.
   */
  customTranslations?: {
    [locale: string]: {
      [key: string]: string;
    };
  };
}

/**
 * Returns a provider for a given cesdk instance.
 */
export type GetProvider<K extends OutputKind> = ({
  cesdk
}: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<K, any, any>>;

/**
 * Common provider configuration that all providers should provide.
 */
export interface CommonProviderConfiguration<I, O extends Output>
  extends CommonConfiguration<I, O> {
  /**
   * The proxy URL to use for the provider.
   */
  proxyUrl: string;

  /**
   * Headers that shall be sent with the request of the provider.
   */
  headers?: Record<string, string>;

  /**
   * Middlewares to add to the provider generation
   * @deprecated Use `middlewares` instead.
   */
  middleware?: Middleware<I, O>[];
}

/**
 * Internal configuration interface for provider initialization.
 * This extends the public CommonPluginConfiguration with required provider field.
 */
export interface InternalPluginConfiguration<
  K extends OutputKind,
  I,
  O extends Output
> extends CommonConfiguration<I, O> {
  /**
   * The provider to use for generation.
   */
  provider: Provider<K, I, O>;

  /**
   * The panel input schema to use for the provider.
   */
  panelInput?: PanelInput<K, I>;
}

/**
 * Context for provider initialization, including the provider, panel input schema,
 * options, and configuration.
 */
export type InitializationContext<
  K extends OutputKind,
  I,
  O extends Output,
  P extends PanelInput<K, I> = PanelInput<K, I>
> = {
  provider: Provider<K, I, O>;
  panelInput?: P;
  options: UIOptions;
  config: InternalPluginConfiguration<K, I, O>;
};

/**
 * Options for UI interactions
 */
export type UIOptions = {
  cesdk: CreativeEditorSDK;
  engine: CreativeEngine;
  historyAssetSourceId?: string;
  historyAssetLibraryEntryId?: string;
  i18n?: {
    prompt?: string;
  };
};

/**
 * Basic context for provider initialization
 */
export type Options = {
  cesdk?: CreativeEditorSDK;
  engine: CreativeEngine;
};
