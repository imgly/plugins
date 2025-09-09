# Asset Library Translation Support Specification

## Executive Summary

This specification outlines the implementation of dynamic translation support for asset libraries in AI plugins, specifically addressing the need to translate asset labels (like style names in Recraft v3) using the same key schema as other UI elements. The solution leverages CE.SDK 1.59's new `translate()` API while maintaining backward compatibility with older versions through a **translation callback approach** that keeps the CustomAssetSource class generic and places translation logic in the providers.

## Problem Statement

Currently, asset sources in CE.SDK return their own labels independently of the CE.SDK internationalization system. This creates inconsistency because:

1. Asset library labels (e.g., style names) are hardcoded in the asset source
2. Other UI labels use translation keys following a defined schema
3. Developers expect uniform translation management across all UI elements
4. There's no direct connection between CE.SDK's i18n system and asset source labels

## Solution Overview

Implement a progressive enhancement approach that:
- Uses CE.SDK's `translate()` API when available (version 1.59.0+)
- Falls back to hardcoded labels for older CE.SDK versions (< 1.59.0)
- **Uses a translation callback** to keep CustomAssetSource generic
- Maintains the established translation key schema
- Requires minimal code changes and no breaking changes
- Keeps AI/model-specific logic in the providers, not in utility classes

## Technical Design

### 1. CustomAssetSource Enhancement

The `CustomAssetSource` class will be enhanced with a **generic translation callback**:

```typescript
interface CustomAssetSourceOptions {
  // Generic callback for label translation - no AI/model-specific logic
  translateLabel?: (assetId: string, fallbackLabel: string, locale: string) => string;
}

class CustomAssetSource {
  private translateLabel?: (assetId: string, fallbackLabel: string, locale: string) => string;
  
  constructor(
    id: string, 
    assets: (AssetDefinition | SelectValue)[] = [],
    options?: CustomAssetSourceOptions
  ) {
    // Store the translation callback if provided
    this.translateLabel = options?.translateLabel;
    // ... rest of initialization
  }
  
  async findAssets(queryData: AssetQueryData): Promise<AssetsQueryResult | undefined> {
    // ... existing filtering logic ...
    
    const resultAssets = paginatedAssets.map((asset) => {
      // Use callback if provided, otherwise use default label
      const label = this.translateLabel 
        ? this.translateLabel(asset.id, asset.label?.[locale], locale)
        : asset.label?.[locale];
      
      return {
        ...asset,
        label,
        locale,
        active: this.activeAssetIds.has(asset.id)
      };
    });
    
    // ... rest of implementation
  }
}
```

### 2. Version Detection

Safe version checking for CE.SDK 1.59.0 or higher:

```typescript
function supportsTranslateAPI(cesdk: any): boolean {
  if (!cesdk?.version) return false;
  
  // Use localeCompare for semantic version comparison
  // Returns >= 0 when cesdk.version is 1.59.0 or higher
  const comparison = cesdk.version.localeCompare('1.59.0', undefined, { 
    numeric: true,
    sensitivity: 'base' 
  });
  
  return comparison >= 0 && typeof cesdk.i18n?.translate === 'function';
}
```

### 3. Provider Translation Implementation

Providers implement the translation logic in the callback:

```typescript
// Helper function used by providers
function createTranslationCallback(
  cesdk: CreativeEditorSDK,
  modelKey: string,
  propertyName: string = 'style'
) {
  return (assetId: string, fallbackLabel: string, locale: string): string => {
    // Check if CE.SDK supports translation API
    if (!supportsTranslateAPI(cesdk)) {
      return fallbackLabel;
    }
    
    // Build translation keys following established pattern
    const translationKeys = [
      `ly.img.plugin-ai-image-generation-web.${modelKey}.property.${propertyName}.${assetId}`,
      `ly.img.plugin-ai-generation-web.property.${propertyName}.${assetId}`,
      `ly.img.plugin-ai-image-generation-web.${modelKey}.defaults.property.${propertyName}.${assetId}`,
      `ly.img.plugin-ai-generation-web.defaults.property.${propertyName}.${assetId}`
    ];
    
    // Use CE.SDK's translate method with fallback array
    const translated = cesdk.i18n.translate(translationKeys);
    
    // Return translated label or fallback if no translation found
    // (CE.SDK returns the last key if no translation is found)
    return translated !== translationKeys[translationKeys.length - 1] 
      ? translated 
      : fallbackLabel;
  };
}

// Usage in provider (e.g., RecraftV3.ts)
const modelKey = 'fal-ai/recraft-v3';

const styleAssetSource = new CustomAssetSource(
  `${modelKey}/styles/image`,
  styles,
  {
    translateLabel: createTranslationCallback(cesdk, modelKey, 'style')
  }
);
```

### 4. Translation Key Schema

Following the established multi-key fallback pattern used throughout AI plugins:

```
Translation keys are provided as an array with fallback priorities:
1. Provider-specific key (most specific)
2. Plugin-generic key 
3. Provider-specific defaults key
4. Plugin-generic defaults key (most generic)

Pattern array:
[
  "ly.img.plugin-ai-{type}-generation-web.{provider-id}.property.{property}.{value}",
  "ly.img.plugin-ai-generation-web.property.{property}.{value}",
  "ly.img.plugin-ai-{type}-generation-web.{provider-id}.defaults.property.{property}.{value}",
  "ly.img.plugin-ai-generation-web.defaults.property.{property}.{value}"
]

Example for Recraft V3 style:
[
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.property.style.realistic_image",
  "ly.img.plugin-ai-generation-web.property.style.realistic_image",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.defaults.property.style.realistic_image",
  "ly.img.plugin-ai-generation-web.defaults.property.style.realistic_image"
]
```

This multi-key approach ensures:
- Provider-specific translations take precedence
- Generic fallbacks are available for common styles
- Defaults provide ultimate fallback
- Translation reuse across providers when appropriate

### 5. Provider Implementation Updates

Providers supply the translation logic via callback:

```typescript
// Before
const styleAssetSource = new CustomAssetSource(
  sourceId,
  styles.map(({ id, label }) => ({
    id,
    label,
    thumbUri: getStyleThumbnail(id)
  }))
);

// After - Add translation callback
const modelKey = 'fal-ai/recraft-v3';
const styleAssetSource = new CustomAssetSource(
  sourceId,
  styles.map(({ id, label }) => ({
    id,
    label,  // Still used as fallback
    thumbUri: getStyleThumbnail(id)
  })),
  {
    translateLabel: (assetId, fallback) => {
      if (supportsTranslateAPI(cesdk)) {
        const keys = [
          `ly.img.plugin-ai-image-generation-web.${modelKey}.property.style.${assetId}`,
          `ly.img.plugin-ai-generation-web.property.style.${assetId}`,
          // ... additional fallback keys
        ];
        const translated = cesdk.i18n.translate(keys);
        return translated !== keys[keys.length - 1] ? translated : fallback;
      }
      return fallback;
    }
  }
);
```

### 6. TypeScript Safety

Use type guards and conditional types to ensure type safety:

```typescript
interface TranslationAPI {
  translate(key: string | string[]): string;
}

function hasTranslateAPI(i18n: any): i18n is TranslationAPI {
  return typeof i18n?.translate === 'function';
}

// Usage in CustomAssetSource
if (supportsTranslateAPI(this.cesdk) && hasTranslateAPI(this.cesdk.i18n)) {
  return this.cesdk.i18n.translate(translationKey);
}
```

## Implementation Phases

### Phase 1: Core Implementation
1. Enhance CustomAssetSource class with translation support
2. Add version detection logic
3. Implement fallback mechanism

### Phase 2: Provider Updates
1. Update Recraft v3 provider (primary use case)
2. Update Recraft 2.0b provider
3. Identify and update other providers using asset libraries

### Phase 3: Testing & Validation
1. Test with CE.SDK < 1.59.0 (verify fallback behavior)
2. Test with CE.SDK >= 1.59.0 (verify dynamic translations)
3. Test translation updates without page reload
4. Validate with demo application

## Migration Guide

### For Provider Developers

1. **Add translation callback to CustomAssetSource:**
   ```typescript
   const assetSource = new CustomAssetSource(id, assets, {
     translateLabel: (assetId, fallback, locale) => {
       // Your translation logic here
       if (supportsTranslateAPI(cesdk)) {
         const keys = buildTranslationKeys(modelKey, assetId);
         return cesdk.i18n.translate(keys);
       }
       return fallback;
     }
   });
   ```

2. **Assets remain completely unchanged:**
   ```typescript
   // No changes to asset definitions
   {
     id: 'style_id',
     label: 'Fallback Label',  // Used as fallback
     thumbUri: getThumbnail(id)
   }
   ```

3. **Ensure translations exist in translation files:**
   ```json
   {
     "en": {
       // Keys follow the inferred pattern
       "ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.property.style.realistic_image": "Realistic Image",
       // Optional: Add generic fallbacks for common styles
       "ly.img.plugin-ai-generation-web.property.style.realistic_image": "Realistic"
     }
   }
   ```

## Backward Compatibility

- **CE.SDK < 1.59.0**: Assets display hardcoded labels from asset definitions
- **CE.SDK >= 1.59.0**: Assets display translated labels from i18n system
- **No breaking changes**: Existing implementations continue to work
- **Progressive enhancement**: Features improve automatically with CE.SDK upgrade

## Testing Requirements

### Unit Tests
- Version detection logic
- Translation fallback mechanism
- Asset label resolution

### Integration Tests
- Provider initialization with different CE.SDK versions
- Asset library rendering
- Translation key resolution

### Manual Testing
- Visual verification in demo application
- Test with "Test Translations" feature
- Verify `&` and `@` prefixes for translation sources

## Success Criteria

1. ✅ Asset libraries show translated labels when CE.SDK >= 1.59.0
2. ✅ Asset libraries show fallback labels when CE.SDK < 1.59.0
3. ✅ CustomAssetSource remains generic (no AI/model-specific logic)
4. ✅ Translation keys follow established schema
5. ✅ Existing functionality remains unchanged
6. ✅ Zero breaking changes for consumers
7. ✅ Clean separation of concerns (translation logic in providers)

## Example Implementation

```typescript
// In CustomAssetSource.ts
class CustomAssetSource implements AssetSource {
  private translateLabel?: (assetId: string, fallbackLabel: string, locale: string) => string;
  
  constructor(
    id: string,
    assets: (AssetDefinition | SelectValue)[] = [],
    options?: CustomAssetSourceOptions
  ) {
    this.id = id;
    this.translateLabel = options?.translateLabel;
    // ... rest of initialization
  }
  
  async findAssets(queryData: AssetQueryData): Promise<AssetsQueryResult | undefined> {
    // ... existing filtering logic ...
    
    const resultAssets: AssetResult[] = paginatedAssets.map((asset) => {
      // Use translation callback if provided, otherwise use default label
      const label = this.translateLabel
        ? this.translateLabel(asset.id, asset.label?.[locale], locale)
        : asset.label?.[locale];
      
      return {
        id: asset.id,
        groups: asset.groups,
        meta: asset.meta,
        payload: asset.payload,
        locale,
        label,
        tags: asset.tags?.[locale],
        active: this.activeAssetIds.has(asset.id)
      };
    });
    
    // ... rest of implementation ...
  }
}

// In Provider (e.g., RecraftV3.ts)
const styleAssetSource = new CustomAssetSource(
  sourceId,
  styles,
  {
    translateLabel: (assetId, fallback) => {
      // Provider handles all translation logic
      if (supportsTranslateAPI(cesdk)) {
        const keys = buildTranslationKeys(modelKey, assetId);
        return cesdk.i18n.translate(keys);
      }
      return fallback;
    }
  }
);
```

## References

- [CE.SDK 1.59 InternationalizationAPI Documentation](https://img.ly/docs/cesdk/js/api/cesdk-js/classes/internationalizationapi/)
- Current translation key schema documentation (CLAUDE.md)
- Existing CustomAssetSource implementation
- Recraft v3 provider implementation

## Appendix: Affected Files

Primary files to be modified:
- `/packages/plugin-utils/src/assetSources/CustomAssetSource.ts`
- `/packages/plugin-ai-image-generation-web/src/fal-ai/RecraftV3.ts`
- `/packages/plugin-ai-image-generation-web/src/fal-ai/Recraft20b.ts`
- `/packages/plugin-ai-sticker-generation-web/src/fal-ai/Recraft20b.ts`

Translation files to be verified:
- `/packages/plugin-ai-image-generation-web/translations.json`
- `/packages/plugin-ai-sticker-generation-web/translations.json`