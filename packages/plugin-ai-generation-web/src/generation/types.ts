import type CreativeEditorSDK from '@cesdk/cesdk-js';
import { type CreativeEngine } from '@cesdk/cesdk-js';
import type Provider from './provider';
import { Output, OutputKind, PanelInput } from './provider';
import { Middleware } from './middleware/middleware';

/**
 * Returns a provider for a given cesdk instance.
 */
export type GetProvider<K extends OutputKind> = ({
  cesdk
}: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<K, any, any>>;

/**
 * Configuration options for provider initialization
 */
export type InitProviderConfiguration = {
  /**
   * Whether to enable debug mode
   */
  debug?: boolean;

  /**
   * If true the generation process wll be replaced with a dummy generation.
   * Useful for testing the UI without actually generating images.
   */
  dryRun?: boolean;

  /**
   * Is called after an error occurred during the generation process.
   * Can be used to show an error message to the user, e.g. with the
   * Dialog or Notification API
   *
   * The default implementation logs the error to the console and
   * shows a notification to the user.
   */
  onError?: (error: unknown) => void;

  /**
   * Is called when the generation process is started. Can be used to
   * extend the generation process with additional steps.
   *
   * @param generate A function that starts the actual generation process.
   */
  middleware?: GenerationMiddleware;
};

/**
 * Common provider configuration that all providers should provide.
 */
export interface CommonProviderConfiguration<I, O extends Output> {
  /**
   * The proxy URL to use for the provider.
   */
  proxyUrl: string;

  /**
   * Indicates whether the provider is in debug mode and should log additional information.
   */
  debug?: boolean;

  /**
   * Middleware that shall be executed during the generation process.
   */
  middleware?: Middleware<I, O>[];

  /**
   * Headers that shall be sent with the request of the provider.
   */
  headers?: Record<string, string>;
}

export type GenerationMiddleware = (
  generate: () => Promise<void>,
  context: {
    provider: Provider<any, any, any>;
    abort: () => void;
  }
) => Promise<void>;

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
  config: CommonProviderConfiguration<I, O>;
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
