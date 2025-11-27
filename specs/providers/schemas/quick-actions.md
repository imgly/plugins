# Quick Actions Support

This document defines how providers integrate with the quick actions system.

## Overview

Quick actions are context-sensitive operations that appear in the canvas menu when elements are selected. Providers declare which quick actions they support and how to map quick action input to provider input.

## Quick Action Types

### Image Quick Actions

| ID | Input Fields | Description |
|----|--------------|-------------|
| `ly.img.editImage` | `prompt`, `uri` | Edit image with text prompt |
| `ly.img.createVariant` | `prompt`, `uri` | Create variation of image |
| `ly.img.styleTransfer` | `style`, `uri` | Apply style preset |
| `ly.img.artistTransfer` | `artist`, `uri` | Apply artist style |
| `ly.img.swapBackground` | `prompt`, `uri` | Replace background |
| `ly.img.combineImages` | `uris[]`, `prompt` | Combine multiple images |
| `ly.img.remixPage` | `prompt`, `uri` | Turn page into image (auto prompt) |
| `ly.img.remixPageWithPrompt` | `prompt`, `uri` | Turn page into image with custom prompt |

### Video Quick Actions

| ID | Input Fields | Description |
|----|--------------|-------------|
| `ly.img.createVideo` | `uri`, `prompt` | Animate image to video |
| `ly.img.animateBetweenImages` | `firstFrameUri`, `lastFrameUri` | Interpolate between frames |

## Declaration Syntax

### Basic Support

```typescript
input: {
  quickActions: {
    supported: {
      // With input mapping
      'ly.img.editImage': {
        mapInput: (quickActionInput) => providerInput
      },

      // Direct compatibility (input types match)
      'ly.img.createVariant': true,

      // Explicitly unsupported
      'ly.img.styleTransfer': false
    }
  }
}
```

### Using mergeQuickActionsConfig

Merge provider defaults with user configuration overrides:

```typescript
import { mergeQuickActionsConfig } from '@imgly/plugin-ai-generation-web';

input: {
  quickActions: {
    supported: mergeQuickActionsConfig(
      // Provider defaults
      {
        'ly.img.editImage': {
          mapInput: (input) => ({
            prompt: input.prompt,
            image_url: input.uri
          })
        }
      },
      // User overrides from config
      config.supportedQuickActions
    )
  }
}
```

## Input Mapping

### mapInput Function

Transforms quick action input to provider input:

```typescript
{
  mapInput: (quickActionInput: QuickActionInput) => ProviderInput
}
```

### Image Quick Action Input Types

```typescript
// ly.img.editImage
interface EditImageInput {
  prompt: string;
  uri: string;  // Image URL
}

// ly.img.createVariant
interface CreateVariantInput {
  prompt?: string;
  uri: string;
}

// ly.img.styleTransfer
interface StyleTransferInput {
  style: string;  // Style name/preset
  uri: string;
}

// ly.img.artistTransfer
interface ArtistTransferInput {
  artist: string;  // Artist name
  uri: string;
}

// ly.img.swapBackground
interface SwapBackgroundInput {
  prompt: string;
  uri: string;
}

// ly.img.combineImages
interface CombineImagesInput {
  uris: string[];  // Multiple image URLs
  prompt: string;
}

// ly.img.remixPage
interface RemixPageInput {
  prompt: string;  // Auto-generated prompt
  uri: string;     // Exported page as image URL
}

// ly.img.remixPageWithPrompt
interface RemixPageWithPromptInput {
  prompt: string;  // User-provided prompt
  uri: string;     // Exported page as image URL
}
```

### Video Quick Action Input Types

```typescript
// ly.img.createVideo
interface CreateVideoInput {
  uri: string;      // First frame image URL
  prompt?: string;  // Motion guidance
}

// ly.img.animateBetweenImages
interface AnimateBetweenImagesInput {
  firstFrameUri: string;
  lastFrameUri: string;
}
```

## Complete Examples

### I2I Provider with Full Quick Action Support

```typescript
supportedQuickActions: {
  'ly.img.editImage': {
    mapInput: (input) => ({
      prompt: input.prompt,
      image_url: input.uri
    })
  },
  'ly.img.createVariant': {
    mapInput: (input) => ({
      prompt: input.prompt ?? 'Create a variant of this image',
      image_url: input.uri
    })
  },
  'ly.img.styleTransfer': {
    mapInput: (input) => ({
      prompt: `Transform this image in ${input.style} style`,
      image_url: input.uri
    })
  },
  'ly.img.artistTransfer': {
    mapInput: (input) => ({
      prompt: `Reimagine this image in the style of ${input.artist}`,
      image_url: input.uri
    })
  }
}
```

### I2V Provider with Quick Action Support

```typescript
supportedQuickActions: {
  'ly.img.createVideo': {
    mapInput: (input) => ({
      image_url: input.uri,
      prompt: input.prompt ?? ''
    })
  }
}
```

### First+Last Frame Video Provider

```typescript
supportedQuickActions: {
  'ly.img.animateBetweenImages': {
    mapInput: (input) => ({
      first_frame_url: input.firstFrameUri,
      last_frame_url: input.lastFrameUri,
      prompt: ''
    })
  }
}
```

## User Configuration Overrides

Users can override quick action support in provider configuration:

```typescript
Runware.Ideogram3Remix({
  proxyUrl: 'https://api.example.com',
  supportedQuickActions: {
    // Disable a quick action
    'ly.img.styleTransfer': false,

    // Override mapping
    'ly.img.editImage': {
      mapInput: (input) => ({
        prompt: `Custom: ${input.prompt}`,
        image_url: input.uri
      })
    },

    // Add custom quick action
    'my.custom.action': {
      mapInput: (input) => ({ ... })
    }
  }
});
```

## Feature Flags

Quick actions are controlled by CE.SDK Feature API:

### Pattern

```
ly.img.{plugin-id}.quickAction.{actionName}
```

### Examples

```typescript
// Disable specific quick action
cesdk.feature.enable(
  'ly.img.plugin-ai-image-generation-web.quickAction.styleTransfer',
  false
);

// Disable all quick actions for a plugin
cesdk.feature.enable(
  'ly.img.plugin-ai-image-generation-web.quickAction',
  false
);
```

### Enabling in Provider

Providers should enable their quick action features during initialization:

```typescript
// In provider factory
cesdk.feature.enable(
  'ly.img.plugin-ai-image-generation-web.quickAction.editImage',
  true
);
```

## Type Safety

Use TypeScript generics for type-safe quick action support:

```typescript
import { ImageQuickActionSupportMap } from '../types';

type MyProviderInput = {
  prompt: string;
  image_url: string;
};

const supportedQuickActions: ImageQuickActionSupportMap<MyProviderInput> = {
  'ly.img.editImage': {
    mapInput: (input) => ({
      prompt: input.prompt,      // Type-checked
      image_url: input.uri       // Type-checked
    })
  }
};
```

## When Quick Actions Appear

Quick actions appear in the canvas context menu when:

1. An element is selected on canvas
2. The element type matches the quick action's target (image, video, etc.)
3. At least one registered provider supports the quick action
4. The feature flag is enabled

## Checklist for Adding Quick Action Support

- [ ] Identify which quick actions the provider can support
- [ ] Implement `mapInput` for each supported quick action
- [ ] Add to `supportedQuickActions` in provider definition
- [ ] Use `mergeQuickActionsConfig` to allow user overrides
- [ ] Enable feature flags during provider initialization
- [ ] Test quick actions in canvas context menu
