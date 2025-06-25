import type CreativeEditorSDK from '@cesdk/cesdk-js';
import { type CreativeEngine } from '@cesdk/cesdk-js';
import type Provider from './provider';
import { Output, OutputKind, PanelInput } from './provider';
import { CommonConfiguration, CommonPluginConfiguration } from '../types';
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
  config: CommonPluginConfiguration<K, I, O>;
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
