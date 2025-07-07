import { ProviderInitializationResult } from './generation/initializeProvider';
import { OutputKind } from './generation/provider';

/**
 * Global registry for managing AI generation providers across all plugins.
 * Uses singleton pattern to ensure cross-plugin provider discovery.
 */
export class ProviderRegistry {
  /** Map storing all registered providers by their ID */
  private providers: Map<string, ProviderInitializationResult<any, any, any>> =
    new Map();

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  /**
   * Gets the singleton instance of the ProviderRegistry.
   * Uses global object storage to ensure singleton across different bundle contexts.
   * @returns The ProviderRegistry instance
   */
  public static get(): ProviderRegistry {
    const globalKey = '__imgly_provider_registry__';
    const globalObj = (
      typeof window !== 'undefined' ? window : globalThis
    ) as any;

    if (!globalObj[globalKey]) {
      globalObj[globalKey] = new ProviderRegistry();
    }
    return globalObj[globalKey];
  }

  /**
   * Registers a provider in the registry.
   * @param providerInitializationResult The provider to register
   * @returns A disposer function that unregisters the provider when called
   */
  public register(
    providerInitializationResult: ProviderInitializationResult<any, any, any>
  ): () => void {
    if (this.providers.has(providerInitializationResult.provider.id)) {
      // eslint-disable-next-line no-console
      console.warn(
        `Provider with ID "${providerInitializationResult.provider.id}" is already registered`
      );
    }

    this.providers.set(
      providerInitializationResult.provider.id,
      providerInitializationResult
    );

    return () => {
      if (
        this.providers.get(providerInitializationResult.provider.id) ===
        providerInitializationResult
      ) {
        this.providers.delete(providerInitializationResult.provider.id);
      }
    };
  }

  /**
   * Gets all registered providers.
   * @returns Array of all provider instances
   */
  public getAll(): ProviderInitializationResult<any, any, any>[] {
    return Array.from(this.providers.values());
  }

  /**
   * Gets a provider by its ID.
   * @param id The provider ID to look up
   * @returns The provider instance or undefined if not found
   */
  public getById(
    id: string
  ): ProviderInitializationResult<any, any, any> | undefined {
    return this.providers.get(id);
  }

  /**
   * Gets all providers of a specific kind.
   * @param kind The output kind to filter by
   * @returns Array of providers matching the specified kind
   */
  public getByKind<K extends OutputKind>(
    kind: K
  ): ProviderInitializationResult<K, any, any>[] {
    return this.getAll().filter(({ provider }) => provider.kind === kind);
  }
}
