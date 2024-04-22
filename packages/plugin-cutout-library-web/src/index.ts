import plugin, {
  UILocations,
  generateCutoutFromSelection,
  getCutoutLibraryInsertEntry
} from './plugin';

export const DEFAULT_ASSET_BASE_URI = `https://staticimgly.com/${PLUGIN_NAME.replace(
  '@',
  ''
)}/${PLUGIN_VERSION}/dist/assets`;

export const DEFAULT_PLUGIN_CONFIGURATION = {
  assetBaseUri: DEFAULT_ASSET_BASE_URI
};

export interface PluginConfiguration {
  assetBaseUri: string;
  ui?: {
    locations: UILocations[];
  };
}

export function getPluginConfiguration(
  config: Partial<PluginConfiguration>
): PluginConfiguration {
  return { ...DEFAULT_PLUGIN_CONFIGURATION, ...config };
}

const Plugin = (
  config: Partial<PluginConfiguration> = DEFAULT_PLUGIN_CONFIGURATION
) => ({
  name: PLUGIN_NAME,
  version: PLUGIN_VERSION,
  ...plugin({ ...DEFAULT_PLUGIN_CONFIGURATION, ...config })
});

export default Plugin;

export { generateCutoutFromSelection, getCutoutLibraryInsertEntry };
