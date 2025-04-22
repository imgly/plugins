import { GenerationOptions, Output } from '../provider';
import { Middleware } from './middleware';

export interface RateLimitOptions<I> {
  /**
   * Maximum number of requests allowed in the time window
   */
  maxRequests: number;

  /**
   * Time window in milliseconds
   */
  timeWindowMs: number;

  /**
   * Optional key function or string to create different rate limits for different inputs
   * - If not provided, all requests share the same 'global' rate limit
   * - If a string is provided, that string is used as a static key
   * - If a function is provided, it generates a key based on input and options
   */
  keyFn?: string | ((input: I, options: GenerationOptions) => string);

  /**
   * Callback function that is called when rate limit is exceeded
   * Return value determines if the operation should be rejected (throw error) or allowed
   * If true is returned, the operation will proceed despite exceeding the rate limit
   * If false or undefined is returned, the operation will be rejected with a default error
   */
  onRateLimitExceeded?: (
    input: I,
    options: GenerationOptions,
    rateLimitInfo: {
      key: string;
      currentCount: number;
      maxRequests: number;
      timeWindowMs: number;
      remainingTimeMs: number;
    }
  ) => boolean | Promise<boolean> | void;

  /**
   * Optional database name for the IndexedDB store
   * If not provided, a default name will be used
   */
  dbName?: string;
}

// Store for tracking requests per key
interface RequestTracker {
  timestamps: number[];
  lastCleanup: number;
}

// In-memory fallback store for rate limits for environments without IndexedDB
// Export for testing purposes
// This is now a Map of middleware instances to their respective stores
// The key can be either a symbol (for unique instances with prefix) or a string (for shared instances without prefix)
export const inMemoryStores: Map<
  symbol | string,
  Record<string, RequestTracker>
> = new Map();

/**
 * IndexedDB store for rate limiting
 */
class RateLimitStore {
  private db: IDBDatabase | null = null;

  private readonly dbName: string;

  private readonly storeName: string;

  private readonly dbVersion: number = 1;

  private isInitializing: boolean = false;

  private initPromise: Promise<void> | null = null;

  private readonly instanceId: symbol | string;

  constructor(
    instanceId: symbol | string,
    dbName?: string,
    storeName?: string
  ) {
    this.instanceId = instanceId;
    this.dbName = dbName ?? 'ly.img.ai.rateLimit';
    this.storeName = storeName ?? 'rateLimits';
  }

  /**
   * Initialize the database connection
   */
  async initialize(): Promise<void> {
    if (this.db) {
      return;
    }

    if (this.isInitializing) {
      return this.initPromise!;
    }

    this.isInitializing = true;
    this.initPromise = new Promise<void>((resolve, reject) => {
      try {
        const request = indexedDB.open(this.dbName, this.dbVersion);

        request.onerror = (event) => {
          this.isInitializing = false;

          // eslint-disable-next-line no-console
          console.error('Failed to open IndexedDB for rate limiting:', event);
          reject(new Error('Failed to open IndexedDB for rate limiting'));
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName, { keyPath: 'id' });
          }
        };

        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          this.isInitializing = false;
          resolve();
        };
      } catch (error) {
        this.isInitializing = false;
        // eslint-disable-next-line no-console
        console.error('Error initializing IndexedDB:', error);
        reject(error);
      }
    });

    return this.initPromise;
  }

  /**
   * Get a request tracker by key
   */
  async getTracker(key: string): Promise<RequestTracker | null> {
    try {
      await this.initialize();

      // Create a combined key that includes the instance ID to ensure isolation
      const instanceIdStr =
        typeof this.instanceId === 'symbol'
          ? this.instanceId.description || ''
          : this.instanceId;
      const combinedKey = `${instanceIdStr}_${key}`;

      return await new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(this.storeName, 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(combinedKey);

        request.onsuccess = () => {
          if (request.result) {
            resolve(request.result.data);
          } else {
            resolve(null);
          }
        };

        request.onerror = () => {
          // eslint-disable-next-line no-console
          console.error(
            `Failed to get tracker for key ${combinedKey}:`,
            request.error
          );
          reject(request.error);
        };
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error getting tracker from IndexedDB:', error);
      return Promise.reject(error);
    }
  }

  /**
   * Save a request tracker by key
   */
  async saveTracker(key: string, tracker: RequestTracker): Promise<void> {
    try {
      await this.initialize();

      // Create a combined key that includes the instance ID to ensure isolation
      const instanceIdStr =
        typeof this.instanceId === 'symbol'
          ? this.instanceId.description || ''
          : this.instanceId;
      const combinedKey = `${instanceIdStr}_${key}`;

      return await new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        store.put({ id: combinedKey, data: tracker });

        transaction.oncomplete = () => {
          resolve();
        };

        transaction.onerror = () => {
          // eslint-disable-next-line no-console
          console.error(
            `Failed to save tracker for key ${combinedKey}:`,
            transaction.error
          );
          reject(transaction.error);
        };
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error saving tracker to IndexedDB:', error);
      return Promise.reject(error);
    }
  }

  /**
   * Check if IndexedDB is available
   */
  static isAvailable(): boolean {
    return typeof indexedDB !== 'undefined';
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

/**
 * Middleware that implements rate limiting for AI generation requests
 * Uses IndexedDB for storage when available, with in-memory fallback
 * Each middleware instance has its own isolated set of rate limits
 */
function rateLimitMiddleware<I, O extends Output>(
  middlewareOptions: RateLimitOptions<I>
) {
  const {
    maxRequests,
    timeWindowMs,
    keyFn = () => 'global',
    onRateLimitExceeded,
    dbName
  } = middlewareOptions;

  // Create an identifier for this middleware instance based on its configuration
  // This ensures persistence across page reloads and sharing between identical configurations
  const configStr = `rate-limit-middleware-${maxRequests}-${timeWindowMs}`;

  // Use a string key for the configuration so identical configurations share the same limits
  const instanceId = configStr;

  // Create the store with the instance ID
  const useIndexedDB = RateLimitStore.isAvailable();
  const store = useIndexedDB ? new RateLimitStore(instanceId, dbName) : null;

  // Initialize this middleware's in-memory store
  if (!inMemoryStores.has(instanceId)) {
    inMemoryStores.set(instanceId, {});
  }
  // Get this middleware's in-memory store
  const inMemoryStore = inMemoryStores.get(instanceId)!;

  const middleware: Middleware<I, O> = async (input, options, next) => {
    // Get rate limit key based on input using the provided keyFn
    // If keyFn is a string, use it directly; otherwise call the function
    const key = typeof keyFn === 'string' ? keyFn : keyFn(input, options);
    const now = Date.now();

    let tracker: RequestTracker;

    // Get tracker from IndexedDB or create a new one
    if (useIndexedDB && store) {
      try {
        const storedTracker = await store.getTracker(key);
        if (storedTracker) {
          tracker = storedTracker;
        } else {
          tracker = {
            timestamps: [],
            lastCleanup: now
          };
        }
      } catch (error) {
        // Fallback to in-memory store if IndexedDB fails
        // eslint-disable-next-line no-console
        console.error(
          'IndexedDB access failed, using in-memory fallback:',
          error
        );
        if (!inMemoryStore[key]) {
          inMemoryStore[key] = {
            timestamps: [],
            lastCleanup: now
          };
        }
        tracker = inMemoryStore[key];
      }
    } else {
      // Use in-memory store if IndexedDB is not available
      if (!inMemoryStore[key]) {
        inMemoryStore[key] = {
          timestamps: [],
          lastCleanup: now
        };
      }
      tracker = inMemoryStore[key];
    }

    // Clean up old timestamps that are outside the time window
    if (now - tracker.lastCleanup > timeWindowMs) {
      tracker.timestamps = tracker.timestamps.filter(
        (timestamp) => now - timestamp < timeWindowMs
      );
      tracker.lastCleanup = now;
    }

    // Check if rate limit is exceeded
    if (tracker.timestamps.length >= maxRequests) {
      // Calculate the time until the oldest request expires
      const oldestTimestamp = Math.min(...tracker.timestamps);
      const remainingTimeMs = Math.max(
        0,
        timeWindowMs - (now - oldestTimestamp)
      );

      // Call the rate limit exceeded callback if provided
      if (onRateLimitExceeded) {
        const rateLimitInfo = {
          key, // This is the baseKey from keyFn
          currentCount: tracker.timestamps.length,
          maxRequests,
          timeWindowMs,
          remainingTimeMs
        };

        // If callback returns true, allow the request to proceed
        const shouldProceed = await onRateLimitExceeded(
          input,
          options,
          rateLimitInfo
        );
        if (!shouldProceed) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
      } else {
        // Default behavior: throw an error
        throw new Error('Rate limit exceeded. Please try again later.');
      }
    }

    // Add current timestamp to the tracker
    tracker.timestamps.push(now);

    // Save the updated tracker
    if (useIndexedDB && store) {
      try {
        await store.saveTracker(key, tracker);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to save tracker to IndexedDB:', error);
        // In case of IndexedDB failure, update the in-memory store as fallback
        inMemoryStore[key] = tracker;
      }
    } else {
      inMemoryStore[key] = tracker;
    }

    // Continue with the next middleware
    return next(input, options);
  };

  return middleware;
}

export default rateLimitMiddleware;
