import type { CreativeEngine } from '@cesdk/cesdk-js';
import type CreativeEditorSDK from '@cesdk/cesdk-js';

/**
 * Base context provided to all property default functions
 */
export interface PropertyContext {
  /**
   * Creative Engine instance
   * Always available for engine-level operations
   */
  engine: CreativeEngine;

  /**
   * Creative Editor SDK instance
   * May be undefined if running headless or without UI
   */
  cesdk?: CreativeEditorSDK;

  /**
   * Current locale for internationalization
   * Format: ISO 639-1 language code (e.g., 'en', 'de', 'ja')
   * Defaults to 'en' if not available
   */
  locale: string;
}

/**
 * Configuration for a single property
 * @template T - The type of the property value
 * @template C - The context type (defaults to PropertyContext)
 */
export interface PropertyConfig<
  T,
  C extends PropertyContext = PropertyContext
> {
  /**
   * Default value for the property
   * Can be a static value or a function that returns the value
   */
  default?: T | ((context: C) => T);

  // Future extensions reserved for:
  // visible?: boolean | ((context: C) => boolean);
  // validate?: (value: T) => string | null;
  // dependsOn?: string[];
}

/**
 * Properties configuration for a provider
 * @template I - The input type of the provider
 */
export type PropertiesConfiguration<I> = {
  [K in keyof Partial<I>]?: PropertyConfig<I[K]>;
};

/**
 * Utility type for extending property contexts selectively
 * @template I - The input type of the provider
 * @template ContextMap - Map of property names to their extended context types
 *
 * @example
 * ```typescript
 * type MyConfig = ExtendPropertyContexts<MyInput, {
 *   style: StyleContext;  // style property gets StyleContext
 *   // other properties get PropertyContext
 * }>;
 * ```
 */
export type ExtendPropertyContexts<
  I,
  ContextMap extends Partial<Record<keyof I, PropertyContext>>
> = {
  [K in keyof Partial<I>]: K extends keyof ContextMap
    ? ContextMap[K] extends PropertyContext
      ? PropertyConfig<I[K], ContextMap[K]>
      : PropertyConfig<I[K]>
    : PropertyConfig<I[K]>;
};
