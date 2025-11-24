# Runware Available Models

This document lists all available models through the Runware API with their AIR identifiers, capabilities, specifications, and input schemas for provider implementation.

## Image Generation Models

### Overview

| Provider | Model | AIR ID | Capabilities |
|----------|-------|--------|--------------|
| BFL | FLUX.1.1 Pro | `bfl:1@1` | T2I |
| BFL | FLUX.1.1 Pro Ultra | `bfl:2@2` | T2I |
| BFL | FLUX.1 Kontext [pro] | `bfl:3@1` | I2I (editing) |
| BFL | FLUX.1 Kontext [max] | `bfl:4@1` | I2I (editing) |
| Google | Imagen 3.0 | `google:1@1` | T2I |
| Google | Imagen 3.0 Fast | `google:1@2` | T2I |
| Google | Imagen 4 Preview | `google:2@1` | T2I |
| Google | Imagen 4 Ultra | `google:2@2` | T2I |
| Google | Imagen 4 Fast | `google:2@3` | T2I |
| Google | Nano Banana / Gemini Flash 2.5 | `google:4@1` | T2I |
| Google | Nano Banana 2 Pro | `google:4@2` | T2I |
| OpenAI | GPT Image 1 | `openai:1@1` | T2I, I2I |
| ByteDance | Seedream 3.0 | `bytedance:3@1` | T2I |
| ByteDance | SeedEdit 3.0 | `bytedance:4@1` | I2I (editing) |
| ByteDance | Seedream 4.0 | `bytedance:5@0` | T2I |
| Bria | Bria 3.2 | `bria:10@1` | T2I |
| Bria | Bria FIBO | `bria:20@1` | T2I |
| Ideogram | Ideogram 3.0 | `ideogram:4@1` | T2I |
| Ideogram | Ideogram 3.0 Remix | `ideogram:4@2` | I2I |
| Ideogram | Ideogram 3.0 Edit | `ideogram:4@3` | I2I |
| Ideogram | Ideogram 3.0 Reframe | `ideogram:4@4` | I2I |
| Ideogram | Ideogram 3.0 Replace BG | `ideogram:4@5` | I2I |
| KlingAI | Kolors 2.0 | `klingai:5@10` | T2I |
| KlingAI | Kolors 2.1 | `klingai:4@10` | T2I |
| Sourceful | Riverflow 1.1 Mini | `sourceful:1@0` | I2I |
| Sourceful | Riverflow 1.1 | `sourceful:1@1` | I2I |
| Sourceful | Riverflow 1.1 Pro | `sourceful:1@2` | I2I |
| Runware | HiDream-I1 Full | `runware:97@1` | T2I |
| Runware | FLUX.1 Krea [dev] | `runware:107@1` | T2I |
| Runware | Qwen-Image | `runware:108@1` | T2I |
| Runware | Qwen-Image-Edit | `runware:108@20` | I2I |
| Runware | Flex.1-alpha | `runware:160@1` | T2I |

---

## Image Model Specifications

### Black Forest Labs (BFL)

**Docs**: https://runware.ai/docs/en/providers/bfl

#### FLUX.1.1 Pro

- **AIR ID**: `bfl:1@1`
- **Capabilities**: Text-to-Image
- **Dimensions**: 256-1440px (must be divisible by 64)
- **Aspect Ratio**: 3:7 to 7:3 (default: 1:1 = 1024×1024)

```json
{
  "components": {
    "schemas": {
      "Flux11ProInput": {
        "type": "object",
        "properties": {
          "prompt": {
            "type": "string",
            "title": "Prompt",
            "minLength": 2,
            "maxLength": 3000,
            "x-imgly-builder": { "component": "TextArea" }
          },
          "aspect_ratio": {
            "type": "string",
            "title": "Aspect Ratio",
            "enum": ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "21:9", "9:21"],
            "default": "1:1",
            "x-imgly-enum-labels": {
              "1:1": "Square",
              "16:9": "Landscape 16:9",
              "9:16": "Portrait 9:16",
              "4:3": "Landscape 4:3",
              "3:4": "Portrait 3:4",
              "3:2": "Landscape 3:2",
              "2:3": "Portrait 2:3",
              "21:9": "Ultrawide",
              "9:21": "Tall"
            },
            "x-imgly-enum-icons": {
              "1:1": "@imgly/plugin/formats/ratio1by1",
              "16:9": "@imgly/plugin/formats/ratio16by9",
              "9:16": "@imgly/plugin/formats/ratio9by16",
              "4:3": "@imgly/plugin/formats/ratio4by3",
              "3:4": "@imgly/plugin/formats/ratio3by4",
              "3:2": "@imgly/plugin/formats/ratio3by2",
              "2:3": "@imgly/plugin/formats/ratio2by3",
              "21:9": "@imgly/plugin/formats/ratio21by9",
              "9:21": "@imgly/plugin/formats/ratio9by21"
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

#### FLUX.1.1 Pro Ultra

- **AIR ID**: `bfl:2@2`
- **Capabilities**: Text-to-Image
- **Resolution**: Up to 4MP (e.g., 2048×2048)
- **Features**: Raw mode available

```json
{
  "components": {
    "schemas": {
      "Flux11ProUltraInput": {
        "type": "object",
        "properties": {
          "prompt": {
            "type": "string",
            "title": "Prompt",
            "minLength": 2,
            "maxLength": 3000,
            "x-imgly-builder": { "component": "TextArea" }
          },
          "aspect_ratio": {
            "type": "string",
            "title": "Aspect Ratio",
            "enum": ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "21:9", "9:21"],
            "default": "1:1",
            "x-imgly-enum-labels": {
              "1:1": "Square",
              "16:9": "Landscape 16:9",
              "9:16": "Portrait 9:16",
              "4:3": "Landscape 4:3",
              "3:4": "Portrait 3:4",
              "3:2": "Landscape 3:2",
              "2:3": "Portrait 2:3",
              "21:9": "Ultrawide",
              "9:21": "Tall"
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

#### FLUX.1 Kontext [pro]

- **AIR ID**: `bfl:3@1`
- **Capabilities**: Image-to-Image (editing)
- **Features**: Fast iterative editing, style preservation
- **Aspect Ratio**: 3:7 to 7:3 (default: 1:1 = 1024×1024)

```json
{
  "components": {
    "schemas": {
      "FluxKontextProInput": {
        "type": "object",
        "properties": {
          "image_url": {
            "type": "string",
            "format": "uri",
            "title": "Source Image",
            "description": "URL of the image to edit"
          },
          "prompt": {
            "type": "string",
            "title": "Prompt",
            "minLength": 3,
            "maxLength": 5000,
            "x-imgly-builder": { "component": "TextArea" }
          },
          "aspect_ratio": {
            "type": "string",
            "title": "Aspect Ratio",
            "enum": ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "21:9", "9:21"],
            "description": "Output aspect ratio (optional, uses input aspect if not specified)"
          }
        },
        "required": ["image_url", "prompt"],
        "x-fal-order-properties": ["image_url", "prompt", "aspect_ratio"]
      }
    }
  }
}
```

#### FLUX.1 Kontext [max]

- **AIR ID**: `bfl:4@1`
- **Capabilities**: Image-to-Image (editing)
- **Features**: Premium quality, sharp edits, typography support
- **Aspect Ratio**: 3:7 to 7:3 (default: 1:1 = 1024×1024)

```json
{
  "components": {
    "schemas": {
      "FluxKontextMaxInput": {
        "type": "object",
        "properties": {
          "image_url": {
            "type": "string",
            "format": "uri",
            "title": "Source Image",
            "description": "URL of the image to edit"
          },
          "prompt": {
            "type": "string",
            "title": "Prompt",
            "minLength": 3,
            "maxLength": 5000,
            "x-imgly-builder": { "component": "TextArea" }
          },
          "aspect_ratio": {
            "type": "string",
            "title": "Aspect Ratio",
            "enum": ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "21:9", "9:21"],
            "description": "Output aspect ratio (optional, uses input aspect if not specified)"
          }
        },
        "required": ["image_url", "prompt"],
        "x-fal-order-properties": ["image_url", "prompt", "aspect_ratio"]
      }
    }
  }
}
```

---

### Google

**Docs**: https://runware.ai/docs/en/providers/google

#### Imagen 4 Preview

- **AIR ID**: `google:2@1`
- **Capabilities**: Text-to-Image
- **Prompt**: 2-3000 characters
- **Dimensions**: Fixed aspect ratios only

```json
{
  "components": {
    "schemas": {
      "Imagen4PreviewInput": {
        "type": "object",
        "properties": {
          "prompt": {
            "type": "string",
            "title": "Prompt",
            "minLength": 2,
            "maxLength": 3000,
            "x-imgly-builder": { "component": "TextArea" }
          },
          "aspect_ratio": {
            "type": "string",
            "title": "Aspect Ratio",
            "enum": ["1:1", "16:9", "9:16", "4:3", "3:4"],
            "default": "1:1",
            "x-imgly-enum-labels": {
              "1:1": "Square (1024×1024)",
              "16:9": "Landscape (1408×768)",
              "9:16": "Portrait (768×1408)",
              "4:3": "Landscape (1280×896)",
              "3:4": "Portrait (896×1280)"
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

#### Imagen 4 Ultra

- **AIR ID**: `google:2@2`
- **Capabilities**: Text-to-Image
- **Features**: Photorealism, exceptional detail and color

Schema same as Imagen 4 Preview.

#### Imagen 4 Fast

- **AIR ID**: `google:2@3`
- **Capabilities**: Text-to-Image
- **Features**: Optimized for latency-sensitive use cases

Schema same as Imagen 4 Preview.

#### Nano Banana / Gemini Flash 2.5

- **AIR ID**: `google:4@1`
- **Capabilities**: Text-to-Image
- **Features**: Multi-image generation, coherent character identity

```json
{
  "components": {
    "schemas": {
      "NanoBananaInput": {
        "type": "object",
        "properties": {
          "prompt": {
            "type": "string",
            "title": "Prompt",
            "minLength": 2,
            "maxLength": 3000,
            "x-imgly-builder": { "component": "TextArea" }
          },
          "aspect_ratio": {
            "type": "string",
            "title": "Aspect Ratio",
            "enum": ["1:1", "16:9", "9:16", "4:3", "3:4"],
            "default": "1:1"
          }
        },
        "required": ["prompt"],
        "x-fal-order-properties": ["prompt", "aspect_ratio"]
      }
    }
  }
}
```

---

### OpenAI

**Docs**: https://runware.ai/docs/en/providers/openai

#### GPT Image 1

- **AIR ID**: `openai:1@1`
- **Capabilities**: Text-to-Image, Image-to-Image
- **Dimensions**: Fixed sizes only (1024×1024, 1536×1024, 1024×1536)

```json
{
  "components": {
    "schemas": {
      "GptImage1TextToImageInput": {
        "type": "object",
        "properties": {
          "prompt": {
            "type": "string",
            "title": "Prompt",
            "x-imgly-builder": { "component": "TextArea" }
          },
          "size": {
            "type": "string",
            "title": "Format",
            "enum": ["1024x1024", "1536x1024", "1024x1536"],
            "default": "1024x1024",
            "x-imgly-enum-labels": {
              "1024x1024": "Square",
              "1536x1024": "Landscape",
              "1024x1536": "Portrait"
            },
            "x-imgly-enum-icons": {
              "1024x1024": "@imgly/plugin/formats/ratio1by1",
              "1536x1024": "@imgly/plugin/formats/ratio4by3",
              "1024x1536": "@imgly/plugin/formats/ratio3by4"
            }
          },
          "background": {
            "type": "string",
            "title": "Background",
            "enum": ["auto", "transparent", "opaque"],
            "default": "auto",
            "x-imgly-enum-labels": {
              "auto": "Auto",
              "transparent": "Transparent",
              "opaque": "Opaque"
            }
          }
        },
        "required": ["prompt"],
        "x-fal-order-properties": ["prompt", "size", "background"]
      },
      "GptImage1ImageToImageInput": {
        "type": "object",
        "properties": {
          "image_url": {
            "type": "string",
            "format": "uri",
            "title": "Source Image"
          },
          "prompt": {
            "type": "string",
            "title": "Prompt",
            "x-imgly-builder": { "component": "TextArea" }
          },
          "size": {
            "type": "string",
            "title": "Format",
            "enum": ["1024x1024", "1536x1024", "1024x1536"],
            "default": "1024x1024"
          }
        },
        "required": ["image_url", "prompt"],
        "x-fal-order-properties": ["image_url", "prompt", "size"]
      }
    }
  }
}
```

---

### ByteDance

**Docs**: https://runware.ai/docs/en/providers/bytedance

#### Seedream 4.0

- **AIR ID**: `bytedance:5@0`
- **Capabilities**: Text-to-Image
- **Resolution**: Up to 4K
- **Features**: Ultra-fast 2K-4K generation, bilingual support

```json
{
  "components": {
    "schemas": {
      "Seedream4Input": {
        "type": "object",
        "properties": {
          "prompt": {
            "type": "string",
            "title": "Prompt",
            "minLength": 2,
            "maxLength": 3000,
            "x-imgly-builder": { "component": "TextArea" }
          },
          "image_size": {
            "type": "string",
            "title": "Format",
            "enum": ["square", "square_hd", "portrait_4_3", "portrait_3_2", "portrait_16_9", "landscape_4_3", "landscape_3_2", "landscape_16_9", "landscape_21_9"],
            "default": "square_hd",
            "x-imgly-enum-labels": {
              "square": "Square",
              "square_hd": "Square HD",
              "portrait_4_3": "Portrait 4:3",
              "portrait_3_2": "Portrait 3:2",
              "portrait_16_9": "Portrait 16:9",
              "landscape_4_3": "Landscape 4:3",
              "landscape_3_2": "Landscape 3:2",
              "landscape_16_9": "Landscape 16:9",
              "landscape_21_9": "Ultrawide"
            }
          },
          "image_resolution": {
            "type": "string",
            "title": "Resolution",
            "enum": ["1k", "2k", "4k"],
            "default": "1k",
            "x-imgly-enum-labels": {
              "1k": "1K (~1MP)",
              "2k": "2K (~4MP)",
              "4k": "4K (~16MP)"
            }
          }
        },
        "required": ["prompt"],
        "x-fal-order-properties": ["prompt", "image_size", "image_resolution"]
      }
    }
  }
}
```

#### SeedEdit 3.0

- **AIR ID**: `bytedance:4@1`
- **Capabilities**: Image-to-Image (editing)
- **Resolution**: Up to 4K output

```json
{
  "components": {
    "schemas": {
      "SeedEdit3Input": {
        "type": "object",
        "properties": {
          "image_url": {
            "type": "string",
            "format": "uri",
            "title": "Source Image"
          },
          "prompt": {
            "type": "string",
            "title": "Prompt",
            "minLength": 2,
            "maxLength": 3000,
            "x-imgly-builder": { "component": "TextArea" }
          },
          "resolution": {
            "type": "string",
            "title": "Resolution",
            "enum": ["1k", "2k"],
            "default": "1k",
            "description": "Output resolution tier (auto-determines from input aspect)",
            "x-imgly-enum-labels": {
              "1k": "1K (~1MP)",
              "2k": "2K (~4MP)"
            }
          }
        },
        "required": ["image_url", "prompt"],
        "x-fal-order-properties": ["image_url", "prompt", "resolution"]
      }
    }
  }
}
```

---

### Ideogram

**Docs**: https://runware.ai/docs/en/providers/ideogram

#### Ideogram 3.0

- **AIR ID**: `ideogram:4@1`
- **Capabilities**: Text-to-Image
- **Dimensions**: 128-2048px (divisible by 64)
- **Features**: Design-level, sharp text rendering, style presets

```json
{
  "components": {
    "schemas": {
      "Ideogram3Input": {
        "type": "object",
        "properties": {
          "prompt": {
            "type": "string",
            "title": "Prompt",
            "x-imgly-builder": { "component": "TextArea" }
          },
          "style": {
            "type": "string",
            "title": "Style",
            "enum": ["AUTO", "GENERAL", "REALISTIC", "DESIGN", "RENDER_3D", "ANIME"],
            "default": "AUTO",
            "x-imgly-enum-labels": {
              "AUTO": "Auto",
              "GENERAL": "General",
              "REALISTIC": "Realistic",
              "DESIGN": "Design",
              "RENDER_3D": "3D Render",
              "ANIME": "Anime"
            }
          },
          "image_size": {
            "anyOf": [
              {
                "type": "string",
                "enum": ["square_hd", "square", "portrait_4_3", "portrait_16_9", "landscape_4_3", "landscape_16_9"]
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
        },
        "required": ["prompt"],
        "x-fal-order-properties": ["prompt", "style", "image_size"]
      },
      "ImageSize": {
        "type": "object",
        "properties": {
          "width": {
            "type": "integer",
            "title": "Width",
            "minimum": 128,
            "maximum": 2048,
            "default": 1024,
            "description": "Must be divisible by 64"
          },
          "height": {
            "type": "integer",
            "title": "Height",
            "minimum": 128,
            "maximum": 2048,
            "default": 1024,
            "description": "Must be divisible by 64"
          }
        }
      }
    }
  }
}
```

#### Ideogram 3.0 Remix

- **AIR ID**: `ideogram:4@2`
- **Capabilities**: Image-to-Image
- **Features**: Reinterprets with fresh styles

```json
{
  "components": {
    "schemas": {
      "Ideogram3RemixInput": {
        "type": "object",
        "properties": {
          "image_url": {
            "type": "string",
            "format": "uri",
            "title": "Source Image"
          },
          "prompt": {
            "type": "string",
            "title": "Prompt",
            "x-imgly-builder": { "component": "TextArea" }
          },
          "style": {
            "type": "string",
            "title": "Style",
            "enum": ["AUTO", "GENERAL", "REALISTIC", "DESIGN", "RENDER_3D", "ANIME"],
            "default": "AUTO"
          },
          "resolution": {
            "type": "string",
            "title": "Resolution",
            "enum": ["1k", "2k"],
            "default": "1k",
            "description": "Output resolution tier"
          }
        },
        "required": ["image_url", "prompt"],
        "x-fal-order-properties": ["image_url", "prompt", "style", "resolution"]
      }
    }
  }
}
```

#### Ideogram 3.0 Edit

- **AIR ID**: `ideogram:4@3`
- **Capabilities**: Image-to-Image (inpainting)

```json
{
  "components": {
    "schemas": {
      "Ideogram3EditInput": {
        "type": "object",
        "properties": {
          "image_url": {
            "type": "string",
            "format": "uri",
            "title": "Source Image"
          },
          "prompt": {
            "type": "string",
            "title": "Prompt",
            "x-imgly-builder": { "component": "TextArea" }
          },
          "resolution": {
            "type": "string",
            "title": "Resolution",
            "enum": ["1k", "2k"],
            "default": "1k"
          }
        },
        "required": ["image_url", "prompt"],
        "x-fal-order-properties": ["image_url", "prompt", "resolution"]
      }
    }
  }
}
```

---

### KlingAI (Image)

**Docs**: https://runware.ai/docs/en/providers/klingai

#### Kolors 2.1

- **AIR ID**: `klingai:4@10`
- **Capabilities**: Text-to-Image
- **Features**: Refined edge rendering, lighting realism

```json
{
  "components": {
    "schemas": {
      "Kolors21Input": {
        "type": "object",
        "properties": {
          "prompt": {
            "type": "string",
            "title": "Prompt",
            "x-imgly-builder": { "component": "TextArea" }
          },
          "aspect_ratio": {
            "type": "string",
            "title": "Aspect Ratio",
            "enum": ["1:1", "16:9", "9:16", "4:3", "3:4"],
            "default": "1:1"
          }
        },
        "required": ["prompt"],
        "x-fal-order-properties": ["prompt", "aspect_ratio"]
      }
    }
  }
}
```

---

### Bria

**Docs**: https://runware.ai/docs/en/providers/bria

#### Bria FIBO

- **AIR ID**: `bria:20@1`
- **Capabilities**: Text-to-Image
- **Features**: Converts prompts to JSON schemas before rendering, precise control

```json
{
  "components": {
    "schemas": {
      "BriaFiboInput": {
        "type": "object",
        "properties": {
          "prompt": {
            "type": "string",
            "title": "Prompt",
            "maxLength": 1000,
            "x-imgly-builder": { "component": "TextArea" }
          },
          "aspect_ratio": {
            "type": "string",
            "title": "Aspect Ratio",
            "enum": ["1:1", "16:9", "9:16", "4:5", "3:2"],
            "default": "1:1"
          }
        },
        "required": ["prompt"],
        "x-fal-order-properties": ["prompt", "aspect_ratio"]
      }
    }
  }
}
```

---

## Video Generation Models

### Overview

| Provider | Model | AIR ID | Capabilities | Duration | Resolution |
|----------|-------|--------|--------------|----------|------------|
| KlingAI | Kling 1.0 Standard | `klingai:1@1` | T2V, I2V | 5-10s | 720p |
| KlingAI | Kling 1.0 Pro | `klingai:1@2` | T2V, I2V | 5-10s | 720p |
| KlingAI | Kling 1.5 Standard | `klingai:2@1` | I2V only | 5-10s | 720p |
| KlingAI | Kling 1.5 Pro | `klingai:2@2` | I2V only | 5-10s | 1080p |
| KlingAI | Kling 1.6 Standard | `klingai:3@1` | T2V, I2V | 5-10s | 720p-1080p |
| KlingAI | Kling 1.6 Pro | `klingai:3@2` | I2V only | 5-10s | 1080p |
| KlingAI | Kling 2.0 Master | `klingai:4@3` | T2V, I2V | 10s | 1080p |
| KlingAI | Kling 2.1 Master | `klingai:5@3` | T2V, I2V | 5-10s | 1080p |
| MiniMax | Video-01 Base | `minimax:1@1` | T2V, I2V, Ref2V | 6s | 768p |
| MiniMax | Video-01 Director | `minimax:2@1` | T2V, I2V | 6s | 768p |
| MiniMax | Video-01 Live | `minimax:2@3` | I2V only | 6s | 768p |
| MiniMax | Hailuo 02 | `minimax:3@1` | T2V, I2V | 6-10s | 768p-1080p |
| PixVerse | PixVerse v3.5 | `pixverse:1@1` | T2V, I2V | 5-8s | 1080p |
| PixVerse | PixVerse v4.5 | `pixverse:1@3` | T2V, I2V | 5-8s | 1080p |
| PixVerse | PixVerse v5 | `pixverse:1@5` | T2V, I2V | 5-8s | 1080p |
| Vidu | Vidu Q1 Classic | `vidu:1@0` | First/Last frame | 5s | 1080p |
| Vidu | Vidu 1.5 | `vidu:1@5` | T2V, I2V, Ref2V | 4-8s | 1080p |
| Vidu | Vidu 2.0 | `vidu:2@0` | I2V, Ref2V | 4-8s | 1080p |
| Vidu | Vidu Q2 Pro | `vidu:3@1` | T2V, First/Last, Ref2V | 1-8s | 1080p |
| Vidu | Vidu Q2 Turbo | `vidu:3@2` | T2V, First/Last, Ref2V | 1-8s | 1080p |
| Google | Veo 2 | `google:2@0` | T2V, I2V | 8s | 720p |
| Google | Veo 3 | `google:3@2` | T2V, I2V | 8s | 720p-1080p |
| Google | Veo 3 Fast | `google:3@1` | T2V, I2V | 8s | 720p-1080p |
| Runway | Gen-4 Turbo | `runway:1@1` | I2V only | 2-10s | 720p-1080p |
| Runway | Aleph (V2V) | `runway:2@1` | V2V | - | - |
| ByteDance | Seedance 1.0 Lite | `bytedance:1@1` | T2V, I2V | 1.2-12s | 480p-720p |
| ByteDance | Seedance 1.0 Pro | `bytedance:2@1` | T2V, I2V | 1.2-12s | 480p-1080p |
| ByteDance | Seedance 1.0 Pro Fast | `bytedance:2@2` | T2V, I2V | 1.2-12s | 480p-1080p |
| Lightricks | LTX-2 Standard | `lightricks:2@0` | T2V, I2V | 6-10s | 720p-1080p |
| Lightricks | LTX-2 High-Speed | `lightricks:2@1` | T2V, I2V | 6-10s | 720p-1080p |

---

## Video Model Specifications

### KlingAI

**Docs**: https://runware.ai/docs/en/providers/klingai

#### Kling 2.1 Master (Text-to-Video)

- **AIR ID**: `klingai:5@3`
- **Capabilities**: Text-to-Video, Image-to-Video
- **Dimensions**: 1920×1080 (16:9), 1080×1080 (1:1), 1080×1920 (9:16)
- **FPS**: 30
- **Duration**: 5 or 10 seconds
- **CFG Scale**: 0-1 (default: 0.5)

```json
{
  "components": {
    "schemas": {
      "Kling21MasterTextToVideoInput": {
        "type": "object",
        "properties": {
          "prompt": {
            "type": "string",
            "title": "Prompt",
            "maxLength": 2500,
            "x-imgly-builder": { "component": "TextArea" }
          },
          "aspect_ratio": {
            "type": "string",
            "title": "Aspect Ratio",
            "enum": ["16:9", "1:1", "9:16"],
            "default": "16:9",
            "x-imgly-enum-labels": {
              "16:9": "Landscape (1920×1080)",
              "1:1": "Square (1080×1080)",
              "9:16": "Portrait (1080×1920)"
            }
          },
          "duration": {
            "type": "string",
            "title": "Duration",
            "enum": ["5", "10"],
            "default": "5",
            "x-imgly-enum-labels": {
              "5": "5 seconds",
              "10": "10 seconds"
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

#### Kling 2.1 Master (Image-to-Video)

- **AIR ID**: `klingai:5@3`
- **Input Requirements**: 300-2048px, 20MB max

```json
{
  "components": {
    "schemas": {
      "Kling21MasterImageToVideoInput": {
        "type": "object",
        "properties": {
          "image_url": {
            "type": "string",
            "format": "uri",
            "title": "Source Image"
          },
          "prompt": {
            "type": "string",
            "title": "Prompt",
            "maxLength": 2500,
            "x-imgly-builder": { "component": "TextArea" }
          },
          "duration": {
            "type": "string",
            "title": "Duration",
            "enum": ["5", "10"],
            "default": "5",
            "x-imgly-enum-labels": {
              "5": "5 seconds",
              "10": "10 seconds"
            }
          }
        },
        "required": ["image_url", "prompt"],
        "x-fal-order-properties": ["image_url", "prompt", "duration"]
      }
    }
  }
}
```

---

### MiniMax (Hailuo)

**Docs**: https://runware.ai/docs/en/providers/minimax

#### Hailuo 02

- **AIR ID**: `minimax:3@1`
- **Capabilities**: Text-to-Video, Image-to-Video
- **Dimensions**: 1366×768 (768p), 1920×1080 (1080p)
- **FPS**: 25
- **Duration**: 6s (all), 10s (768p only)
- **Prompt**: 2-3000 characters

```json
{
  "components": {
    "schemas": {
      "Hailuo02TextToVideoInput": {
        "type": "object",
        "properties": {
          "prompt": {
            "type": "string",
            "title": "Prompt",
            "minLength": 2,
            "maxLength": 3000,
            "x-imgly-builder": { "component": "TextArea" }
          },
          "resolution": {
            "type": "string",
            "title": "Resolution",
            "enum": ["768p", "1080p"],
            "default": "768p",
            "x-imgly-enum-labels": {
              "768p": "768p (1366×768)",
              "1080p": "1080p (1920×1080)"
            }
          },
          "duration": {
            "type": "string",
            "title": "Duration",
            "enum": ["6", "10"],
            "default": "6",
            "description": "10 seconds only available at 768p",
            "x-imgly-enum-labels": {
              "6": "6 seconds",
              "10": "10 seconds"
            }
          }
        },
        "required": ["prompt"],
        "x-fal-order-properties": ["prompt", "resolution", "duration"]
      }
    }
  }
}
```

#### Video-01 Live (Image-to-Video)

- **AIR ID**: `minimax:2@3`
- **Capabilities**: Image-to-Video only
- **Dimensions**: 1366×768
- **Duration**: 6 seconds

```json
{
  "components": {
    "schemas": {
      "Video01LiveInput": {
        "type": "object",
        "properties": {
          "image_url": {
            "type": "string",
            "format": "uri",
            "title": "Source Image"
          },
          "prompt": {
            "type": "string",
            "title": "Prompt",
            "minLength": 2,
            "maxLength": 3000,
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

---

### PixVerse

**Docs**: https://runware.ai/docs/en/providers/pixverse

#### PixVerse v5

- **AIR ID**: `pixverse:1@5`
- **Capabilities**: Text-to-Video, Image-to-Video
- **Resolutions**: 360p to 1080p
- **FPS**: 16 or 24
- **Duration**: 5 or 8 seconds (8s up to 720p only)
- **Input Requirements**: 300-4000px, 20MB max
- **Features**: Camera movements, effects, sound generation

```json
{
  "components": {
    "schemas": {
      "PixVerseV5TextToVideoInput": {
        "type": "object",
        "properties": {
          "prompt": {
            "type": "string",
            "title": "Prompt",
            "minLength": 2,
            "maxLength": 2048,
            "x-imgly-builder": { "component": "TextArea" }
          },
          "aspect_ratio": {
            "type": "string",
            "title": "Aspect Ratio",
            "enum": ["16:9", "4:3", "1:1", "3:4", "9:16"],
            "default": "16:9",
            "x-imgly-enum-labels": {
              "16:9": "Landscape",
              "4:3": "Standard",
              "1:1": "Square",
              "3:4": "Portrait",
              "9:16": "Vertical"
            }
          },
          "resolution": {
            "type": "string",
            "title": "Resolution",
            "enum": ["720p", "1080p"],
            "default": "720p"
          },
          "duration": {
            "type": "string",
            "title": "Duration",
            "enum": ["5", "8"],
            "default": "5",
            "description": "8 seconds only available up to 720p",
            "x-imgly-enum-labels": {
              "5": "5 seconds",
              "8": "8 seconds"
            }
          }
        },
        "required": ["prompt"],
        "x-fal-order-properties": ["prompt", "aspect_ratio", "resolution", "duration"]
      }
    }
  }
}
```

---

### Vidu

**Docs**: https://runware.ai/docs/en/providers/vidu

#### Vidu 2.0

- **AIR ID**: `vidu:2@0`
- **Capabilities**: Image-to-Video, Reference-to-Video
- **Dimensions**: Multiple resolutions (360p to 1080p)
- **FPS**: 24
- **Duration**: 4s (all), 8s (720p only)
- **Input Requirements**: 300-2048px, 20MB max
- **Features**: First/last frame support, movement amplitude, BGM

```json
{
  "components": {
    "schemas": {
      "Vidu2ImageToVideoInput": {
        "type": "object",
        "properties": {
          "image_url": {
            "type": "string",
            "format": "uri",
            "title": "Source Image"
          },
          "prompt": {
            "type": "string",
            "title": "Prompt",
            "x-imgly-builder": { "component": "TextArea" }
          },
          "aspect_ratio": {
            "type": "string",
            "title": "Aspect Ratio",
            "enum": ["16:9", "1:1", "9:16"],
            "default": "16:9"
          },
          "resolution": {
            "type": "string",
            "title": "Resolution",
            "enum": ["360p", "720p", "1080p"],
            "default": "720p"
          },
          "duration": {
            "type": "string",
            "title": "Duration",
            "enum": ["4", "8"],
            "default": "4",
            "description": "8 seconds only available at 720p",
            "x-imgly-enum-labels": {
              "4": "4 seconds",
              "8": "8 seconds"
            }
          }
        },
        "required": ["image_url"],
        "x-fal-order-properties": ["image_url", "prompt", "aspect_ratio", "resolution", "duration"]
      }
    }
  }
}
```

#### Vidu Q2 Pro (First/Last Frame)

- **AIR ID**: `vidu:3@1`
- **Capabilities**: Text-to-Video, First/Last frame, Reference-to-Video
- **Duration**: 1-8 seconds

```json
{
  "components": {
    "schemas": {
      "ViduQ2ProFirstLastFrameInput": {
        "type": "object",
        "properties": {
          "first_frame_url": {
            "type": "string",
            "format": "uri",
            "title": "First Frame"
          },
          "last_frame_url": {
            "type": "string",
            "format": "uri",
            "title": "Last Frame"
          },
          "prompt": {
            "type": "string",
            "title": "Prompt",
            "x-imgly-builder": { "component": "TextArea" }
          },
          "duration": {
            "type": "integer",
            "title": "Duration",
            "minimum": 1,
            "maximum": 8,
            "default": 5,
            "x-imgly-builder": { "component": "Slider" }
          }
        },
        "required": ["first_frame_url"],
        "x-fal-order-properties": ["first_frame_url", "last_frame_url", "prompt", "duration"]
      }
    }
  }
}
```

---

### Google Veo

**Docs**: https://runware.ai/docs/en/providers/google

#### Veo 3

- **AIR ID**: `google:3@2`
- **Capabilities**: Text-to-Video, Image-to-Video
- **Resolution**: 720p-1080p
- **FPS**: 24
- **Duration**: 4, 6, or 8 seconds
- **Features**: Native audio generation (dialogue, ambience, SFX)

```json
{
  "components": {
    "schemas": {
      "Veo3TextToVideoInput": {
        "type": "object",
        "properties": {
          "prompt": {
            "type": "string",
            "title": "Prompt",
            "x-imgly-builder": { "component": "TextArea" }
          },
          "aspect_ratio": {
            "type": "string",
            "title": "Aspect Ratio",
            "enum": ["16:9", "9:16"],
            "default": "16:9",
            "x-imgly-enum-labels": {
              "16:9": "Landscape",
              "9:16": "Portrait"
            }
          },
          "resolution": {
            "type": "string",
            "title": "Resolution",
            "enum": ["720p", "1080p"],
            "default": "720p"
          },
          "duration": {
            "type": "string",
            "title": "Duration",
            "enum": ["4", "6", "8"],
            "default": "8",
            "x-imgly-enum-labels": {
              "4": "4 seconds",
              "6": "6 seconds",
              "8": "8 seconds"
            }
          },
          "generate_audio": {
            "type": "boolean",
            "title": "Generate Audio",
            "default": true,
            "description": "Generate native audio (dialogue, ambience, SFX)"
          }
        },
        "required": ["prompt"],
        "x-fal-order-properties": ["prompt", "aspect_ratio", "resolution", "duration", "generate_audio"]
      }
    }
  }
}
```

#### Veo 3 (Image-to-Video)

```json
{
  "components": {
    "schemas": {
      "Veo3ImageToVideoInput": {
        "type": "object",
        "properties": {
          "image_url": {
            "type": "string",
            "format": "uri",
            "title": "Source Image",
            "description": "Recommended: 720p or higher, 16:9 or 9:16 aspect ratio"
          },
          "prompt": {
            "type": "string",
            "title": "Prompt",
            "x-imgly-builder": { "component": "TextArea" }
          },
          "resolution": {
            "type": "string",
            "title": "Resolution",
            "enum": ["720p", "1080p"],
            "default": "720p"
          },
          "duration": {
            "type": "string",
            "title": "Duration",
            "enum": ["4", "6", "8"],
            "default": "8"
          },
          "generate_audio": {
            "type": "boolean",
            "title": "Generate Audio",
            "default": true
          }
        },
        "required": ["image_url", "prompt"],
        "x-fal-order-properties": ["image_url", "prompt", "resolution", "duration", "generate_audio"]
      }
    }
  }
}
```

---

### Runway

**Docs**: https://runware.ai/docs/en/providers/runway

#### Gen-4 Turbo

- **AIR ID**: `runway:1@1`
- **Capabilities**: Image-to-Video only
- **Dimensions**: 1280×720, 720×1280, 1104×832, 832×1104, 960×960, 1584×672
- **Duration**: 2-10 seconds (default: 10)
- **Prompt**: 1-1000 characters (optional)
- **Input Requirements**: 20MB max

```json
{
  "components": {
    "schemas": {
      "Gen4TurboInput": {
        "type": "object",
        "properties": {
          "image_url": {
            "type": "string",
            "format": "uri",
            "title": "Source Image"
          },
          "prompt": {
            "type": "string",
            "title": "Prompt",
            "maxLength": 1000,
            "x-imgly-builder": { "component": "TextArea" }
          },
          "aspect_ratio": {
            "type": "string",
            "title": "Aspect Ratio",
            "enum": ["16:9", "9:16", "4:3", "3:4", "1:1", "21:9"],
            "default": "16:9",
            "x-imgly-enum-labels": {
              "16:9": "Landscape (1280×720)",
              "9:16": "Portrait (720×1280)",
              "4:3": "Standard (1104×832)",
              "3:4": "Portrait (832×1104)",
              "1:1": "Square (960×960)",
              "21:9": "Ultrawide (1584×672)"
            }
          },
          "duration": {
            "type": "integer",
            "title": "Duration",
            "minimum": 2,
            "maximum": 10,
            "default": 10,
            "x-imgly-builder": { "component": "Slider" }
          }
        },
        "required": ["image_url"],
        "x-fal-order-properties": ["image_url", "prompt", "aspect_ratio", "duration"]
      }
    }
  }
}
```

---

### ByteDance (Seedance)

**Docs**: https://runware.ai/docs/en/providers/bytedance

#### Seedance 1.0 Pro

- **AIR ID**: `bytedance:2@1`
- **Capabilities**: Text-to-Video, Image-to-Video
- **Dimensions**: Multiple (480p to 1080p, various aspect ratios)
- **FPS**: 24
- **Duration**: 1.2-12 seconds (0.1s increments)
- **Features**: First/last frame support, camera fixed mode
- **Input Requirements**: 300-6000px, 10MB max

```json
{
  "components": {
    "schemas": {
      "SeedanceProTextToVideoInput": {
        "type": "object",
        "properties": {
          "prompt": {
            "type": "string",
            "title": "Prompt",
            "minLength": 2,
            "maxLength": 3000,
            "x-imgly-builder": { "component": "TextArea" }
          },
          "aspect_ratio": {
            "type": "string",
            "title": "Aspect Ratio",
            "enum": ["16:9", "4:3", "1:1", "3:4", "9:16", "21:9", "9:21"],
            "default": "16:9"
          },
          "resolution": {
            "type": "string",
            "title": "Resolution",
            "enum": ["480p", "720p", "1080p"],
            "default": "720p"
          },
          "duration": {
            "type": "number",
            "title": "Duration",
            "minimum": 1.2,
            "maximum": 12,
            "default": 5,
            "description": "Duration in seconds (0.1s increments)",
            "x-imgly-builder": { "component": "Slider" }
          }
        },
        "required": ["prompt"],
        "x-fal-order-properties": ["prompt", "aspect_ratio", "resolution", "duration"]
      }
    }
  }
}
```

#### Seedance 1.0 Pro (Image-to-Video)

```json
{
  "components": {
    "schemas": {
      "SeedanceProImageToVideoInput": {
        "type": "object",
        "properties": {
          "first_frame_url": {
            "type": "string",
            "format": "uri",
            "title": "First Frame",
            "description": "Image for first frame (300-6000px)"
          },
          "last_frame_url": {
            "type": "string",
            "format": "uri",
            "title": "Last Frame",
            "description": "Optional image for last frame"
          },
          "prompt": {
            "type": "string",
            "title": "Prompt",
            "minLength": 2,
            "maxLength": 3000,
            "x-imgly-builder": { "component": "TextArea" }
          },
          "duration": {
            "type": "number",
            "title": "Duration",
            "minimum": 1.2,
            "maximum": 12,
            "default": 5,
            "x-imgly-builder": { "component": "Slider" }
          }
        },
        "required": ["first_frame_url", "prompt"],
        "x-fal-order-properties": ["first_frame_url", "last_frame_url", "prompt", "duration"]
      }
    }
  }
}
```

---

### Lightricks (LTX)

**Docs**: https://runware.ai/docs/en/providers/lightricks

#### LTX-2 Standard

- **AIR ID**: `lightricks:2@0`
- **Capabilities**: Text-to-Video, Image-to-Video
- **FPS**: 25 or 50
- **Duration**: 6, 8, or 10 seconds
- **Prompt**: 2-10000 characters
- **Input Requirements**: 7MB max
- **Features**: Audio generation available
- **Note**: No seed support

```json
{
  "components": {
    "schemas": {
      "LTX2TextToVideoInput": {
        "type": "object",
        "properties": {
          "prompt": {
            "type": "string",
            "title": "Prompt",
            "minLength": 2,
            "maxLength": 10000,
            "x-imgly-builder": { "component": "TextArea" }
          },
          "aspect_ratio": {
            "type": "string",
            "title": "Aspect Ratio",
            "enum": ["16:9", "9:16", "1:1"],
            "default": "16:9"
          },
          "resolution": {
            "type": "string",
            "title": "Resolution",
            "enum": ["720p", "1080p"],
            "default": "720p"
          },
          "duration": {
            "type": "string",
            "title": "Duration",
            "enum": ["6", "8", "10"],
            "default": "6",
            "x-imgly-enum-labels": {
              "6": "6 seconds",
              "8": "8 seconds",
              "10": "10 seconds"
            }
          },
          "generate_audio": {
            "type": "boolean",
            "title": "Generate Audio",
            "default": false
          }
        },
        "required": ["prompt"],
        "x-fal-order-properties": ["prompt", "aspect_ratio", "resolution", "duration", "generate_audio"]
      }
    }
  }
}
```

---

## Legend

| Abbreviation | Meaning |
|--------------|---------|
| T2I | Text-to-Image |
| I2I | Image-to-Image |
| T2V | Text-to-Video |
| I2V | Image-to-Video |
| V2V | Video-to-Video |
| Ref2V | Reference-to-Video |
| Audio2V | Audio-driven Video |

---

## Dimension Handling

Runware has specific dimension constraints:

1. **Divisibility**: All dimensions must be divisible by 64 (images) or 8 (video)
2. **Range**: 128-2048 pixels (FLUX Pro: 256-1440)
3. **Resolution Tiers**: `"1k"`, `"2k"`, `"4k"` for auto-sizing from seedImage

### Recommended Aspect Ratio Mapping

```typescript
const ASPECT_RATIO_MAP = {
  '1:1':   { width: 1024, height: 1024 },
  '16:9':  { width: 1344, height: 768 },  // Divisible by 64
  '9:16':  { width: 768, height: 1344 },
  '4:3':   { width: 1152, height: 896 },  // Divisible by 64
  '3:4':   { width: 896, height: 1152 },
  '3:2':   { width: 1152, height: 768 },
  '2:3':   { width: 768, height: 1152 },
  '21:9':  { width: 1536, height: 640 },  // Divisible by 64
  '9:21':  { width: 640, height: 1536 },
};
```

---

## Sources

- [Runware Models Browser](https://runware.ai/models)
- [Runware Providers Documentation](https://runware.ai/docs/en/providers/)
- [Runware Image Inference API](https://runware.ai/docs/en/image-inference/api-reference)
- [Runware Video Inference API](https://runware.ai/docs/en/video-inference/api-reference)
- [Black Forest Labs Documentation](https://docs.bfl.ai/)
- [Ideogram API Reference](https://developer.ideogram.ai/api-reference/)
