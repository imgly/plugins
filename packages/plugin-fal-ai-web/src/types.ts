export interface PluginConfiguration {
  proxyUrl?: string;
  defaultPrompt?: string;
  debug?: boolean;
  dryRun?: boolean;
  onError?: (error: any) => void;
}

export type SelectValue = {
  id: string;
  label: string;
};
