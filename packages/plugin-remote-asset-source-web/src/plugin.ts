import {
  AssetAPI,
  AssetQueryData,
  AssetSource,
  AssetsQueryResult,
  BlockAPI,
  CompleteAssetResult,
  type EditorPlugin
} from '@cesdk/cesdk-js';
import {
  AssetSourceManifest,
  assetSourceManifestSchema
} from './schemas/assetSourceManifestSchema';
import { ensureAssetDuration, ensureMetadataKeys } from './util';

export const RemoteAssetSourcePlugin = (
  pluginConfiguration: RemoteAssetSourcePluginConfiguration
): Omit<EditorPlugin, 'name' | 'version'> => {
  const { baseUrl } = pluginConfiguration;
  let manifestPromise: Promise<AssetSourceManifest> | null = null;

  return {
    async initialize({ engine, cesdk }) {
      try {
        manifestPromise = fetchManifest(baseUrl);
        const manifest = await manifestPromise;
        if (!manifest) {
          throw new Error(
            `Remote Asset Source Manifest could not be loaded. Make sure it is reachable at: ${baseUrl}`
          );
        }
        engine.asset.addSource(manifestToSource(manifest, engine, baseUrl));

        if (cesdk) {
          cesdk.setTranslations({
            en: {
              [`libraries.${manifest.id}.label`]: manifest.name.en
            }
          });
        }
      } catch (error) {
        throw new Error(
          `Remote Asset Source Manifest could not be loaded. Make sure it is reachable at: ${baseUrl}`
        );
      }
    }
  };
};

export const manifestToSource = (
  manifest: AssetSourceManifest,
  engine: {
    asset: AssetAPI;
    block: BlockAPI;
  },
  baseUrl: string
): AssetSource => {
  let getGroups;
  if (manifest.canGetGroups) {
    getGroups = async () => {
      throw new Error('Not implemented');
    };
  }

  return {
    id: manifest.id,
    applyAsset: async (asset: CompleteAssetResult) => {
      if (!engine) {
        throw new Error('Engine not initialized');
      }
      const block = await engine.asset.defaultApplyAsset(asset);
      if (!block) {
        return;
      }
      await ensureAssetDuration(engine, asset, block);
      ensureMetadataKeys(engine, block, asset, manifest.id);
      return block;
    },
    applyAssetToBlock: async (asset, block: number) => {
      if (!engine) {
        throw new Error('Engine not initialized');
      }
      await engine.asset.defaultApplyAssetToBlock(asset, block);
      ensureMetadataKeys(engine, block, asset, manifest.id);
    },
    findAssets: async (
      queryData: AssetQueryData
    ): Promise<AssetsQueryResult | undefined> => {
      const searchParams = new URLSearchParams();
      Object.entries(queryData).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value);
        }
      });
      const result = await fetch(
        `${baseUrl}/assets?${searchParams.toString()}`,
        {
          headers: {
            'content-type': 'application/json'
          }
        }
      ).then((response) => response.json());

      return result.data ?? [];
    },
    getGroups,
    credits: manifest.credits,
    license: manifest.license,
    getSupportedMimeTypes: () => manifest.supportedMimeTypes
  };
};

export interface RemoteAssetSourcePluginConfiguration {
  baseUrl: string;
}

async function fetchManifest(baseUrl: string) {
  const requestSourceManifest = await fetch(`${baseUrl}`);
  const sourceManifestJSON = await requestSourceManifest.json();
  const sourceManifestResult = assetSourceManifestSchema.safeParse(
    sourceManifestJSON.data
  );
  if (!sourceManifestResult.success) {
    throw new Error('Invalid source manifest');
  }
  return sourceManifestResult.data;
}
