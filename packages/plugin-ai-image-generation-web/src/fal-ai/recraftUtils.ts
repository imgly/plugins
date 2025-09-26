import type CreativeEditorSDK from '@cesdk/cesdk-js';
import { CustomAssetSource } from '@imgly/plugin-utils';
import type {
  RecraftStyleContext,
  RecraftV3Configuration,
  Recraft20bConfiguration
} from './recraftTypes';
import { buildPropertyContext } from '@imgly/plugin-ai-generation-web';
import { STYLES_IMAGE, STYLES_VECTOR } from './RecraftV3.constants';
import { STYLES_ICON } from './Recraft20b.constants';

/**
 * Get available styles for a given style type
 */
export function getAvailableStylesForType(
  type: 'image' | 'vector' | 'icon'
): string[] {
  switch (type) {
    case 'image':
      return STYLES_IMAGE.map((s) => s.id);
    case 'vector':
      return STYLES_VECTOR.map((s) => s.id);
    case 'icon':
      return STYLES_ICON.map((s) => s.id);
    default:
      return [];
  }
}

/**
 * Resolve style default from configuration for RecraftV3
 */
export function resolveStyleDefaultV3(
  config: RecraftV3Configuration,
  cesdk: CreativeEditorSDK,
  styleType: 'image' | 'vector'
): string | undefined {
  const defaultConfig = config.properties?.style?.default;

  if (!defaultConfig) {
    return undefined; // Use asset source's default
  }

  // Return static value if not a function
  if (typeof defaultConfig === 'string') {
    return defaultConfig;
  }

  // Build the extended context
  const baseContext = buildPropertyContext(cesdk.engine, cesdk);
  const context: RecraftStyleContext = {
    ...baseContext,
    type: styleType,
    availableStyles: getAvailableStylesForType(styleType),
    isInitializing: true
  };

  // Call the function with properly typed context
  return defaultConfig(context);
}

/**
 * Resolve style default from configuration for Recraft20b
 */
export function resolveStyleDefaultRecraft20b(
  config: Recraft20bConfiguration,
  cesdk: CreativeEditorSDK,
  styleType: 'image' | 'vector' | 'icon'
): string | undefined {
  const defaultConfig = config.properties?.style?.default;

  if (!defaultConfig) {
    return undefined; // Use asset source's default
  }

  // Return static value if not a function
  if (typeof defaultConfig === 'string') {
    return defaultConfig;
  }

  // Build the extended context
  const baseContext = buildPropertyContext(cesdk.engine, cesdk);
  const context: RecraftStyleContext = {
    ...baseContext,
    type: styleType,
    availableStyles: getAvailableStylesForType(styleType),
    isInitializing: true
  };

  // Call the function with properly typed context
  return defaultConfig(context);
}

/**
 * Initialize a style asset source with configured default for RecraftV3
 */
export function initializeStyleAssetSourceV3(
  cesdk: CreativeEditorSDK,
  config: RecraftV3Configuration,
  styleType: 'image' | 'vector',
  styles: Array<{ id: string; label: string }>,
  sourceId: string,
  getStyleThumbnail: (id: string) => string,
  translateLabel?: (
    assetId: string,
    fallbackLabel: string,
    locale: string
  ) => string
): CustomAssetSource {
  // Create the asset source with default first selection
  const assetSource = new CustomAssetSource(
    sourceId,
    styles.map((style) => ({
      id: style.id,
      label: style.label,
      thumbUri: getStyleThumbnail(style.id)
    })),
    translateLabel ? { translateLabel } : undefined
  );

  // Get the default from asset source (first item)
  const assetSourceDefault = assetSource.getActiveSelectValue();

  // Resolve configured default if provided
  const configuredDefault = resolveStyleDefaultV3(config, cesdk, styleType);

  // If configuration provides a different default, update the asset source
  if (configuredDefault && configuredDefault !== assetSourceDefault?.id) {
    assetSource.clearActiveAssets();
    assetSource.setAssetActive(configuredDefault);
  }

  return assetSource;
}

/**
 * Initialize a style asset source with configured default for Recraft20b
 */
export function initializeStyleAssetSourceRecraft20b(
  cesdk: CreativeEditorSDK,
  config: Recraft20bConfiguration,
  styleType: 'image' | 'vector' | 'icon',
  styles: Array<{ id: string; label: string }>,
  sourceId: string,
  getStyleThumbnail: (id: string) => string,
  translateLabel?: (
    assetId: string,
    fallbackLabel: string,
    locale: string
  ) => string
): CustomAssetSource {
  // Create the asset source with default first selection
  const assetSource = new CustomAssetSource(
    sourceId,
    styles.map((style) => ({
      id: style.id,
      label: style.label,
      thumbUri: getStyleThumbnail(style.id)
    })),
    translateLabel ? { translateLabel } : undefined
  );

  // Get the default from asset source (first item)
  const assetSourceDefault = assetSource.getActiveSelectValue();

  // Resolve configured default if provided
  const configuredDefault = resolveStyleDefaultRecraft20b(
    config,
    cesdk,
    styleType
  );

  // If configuration provides a different default, update the asset source
  if (configuredDefault && configuredDefault !== assetSourceDefault?.id) {
    assetSource.clearActiveAssets();
    assetSource.setAssetActive(configuredDefault);
  }

  return assetSource;
}
