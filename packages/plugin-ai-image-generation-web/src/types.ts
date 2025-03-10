export interface PluginConfiguration {
  proxyUrl?: string;
  defaultPrompt?: string;
  debug?: boolean;
  dryRun?: boolean;
  onError?: (error: any) => void;
  historyAssetSourceId?: string;
  uploadGeneratedAsset?: 'configured' | ((url: string) => Promise<string>);
}

export type SelectValue = {
  id: string;
  label: string;
};
