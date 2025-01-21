export interface PluginConfiguration {
  proxyUrl?: string;
  defaultPrompt?: string;
  debug?: boolean;
  dryRun?: boolean;
}

export type SelectValue = {
  id: string;
  label: string;
};
