import CreativeEditorSDK from '@cesdk/cesdk-js';
import type {
  AssetDefinition,
  AssetQueryData,
  AssetResult,
  AssetSource,
  AssetsQueryResult
} from '@cesdk/engine';

/**
 * A custom AssetSource implementation that manages assets from an array or dynamic function
 * and provides functionality to mark assets as active.
 */
export class CustomAssetSource implements AssetSource {
  /** The unique id of the asset source */
  id: string;

  /** Array of assets or function that returns assets */
  private assetsOrProvider: AssetDefinition[] | (() => AssetDefinition[]);

  /** Set of IDs for active assets */
  private activeAssetIds: Set<string>;

  private loaderDisposer: Record<string, (() => void) | undefined>;

  private cesdk: CreativeEditorSDK;

  /**
   * Creates a new instance of CustomAssetSource
   *
   * @param id - The unique identifier for this asset source
   * @param assetsOrProvider - Array of asset definitions or function that returns asset definitions
   */
  constructor(
    id: string,
    cesdk: CreativeEditorSDK,
    assetsOrProvider: AssetDefinition[] | (() => AssetDefinition[]) = []
  ) {
    this.id = id;
    this.assetsOrProvider = assetsOrProvider;
    this.activeAssetIds = new Set<string>();
    this.loaderDisposer = {};
    this.cesdk = cesdk;
  }

  /**
   * Get all current assets definitions used by this asset source
   */
  public getCurrentAssets(): AssetDefinition[] {
    return typeof this.assetsOrProvider === 'function'
      ? this.assetsOrProvider()
      : this.assetsOrProvider;
  }

  /**
   * Find assets based on the provided query data
   * Supports pagination, searching, filtering, and active-first sorting
   *
   * @param queryData - Query parameters to filter and sort assets
   * @returns Promise with the query results
   */
  async findAssets(
    queryData: AssetQueryData
  ): Promise<AssetsQueryResult | undefined> {
    const {
      page,
      perPage,
      locale = 'en',
      sortActiveFirst,
      query,
      tags,
      groups,
      excludeGroups,
      sortingOrder,
      sortKey
    } = queryData;

    // Start with all assets
    let filteredAssets = [...this.getCurrentAssets()];

    // Filter by groups if provided
    if (groups && groups.length > 0) {
      filteredAssets = filteredAssets.filter(
        (asset) =>
          asset.groups && groups.some((group) => asset.groups?.includes(group))
      );
    }

    // Filter out excluded groups if provided
    if (excludeGroups && excludeGroups.length > 0) {
      filteredAssets = filteredAssets.filter(
        (asset) =>
          !asset.groups ||
          !excludeGroups.some((group) => asset.groups?.includes(group))
      );
    }

    // Filter by query (search in label and tags)
    if (query) {
      const lowerQuery = query.toLowerCase();
      filteredAssets = filteredAssets.filter((asset) => {
        const label = asset.label?.[locale]?.toLowerCase();
        const assetTags = asset.tags?.[locale] || [];

        return (
          (label && label.includes(lowerQuery)) ||
          assetTags.some((tag) => tag.toLowerCase().includes(lowerQuery))
        );
      });
    }

    // Filter by exact tags if provided
    if (tags && tags.length > 0) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filteredAssets = filteredAssets.filter((asset) => {
        const assetTags = asset.tags?.[locale] || [];
        return tagArray.some((tag) => assetTags.includes(tag));
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
    const resultAssets: AssetResult[] = paginatedAssets.map((asset) => {
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

  updateLabel(
    assetId: string,
    label: (currentLabel: string) => string,
    locale: string
  ): void {
    if (typeof this.assetsOrProvider === 'function') {
      // eslint-disable-next-line no-console
      console.warn('Cannot update label on dynamic asset provider');
      return;
    }
    this.assetsOrProvider.forEach((asset) => {
      if (asset.id === assetId) {
        asset.label = asset.label || {};
        asset.label[locale] = label(asset.label[locale]);
      }
    });
  }

  getLabel(assetId: string, locale: string): string | undefined {
    const foundAsset = this.getCurrentAssets().find((asset) => {
      return asset.id === assetId;
    });
    if (foundAsset == null) return undefined;

    return foundAsset.label?.[locale];
  }

  /**
   * Set an asset as active by its ID
   *
   * @param assetId - The ID of the asset to mark as active
   */
  setAssetActive(assetId: string): void {
    this.activeAssetIds.add(assetId);
  }

  setAssetLoading(assetId: string, loading: boolean): void {
    if (loading) {
      const label = this.getLabel(assetId, 'en') ?? '';
      const disposeAsciiLoader = createAsciiLoader((spinnerChar) => {
        if (this.cesdk.engine.asset === null) return false;
        this.updateLabel(assetId, () => `${spinnerChar} ${label}`, 'en');
        this.cesdk.engine.asset.assetSourceContentsChanged(this.id);
        return true;
      });
      this.loaderDisposer[assetId] = () => {
        this.updateLabel(assetId, () => label, 'en');
        disposeAsciiLoader();
      };
    } else {
      this.loaderDisposer[assetId]?.();
      this.loaderDisposer[assetId] = undefined;
    }
  }

  /**
   * Set an asset as inactive by its ID
   *
   * @param assetId - The ID of the asset to mark as inactive
   */
  setAssetInactive(assetId: string): void {
    this.activeAssetIds.delete(assetId);
    this.loaderDisposer[assetId]?.();
    this.loaderDisposer[assetId] = undefined;
  }

  /**
   * Clear all active assets
   */
  clearActiveAssets(): void {
    this.activeAssetIds.clear();
    Object.values(this.loaderDisposer).forEach((disposer) => {
      disposer?.();
    });
    this.loaderDisposer = {};
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
    if (typeof this.assetsOrProvider === 'function') {
      // eslint-disable-next-line no-console
      console.warn('Cannot add asset to dynamic asset provider');
      return;
    }
    // Check if asset with this ID already exists
    const existingIndex = this.assetsOrProvider.findIndex(
      (a) => a.id === asset.id
    );
    if (existingIndex >= 0) {
      // Replace existing asset
      this.assetsOrProvider[existingIndex] = asset;
    } else {
      // Add new asset
      this.assetsOrProvider.push(asset);
    }
  }

  /**
   * Remove an asset from this source
   *
   * @param assetId - The ID of the asset to remove
   */
  removeAsset(assetId: string): void {
    if (typeof this.assetsOrProvider === 'function') {
      // eslint-disable-next-line no-console
      console.warn('Cannot remove asset from dynamic asset provider');
      return;
    }
    const index = this.assetsOrProvider.findIndex(
      (asset) => asset.id === assetId
    );
    if (index !== -1) {
      this.assetsOrProvider.splice(index, 1);
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
    this.getCurrentAssets().forEach((asset) => {
      if (asset.groups) {
        asset.groups.forEach((group) => groups.add(group));
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
 * @param assetsOrProvider - Array of asset definitions or function that returns asset definitions
 * @returns A new CustomAssetSource instance
 */
export function createCustomAssetSource(
  id: string,
  cesdk: CreativeEditorSDK,
  assetsOrProvider: AssetDefinition[] | (() => AssetDefinition[]) = []
): CustomAssetSource {
  return new CustomAssetSource(id, cesdk, assetsOrProvider);
}

/**
 * Creates a periodically updating ASCII loader animation and calls a callback function
 * with each update until a disposer is called.
 *
 * @param callback Function to call with each loader update
 * @param interval Milliseconds between updates (default: 500ms)
 * @returns A disposer function that stops the animation when called
 */
function createAsciiLoader(
  callback: (loader: string) => boolean,
  interval: number = 200
): () => void {
  // Spinner frames for the animation
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let frameIndex = 0;

  // Start the interval
  const timerId = setInterval(() => {
    // Get the current frame and update the index
    const currentFrame = frames[frameIndex];
    frameIndex = (frameIndex + 1) % frames.length;

    // Call the callback with the current frame
    if (!callback(currentFrame)) {
      clearInterval(timerId);
    }
  }, interval);

  // Return a disposer function
  return () => {
    clearInterval(timerId);
  };
}

export default CustomAssetSource;
