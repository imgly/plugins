export interface PluginConfiguration {
  /**
   * Render console logs for debugging purposes.
   */
  debug?: boolean;

  /**
   * If true the generation process wll be replaced with a dummy generation.
   * Useful for testing the UI without actually generating images.
   */
  dryRun?: boolean;

  /**
   * The URL of the proxy server that forwards requests to the AI model.
   */
  proxyUrl?: string;
}
