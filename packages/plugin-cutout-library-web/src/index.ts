import { CreativeEngine, DesignBlockId } from '@cesdk/cesdk-js';
import plugin, { UILocations, generateCutoutFromSelection } from './plugin';

export const DEFAULT_ASSET_BASE_URI = `https://staticimgly.com/${PLUGIN_NAME.replace(
  '@',
  ''
)}/${PLUGIN_VERSION}/dist/assets`;

export const DEFAULT_PLUGIN_CONFIGURATION = {
  assetBaseUri: DEFAULT_ASSET_BASE_URI,
  createCutoutFromBlocks: (blockIds: number[], engine: CreativeEngine) => {
    return engine.block.createCutoutFromBlocks(blockIds, 0, 2, false);
  }
};
export type CreateCutoutFromBlocks = (
  blockIds: number[],
  engine: CreativeEngine
) => DesignBlockId;

export interface PluginConfiguration {
  assetBaseUri: string;
  ui?: {
    locations: UILocations[];
  };
  // Can be used to customize the cutout block creation call parameters.
  createCutoutFromBlocks?: CreateCutoutFromBlocks;
}
export interface InternalPluginConfiguration extends PluginConfiguration {
  createCutoutFromBlocks: CreateCutoutFromBlocks;
}

export function getPluginConfiguration(
  config: Partial<PluginConfiguration>
): InternalPluginConfiguration {
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

export { generateCutoutFromSelection };
