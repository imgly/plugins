export interface PluginConfiguration {
  proxyUrl?: string;
  defaultPrompt?: string;
  debug?: boolean;
  dryRun?: boolean;
  onError?: (error: any) => void;
  historyAssetSourceId?: string;
}

export type SelectValue = {
  id: string;
  label: string;
};
