// EachLabs image provider factory
// TODO: Implement actual provider creation

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Middleware = (input: any, output: any) => any;

export interface EachLabsProviderConfiguration {
  /**
   * The URL of the proxy server to use for API requests
   */
  proxyUrl: string;
  /**
   * Enable debug mode for logging
   */
  debug?: boolean;
  /**
   * Optional middlewares to apply to the provider
   */
  middlewares?: Middleware[];
  /**
   * History configuration
   */
  history?: false | '@imgly/local' | '@imgly/indexedDB';
}

// Provider factory will be implemented here when models are added
