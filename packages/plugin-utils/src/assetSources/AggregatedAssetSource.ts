/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  AssetDefinition,
  AssetQueryData,
  AssetResult,
  AssetSource,
  AssetsQueryResult
} from '@cesdk/cesdk-js';
import CreativeEditorSDK from '@cesdk/cesdk-js';

/**
 * AggregatedAssetSource implements the AssetSource interface by aggregating
 * multiple asset sources via the cesdk API and combining their results.
 *
 * This asset source is read-only - it does not support adding or removing assets.
 */
export class AggregatedAssetSource implements AssetSource {
  /** The unique id of the asset source */
  public readonly id: string;

  /** The Creative Editor SDK instance */
  private cesdk: CreativeEditorSDK;

  /** The IDs of asset sources to aggregate */
  private assetSourceIds: string[];

  /**
   * Creates a new AggregatedAssetSource
   *
   * @param id - The unique identifier for this asset source
   * @param cesdk - The Creative Editor SDK instance
   * @param assetSourceIds - The IDs of asset sources to aggregate
   */
  constructor(id: string, cesdk: CreativeEditorSDK, assetSourceIds: string[]) {
    this.id = id;
    this.cesdk = cesdk;
    this.assetSourceIds = assetSourceIds;
  }

  /**
   * Find assets across all aggregated sources based on the provided query data
   * Results are sorted by the insertedAt timestamp in meta field
   *
   * @param queryData - Query parameters to filter and sort assets
   * @returns Promise with the query results
   */
  async findAssets(
    queryData: AssetQueryData
  ): Promise<AssetsQueryResult | undefined> {
    try {
      // Query all asset sources via cesdk
      const queryPromises = this.assetSourceIds.map((sourceId) =>
        this.cesdk.engine.asset.findAssets(sourceId, {
          ...queryData,
          // Increase page size to get all assets from each source
          // We'll handle pagination after merging
          perPage: 9999,
          page: 0
        })
      );

      // Wait for all queries to complete
      const results = await Promise.all(queryPromises);

      // Combine all assets from all sources
      let allAssets: AssetResult[] = [];
      results.forEach((result) => {
        if (result?.assets) {
          allAssets = allAssets.concat(result.assets);
        }
      });

      // Sort by insertedAt timestamp
      allAssets.sort((a, b) => {
        const timeA = (a.meta?.insertedAt as number) || 0;
        const timeB = (b.meta?.insertedAt as number) || 0;

        // Sort newest first (descending)
        return timeB - timeA;
      });

      // Apply pagination after merging
      const { page, perPage } = queryData;
      const startIndex = page * perPage;
      const endIndex = startIndex + perPage;
      const paginatedAssets = allAssets.slice(startIndex, endIndex);

      // Calculate if there is a next page
      const nextPage = endIndex < allAssets.length ? page + 1 : undefined;

      return {
        assets: paginatedAssets,
        currentPage: page,
        nextPage,
        total: allAssets.length
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error finding assets:', error);
      return undefined;
    }
  }

  /**
   * Retrieves all groups from all aggregated asset sources using cesdk
   * @returns Promise with an array of unique group names
   */
  async getGroups(): Promise<string[]> {
    const groupPromises = this.assetSourceIds.map((sourceId) =>
      this.cesdk.engine.asset.getGroups(sourceId)
    );

    const groupArrays = await Promise.all(groupPromises);

    // Combine and deduplicate groups
    const uniqueGroups = new Set<string>();
    groupArrays.forEach((groups) => {
      groups.forEach((group) => uniqueGroups.add(group));
    });

    return Array.from(uniqueGroups);
  }

  /**
   * This operation is not supported in AggregatedAssetSource
   * @throws Error - This method is not supported
   */
  addAsset(_asset: AssetDefinition): void {
    throw new Error('AggregatedAssetSource does not support adding assets');
  }

  /**
   * This operation is not supported in AggregatedAssetSource
   * @throws Error - This method is not supported
   */
  removeAsset(_assetId: string): void {
    throw new Error('AggregatedAssetSource does not support removing assets');
  }
}

/**
 * Helper function to create an AggregatedAssetSource instance
 *
 * @param id - The unique identifier for this asset source
 * @param cesdk - The Creative Editor SDK instance
 * @param assetSourceIds - The IDs of asset sources to aggregate
 * @returns A new AggregatedAssetSource instance
 */
export function createAggregatedAssetSource(
  id: string,
  cesdk: CreativeEditorSDK,
  assetSourceIds: string[]
): AggregatedAssetSource {
  return new AggregatedAssetSource(id, cesdk, assetSourceIds);
}

export default AggregatedAssetSource;
