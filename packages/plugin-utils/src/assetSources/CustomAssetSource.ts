import type {
  AssetDefinition,
  AssetQueryData,
  AssetResult,
  AssetSource,
  AssetsQueryResult
} from '@cesdk/engine';

/**
 * Simplified value type for select inputs that can be converted to asset definitions
 */
export type SelectValue = {
  id: string;
  label: string;
  thumbUri?: string;
};

/**
 * A custom AssetSource implementation that manages assets from an array
 * and provides additional functionality like to mark assets as active or changing
 * labels.
 */
export class CustomAssetSource implements AssetSource {
  /** The unique id of the asset source */
  id: string;

  /** Array of assets to be served by this source */
  private assets: AssetDefinition[];

  /** Set of IDs for active assets */
  private activeAssetIds: Set<string>;

  /**
   * Creates a new instance of CustomAssetSource
   * 
   * @param id - The unique identifier for this asset source
   * @param assets - Array of asset definitions or SelectValue objects to include in this source
   */
  constructor(id: string, assets: (AssetDefinition | SelectValue)[] = []) {
    this.id = id;
    this.assets = assets.map(asset => {
      // Check if the asset is a SelectValue by looking for the label property as a string
      if (
        typeof (asset as SelectValue).label === 'string' && 
        !((asset as AssetDefinition).label && typeof (asset as AssetDefinition).label === 'object')
      ) {
        const selectValue = asset as SelectValue;
        // Convert SelectValue to AssetDefinition
        return {
          id: selectValue.id,
          label: { en: selectValue.label },
          meta: selectValue.thumbUri ? { thumbnailURI: selectValue.thumbUri } : undefined
        } as AssetDefinition;
      }
      return asset as AssetDefinition;
    });
    this.activeAssetIds = new Set<string>();
  }

  /**
   * Find assets based on the provided query data
   * Supports pagination, searching, filtering, and active-first sorting
   * 
   * @param queryData - Query parameters to filter and sort assets
   * @returns Promise with the query results
   */
  async findAssets(queryData: AssetQueryData): Promise<AssetsQueryResult | undefined> {
    const { page, perPage, locale = 'en', sortActiveFirst, query, tags, groups, excludeGroups, sortingOrder, sortKey } = queryData;

    // Start with all assets
    let filteredAssets = [...this.assets];

    // Filter by groups if provided
    if (groups && groups.length > 0) {
      filteredAssets = filteredAssets.filter(asset => 
        asset.groups && groups.some(group => asset.groups?.includes(group))
      );
    }

    // Filter out excluded groups if provided
    if (excludeGroups && excludeGroups.length > 0) {
      filteredAssets = filteredAssets.filter(asset => 
        !asset.groups || !excludeGroups.some(group => asset.groups?.includes(group))
      );
    }

    // Filter by query (search in label and tags)
    if (query) {
      const lowerQuery = query.toLowerCase();
      filteredAssets = filteredAssets.filter(asset => {
        const label = asset.label?.[locale]?.toLowerCase();
        const assetTags = asset.tags?.[locale] || [];
        
        return (
          (label && label.includes(lowerQuery)) ||
          assetTags.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
      });
    }

    // Filter by exact tags if provided
    if (tags && tags.length > 0) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filteredAssets = filteredAssets.filter(asset => {
        const assetTags = asset.tags?.[locale] || [];
        return tagArray.some(tag => assetTags.includes(tag));
      });
    }

    // Sort by active first if requested
    if (sortActiveFirst) {
      filteredAssets.sort((a, b) => {
        const aActive = this.activeAssetIds.has(a.id);
        const bActive = this.activeAssetIds.has(b.id);
        
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;
        return 0;
      });
    }

    // Sort by sortKey if provided
    if (sortKey && sortKey !== 'id') {
      filteredAssets.sort((a, b) => {
        // Sort by metadata field
        const aValue = a.meta?.[sortKey];
        const bValue = b.meta?.[sortKey];
        
        if (aValue === undefined) return 1;
        if (bValue === undefined) return -1;
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortingOrder === 'Descending' 
            ? bValue.localeCompare(aValue) 
            : aValue.localeCompare(bValue);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortingOrder === 'Descending' 
            ? bValue - aValue 
            : aValue - bValue;
        }
        
        return 0;
      });
    } else if (sortKey === 'id') {
      // Sort by id
      filteredAssets.sort((a, b) => {
        return sortingOrder === 'Descending' 
          ? b.id.localeCompare(a.id) 
          : a.id.localeCompare(b.id);
      });
    }

    // Calculate pagination
    const total = filteredAssets.length;
    const startIndex = page * perPage;
    const endIndex = startIndex + perPage;
    const paginatedAssets = filteredAssets.slice(startIndex, endIndex);

    // Transform AssetDefinition objects to AssetResult objects
    const resultAssets: AssetResult[] = paginatedAssets.map(asset => {
      return {
        id: asset.id,
        groups: asset.groups,
        meta: asset.meta,
        payload: asset.payload,
        locale,
        label: asset.label?.[locale],
        tags: asset.tags?.[locale],
        active: this.activeAssetIds.has(asset.id)
      };
    });

    // Calculate next page if there are more assets
    const nextPage = endIndex < total ? page + 1 : undefined;

    return {
      assets: resultAssets,
      currentPage: page,
      nextPage,
      total
    };
  }


  updateLabel(assetId: string, label: string, locale: string): void {
    this.assets.forEach(asset => {
      if (asset.id === assetId) {
        asset.label = asset.label || {};
        asset.label[locale] = label;
      }
    });
  }

  /**
   * Set an asset as active by its ID
   * 
   * @param assetId - The ID of the asset to mark as active
   */
  setAssetActive(assetId: string): void {
    this.activeAssetIds.add(assetId);
  }

  /**
   * Set multiple assets as active by their IDs
   * 
   * @param assetIds - Array of asset IDs to mark as active
   */
  setAssetsActive(assetIds: string[]): void {
    assetIds.forEach(id => this.activeAssetIds.add(id));
  }

  /**
   * Set an asset as inactive by its ID
   * 
   * @param assetId - The ID of the asset to mark as inactive
   */
  setAssetInactive(assetId: string): void {
    this.activeAssetIds.delete(assetId);
  }

  /**
   * Clear all active assets
   */
  clearActiveAssets(): void {
    this.activeAssetIds.clear();
  }

  /**
   * Check if an asset is marked as active
   * 
   * @param assetId - The ID of the asset to check
   * @returns True if the asset is active, false otherwise
   */
  isAssetActive(assetId: string): boolean {
    return this.activeAssetIds.has(assetId);
  }

  /**
   * Add an asset to this source
   * 
   * @param asset - The asset definition to add
   */
  addAsset(asset: AssetDefinition): void {
    // Check if asset with this ID already exists
    const existingIndex = this.assets.findIndex(a => a.id === asset.id);
    if (existingIndex >= 0) {
      // Replace existing asset
      this.assets[existingIndex] = asset;
    } else {
      // Add new asset
      this.assets.push(asset);
    }
  }

  /**
   * Remove an asset from this source
   * 
   * @param assetId - The ID of the asset to remove
   */
  removeAsset(assetId: string): void {
    const index = this.assets.findIndex(asset => asset.id === assetId);
    if (index !== -1) {
      this.assets.splice(index, 1);
      this.activeAssetIds.delete(assetId);
    }
  }

  /**
   * Get all available groups from the assets
   * 
   * @returns Array of unique group names
   */
  async getGroups(): Promise<string[]> {
    const groups = new Set<string>();
    this.assets.forEach(asset => {
      if (asset.groups) {
        asset.groups.forEach(group => groups.add(group));
      }
    });
    return Array.from(groups);
  }

  /**
   * Returns the supported MIME types for this asset source
   * 
   * @returns Array of supported MIME types
   */
  getSupportedMimeTypes(): string[] {
    return [
      'image/jpeg',
      'image/png',
      'image/svg+xml',
      'image/webp',
      'video/mp4',
      'audio/mpeg'
    ];
  }
}

/**
 * Helper function to create a CustomAssetSource instance
 * 
 * @param id - The unique identifier for this asset source
 * @param assets - Array of asset definitions or SelectValue objects to include in this source
 * @returns A new CustomAssetSource instance
 */
export function createCustomAssetSource(id: string, assets: (AssetDefinition | SelectValue)[] = []): CustomAssetSource {
  return new CustomAssetSource(id, assets);
}

export default CustomAssetSource;
