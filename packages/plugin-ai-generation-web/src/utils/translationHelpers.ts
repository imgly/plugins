import type CreativeEditorSDK from '@cesdk/cesdk-js';
import { supportsTranslateAPI, hasTranslateAPI } from '@imgly/plugin-utils';

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
