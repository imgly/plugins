import plugin, { PLUGIN_ID, type PluginConfiguration } from './plugin';

const Plugin = (pluginConfiguration?: PluginConfiguration) => ({
  name: PLUGIN_ID,
  version: PLUGIN_VERSION,
  ...plugin(pluginConfiguration)
});

// Default export supports both client-side and provider-based usage
export default Plugin;

// Export FalAI providers for server-side background removal
export { default as FalAi } from './fal-ai';

// Export types
export type { BackgroundRemovalProvider } from './processBackgroundRemoval';
export type { PluginConfiguration } from './plugin';

// Re-export the plugin function for direct usage
export { plugin };
