import type {
  PropertyConfig,
  PropertyContext
} from '../core/propertyConfiguration';

/**
 * Resolve the default value for a property
 * @template T - The property value type
 * @template C - The context type
 */
export function resolvePropertyDefault<
  T,
  C extends PropertyContext = PropertyContext
>(
  propertyId: string,
  propertyConfig: PropertyConfig<T, C> | undefined,
  context: C,
  schemaDefault?: T,
  fallback?: T
): T | undefined {
  // 1. Check property configuration
  if (propertyConfig?.default !== undefined) {
    const defaultValue = propertyConfig.default;

    // 2a. Static value
    if (typeof defaultValue !== 'function') {
      return defaultValue;
    }

    // 2b. Dynamic value - call function with context
    return (defaultValue as (context: C) => T)(context);
  }

  // 3. Schema default
  if (schemaDefault !== undefined) {
    return schemaDefault;
  }

  // 4. Fallback
  return fallback;
}

/**
 * Batch resolve multiple property defaults
 */
export function resolvePropertyDefaults<
  I,
  C extends PropertyContext = PropertyContext
>(
  properties: Array<{
    id: keyof I;
    config?: PropertyConfig<I[keyof I], C>;
    schemaDefault?: I[keyof I];
    fallback?: I[keyof I];
  }>,
  context: C
): Partial<I> {
  const resolved: Partial<I> = {};

  for (const prop of properties) {
    const value = resolvePropertyDefault(
      prop.id as string,
      prop.config,
      context,
      prop.schemaDefault,
      prop.fallback
    );

    if (value !== undefined) {
      resolved[prop.id] = value;
    }
  }

  return resolved;
}
