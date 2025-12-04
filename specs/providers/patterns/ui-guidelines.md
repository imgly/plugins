# UI Guidelines for Provider Parameters

This document defines the parameter hierarchy, standard formats, and UI design principles for AI generation providers.

## Core Principles

1. **Simplicity first**: The UI should be usable by non-experts
2. **Essential parameters only**: Hide expert/technical parameters (cfg_scale, seed, guidance_scale, steps, etc.)
3. **Consistency**: Use the same parameter names and formats across providers
4. **Alignment**: Aim for consistency and alignment with existing provider implementations where possible

## Parameter Priority Hierarchy

Parameters should be exposed in this order of importance:

### Priority 1: Core Input (Always Required)
| Parameter | Type | UI Component | When |
|-----------|------|--------------|------|
| `prompt` | `string` | `TextArea` | Text-to-X providers |
| `image_url` | `string` | `ImageUrl` | Image-to-X providers |

### Priority 2: Output Format (Usually Required)
| Parameter | Type | UI Component | Description |
|-----------|------|--------------|-------------|
| `aspect_ratio` | `enum` | `Select` with icons | Output aspect ratio |
| `duration` | `enum` | `Select` | Video duration (video only) |

### Priority 3: Creative Control (Optional, Case-by-Case)
| Parameter | Type | UI Component | When to Include |
|-----------|------|--------------|-----------------|
| `style` | `enum` or asset library | `Select` or `Button` | If provider has distinct style presets |
| `resolution` | `enum` | `Select` | If provider supports multiple resolutions |

### DO NOT Expose (Expert Parameters)
These parameters should be set to sensible defaults internally, not exposed to users:

- `seed` - For reproducibility (expert use)
- `cfg_scale` / `guidance_scale` - Model guidance (expert use)
- `steps` / `num_inference_steps` - Inference steps (expert use)
- `enhance_prompt` - Prompt enhancement (use provider default)
- `negative_prompt` - What to avoid (expert use, consider for specific use cases only)
- `auto_fix` - Auto-correction (use provider default)
- `sync_mode` - API behavior (internal)
- `output_format` - File format (internal)
- `num_images` - Number of outputs (internal, always generate 1)

## Standard Aspect Ratios

When a provider allows flexible dimensions, map to these standard aspect ratios:

### Image Generation - Standard Set
```typescript
const STANDARD_IMAGE_ASPECT_RATIOS = {
  '1:1':   { width: 1024, height: 1024, label: 'Square' },
  '4:3':   { width: 1152, height: 896,  label: 'Landscape 4:3' },
  '3:4':   { width: 896,  height: 1152, label: 'Portrait 3:4' },
  '16:9':  { width: 1344, height: 768,  label: 'Widescreen' },
  '9:16':  { width: 768,  height: 1344, label: 'Mobile' },
  '3:2':   { width: 1152, height: 768,  label: 'Photo Landscape' },
  '2:3':   { width: 768,  height: 1152, label: 'Photo Portrait' }
};
```

### Image Generation - Extended Set (if provider supports)
```typescript
const EXTENDED_IMAGE_ASPECT_RATIOS = {
  ...STANDARD_IMAGE_ASPECT_RATIOS,
  '21:9':  { width: 1536, height: 640,  label: 'Ultra-Wide' },
  '9:21':  { width: 640,  height: 1536, label: 'Ultra-Tall' },
  '2.4:1': { width: 2400, height: 1000, label: 'Cinematic' }
};
```

### Video Generation - Standard Set
```typescript
const STANDARD_VIDEO_ASPECT_RATIOS = {
  '16:9': { width: 1280, height: 720,  label: 'Landscape' },
  '9:16': { width: 720,  height: 1280, label: 'Portrait' },
  '1:1':  { width: 720,  height: 720,  label: 'Square' }
};
```

**Note**: All dimensions must be divisible by 64 for most AI models.

## Standard Duration Options (Video)

```typescript
const STANDARD_VIDEO_DURATIONS = {
  '4s':  { seconds: 4,  label: '4 seconds' },
  '5s':  { seconds: 5,  label: '5 seconds' },
  '6s':  { seconds: 6,  label: '6 seconds' },
  '8s':  { seconds: 8,  label: '8 seconds' },
  '10s': { seconds: 10, label: '10 seconds' }
};
```

Use only durations the provider actually supports.

## Standard Resolution Options

When provider supports multiple quality levels:

```typescript
const STANDARD_RESOLUTIONS = {
  'standard': { label: 'Standard', multiplier: 1 },
  'hd':       { label: 'HD', multiplier: 1.5 },
  '4k':       { label: '4K', multiplier: 2 }
};
```

For video:
```typescript
const STANDARD_VIDEO_RESOLUTIONS = {
  '720p':  { width: 1280, height: 720,  label: 'HD (720p)' },
  '1080p': { width: 1920, height: 1080, label: 'Full HD (1080p)' }
};
```

## Schema Field Order

Always order properties in the UI with `x-fal-order-properties`:

### Text-to-Image
```json
["prompt", "aspect_ratio", "style"]
```

### Image-to-Image
```json
["image_url", "prompt", "style"]
```

### Text-to-Video
```json
["prompt", "aspect_ratio", "duration"]
```

### Image-to-Video
```json
["image_url", "prompt", "duration"]
```

## UI Component Reference

### TextArea (Prompt Input)
```json
{
  "prompt": {
    "type": "string",
    "title": "Prompt",
    "minLength": 1,
    "maxLength": 3000,
    "x-imgly-builder": { "component": "TextArea" }
  }
}
```

### Select with Icons (Aspect Ratio)
```json
{
  "aspect_ratio": {
    "type": "string",
    "title": "Format",
    "enum": ["1:1", "16:9", "9:16", "4:3", "3:4"],
    "default": "1:1",
    "x-imgly-enum-labels": {
      "1:1": "Square",
      "16:9": "Widescreen",
      "9:16": "Mobile",
      "4:3": "Landscape",
      "3:4": "Portrait"
    },
    "x-imgly-enum-icons": {
      "1:1": "@imgly/plugin/formats/ratio1by1",
      "16:9": "@imgly/plugin/formats/ratio16by9",
      "9:16": "@imgly/plugin/formats/ratio9by16",
      "4:3": "@imgly/plugin/formats/ratio4by3",
      "3:4": "@imgly/plugin/formats/ratio3by4"
    }
  }
}
```

### Select (Duration)
```json
{
  "duration": {
    "type": "string",
    "title": "Duration",
    "enum": ["4s", "6s", "8s"],
    "default": "5s",
    "x-imgly-enum-labels": {
      "4s": "4 seconds",
      "6s": "6 seconds",
      "8s": "8 seconds"
    }
  }
}
```

### ImageUrl (Image Input)
```json
{
  "image_url": {
    "type": "string",
    "title": "Input Image",
    "x-imgly-builder": { "component": "ImageUrl" }
  }
}
```

### Style Dropdown (Simple)
```json
{
  "style": {
    "type": "string",
    "title": "Style",
    "enum": ["auto", "realistic", "artistic", "design"],
    "default": "auto",
    "x-imgly-enum-labels": {
      "auto": "Auto",
      "realistic": "Realistic",
      "artistic": "Artistic",
      "design": "Design"
    }
  }
}
```

## Available Format Icons

Icons available from `@imgly/plugin/formats`:

| Icon | Key |
|------|-----|
| Square | `ratio1by1` |
| Landscape 16:9 | `ratio16by9` |
| Portrait 9:16 | `ratio9by16` |
| Landscape 4:3 | `ratio4by3` |
| Portrait 3:4 | `ratio3by4` |
| Landscape 3:2 | `ratio3by2` |
| Portrait 2:3 | `ratio2by3` |
| Ultra-wide 21:9 | `ratio21by9` |
| Ultra-tall 9:21 | `ratio9by21` |

Usage: `@imgly/plugin/formats/{key}`

## Dimension Mapping Strategy

**Important**: Regardless of how the UI is defined, the provider implementation must always send valid values to the API in whatever format it expects (enum strings, width/height integers, preset names, etc.).

### When Provider Allows Completely Free Dimensions
If the API accepts any width/height without significant constraints:
- **DO** provide an aspect ratio dropdown with our standard ratios (mapped to default dimensions)
- **DO** extend the aspect ratio enum with a "Custom" option
- **DO** provide custom width/height input fields that are only visible when "Custom" is selected
- This gives users both quick presets and full flexibility while keeping the UI clean

**Example** (from fal.ai RecraftV3):
```json
{
  "image_size": {
    "anyOf": [
      {
        "enum": [
          "square_hd",
          "square",
          "portrait_4_3",
          "portrait_16_9",
          "landscape_4_3",
          "landscape_16_9"
        ],
        "type": "string"
      },
      { "$ref": "#/components/schemas/ImageSize" }
    ],
    "title": "Format",
    "default": "square_hd",
    "x-imgly-enum-labels": {
      "ImageSize": "Custom",
      "square_hd": "Square HD",
      "square": "Square",
      "portrait_4_3": "Portrait 4:3",
      "portrait_16_9": "Portrait 16:9",
      "landscape_4_3": "Landscape 4:3",
      "landscape_16_9": "Landscape 16:9"
    },
    "x-imgly-enum-icons": {
      "square": "@imgly/plugin/formats/ratio1by1",
      "square_hd": "@imgly/plugin/formats/ratio1by1",
      "portrait_4_3": "@imgly/plugin/formats/ratio3by4",
      "portrait_16_9": "@imgly/plugin/formats/ratio9by16",
      "landscape_4_3": "@imgly/plugin/formats/ratio4by3",
      "landscape_16_9": "@imgly/plugin/formats/ratio16by9",
      "ImageSize": "@imgly/plugin/formats/ratioFree"
    }
  }
}
```

With the referenced `ImageSize` schema for custom dimensions:
```json
{
  "ImageSize": {
    "title": "ImageSize",
    "type": "object",
    "properties": {
      "width": {
        "type": "integer",
        "title": "Width",
        "exclusiveMinimum": 0,
        "maximum": 14142,
        "default": 512
      },
      "height": {
        "type": "integer",
        "title": "Height",
        "exclusiveMinimum": 0,
        "maximum": 14142,
        "default": 512
      }
    },
    "x-fal-order-properties": ["width", "height"]
  }
}
```

The `anyOf` construct allows selecting either a preset enum value OR expanding the `ImageSize` object for custom width/height inputs. The UI shows the object option as "Custom" via `x-imgly-enum-labels`.

### When Provider Has Constrained Dimensions
If the API has restrictions (e.g., dimensions must be divisible by 64, within certain ranges, or from a limited set):
- **DO NOT** expose width/height number inputs (UI would be too complicated with validation)
- **DO** use aspect ratio dropdown mapped to pre-calculated valid dimensions
- Ensure all mapped dimensions satisfy the provider's constraints

### When Provider Has Fixed Presets
If the API only accepts specific size presets:
- Map our standard aspect ratios to the closest matching preset
- Document any aspect ratios that cannot be supported

### When Provider Uses Aspect Ratio Strings
If the API accepts aspect ratio strings directly (e.g., "16:9"):
- Pass through the aspect ratio string
- Document which ratios are supported

## Decision Matrix: When to Include Optional Parameters

| Parameter | Include If... | Example |
|-----------|---------------|---------|
| `style` | Provider has 3+ distinct style presets | Ideogram (AUTO, REALISTIC, DESIGN) |
| `style` (asset library) | Provider has 10+ styles with visual differences | Recraft (50+ illustration styles) |
| `resolution` | Provider supports meaningfully different quality levels | NanoBananaPro (1K, 2K, 4K) |
| `negative_prompt` | **Rarely** - only if critical for model behavior | Most models: skip |

## Provider-Specific Defaults

When a parameter is not exposed but has impact, set sensible defaults:

```typescript
// Internal defaults (not in schema)
const INTERNAL_DEFAULTS = {
  num_images: 1,           // Always generate one image
  output_format: 'png',    // Prefer PNG for quality
  enhance_prompt: true,    // Let AI improve prompts
  auto_fix: true,          // Auto-correct issues
  sync_mode: true          // Wait for result
};
```

## Example: Minimal T2I Provider Schema

```json
{
  "openapi": "3.0.0",
  "info": { "title": "Example T2I API", "version": "1.0.0" },
  "components": {
    "schemas": {
      "ExampleInput": {
        "type": "object",
        "properties": {
          "prompt": {
            "type": "string",
            "title": "Prompt",
            "minLength": 1,
            "x-imgly-builder": { "component": "TextArea" }
          },
          "aspect_ratio": {
            "type": "string",
            "title": "Format",
            "enum": ["1:1", "16:9", "9:16", "4:3", "3:4"],
            "default": "1:1",
            "x-imgly-enum-labels": {
              "1:1": "Square",
              "16:9": "Widescreen",
              "9:16": "Mobile",
              "4:3": "Landscape",
              "3:4": "Portrait"
            },
            "x-imgly-enum-icons": {
              "1:1": "@imgly/plugin/formats/ratio1by1",
              "16:9": "@imgly/plugin/formats/ratio16by9",
              "9:16": "@imgly/plugin/formats/ratio9by16",
              "4:3": "@imgly/plugin/formats/ratio4by3",
              "3:4": "@imgly/plugin/formats/ratio3by4"
            }
          }
        },
        "required": ["prompt"],
        "x-fal-order-properties": ["prompt", "aspect_ratio"]
      }
    }
  }
}
```

## Example: Minimal I2I Provider Schema

```json
{
  "openapi": "3.0.0",
  "info": { "title": "Example I2I API", "version": "1.0.0" },
  "components": {
    "schemas": {
      "ExampleInput": {
        "type": "object",
        "properties": {
          "image_url": {
            "type": "string",
            "title": "Input Image",
            "x-imgly-builder": { "component": "ImageUrl" }
          },
          "prompt": {
            "type": "string",
            "title": "Prompt",
            "minLength": 1,
            "x-imgly-builder": { "component": "TextArea" }
          }
        },
        "required": ["image_url", "prompt"],
        "x-fal-order-properties": ["image_url", "prompt"]
      }
    }
  }
}
```

## Example: Minimal T2V Provider Schema

```json
{
  "openapi": "3.0.0",
  "info": { "title": "Example T2V API", "version": "1.0.0" },
  "components": {
    "schemas": {
      "ExampleInput": {
        "type": "object",
        "properties": {
          "prompt": {
            "type": "string",
            "title": "Prompt",
            "minLength": 1,
            "x-imgly-builder": { "component": "TextArea" }
          },
          "aspect_ratio": {
            "type": "string",
            "title": "Format",
            "enum": ["16:9", "9:16", "1:1"],
            "default": "16:9",
            "x-imgly-enum-labels": {
              "16:9": "Landscape",
              "9:16": "Portrait",
              "1:1": "Square"
            },
            "x-imgly-enum-icons": {
              "16:9": "@imgly/plugin/formats/ratio16by9",
              "9:16": "@imgly/plugin/formats/ratio9by16",
              "1:1": "@imgly/plugin/formats/ratio1by1"
            }
          },
          "duration": {
            "type": "string",
            "title": "Duration",
            "enum": ["4s", "6s", "8s"],
            "default": "5s",
            "x-imgly-enum-labels": {
              "4s": "4 seconds",
              "6s": "6 seconds",
              "8s": "8 seconds"
            }
          }
        },
        "required": ["prompt"],
        "x-fal-order-properties": ["prompt", "aspect_ratio", "duration"]
      }
    }
  }
}
```

## Summary Checklist

When implementing a new provider:

- [ ] **Prompt**: Always include, use `TextArea` component
- [ ] **Image URL**: Include for I2I/I2V, use `ImageUrl` component
- [ ] **Aspect Ratio**: Map to standard ratios with icons, use `Select`
- [ ] **Duration**: For video, use string enum with labels
- [ ] **Style**: Only if provider has distinct presets (3+)
- [ ] **Expert params**: DO NOT expose (seed, cfg_scale, steps, etc.)
- [ ] **Order**: Use `x-fal-order-properties` to set logical order
