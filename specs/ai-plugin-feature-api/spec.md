# AI Plugin UI Customization via Feature API

## Overview

This specification defines how to use CE.SDK's Feature API to control AI plugin UI element visibility. The approach allows fine-grained control over specific UI components (input selectors, provider dropdowns) while maintaining all providers active for features like quick actions.

## Feature ID Schema

Feature IDs follow a consistent, plugin-specific schema that aligns with CE.SDK patterns while maintaining plugin isolation:

```
ly.img.<plugin-id>.<component>.<element>.<sub-element>
```

### Schema Components

| Component | Description | Example |
|-----------|-------------|---------|
| `ly.img` | Standard IMG.LY prefix (consistent with CE.SDK) | `ly.img` |
| `<plugin-id>` | The plugin's unique identifier (without `@imgly/` prefix) | `plugin-ai-image-generation-web` |
| `<component>` | Major functional area within the plugin | `input`, `panel`, `provider`, `quickActions` |
| `<element>` | Specific UI element or feature | `text`, `image`, `createVariant` |
| `<sub-element>` | (Optional) More granular control | Additional nesting as needed |

### Plugin Identifiers

The following plugin IDs are used in feature keys (note: `@imgly/` prefix is omitted for consistency with i18n keys):

- `plugin-ai-image-generation-web` - Image generation
- `plugin-ai-video-generation-web` - Video generation
- `plugin-ai-audio-generation-web` - Audio generation (speech & sound)
- `plugin-ai-sticker-generation-web` - Sticker generation
- `plugin-ai-text-generation-web` - Text generation
- `ly.img.ai.apps` - AI Apps orchestrator (special case, already without prefix)

## Feature Hierarchy

### Image Generation Plugin

```typescript
// Input type controls
'ly.img.plugin-ai-image-generation-web.input'              // Input selector (Text/Image toggle)
'ly.img.plugin-ai-image-generation-web.input.text'         // Text input availability
'ly.img.plugin-ai-image-generation-web.input.image'        // Image input availability

// Provider controls
'ly.img.plugin-ai-image-generation-web.provider'           // Provider selector dropdown

// Quick actions
'ly.img.plugin-ai-image-generation-web.quickActions'       // All quick actions menu
'ly.img.plugin-ai-image-generation-web.quickActions.createVariant'
'ly.img.plugin-ai-image-generation-web.quickActions.swapBackground'
'ly.img.plugin-ai-image-generation-web.quickActions.styleTransfer'
'ly.img.plugin-ai-image-generation-web.quickActions.artistTransfer'
'ly.img.plugin-ai-image-generation-web.quickActions.combineImages'
'ly.img.plugin-ai-image-generation-web.quickActions.remixPage'
'ly.img.plugin-ai-image-generation-web.quickActions.remixPageWithPrompt'
```

### Video Generation Plugin

```typescript
'ly.img.plugin-ai-video-generation-web.input'              // Input selector
'ly.img.plugin-ai-video-generation-web.input.text'         // Text input
'ly.img.plugin-ai-video-generation-web.input.image'        // Image input
'ly.img.plugin-ai-video-generation-web.provider'           // Provider selector

// Quick actions
'ly.img.plugin-ai-video-generation-web.quickActions'       // All quick actions
'ly.img.plugin-ai-video-generation-web.quickActions.createVideo'
```

### Audio Generation Plugin

```typescript
// Provider controls
'ly.img.plugin-ai-audio-generation-web.speech.provider'    // Speech provider selector
'ly.img.plugin-ai-audio-generation-web.sound.provider'     // Sound provider selector
```

### Sticker Generation Plugin

```typescript
'ly.img.plugin-ai-sticker-generation-web.provider'         // Provider selector
```

### Text Generation Plugin

```typescript
'ly.img.plugin-ai-text-generation-web.provider'            // Provider selector

// Quick actions
'ly.img.plugin-ai-text-generation-web.quickActions'        // All quick actions
```

## Component Types

### Standard Components

| Component | Purpose | Example Use Case |
|-----------|---------|------------------|
| `input` | Input type controls | Control Text/Image toggle visibility |
| `provider` | Provider selection | Auto-hide when single provider |
| `quickActions` | Canvas quick actions menu | Hide/show quick actions in canvas |
| `quickActions.{actionId}` | Individual quick action | Control specific quick actions, including custom provider actions |

## Usage Examples

### Basic Feature Control

```typescript
// 1. Hide image input selector, only allow text input
cesdk.feature.enable('ly.img.plugin-ai-image-generation-web.input', false);

// 2. Hide provider selector for stickers
cesdk.feature.enable('ly.img.plugin-ai-sticker-generation-web.provider', false);

// 3. Only allow text input for video generation
cesdk.feature.enable('ly.img.plugin-ai-video-generation-web.input', false);
cesdk.feature.enable('ly.img.plugin-ai-video-generation-web.input.text', true);
cesdk.feature.enable('ly.img.plugin-ai-video-generation-web.input.image', false);
```

### Dynamic Feature Control

```typescript
// Auto-hide provider selector when only one provider is available
cesdk.feature.enable('ly.img.plugin-ai-image-generation-web.provider', ({ engine }) => {
  const providers = getAvailableImageProviders();
  return providers.length > 1;
});

// Control input selector based on available providers
cesdk.feature.enable('ly.img.plugin-ai-video-generation-web.input', ({ engine }) => {
  // Only show input selector if both text and image providers are available
  return hasTextProviders() && hasImageProviders();
});
```

### Custom Provider Quick Actions

When providers add custom quick actions, they should also register and enable the corresponding feature:

```typescript
// Example: Provider adds a custom quick action
const customProvider = {
  // ... provider configuration
  quickActions: {
    'customEnhance': {
      // ... quick action configuration
    }
  }
};

// Provider should also enable the feature during initialization
cesdk.feature.enable('ly.img.plugin-ai-image-generation-web.quickActions.customEnhance', true);
```

## Default Behavior and Feature Initialization

### When Features Are Set to True

Features are initialized to `true` (enabled) during plugin initialization:

1. **Plugin Initialization** - Each plugin sets its own features to `true` when loaded
   - Image plugin: Sets `ly.img.plugin-ai-image-generation-web.input`, `.input.text`, `.input.image`, `.provider`, `.quickActions`, and all individual quick action features
   - Video plugin: Sets `ly.img.plugin-ai-video-generation-web.input`, `.input.text`, `.input.image`, `.provider`, `.quickActions`, `.quickActions.createVideo`
   - Audio plugin: Sets `ly.img.plugin-ai-audio-generation-web.speech.provider`, `.sound.provider`
   - Sticker plugin: Sets `ly.img.plugin-ai-sticker-generation-web.provider`
   - Text plugin: Sets `ly.img.plugin-ai-text-generation-web.provider`, `.quickActions`

2. **Feature Behavior**
   - Unknown/unset features default to `false` per CE.SDK Feature API behavior
   - Plugins must explicitly enable their features during initialization
   - This ensures backward compatibility - existing implementations continue working

## Feature Evaluation

### Evaluation Points

Features are evaluated at specific points during UI rendering:

1. **Panel Rendering** - When generation panels are rendered
   - Input selector features (`.input`, `.input.text`, `.input.image`)
   - Provider selector features (`.provider`, `.speech.provider`, `.sound.provider`)
2. **Quick Actions Menu** - When canvas menu is displayed
   - Quick actions features (`.quickActions` and individual action features)
3. **UI Component Render** - During individual component rendering in `initializeProviders.ts`

### Evaluation Context

The feature API receives a context object with:
- `engine` - The CreativeEngine instance
- Additional context based on evaluation point

## Implementation Guidelines

### Feature Checking

```typescript
// Utility function for feature checking
function isFeatureEnabled(
  cesdk: CreativeEditorSDK, 
  featureId: string
): boolean {
  return cesdk.feature.isEnabled(featureId, { 
    engine: cesdk.engine 
  });
}
```


### Important Considerations

1. **Use full plugin IDs** in feature names to avoid conflicts between plugins
2. **Quick actions remain functional** regardless of input/provider selector visibility
3. **Provider availability is independent** from input type availability
4. **Features are plugin-scoped** - they don't affect other plugins
5. **Plugins must enable their features** during initialization for backward compatibility
6. **Custom quick actions from providers** should also register their feature using the pattern `ly.img.<plugin-id>.quickActions.{customActionId}` and enable it during provider initialization

## Migration Path

For existing implementations:

1. **No changes required** - Plugins enable their features by default, maintaining current functionality
2. **Gradual adoption** - Features can be disabled/customized incrementally
3. **Direct Feature API usage** - Users control features via CE.SDK Feature API

## Appendix: Quick Reference

### Common Feature Patterns

| Use Case | Feature ID Pattern |
|----------|-------------------|
| Hide input selector | `ly.img.<plugin-id>.input` |
| Control input types | `ly.img.<plugin-id>.input.text`, `.input.image` |
| Hide provider dropdown | `ly.img.<plugin-id>.provider` |
| Control quick actions | `ly.img.<plugin-id>.quickActions` |
| Hide specific quick action | `ly.img.<plugin-id>.quickActions.{actionName}` |

### Feature ID Examples by Plugin

| Plugin | Input Selector | Provider Selector |
|--------|----------------|-------------------|
| Image | `ly.img.plugin-ai-image-generation-web.input` | `ly.img.plugin-ai-image-generation-web.provider` |
| Video | `ly.img.plugin-ai-video-generation-web.input` | `ly.img.plugin-ai-video-generation-web.provider` |
| Audio | N/A | `ly.img.plugin-ai-audio-generation-web.speech.provider` |
| Sticker | N/A | `ly.img.plugin-ai-sticker-generation-web.provider` |
| Text | N/A | `ly.img.plugin-ai-text-generation-web.provider` |

## Complete List of Feature Keys

### Image Generation Plugin
```
ly.img.plugin-ai-image-generation-web.input
ly.img.plugin-ai-image-generation-web.input.text
ly.img.plugin-ai-image-generation-web.input.image
ly.img.plugin-ai-image-generation-web.provider
ly.img.plugin-ai-image-generation-web.quickActions
ly.img.plugin-ai-image-generation-web.quickActions.createVariant
ly.img.plugin-ai-image-generation-web.quickActions.swapBackground
ly.img.plugin-ai-image-generation-web.quickActions.styleTransfer
ly.img.plugin-ai-image-generation-web.quickActions.artistTransfer
ly.img.plugin-ai-image-generation-web.quickActions.combineImages
ly.img.plugin-ai-image-generation-web.quickActions.remixPage
ly.img.plugin-ai-image-generation-web.quickActions.remixPageWithPrompt
```

### Video Generation Plugin
```
ly.img.plugin-ai-video-generation-web.input
ly.img.plugin-ai-video-generation-web.input.text
ly.img.plugin-ai-video-generation-web.input.image
ly.img.plugin-ai-video-generation-web.provider
ly.img.plugin-ai-video-generation-web.quickActions
ly.img.plugin-ai-video-generation-web.quickActions.createVideo
```

### Audio Generation Plugin
```
ly.img.plugin-ai-audio-generation-web.speech.provider
ly.img.plugin-ai-audio-generation-web.sound.provider
```

### Sticker Generation Plugin
```
ly.img.plugin-ai-sticker-generation-web.provider
```

### Text Generation Plugin
```
ly.img.plugin-ai-text-generation-web.provider
ly.img.plugin-ai-text-generation-web.quickActions
```

**Total: 26 feature keys**