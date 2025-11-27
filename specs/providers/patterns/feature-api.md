# Feature API for AI Providers

This document explains when and how providers register custom feature flags.

## Most Providers: No Feature Flags Needed

**Most providers don't need to register any feature flags.** The plugin handles all standard feature flags (input toggles, provider selection, quick actions). Just register translations and you're done.

```typescript
export function MyTextToImage(config: ProviderConfiguration) {
  return async ({ cesdk }) => {
    const modelKey = 'partner/vendor/model-name';

    // Only register translations (see i18n.md)
    cesdk.i18n.setTranslations({
      en: {
        [`libraries.${getPanelId(modelKey)}.history.label`]: 'Generated Images'
      }
    });

    return createImageProvider({ modelKey, ... }, config);
  };
}
```

## When to Register Provider-Specific Feature Flags

Register custom feature flags **only** when your provider has toggleable sub-features that users may want to enable/disable independently.

**Current example:** Recraft providers have distinct style categories (image, vector, icon) that users can toggle:

```typescript
// Users can disable vector styles while keeping image styles
cesdk.feature.enable('ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.style.vector', false);
```

This is a rare pattern. Only use it when:
- Provider has multiple distinct modes or categories
- Users would reasonably want to hide some but not all
- The categories require separate UI controls

## Implementation Pattern

If your provider needs custom feature flags:

### 1. Register Feature Flags During Initialization

```typescript
export function ProviderWithModes(config: ProviderConfiguration) {
  return async ({ cesdk }) => {
    const modelKey = 'partner/vendor/model-name';

    // Register provider-specific feature flags (enabled by default)
    cesdk.feature.enable(
      `ly.img.plugin-ai-image-generation-web.${modelKey}.style.image`,
      true
    );
    cesdk.feature.enable(
      `ly.img.plugin-ai-image-generation-web.${modelKey}.style.vector`,
      true
    );

    return createImageProvider({ modelKey, ... }, config);
  };
}
```

### 2. Check Flags in Custom Property Renderers

```typescript
renderCustomProperty: {
  style: ({ builder, engine }, property) => {
    const isImageEnabled = cesdk.feature.isEnabled(
      `ly.img.plugin-ai-image-generation-web.${modelKey}.style.image`,
      { engine }  // Always include engine context
    );
    const isVectorEnabled = cesdk.feature.isEnabled(
      `ly.img.plugin-ai-image-generation-web.${modelKey}.style.vector`,
      { engine }
    );

    // Only show toggle if both are enabled
    if (isImageEnabled && isVectorEnabled) {
      builder.ButtonGroup(/* type switcher */);
    }
    // ...
  }
}
```

### Naming Convention

```
ly.img.plugin-ai-{kind}-generation-web.{modelKey}.{feature}
```

- `{kind}` = `image`, `video`, `audio`, `text`, or `sticker`
- `{modelKey}` = your provider ID (e.g., `partner/vendor/model-name`)
- `{feature}` = descriptive feature name (e.g., `style.vector`, `mode.turbo`)

## Checklist

- [ ] **Standard provider?** No feature flags needed - skip this entirely
- [ ] **Toggleable sub-features?** Register with `cesdk.feature.enable()` during init
- [ ] **Default to enabled** (`true`) for backward compatibility
- [ ] **Include `{ engine }` context** when checking with `isEnabled()`
