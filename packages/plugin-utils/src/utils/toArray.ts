/**
 * Converts a value to an array format.
 *
 * @template T The type of the array elements
 * @param value - The value to convert. Can be a single item, an array, null, or undefined
 * @returns An array containing the value(s). Returns empty array if value is null/undefined,
 *          the original array if value is already an array, or a single-element array if value is a single item
 *
 * @example
 * ```typescript
 * toArray('hello')        // ['hello']
 * toArray(['a', 'b'])     // ['a', 'b']
 * toArray(null)           // []
 * toArray(undefined)      // []
 * toArray(42)             // [42]
 * ```
 */
function toArray<T>(value?: T | T[]): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

export default toArray;
