import type { CreativeEngine } from '@cesdk/cesdk-js';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
import type { PropertyContext } from '../core/propertyConfiguration';

/**
 * Build the base property context from available sources
 */
export function buildPropertyContext(
  engine: CreativeEngine,
  cesdk?: CreativeEditorSDK
): PropertyContext {
  // Get locale from cesdk or default to 'en'
  const locale = cesdk?.i18n?.getLocale?.() || 'en';

  return {
    engine,
    cesdk,
    locale
  };
}

/**
 * Context cache for performance optimization
 */
export class PropertyContextCache {
  private cache: PropertyContext | null = null;

  /**
   * Get cached context or build new one
   */
  getContext(
    engine: CreativeEngine,
    cesdk?: CreativeEditorSDK
  ): PropertyContext {
    if (!this.cache) {
      this.cache = buildPropertyContext(engine, cesdk);
    }
    return this.cache;
  }

  /**
   * Clear the cache (e.g., when locale changes)
   */
  clear(): void {
    this.cache = null;
  }
}
