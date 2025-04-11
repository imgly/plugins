/* eslint-disable no-console */
import {
  CreativeEngine,
  type AssetDefinition,
  type AssetQueryData,
  type AssetResult,
  type AssetSource,
  type AssetsQueryResult
} from '@cesdk/cesdk-js';

type BlobEntry = {
  id: string;
  blob: Blob;
};

// Asset definition with meta containing insertedAt timestamp
type AssetEntryWithMeta = AssetDefinition;

/**
 * IndexedDBAssetSource implements the AssetSource interface using IndexedDB as the storage backend.
 */
export class IndexedDBAssetSource implements AssetSource {
  /** The unique id of the API */
  public readonly id: string;

  public readonly engine: CreativeEngine;

  private readonly dbName: string;

  private readonly dbVersion: number;

  private readonly assetStoreName: string = 'assets';

  private readonly blobStoreName: string = 'blobs';

  private db: IDBDatabase | null = null;

  /**
   * Creates a new IndexedDBAssetSource
   *
   * @param id - The unique identifier for this asset source
   * @param {Object} [options] - Optional configuration options.
   * @param {string} [options.dbName] - The name of the database.
   * @param {number} [options.dbVersion] - The version number of the database.
   */
  constructor(
    id: string,
    engine: CreativeEngine,
    options?: {
      dbName?: string;
      dbVersion?: number;
    }
  ) {
    this.id = id;
    this.engine = engine;
    this.dbName = options?.dbName ?? `ly.img.assetSource/${id}`;
    this.dbVersion = options?.dbVersion ?? 1;
  }

  /**
   * Initialize the database connection and create object stores if needed
   */
  public async initialize(): Promise<void> {
    if (this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = (event) => {
        reject(
          new Error(
            `Failed to open IndexedDB: ${(event.target as IDBRequest).error}`
          )
        );
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create asset store if it doesn't exist
        if (!db.objectStoreNames.contains(this.assetStoreName)) {
          db.createObjectStore(this.assetStoreName, {
            keyPath: 'id'
          });
        }
        // Create blob store if it doesn't exist
        if (!db.objectStoreNames.contains(this.blobStoreName)) {
          db.createObjectStore(this.blobStoreName, {
            keyPath: 'id'
          });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };
    });
  }

  /**
   * Close the database connection
   */
  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Find all assets for the given type and the provided query data.
   *
   * @param queryData - The query parameters for filtering assets
   * @param insertionSortOrder - Optional parameter to sort by insertion time: 'asc' for oldest first, 'desc' for newest first (default)
   * @returns A promise that resolves to the query results or undefined if there was an error
   */
  public async findAssets(
    queryData: AssetQueryData
  ): Promise<AssetsQueryResult | undefined> {
    await this.initialize();

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // Get all assets from the store with specified insertion order
      const assetDefinitions = await this.getAllAssets('asc');

      let assetResults = assetDefinitions.reduce((acc, assetDefinition) => {
        const locale = queryData.locale ?? 'en';
        let label = '';
        let tags: string[] = [];

        // Handle localized label if available
        if (
          assetDefinition.label != null &&
          typeof assetDefinition.label === 'object' &&
          assetDefinition.label[locale]
        ) {
          label = assetDefinition.label[locale];
        }

        // Handle localized tags if available
        if (
          assetDefinition.tags != null &&
          typeof assetDefinition.tags === 'object' &&
          assetDefinition.tags[locale]
        ) {
          tags = assetDefinition.tags[locale];
        }

        const result: AssetResult = {
          ...assetDefinition,
          label,
          tags
        };

        if (this.filterAsset(result, queryData)) {
          acc.push(result);
        }

        return acc;
      }, [] as AssetResult[]);

      assetResults = await this.restoreBlobUrls(assetResults);

      // Apply sorting
      assetResults = this.sortAssets(assetResults, queryData);

      // Apply pagination
      const { page, perPage } = queryData;
      const startIndex = page * perPage;
      const endIndex = startIndex + perPage;
      const paginatedAssets = assetResults.slice(startIndex, endIndex);

      // Determine if there's a next page
      const nextPage = endIndex < assetResults.length ? page + 1 : undefined;

      const result = {
        assets: paginatedAssets,
        currentPage: page,
        nextPage,
        total: assetResults.length
      };

      return result;
    } catch (error) {
      console.error('Error finding assets:', error);
      return undefined;
    }
  }

  public async getGroups(): Promise<string[]> {
    await this.initialize();

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.assetStoreName, 'readonly');
      const store = transaction.objectStore(this.assetStoreName);
      const request = store.getAll();

      request.onsuccess = () => {
        const allGroups = new Set<string>();

        // Extract all groups from all assets
        (request.result as AssetResult[]).forEach((asset) => {
          if (asset.groups && Array.isArray(asset.groups)) {
            asset.groups.forEach((group) => allGroups.add(group));
          }
        });

        const uniqueGroups = [...allGroups];
        resolve(uniqueGroups);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get groups: ${request.error}`));
      };
    });
  }

  /**
   * Adds the given asset to this source. Part of the AssetSource interface.
   *
   * @param asset - The asset definition to add
   */
  public addAsset(asset: AssetDefinition): void {
    this.initialize()
      .then(async () => {
        if (!this.db) {
          throw new Error('Database not initialized');
        }

        const transaction = this.db.transaction(
          this.assetStoreName,
          'readwrite'
        );
        const assetStore = transaction.objectStore(this.assetStoreName);

        const blobsToStore = new Set<string>();
        processBlobUrls(asset, (value) => {
          blobsToStore.add(value);
        });

        setTimeout(() => {
          this.storeBlobUrls([...blobsToStore]);
        });

        // Ensure asset has meta object with insertedAt timestamp
        const assetWithMeta: AssetEntryWithMeta = {
          ...asset,
          meta: {
            ...asset.meta,
            insertedAt: asset.meta?.insertedAt || Date.now()
          }
        };

        // Store the asset in the database
        assetStore.put(assetWithMeta);

        transaction.onerror = () => {
          console.error(`Failed to add asset: ${transaction.error}`);
        };
      })
      .catch((error) => {
        console.error('Error initializing database:', error);
      });
  }

  /**
   * Removes the given asset from this source. Part of the AssetSource interface.
   *
   * @param assetId - The ID of the asset to remove
   */
  public async removeAsset(assetId: string): Promise<void> {
    const asset = await this.getAsset(assetId);

    return this.initialize()
      .then(() => {
        if (!this.db) {
          throw new Error('Database not initialized');
        }

        const transaction = this.db.transaction(
          this.assetStoreName,
          'readwrite'
        );
        const store = transaction.objectStore(this.assetStoreName);
        store.delete(assetId);

        transaction.oncomplete = () => {
          processBlobUrls(asset, (value) => {
            this.removeBlob(value);
          });
          this.engine.asset.assetSourceContentsChanged(this.id);
        };

        transaction.onerror = () => {
          console.error(`Failed to remove asset: ${transaction.error}`);
        };
      })
      .catch((error) => {
        console.error('Error initializing database:', error);
      });
  }

  /**
   * Removes the given asset from this source. Part of the AssetSource interface.
   *
   * @param assetId - The ID of the asset to remove
   */
  public async removeBlob(blobId: string): Promise<void> {
    return this.initialize()
      .then(() => {
        if (!this.db) {
          throw new Error('Database not initialized');
        }

        const transaction = this.db.transaction(
          this.blobStoreName,
          'readwrite'
        );
        const store = transaction.objectStore(this.blobStoreName);
        store.delete(blobId);

        transaction.onerror = () => {
          console.error(`Failed to remove blob: ${transaction.error}`);
        };
      })
      .catch((error) => {
        console.error('Error initializing database:', error);
      });
  }

  /**
   * Get all assets from the database sorted by insertion order (newest to oldest)
   *
   * @param sortOrder - Optional parameter to specify sort order: 'asc' for oldest first, 'desc' for newest first (default)
   * @returns A promise that resolves to an array of all assets
   */
  private async getAllAssets(
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<AssetDefinition[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.assetStoreName, 'readonly');
      const store = transaction.objectStore(this.assetStoreName);
      const request = store.getAll();

      request.onsuccess = () => {
        const assets = request.result as AssetEntryWithMeta[];

        // Sort by insertion timestamp
        assets.sort((a, b) => {
          // Default to current time if insertedAt is missing (for backward compatibility)
          // First check in meta.insertedAt, then fallback to legacy _insertedAt for backward compatibility
          const timeA =
            a.meta?.insertedAt || (a as any)._insertedAt || Date.now();
          const timeB =
            b.meta?.insertedAt || (b as any)._insertedAt || Date.now();

          // Sort based on requested order
          return sortOrder === 'asc'
            ? timeA - timeB // oldest first
            : timeB - timeA; // newest first (default)
        });

        resolve(assets);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get assets: ${request.error}`));
      };
    });
  }

  // Retrieve a blob by ID
  async getAsset(id: string): Promise<AssetResult | undefined> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.assetStoreName, 'readonly');
      const store = transaction.objectStore(this.assetStoreName);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result as AssetResult);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get blob: ${request.error}`));
      };
    });
  }

  // Retrieve a blob by ID
  async getBlob(id: string): Promise<BlobEntry | undefined> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.blobStoreName, 'readonly');
      const store = transaction.objectStore(this.blobStoreName);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result as BlobEntry);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get blob: ${request.error}`));
      };
    });
  }

  async createBlobUrlFromStore(blobUrl: string): Promise<string> {
    const blobEntry = await this.getBlob(blobUrl);
    if (blobEntry != null) {
      return URL.createObjectURL(blobEntry.blob);
    }
    return blobUrl;
  }

  async storeBlobUrls(urls: string[]): Promise<void> {
    const blobsToStore: { [key: string]: Blob } = {};
    await Promise.all(
      urls.map(async (blobUrl) => {
        const blobResponse = await fetch(blobUrl);
        const blob = await blobResponse.blob();
        blobsToStore[blobUrl] = blob;
      })
    );

    return this.initialize()
      .then(async () => {
        if (!this.db) {
          throw new Error('Database not initialized');
        }

        const transaction = this.db.transaction(
          this.blobStoreName,
          'readwrite'
        );
        const blobStore = transaction.objectStore(this.blobStoreName);

        // Store the asset in the database
        Object.entries(blobsToStore).forEach(([key, blob]) => {
          const asset: BlobEntry = { id: key, blob };
          blobStore.put(asset);
        });

        transaction.onerror = () => {
          console.error(`Failed to add blobs: ${transaction.error}`);
        };
      })
      .catch((error) => {
        console.error('Error initializing database:', error);
      });
  }

  async restoreBlobUrls(assets: AssetResult[]): Promise<AssetResult[]> {
    const blobReplaced: { [key: string]: string } = {};
    const blobUrls: Set<string> = new Set();
    processBlobUrls(assets, (value) => {
      blobUrls.add(value);
    });

    await Promise.all(
      [...blobUrls].map(async (value) => {
        const newUrl = await this.createBlobUrlFromStore(value);
        blobReplaced[value] = newUrl;
      })
    );

    return processBlobUrls(assets, (value) => {
      return blobReplaced[value] ?? value;
    });
  }

  /**
   * Returns if the given asset should be filtered based on query data
   *
   * @param asset - The asset to filter
   * @param queryData - The query parameters to filter by
   * @returns true if the asset should be included, false otherwise
   */
  private filterAsset(asset: AssetResult, queryData: AssetQueryData): boolean {
    const { query, tags, groups, excludeGroups } = queryData;

    // Filter by query string (search on label and tags)
    if (query && query.trim() !== '') {
      const lowerQuery = query.trim().toLowerCase().split(' ');

      const lowerLabel = asset.label?.toLowerCase() ?? '';
      const lowerTags = asset.tags?.map((tag) => tag.toLowerCase()) ?? [];

      const matchLabelOrTag = lowerQuery.every((word) => {
        return (
          lowerLabel.includes(word) ||
          lowerTags.some((tag) => tag.includes(word))
        );
      });

      if (!matchLabelOrTag) {
        return false;
      }
    }

    // Filter by exact tags if provided by the query
    if (tags) {
      const tagList = Array.isArray(tags) ? tags : [tags];
      if (
        tagList.length > 0 &&
        (!asset.tags || !tagList.every((tag) => asset.tags?.includes(tag)))
      ) {
        return false;
      }
    }

    // Filter by groups
    if (groups && groups.length > 0) {
      if (
        !asset.groups ||
        !groups.some((group) => asset.groups?.includes(group))
      ) {
        return false;
      }
    }

    // Filter by excluded groups
    if (excludeGroups && excludeGroups.length > 0) {
      if (
        asset.groups &&
        asset.groups.some((group) => excludeGroups.includes(group))
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Sort assets based on query data
   *
   * @param assets - The assets to sort
   * @param queryData - The query parameters with sorting information
   * @returns The sorted assets
   */
  private sortAssets(
    assets: AssetResult[],
    queryData: AssetQueryData
  ): AssetResult[] {
    const { sortingOrder, sortKey, sortActiveFirst } = queryData;

    // Clone the array to avoid modifying the original
    const sortedAssets = [...assets];

    // If no sorting order specified or set to 'None', return the current order
    if (!sortingOrder || sortingOrder === 'None') {
      return sortedAssets;
    }

    // Sort by the specified key
    if (sortKey) {
      sortedAssets.sort((a, b) => {
        let valueA;
        let valueB;

        if (sortKey === 'id') {
          valueA = a.id;
          valueB = b.id;
        } else {
          // Handle metadata sorting (assuming metadata is stored in a 'metadata' field)
          valueA = a.meta?.[sortKey] ?? null;
          valueB = b.meta?.[sortKey] ?? null;
        }

        // Handle null/undefined values
        if (valueA === null || valueA === undefined)
          return sortingOrder === 'Ascending' ? -1 : 1;
        if (valueB === null || valueB === undefined)
          return sortingOrder === 'Ascending' ? 1 : -1;

        // Compare values based on sorting order
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return sortingOrder === 'Ascending'
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        } else {
          return sortingOrder === 'Ascending'
            ? valueA < valueB
              ? -1
              : valueA > valueB
              ? 1
              : 0
            : valueA > valueB
            ? -1
            : valueA < valueB
            ? 1
            : 0;
        }
      });
    } else if (sortingOrder === 'Descending') {
      // If no sort key is specified, and sorting order set
      // to Descending, just reverse original order
      sortedAssets.reverse();
    }

    // Sort by active first if requested
    if (sortActiveFirst) {
      sortedAssets.sort((a, b) => {
        if (a.active && !b.active) return -1;
        if (!a.active && b.active) return 1;
        return 0;
      });
    }

    return sortedAssets;
  }
}

/**
 * Goes through an object and calls a callback for every string value that starts with 'blob:'
 * The callback can return a string to replace the original value
 * @param obj The object to traverse
 * @param callback Function to call when a blob URL is found, can return a replacement value
 * @param path Current path in the object (used for recursion)
 * @returns The modified object (or the original if no replacements were made)
 */
function processBlobUrls<T>(
  obj: T,
  callback: (value: string, path: string) => string | void,
  path: string = ''
): T {
  // Return the object as is if it's null or not an object
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    for (let index = 0; index < obj.length; index++) {
      const currentPath = path ? `${path}[${index}]` : `[${index}]`;

      if (typeof obj[index] === 'string' && obj[index].startsWith('blob:')) {
        const replacement = callback(obj[index], currentPath);
        if (typeof replacement === 'string') {
          obj[index] = replacement;
        }
      } else {
        obj[index] = processBlobUrls(obj[index], callback, currentPath);
      }
    }
    return obj;
  }

  // Handle regular objects
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      const currentPath = path ? `${path}.${key}` : key;

      if (typeof value === 'string' && value.startsWith('blob:')) {
        const replacement = callback(value, currentPath);
        if (typeof replacement === 'string') {
          // @ts-ignore
          obj[key] = replacement;
        }
      } else {
        obj[key] = processBlobUrls(value, callback, currentPath);
      }
    }
  }

  return obj;
}

export default IndexedDBAssetSource;
