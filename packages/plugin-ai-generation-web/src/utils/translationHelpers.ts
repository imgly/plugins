import type CreativeEditorSDK from '@cesdk/cesdk-js';
import { supportsTranslateAPI, hasTranslateAPI } from '@imgly/plugin-utils';

type TranslationDefinition = Partial<
  Record<string, Partial<Record<string, string>>>
>;

/**
 * Sets default translations only for keys that don't already exist.
 *
 * This allows integrators to set custom translations BEFORE plugins load,
 * and the plugins won't override those custom values with their defaults.
 *
 * @param cesdk - The CE.SDK instance
 * @param definition - The translations to set (same format as setTranslations)
 *
 * @example
 * ```ts
 * // Integrator sets custom translation BEFORE plugin loads
 * cesdk.i18n.setTranslations({ en: { 'my.key': 'Custom Value' } });
 *
 * // Plugin uses setDefaultTranslations - won't override 'my.key'
 * setDefaultTranslations(cesdk, { en: { 'my.key': 'Default Value', 'other.key': 'Other' } });
 *
 * // Result: 'my.key' = 'Custom Value', 'other.key' = 'Other'
 * ```
 */
export function setDefaultTranslations(
  cesdk: CreativeEditorSDK,
  definition: TranslationDefinition
): void {
  // Check if getTranslations API is available (CE.SDK 1.59.0+)
  if (typeof cesdk.i18n?.getTranslations !== 'function') {
    // Fallback: use regular setTranslations if getTranslations not available
    cesdk.i18n.setTranslations(definition);
    return;
  }

  // Get existing translations for all locales in the definition
  const locales = Object.keys(definition) as string[];
  const existingTranslations = cesdk.i18n.getTranslations(locales);

  // Filter out keys that already exist
  const filteredDefinition: TranslationDefinition = {};

  for (const locale of locales) {
    const newTranslations = definition[locale];
    if (!newTranslations) continue;

    const existingLocaleTranslations =
      (existingTranslations[locale] as Record<string, string> | undefined) ??
      {};
    const filteredLocaleTranslations: Record<string, string> = {};

    for (const [key, value] of Object.entries(newTranslations)) {
      // Only include if key doesn't already exist
      if (!(key in existingLocaleTranslations) && value !== undefined) {
        filteredLocaleTranslations[key] = value;
      }
    }

    // Only add locale if there are translations to set
    if (Object.keys(filteredLocaleTranslations).length > 0) {
      filteredDefinition[locale] = filteredLocaleTranslations;
    }
  }

  // Only call setTranslations if there are new translations to add
  if (Object.keys(filteredDefinition).length > 0) {
    cesdk.i18n.setTranslations(filteredDefinition);
  }
}

/**
 * Creates a translation callback function for AI asset sources
 * @param cesdk - The CE.SDK instance
 * @param modelKey - The model/provider key (e.g., 'fal-ai/recraft-v3')
 * @param propertyName - The property name (e.g., 'style', 'aspect_ratio')
 * @param pluginType - The plugin type (e.g., 'image', 'video', 'sticker')
 * @returns A translation callback function for use with CustomAssetSource
 */
export function createTranslationCallback(
  cesdk: CreativeEditorSDK,
  modelKey: string,
  propertyName: string = 'style',
  pluginType: string = 'image'
): (assetId: string, fallbackLabel: string, locale: string) => string {
  return (assetId: string, fallbackLabel: string): string => {
    // Check if CE.SDK supports translation API
    if (!supportsTranslateAPI(cesdk)) {
      return fallbackLabel;
    }

    // Build translation keys following established AI plugin pattern
    const translationKeys = buildTranslationKeys(
      modelKey,
      propertyName,
      assetId,
      pluginType
    );

    // Use CE.SDK's translate method with fallback array
    if (hasTranslateAPI(cesdk.i18n)) {
      const translated = cesdk.i18n.translate(translationKeys);

      // Return translated label or fallback if no translation found
      // (CE.SDK returns the last key if no translation is found)
      return translated !== translationKeys[translationKeys.length - 1]
        ? translated
        : fallbackLabel;
    }

    return fallbackLabel;
  };
}

/**
 * Build translation keys array for AI plugin property values
 * @param modelKey - The model/provider key
 * @param propertyName - The property name
 * @param value - The property value
 * @param pluginType - The plugin type (image, video, sticker, etc.)
 * @returns Array of translation keys in fallback order
 */
export function buildTranslationKeys(
  modelKey: string,
  propertyName: string,
  value: string,
  pluginType: string = 'image'
): string[] {
  return [
    `ly.img.plugin-ai-${pluginType}-generation-web.${modelKey}.property.${propertyName}.${value}`,
    `ly.img.plugin-ai-generation-web.property.${propertyName}.${value}`,
    `ly.img.plugin-ai-${pluginType}-generation-web.${modelKey}.defaults.property.${propertyName}.${value}`,
    `ly.img.plugin-ai-generation-web.defaults.property.${propertyName}.${value}`
  ];
}
