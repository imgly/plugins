/**
 * Checks if a value is defined (not undefined).
 *
 * Helpful to filter out undefined values from an array or collection
 * while keeping the type information intact.
 *
 * ```
 * array.filter(isDefined)
 * ```
 */
function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

export default isDefined;
