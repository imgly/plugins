/**
 * Interface for objects that have translation capabilities
 */
interface TranslationAPI {
  translate(key: string | string[]): string;
}

/**
 * Check if CE.SDK supports the translate API (version 1.59.0 or higher)
 * @param cesdk - The CE.SDK instance to check
 * @returns True if the translate API is supported
 */
export function supportsTranslateAPI(cesdk: any): boolean {
  if (!cesdk?.version) return false;

  // Use localeCompare for semantic version comparison
  // Returns >= 0 when cesdk.version is 1.59.0 or higher
  const comparison = cesdk.version.localeCompare('1.59.0', undefined, {
    numeric: true,
    sensitivity: 'base'
  });

  return comparison >= 0 && typeof cesdk.i18n?.translate === 'function';
}

/**
 * Type guard to check if an object has the translate API
 * @param i18n - The object to check
 * @returns True if the object has a translate function
 */
export function hasTranslateAPI(i18n: any): i18n is TranslationAPI {
  return typeof i18n?.translate === 'function';
}

/**
 * Safely translate a key with CE.SDK version compatibility check.
 * Returns the translation if supported (CE.SDK >= 1.59.0), otherwise returns the fallback.
 *
 * @param cesdk - The CE.SDK instance
 * @param translationKey - The translation key to translate
 * @param fallback - The fallback value to use if translation is not supported or key is not found
 * @returns The translated string or fallback
 */
export function translateWithFallback(
  cesdk: any,
  translationKey: string | string[],
  fallback: string
): string {
  if (!cesdk) {
    return fallback;
  }

  // Check if CE.SDK supports translation API (version 1.59.0+)
  if (supportsTranslateAPI(cesdk) && hasTranslateAPI(cesdk.i18n)) {
    return cesdk.i18n.translate(translationKey);
  }

  return fallback;
}
