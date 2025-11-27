# Feature API for AI Providers

This document explains how AI providers integrate with CE.SDK's Feature API to allow users granular control over functionality visibility.

## Overview

The Feature API enables users to:
- Enable/disable entire provider capabilities (e.g., hide text-to-image input)
- Control UI elements (e.g., hide provider selection dropdown)
- Show/hide individual quick actions
- Control provider-specific features (e.g., hide vector style option in Recraft)

**Key principle:** All features are **enabled by default** for backward compatibility. Providers register their features during initialization, and users can selectively disable them.

## Feature Flag Naming Conventions

### Hierarchy

```
Plugin-level:   ly.img.plugin-ai-{kind}-generation-web.{feature}
Provider-level: ly.img.plugin-ai-{kind}-generation-web.{modelKey}.{feature}
Quick-action:   ly.img.plugin-ai-{kind}-generation-web.quickAction.{actionName}
```

Where:
- `{kind}` = `image`, `video`, `audio`, `text`, or `sticker`
- `{modelKey}` = provider identifier (e.g., `fal-ai/recraft-v3`, `runware/openai/gpt-image-1`)
- `{feature}` = feature name
- `{actionName}` = quick action name (e.g., `editImage`, `styleTransfer`)

### Plugin-Level Features (Registered by Plugin)

These are registered by the generation plugin (not individual providers):

| Feature Flag | Purpose | Default |
|--------------|---------|---------|
| `ly.img.plugin-ai-{kind}-generation-web.fromText` | Show text-to-X input toggle | `true` |
| `ly.img.plugin-ai-{kind}-generation-web.fromImage` | Show image-to-X input toggle | `true` |
| `ly.img.plugin-ai-{kind}-generation-web.providerSelect` | Show provider dropdown in panel | `true` |
| `ly.img.plugin-ai-{kind}-generation-web.quickAction` | Enable all quick actions | `true` |
| `ly.img.plugin-ai-{kind}-generation-web.quickAction.providerSelect` | Show provider dropdown in quick actions | `true` |

**These are NOT registered by individual providers.** They're already set by the plugin initialization.

### Quick Action Feature Flags (Auto-Registered)

When a provider declares `supportedQuickActions`, the base system auto-enables feature flags:

```typescript
// Automatically registered when provider supports quick actions
ly.img.plugin-ai-{kind}-generation-web.quickAction.{actionName}
```

**Example:** If your provider supports `ly.img.editImage`:
- System auto-enables `ly.img.plugin-ai-image-generation-web.quickAction.editImage`

### Provider-Specific Feature Flags

For providers with toggleable features (like style groups), register custom feature flags:

```typescript
// Pattern
ly.img.plugin-ai-{kind}-generation-web.{modelKey}.{feature}

// Example: Recraft V3 style groups
ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.style.image
ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.style.vector
```

## Provider Implementation

### Basic Provider (No Custom Features)

Most providers don't need to register any feature flags - just translations:

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

### Provider with Custom Features

For providers with toggleable sub-features (like Recraft's style groups):

```typescript
export function RecraftV3(config: RecraftV3Configuration) {
  return async ({ cesdk }) => {
    const modelKey = 'fal-ai/recraft-v3';

    // Register provider-specific feature flags
    cesdk.feature.enable(
      `ly.img.plugin-ai-image-generation-web.${modelKey}.style.image`,
      true
    );
    cesdk.feature.enable(
      `ly.img.plugin-ai-image-generation-web.${modelKey}.style.vector`,
      true
    );

    // Register translations...

    return createImageProvider({
      modelKey,
      renderCustomProperty: {
        style: ({ builder, engine }, property) => {
          // Check which features are enabled
          const isImageStyleEnabled = cesdk.feature.isEnabled(
            `ly.img.plugin-ai-image-generation-web.${modelKey}.style.image`,
            { engine }
          );
          const isVectorStyleEnabled = cesdk.feature.isEnabled(
            `ly.img.plugin-ai-image-generation-web.${modelKey}.style.vector`,
            { engine }
          );

          // Conditionally render UI based on enabled features
          if (isImageStyleEnabled && isVectorStyleEnabled) {
            builder.ButtonGroup(/* show type switcher */);
          }
          // ...
        }
      }
    }, config);
  };
}
```

## Checking Feature Flags

Always include the `engine` context when checking features:

```typescript
// Correct - includes engine context
const isEnabled = cesdk.feature.isEnabled(
  'ly.img.plugin-ai-image-generation-web.fromText',
  { engine: cesdk.engine }  // or { engine } from render context
);

// Incorrect - missing context
const isEnabled = cesdk.feature.isEnabled(
  'ly.img.plugin-ai-image-generation-web.fromText'
);
```

## User Configuration Examples

Users control features via the CE.SDK Feature API:

```typescript
// Disable text-to-image entirely
cesdk.feature.enable('ly.img.plugin-ai-image-generation-web.fromText', false);

// Hide provider selection dropdown
cesdk.feature.enable('ly.img.plugin-ai-image-generation-web.providerSelect', false);

// Disable specific quick action
cesdk.feature.enable('ly.img.plugin-ai-image-generation-web.quickAction.styleTransfer', false);

// Provider-specific: disable vector styles for Recraft
cesdk.feature.enable('ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.style.vector', false);
```

## When to Register Custom Feature Flags

**DO register** custom feature flags when:
- Provider has multiple modes that users may want to toggle independently
- Provider has optional feature groups (like style categories)
- Provider has advanced features that some users may want to hide

**DON'T register** feature flags for:
- Basic provider functionality (handled by plugin-level flags)
- Quick action support (auto-registered by the system)
- Individual schema properties (control via schema `x-imgly-hidden` or `x-imgly-builder`)

## Provider Checklist

- [ ] **Basic providers**: No feature flag registration needed
- [ ] **Custom features**: Register with `cesdk.feature.enable()` during initialization
- [ ] **Feature checks**: Always include `{ engine }` context
- [ ] **Default enabled**: All custom features default to `true`
- [ ] **Naming convention**: Follow `ly.img.plugin-ai-{kind}-generation-web.{modelKey}.{feature}` pattern
