# IMG.LY AI Image Generation for Web

A plugin for integrating AI image generation capabilities into CreativeEditor SDK.

## Overview

The `@imgly/plugin-ai-image-generation-web` package enables users to generate and modify images using AI directly within CreativeEditor SDK. This shipped provider leverages the [fal.ai](https://fal.ai) platform to provide high-quality image generation from text-to-image and image-to-image transformations.

Features include:
- Text-to-image generation
- Image-to-image transformations
- Multiple style options (realistic, illustration, vector)
- Various size presets and custom dimensions
- Automatic history tracking
- Canvas menu quick actions
- Seamless integration with CreativeEditor SDK

## Installation

```bash
npm install @imgly/plugin-ai-image-generation-web
```

## Usage

### Basic Configuration

To use the plugin, import it and configure it with your preferred providers:

#### Single Provider Configuration

```typescript
import CreativeEditorSDK from '@cesdk/cesdk-js';
import ImageGeneration from '@imgly/plugin-ai-image-generation-web';
import FalAiImage from '@imgly/plugin-ai-image-generation-web/fal-ai';
// For OpenAI providers
import OpenAiImage from '@imgly/plugin-ai-image-generation-web/open-ai';
// For Runware providers
import RunwareImage from '@imgly/plugin-ai-image-generation-web/runware';

// Initialize CreativeEditor SDK
CreativeEditorSDK.create(domElement, {
  license: 'your-license-key',
  // Other configuration options...
}).then(async (cesdk) => {
  // Add the image generation plugin with fal.ai providers
  cesdk.addPlugin(
    ImageGeneration({
      // Text-to-image provider
      text2image: FalAiImage.RecraftV3({
        proxyUrl: 'http://your-proxy-server.com/api/proxy',
        headers: {
          'x-custom-header': 'value',
          'x-client-version': '1.0.0'
        }
      }),
      
      // Alternative: Use Recraft20b with icon style support
      // text2image: FalAiImage.Recraft20b({
      //   proxyUrl: 'http://your-proxy-server.com/api/proxy',
      //   headers: {
      //     'x-custom-header': 'value',
      //     'x-client-version': '1.0.0'
      //   }
      // }),
      
      // Image-to-image provider (optional)
      image2image: FalAiImage.GeminiFlashEdit({
        proxyUrl: 'http://your-proxy-server.com/api/proxy',
        headers: {
          'x-custom-header': 'value',
          'x-client-version': '1.0.0'
        }
      }),
      
      // Optional configuration
      debug: false,
      dryRun: false
    })
  );
});
```

#### Multiple Providers Configuration

You can configure multiple providers for each generation type, and users will see a selection box to choose between them:

```typescript
import CreativeEditorSDK from '@cesdk/cesdk-js';
import ImageGeneration from '@imgly/plugin-ai-image-generation-web';
import FalAiImage from '@imgly/plugin-ai-image-generation-web/fal-ai';
import OpenAiImage from '@imgly/plugin-ai-image-generation-web/open-ai';

// Initialize CreativeEditor SDK
CreativeEditorSDK.create(domElement, {
  license: 'your-license-key',
  // Other configuration options...
}).then(async (cesdk) => {
  // Add the image generation plugin with multiple providers
  cesdk.addPlugin(
    ImageGeneration({
      // Multiple text-to-image providers
      text2image: [
        FalAiImage.RecraftV3({
          proxyUrl: 'http://your-proxy-server.com/api/proxy',
          headers: {
            'x-custom-header': 'value',
            'x-client-version': '1.0.0'
          }
        }),
        FalAiImage.NanoBanana({
          proxyUrl: 'http://your-proxy-server.com/api/proxy',
          headers: {
            'x-custom-header': 'value',
            'x-client-version': '1.0.0'
          }
        }),
        FalAiImage.Recraft20b({
          proxyUrl: 'http://your-proxy-server.com/api/proxy',
          headers: {
            'x-custom-header': 'value',
            'x-client-version': '1.0.0'
          }
        }),
        OpenAiImage.GptImage1.Text2Image({
          proxyUrl: 'http://your-proxy-server.com/api/proxy',
          headers: {
            'x-api-key': 'your-key',
            'x-request-source': 'cesdk-plugin'
          }
        })
      ],
      
      // Multiple image-to-image providers (optional)
      image2image: [
        FalAiImage.GeminiFlashEdit({
          proxyUrl: 'http://your-proxy-server.com/api/proxy',
          headers: {
            'x-custom-header': 'value',
            'x-client-version': '1.0.0'
          }
        }),
        FalAiImage.NanoBananaEdit({
          proxyUrl: 'http://your-proxy-server.com/api/proxy',
          headers: {
            'x-custom-header': 'value',
            'x-client-version': '1.0.0'
          }
        }),
        OpenAiImage.GptImage1.Image2Image({
          proxyUrl: 'http://your-proxy-server.com/api/proxy',
          headers: {
            'x-api-key': 'your-key',
            'x-request-source': 'cesdk-plugin'
          }
        })
      ],
      
      // Optional configuration
      debug: false,
      dryRun: false
    })
  );
});
```

### Providers

The plugin comes with pre-configured providers for fal.ai and OpenAI models:

#### 1. RecraftV3 (Text-to-Image)

A versatile text-to-image model from fal.ai that generates images based on text prompts:

```typescript
text2image: FalAiImage.RecraftV3({
  proxyUrl: 'http://your-proxy-server.com/api/proxy',
  headers: {
    'x-custom-header': 'value',
    'x-client-version': '1.0.0'
  },
  // Optional: Configure default property values
  properties: {
    style: { default: 'realistic_image' },  // Default style
    image_size: { default: 'square_hd' }     // Default size
  }
})
```

Key features:
- Multiple style options (realistic, illustration, vector)
- Various image size presets
- Custom dimensions support
- Adjustable quality settings
- Custom headers support for API requests

**Available Property Values:**

```typescript
// image_size options:
'square_hd'      // 1024x1024 (default)
'square'         // 512x512
'portrait_4_3'   // 768x1024
'portrait_16_9'  // 576x1024
'landscape_4_3'  // 1024x768
'landscape_16_9' // 1024x576

// style options (grouped by category):
// Base styles:
'any'                  // Let model decide
'realistic_image'      // Photorealistic (default)
'digital_illustration' // Digital art
'vector_illustration'  // Vector graphics

// Realistic substyles:
'realistic_image/b_and_w'           // Black and white
'realistic_image/hard_flash'        // Hard flash photography
'realistic_image/hdr'               // HDR photography
'realistic_image/natural_light'     // Natural lighting
'realistic_image/studio_portrait'   // Studio portrait
'realistic_image/enterprise'        // Business/corporate
'realistic_image/motion_blur'       // Motion blur effect
'realistic_image/evening_light'     // Evening lighting
'realistic_image/faded_nostalgia'   // Nostalgic/faded look
'realistic_image/forest_life'       // Forest/nature
'realistic_image/mystic_naturalism' // Mystic nature
'realistic_image/natural_tones'     // Natural color tones
'realistic_image/organic_calm'      // Organic/calm aesthetic
'realistic_image/real_life_glow'    // Natural glow
'realistic_image/retro_realism'     // Retro realistic
'realistic_image/retro_snapshot'    // Retro photo
'realistic_image/urban_drama'       // Urban/dramatic
'realistic_image/village_realism'   // Village/rural
'realistic_image/warm_folk'         // Warm/folk style

// Digital illustration substyles:
'digital_illustration/pixel_art'           // Pixel art
'digital_illustration/hand_drawn'          // Hand-drawn
'digital_illustration/grain'               // Grainy texture
'digital_illustration/infantile_sketch'    // Child-like sketch
'digital_illustration/2d_art_poster'       // 2D poster art
'digital_illustration/handmade_3d'         // Handmade 3D look
'digital_illustration/hand_drawn_outline'  // Hand-drawn outline
'digital_illustration/engraving_color'     // Color engraving
'digital_illustration/2d_art_poster_2'     // Alternative poster style
'digital_illustration/antiquarian'         // Antique/vintage
'digital_illustration/bold_fantasy'        // Bold fantasy art
'digital_illustration/child_book'          // Children's book
'digital_illustration/child_books'         // Children's book alt
'digital_illustration/cover'               // Book/album cover
'digital_illustration/crosshatch'          // Crosshatching
'digital_illustration/digital_engraving'   // Digital engraving
'digital_illustration/expressionism'       // Expressionist
// ... and many more digital illustration styles

// Vector illustration substyles:
'vector_illustration/cartoon'              // Cartoon style
'vector_illustration/kawaii'               // Kawaii/cute
'vector_illustration/comic'                // Comic book
'vector_illustration/line_art'             // Line art
'vector_illustration/noir_silhouette'      // Noir silhouette
```

**Configuration Example with All Properties:**

```typescript
text2image: FalAiImage.RecraftV3({
  proxyUrl: 'http://your-proxy-server.com/api/proxy',
  properties: {
    prompt: { default: '' },  // User will fill this
    style: { default: 'realistic_image/natural_light' },
    image_size: { default: 'landscape_16_9' },

    // Dynamic style based on context
    style: {
      default: (context) => {
        const hour = new Date().getHours();
        if (hour < 6 || hour > 18) {
          return 'realistic_image/evening_light';
        }
        return 'realistic_image/natural_light';
      }
    }
  }
})
```

**Style Group Control:**
You can control which style groups (image/vector) are available using the Feature API:

```typescript
// Disable vector styles, only allow image styles
cesdk.feature.enable('ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.style.vector', false);

// Or disable image styles, only allow vector styles
cesdk.feature.enable('ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.style.image', false);
```

**Custom Translations:**
```typescript
cesdk.i18n.setTranslations({
  en: {
    'ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.property.prompt': 'Your image description',
    'ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.property.style': 'Art Style',
    'ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.property.style.realistic_image': 'Photorealistic',
    'ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.property.style.illustration': 'Illustration',
    'ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.property.image_size': 'Canvas Size'
  }
});
```

#### 2. Recraft20b (Text-to-Image)

An enhanced text-to-image model from fal.ai with additional icon style support:

```typescript
text2image: FalAiImage.Recraft20b({
  proxyUrl: 'http://your-proxy-server.com/api/proxy',
  headers: {
    'x-custom-header': 'value',
    'x-client-version': '1.0.0'
  },
  // Optional: Configure default property values
  properties: {
    // Dynamic style defaults based on style type
    style: {
      default: (context) => {
        // Different defaults for different style categories
        // This is handled internally by the provider
        return 'broken_line';  // Default for icon styles
      }
    },
    image_size: { default: 'square_hd' },
    n_colors: { default: 4 }  // Default color count for icon styles
  }
})
```

Key features:
- All RecraftV3 features (realistic, illustration, vector styles)
- **New icon styles**: broken_line, colored_outline, colored_shapes, doodle_fill, and more
- Three-way style selection (image/vector/icon)
- Same image size presets and custom dimensions support
- Cost-effective alternative to RecraftV3

**Available Property Values:**

```typescript
// image_size options (same as RecraftV3):
'square_hd'      // 1024x1024 (default)
'square'         // 512x512
'portrait_4_3'   // 768x1024
'portrait_16_9'  // 576x1024
'landscape_4_3'  // 1024x768
'landscape_16_9' // 1024x576

// style options - includes all RecraftV3 styles PLUS icon styles:
// All RecraftV3 styles are supported (see RecraftV3 above)

// Additional Icon styles (unique to Recraft20b):
'icon/broken_line'            // Broken line icon style
'icon/colored_outline'        // Colored outline icons
'icon/colored_shapes'         // Solid colored shapes
'icon/colored_shapes_gradient' // Gradient colored shapes
'icon/doodle_fill'           // Doodle-filled icons
'icon/doodle_offset_fill'    // Offset doodle fill
'icon/offset_fill'           // Offset fill style
'icon/outline'               // Simple outline
'icon/outline_gradient'      // Gradient outline
'icon/uneven_fill'          // Uneven/artistic fill

// Logo styles:
'logo'                       // Logo design

// n_colors options (for icon styles):
1  // Monochrome
2  // Two colors (default)
3  // Three colors
4  // Four colors
// ... up to any reasonable number
```

**Configuration Example with All Properties:**

```typescript
text2image: FalAiImage.Recraft20b({
  proxyUrl: 'http://your-proxy-server.com/api/proxy',
  properties: {
    prompt: { default: '' },  // User will fill this
    style: { default: 'icon/colored_outline' },  // Default to icon style
    image_size: { default: 'square' },
    n_colors: { default: 3 },  // Number of colors for icon styles

    // Dynamic style based on use case
    style: {
      default: (context) => {
        // You could check block type or other context
        const engine = context.engine;
        // Return appropriate style
        return 'icon/broken_line';
      }
    }
  }
})
```

**Style Group Control:**
You can control which style groups (image/vector/icon) are available using the Feature API:

```typescript
// Only allow icon styles
cesdk.feature.enable('ly.img.plugin-ai-image-generation-web.fal-ai/recraft/v2/text-to-image.style.image', false);
cesdk.feature.enable('ly.img.plugin-ai-image-generation-web.fal-ai/recraft/v2/text-to-image.style.vector', false);

// Only allow image and vector styles (disable icon)
cesdk.feature.enable('ly.img.plugin-ai-image-generation-web.fal-ai/recraft/v2/text-to-image.style.icon', false);
```

Note: When all style groups are disabled, the provider automatically falls back to the 'any' style.

**Custom Translations:**
```typescript
cesdk.i18n.setTranslations({
  en: {
    'ly.img.plugin-ai-image-generation-web.fal-ai/recraft/v2/text-to-image.property.prompt': 'Icon description',
    'ly.img.plugin-ai-image-generation-web.fal-ai/recraft/v2/text-to-image.property.style': 'Icon Style',
    'ly.img.plugin-ai-image-generation-web.fal-ai/recraft/v2/text-to-image.property.style.icon': 'Standard Icon',
    'ly.img.plugin-ai-image-generation-web.fal-ai/recraft/v2/text-to-image.property.style.logo': 'Logo Icon',
    'ly.img.plugin-ai-image-generation-web.fal-ai/recraft/v2/text-to-image.property.n_colors': 'Number of Colors'
  }
});
```
- Custom headers support for API requests

#### 3. GptImage1.Text2Image (Text-to-Image)

OpenAI's GPT-4 Vision based text-to-image model that generates high-quality images:

```typescript
text2image: OpenAiImage.GptImage1.Text2Image({
  proxyUrl: 'http://your-proxy-server.com/api/proxy',
  headers: {
    'x-api-key': 'your-key',
    'x-request-source': 'cesdk-plugin'
  },
  // Optional: Configure default property values
  properties: {
    size: { default: '1024x1024' },  // Options: '1024x1024', '1792x1024', '1024x1792'
    quality: { default: 'standard' }, // Options: 'standard', 'hd'
    style: { default: 'vivid' }      // Options: 'vivid', 'natural'
  }
})
```

Key features:
- High-quality image generation
- Multiple size options (1024×1024, 1536×1024, 1024×1536)
- Background transparency options
- Automatic prompt optimization
- Custom headers support for API requests

#### 4. GeminiFlash25 (Text-to-Image)

A fast and efficient text-to-image model from Google's Gemini Flash 2.5 via fal.ai:

```typescript
text2image: FalAiImage.GeminiFlash25({
  proxyUrl: 'http://your-proxy-server.com/api/proxy',
  headers: {
    'x-custom-header': 'value',
    'x-client-version': '1.0.0'
  },
  // Optional: Configure default property values
  properties: {
    aspect_ratio: { default: '1:1' },  // Options: '1:1', '3:4', '4:3', '9:16', '16:9'
    output_format: { default: 'jpeg' }  // Options: 'jpeg', 'png', 'webp'
  }
})
```

Key features:
- Fast generation times with Google's Gemini Flash 2.5 model
- Multiple aspect ratios: 1:1, 3:4, 4:3, 9:16, 16:9
- Custom dimensions support
- Multiple output formats (JPEG, PNG, WEBP)
- Configurable number of images (1-4)
- Custom headers support for API requests

**Available Property Values:**

```typescript
// aspect_ratio options:
'1:1'   // Square (1024×1024)
'3:4'   // Portrait (768×1024)
'4:3'   // Landscape (1024×768)
'9:16'  // Tall Portrait (576×1024)
'16:9'  // Wide Landscape (1024×576)

// output_format options:
'jpeg'  // JPEG format (default)
'png'   // PNG format
'webp'  // WebP format
```

**Custom Translations:**
```typescript
cesdk.i18n.setTranslations({
  en: {
    'ly.img.plugin-ai-image-generation-web.fal-ai/gemini-flash-2.5.property.prompt': 'Describe your image',
    'ly.img.plugin-ai-image-generation-web.fal-ai/gemini-flash-2.5.property.aspect_ratio': 'Aspect Ratio',
    'ly.img.plugin-ai-image-generation-web.fal-ai/gemini-flash-2.5.property.aspect_ratio.1:1': 'Square (1:1)',
    'ly.img.plugin-ai-image-generation-web.fal-ai/gemini-flash-2.5.property.aspect_ratio.16:9': 'Wide (16:9)'
  }
});
```

#### 5. GeminiFlashEdit (Image-to-Image)

An image modification model from fal.ai that transforms existing images:

```typescript
image2image: FalAiImage.GeminiFlashEdit({
  proxyUrl: 'http://your-proxy-server.com/api/proxy',
  headers: {
    'x-custom-header': 'value',
    'x-client-version': '1.0.0'
  },
  // Optional: Configure default property values
  properties: {
    strength: { default: 0.8 },        // Transformation strength (0.0-1.0)
    guidance_scale: { default: 7.5 },  // Guidance scale (0-20)
    num_inference_steps: { default: 50 }  // Number of inference steps
  }
})
```

Key features:
- Transform existing images with text prompts
- Comprehensive quick actions support: edit image, swap background, style transfer, artist styles, create variants, upscale, outpaint, and combine images
- Maintains original image dimensions
- Includes style presets and artist-specific transformations
- Supports multi-image inputs via combineImages quick action
- Custom headers support for API requests

**Custom Translations:**
```typescript
cesdk.i18n.setTranslations({
  en: {
    'ly.img.plugin-ai-image-generation-web.fal-ai/gemini-flash-edit.property.prompt': 'Transformation instructions',
    'ly.img.plugin-ai-image-generation-web.fal-ai/gemini-flash-edit.property.image_url': 'Source Image'
  }
});
```

#### 5. GptImage1.Image2Image (Image-to-Image)

OpenAI's GPT-4 Vision based image editing model that can transform existing images:

```typescript
image2image: OpenAiImage.GptImage1.Image2Image({
  proxyUrl: 'http://your-proxy-server.com/api/proxy',
  headers: {
    'x-api-key': 'your-key',
    'x-request-source': 'cesdk-plugin'
  }
})
```

Key features:
- Powerful image transformation capabilities
- Supports the same quick actions as GeminiFlashEdit
- Maintains original image dimensions
- Can be used as a direct alternative to GeminiFlashEdit
- Custom headers support for API requests

#### 5. IdeogramV3 (Text-to-Image)

A high-quality text-to-image model from fal.ai featuring advanced generation capabilities:

```typescript
text2image: FalAiImage.IdeogramV3({
  proxyUrl: 'http://your-proxy-server.com/api/proxy',
  headers: {
    'x-custom-header': 'value',
    'x-client-version': '1.0.0'
  },
  // Optional: Configure default property values
  properties: {
    style: { default: 'GENERAL' },    // Options: 'AUTO', 'GENERAL', 'REALISTIC', 'DESIGN'
    image_size: { default: 'square_hd' }, // Same options as Recraft
    seed: { default: 12345 }         // Fixed seed for reproducibility
  }
})
```

Key features:
- Four distinct style modes: AUTO, GENERAL, REALISTIC, and DESIGN
- Multiple image size presets: square HD, square, portrait 4:3/16:9, landscape 4:3/16:9
- Custom dimensions support (64x64 to 14142x14142 pixels)

#### 6. IdeogramV3Remix (Image-to-Image)

A powerful image remixing model from fal.ai that transforms existing images while preserving core elements:

```typescript
image2image: FalAiImage.IdeogramV3Remix({
  proxyUrl: 'http://your-proxy-server.com/api/proxy',
  headers: {
    'x-custom-header': 'value',
    'x-client-version': '1.0.0'
  },
  // Optional: Configure default property values
  properties: {
    style: { default: 'AUTO' },       // Options: 'AUTO', 'GENERAL', 'REALISTIC', 'DESIGN'
    image_size: { default: 'square_hd' },
    remix_strength: { default: 0.7 }  // How much to transform (0.0-1.0)
  }
})
```

Key features:
- **Remix existing images** with text prompts while maintaining core characteristics
- Four distinct style modes: AUTO, GENERAL, REALISTIC, and DESIGN
- Multiple image size presets: square HD, square, portrait 4:3/16:9, landscape 4:3/16:9
- Custom dimensions support (64x64 to 14142x14142 pixels)

#### 7. QwenImageEdit (Image-to-Image)

A powerful image editing model with superior text editing capabilities from fal.ai:

```typescript
image2image: FalAiImage.QwenImageEdit({
  proxyUrl: 'http://your-proxy-server.com/api/proxy',
  headers: {
    'x-custom-header': 'value',
    'x-client-version': '1.0.0'
  },
  // Optional: Configure default property values
  properties: {
    seed: { default: 12345 },         // Fixed seed for reproducibility
    guidance_scale: { default: 7.5 }  // Guidance strength (0-20)
  }
})
```

Key features:
- **Superior text editing capabilities** for image transformation
- Transform existing images with detailed text prompts
- Available through all canvas quick actions (edit, background swap, style transfer, artist styles, variants)
- Maintains original image dimensions
- Custom headers support for API requests
```

#### 8. FluxProKontextEdit (Image-to-Image)

A versatile image editing model that applies stylistic changes and transformations:

```typescript
image2image: FalAiImage.FluxProKontextEdit({
  proxyUrl: 'http://your-proxy-server.com/api/proxy'
})
```

Key features:
- Change existing images with text prompts
- Built-in quick actions for style transfer, artist styles, background swapping, and variants
- Keeps original image dimensions

#### 9. FluxProKontextMaxEdit (Image-to-Image)

A high-quality variant of FluxProKontext offering more detailed results:

```typescript
image2image: FalAiImage.FluxProKontextMaxEdit({
  proxyUrl: 'http://your-proxy-server.com/api/proxy'
})
```

Key features:
- All capabilities of FluxProKontextEdit with enhanced quality
- Style transfer & artist presets
- Maintains original dimensions
- Canvas quick-action integration

#### 9. NanoBanana (Text-to-Image)

A fast and efficient text-to-image model from fal.ai that generates high-quality images:

```typescript
text2image: FalAiImage.NanoBanana({
  proxyUrl: 'http://your-proxy-server.com/api/proxy',
  headers: {
    'x-custom-header': 'value',
    'x-client-version': '1.0.0'
  },
  // Optional: Configure default property values
  properties: {
    output_format: { default: 'PNG' }  // Options: 'PNG', 'JPEG'
  }
})
```

Key features:
- Fast generation times for quick prototyping
- High-quality image output at 1024×1024 resolution
- Simple prompt-based interface
- Support for multiple output formats (JPEG, PNG)
- Configurable number of images (1-4)
- Supports page remixing with custom prompts
- Custom headers support for API requests

**Custom Translations:**
```typescript
cesdk.i18n.setTranslations({
  en: {
    'ly.img.plugin-ai-image-generation-web.fal-ai/nano-banana.property.prompt': 'Describe your image',
    'ly.img.plugin-ai-image-generation-web.fal-ai/nano-banana.property.num_images': 'Number of Images',
    'ly.img.plugin-ai-image-generation-web.fal-ai/nano-banana.property.output_format': 'Output Format'
  }
});
```

#### 10. NanoBananaPro (Text-to-Image)

An enhanced version of NanoBanana from fal.ai with advanced aspect ratio and resolution controls:

```typescript
text2image: FalAiImage.NanoBananaPro({
  proxyUrl: 'http://your-proxy-server.com/api/proxy',
  headers: {
    'x-custom-header': 'value',
    'x-client-version': '1.0.0'
  },
  // Optional: Configure default property values
  properties: {
    aspect_ratio: { default: '1:1' },  // Options: '1:1', '3:2', '2:3', '4:3', '3:4', '16:9', '9:16', '21:9', '9:21', '2.4:1'
    resolution: { default: '1K' },     // Options: '1K', '2K', '4K'
    output_format: { default: 'png' }     // Options: 'png', 'jpeg', 'webp'
  }
})
```

Key features:
- Fast generation times for quick prototyping
- 10 different aspect ratio options (square, portrait, landscape, ultra-wide, cinematic)
- 3 resolution multipliers (1K, 2K, 4K) for scalable image quality
- High-quality image output with flexible dimensions
- Simple prompt-based interface
- Support for multiple output formats (JPEG, PNG)
- Configurable number of images (1-4)
- Supports page remixing with custom prompts
- Custom headers support for API requests

**Custom Translations:**
```typescript
cesdk.i18n.setTranslations({
  en: {
    'ly.img.plugin-ai-image-generation-web.fal-ai/nano-banana-pro.property.prompt': 'Describe your image',
    'ly.img.plugin-ai-image-generation-web.fal-ai/nano-banana-pro.property.aspect_ratio': 'Aspect Ratio',
    'ly.img.plugin-ai-image-generation-web.fal-ai/nano-banana-pro.property.resolution': 'Resolution',
    'ly.img.plugin-ai-image-generation-web.fal-ai/nano-banana-pro.property.output_format': 'Output Format'
  }
});
```

#### 11. SeedreamV4 (Text-to-Image)

A powerful text-to-image model from ByteDance's Seedream 4.0 available through fal.ai:

```typescript
text2image: FalAiImage.SeedreamV4({
  proxyUrl: 'http://your-proxy-server.com/api/proxy',
  headers: {
    'x-custom-header': 'value',
    'x-client-version': '1.0.0'
  },
  // Optional: Configure default property values
  properties: {
    image_size: { default: 'square_hd' }  // Options: square_hd, square, portrait/landscape variants
  }
})
```

Key features:
- High-quality image generation with ByteDance's Seedream 4.0 model
- Multiple image size presets: square HD (2048×2048), square (1024×1024), portrait 4:3/16:9, landscape 4:3/16:9
- Custom dimensions support (1024-4096 pixels)
- Fast generation times
- Safety checker enabled by default

#### 11. SeedreamV4Edit (Image-to-Image)

An advanced image editing model from ByteDance's Seedream 4.0 for transforming existing images:

```typescript
image2image: FalAiImage.SeedreamV4Edit({
  proxyUrl: 'http://your-proxy-server.com/api/proxy',
  headers: {
    'x-custom-header': 'value',
    'x-client-version': '1.0.0'
  }
})
```

Key features:
- Unified architecture for both generation and editing
- Supports multiple input images (up to 10)
- Full canvas quick actions support: edit image, swap background, style transfer, artist styles, create variants, combine images, remix page
- Maintains original image dimensions
- Custom headers support for API requests

#### 12. NanoBananaEdit (Image-to-Image)

An image editing model from fal.ai that transforms existing images using text prompts:

```typescript
image2image: FalAiImage.NanoBananaEdit({
  proxyUrl: 'http://your-proxy-server.com/api/proxy',
  headers: {
    'x-custom-header': 'value',
    'x-client-version': '1.0.0'
  },
  // Optional: Configure default property values
  properties: {
    strength: { default: 0.7 },        // Edit strength (0.0-1.0)
    output_format: { default: 'PNG' }  // Options: 'PNG', 'JPEG'
  }
})
```

Key features:
- Edit existing images with text prompts
- Supports combining multiple images (up to 10 images)
- Maintains original image dimensions automatically
- Supports all standard image editing quick actions
- Fast processing times
- Canvas quick-action integration
- Custom headers support for API requests

**Custom Translations:**
```typescript
cesdk.i18n.setTranslations({
  en: {
    'ly.img.plugin-ai-image-generation-web.fal-ai/nano-banana/edit.property.prompt': 'Edit instructions',
    'ly.img.plugin-ai-image-generation-web.fal-ai/nano-banana/edit.property.image_url': 'Source Image'
  }
});
```

#### 13. NanoBananaProEdit (Image-to-Image)

An enhanced image editing model from fal.ai (Pro version of Nano Banana) that transforms existing images using text prompts:

```typescript
image2image: FalAiImage.NanoBananaProEdit({
  proxyUrl: 'http://your-proxy-server.com/api/proxy',
  headers: {
    'x-custom-header': 'value',
    'x-client-version': '1.0.0'
  },
  // Optional: Configure default property values
  properties: {
    num_images: { default: 1 },           // Number of images (1-4)
    aspect_ratio: { default: 'auto' },    // Aspect ratio (auto, 21:9, 16:9, 3:2, 4:3, 5:4, 1:1, 4:5, 3:4, 2:3, 9:16)
    resolution: { default: '1K' },        // Resolution (1K, 2K, 4K)
    output_format: { default: 'png' }     // Options: 'png', 'jpeg', 'webp'
  }
})
```

Key features:
- Professional-grade image editing with text prompts
- Supports combining multiple images (up to 10 images)
- Maintains original image dimensions automatically
- Multiple aspect ratio and resolution options
- Supports all standard image editing quick actions
- Fast processing with optimized quality
- Canvas quick-action integration
- Custom headers support for API requests

**Custom Translations:**
```typescript
cesdk.i18n.setTranslations({
  en: {
    'ly.img.plugin-ai-image-generation-web.fal-ai/nano-banana-pro/edit.property.prompt': 'Edit instructions',
    'ly.img.plugin-ai-image-generation-web.fal-ai/nano-banana-pro/edit.property.image_url': 'Source Image'
  }
});
```

### Runware Providers

Runware provides access to multiple AI models through a unified API. These providers require a Runware proxy URL for authentication.

#### 14. Flux2Dev (Text-to-Image & Image-to-Image)

Black Forest Labs' FLUX.2 [dev] model with full architectural control:

```typescript
// Text-to-Image
text2image: RunwareImage.Flux2Dev.Text2Image({
    proxyUrl: 'http://your-runware-proxy.com/api/proxy'
})

// Image-to-Image
image2image: RunwareImage.Flux2Dev.Image2Image({
    proxyUrl: 'http://your-runware-proxy.com/api/proxy'
})
```

Key features:
- Open weights release with full architectural control
- Flexible sampling behavior and guidance strategies
- Resolution: 512-2048 pixels (multiples of 16)
- Up to 4 reference images for I2I
- Aspect ratios: 1:1, 16:9, 9:16, 4:3, 3:4

#### 15. Flux2Pro (Text-to-Image & Image-to-Image)

Black Forest Labs' FLUX.2 [pro] model with enhanced capabilities:

```typescript
// Text-to-Image
text2image: RunwareImage.Flux2Pro.Text2Image({
    proxyUrl: 'http://your-runware-proxy.com/api/proxy'
})

// Image-to-Image
image2image: RunwareImage.Flux2Pro.Image2Image({
    proxyUrl: 'http://your-runware-proxy.com/api/proxy'
})
```

Key features:
- Professional-grade image generation
- Resolution: 256-1920 pixels (multiples of 16)
- Up to 9 reference images for I2I
- Enhanced quality and detail
- Aspect ratios: 1:1, 16:9, 9:16, 4:3, 3:4

#### 16. Flux2Flex (Text-to-Image & Image-to-Image)

Black Forest Labs' FLUX.2 [flex] model optimized for flexibility:

```typescript
// Text-to-Image
text2image: RunwareImage.Flux2Flex.Text2Image({
    proxyUrl: 'http://your-runware-proxy.com/api/proxy'
})

// Image-to-Image
image2image: RunwareImage.Flux2Flex.Image2Image({
    proxyUrl: 'http://your-runware-proxy.com/api/proxy'
})
```

Key features:
- Flexible generation with fast inference
- Resolution: 256-1920 pixels (multiples of 16)
- Up to 10 reference images for I2I
- Aspect ratios: 1:1, 16:9, 9:16, 4:3, 3:4

#### 17. Seedream4 (Text-to-Image & Image-to-Image)

ByteDance's Seedream 4.0 model for high-quality generation:

```typescript
// Text-to-Image
text2image: RunwareImage.Seedream4.Text2Image({
    proxyUrl: 'http://your-runware-proxy.com/api/proxy'
})

// Image-to-Image
image2image: RunwareImage.Seedream4.Image2Image({
    proxyUrl: 'http://your-runware-proxy.com/api/proxy'
})
```

Key features:
- ByteDance's latest generation model
- High-quality photorealistic output
- Up to 14 reference images for I2I with character/subject consistency
- Aspect ratios: 1:1, 16:9, 9:16, 4:3, 3:4

#### 18. NanoBanana2Pro (Text-to-Image & Image-to-Image)

Google's Gemini 3 Pro based model for fast, high-quality generation:

```typescript
// Text-to-Image
text2image: RunwareImage.NanoBanana2Pro.Text2Image({
    proxyUrl: 'http://your-runware-proxy.com/api/proxy'
})

// Image-to-Image
image2image: RunwareImage.NanoBanana2Pro.Image2Image({
    proxyUrl: 'http://your-runware-proxy.com/api/proxy'
})
```

Key features:
- Powered by Gemini 3 Pro
- Fast generation with high quality
- Up to 14 reference images for style/lighting transfer
- Aspect ratios: 1:1, 16:9, 9:16, 4:3, 3:4

#### 19. GptImage1 (Text-to-Image & Image-to-Image) via Runware

OpenAI's GPT Image 1 model accessed through Runware:

```typescript
// Text-to-Image
text2image: RunwareImage.GptImage1.Text2Image({
    proxyUrl: 'http://your-runware-proxy.com/api/proxy'
})

// Image-to-Image
image2image: RunwareImage.GptImage1.Image2Image({
    proxyUrl: 'http://your-runware-proxy.com/api/proxy'
})
```

Key features:
- OpenAI's latest image generation model
- High-quality image generation and editing
- Fixed resolutions: 1024×1024, 1536×1024, 1024×1536
- Instruction-based editing for I2I

#### 20. Seedream45 (Text-to-Image & Image-to-Image) via Runware

ByteDance's Seedream 4.5 model with improved facial detail and text generation:

```typescript
// Text-to-Image
text2image: RunwareImage.Seedream45.Text2Image({
    proxyUrl: 'http://your-runware-proxy.com/api/proxy'
})

// Image-to-Image
image2image: RunwareImage.Seedream45.Image2Image({
    proxyUrl: 'http://your-runware-proxy.com/api/proxy'
})
```

Key features:
- Improved facial detail rendering over Seedream 4.0
- Enhanced text generation quality
- Multi-image fusion capabilities
- 2K resolution output (minimum 3.7M pixels)
- Aspect ratios: 1:1, 16:9, 9:16, 4:3, 3:4
- Up to 14 reference images for I2I

#### 21. GptImage1Mini (Text-to-Image & Image-to-Image) via Runware

OpenAI's cost-efficient GPT Image 1 Mini model accessed through Runware:

```typescript
// Text-to-Image
text2image: RunwareImage.GptImage1Mini.Text2Image({
    proxyUrl: 'http://your-runware-proxy.com/api/proxy'
})

// Image-to-Image
image2image: RunwareImage.GptImage1Mini.Image2Image({
    proxyUrl: 'http://your-runware-proxy.com/api/proxy'
})
```

Key features:
- ~80% cost savings compared to GPT Image 1
- Fast generation times
- Same capabilities as GPT Image 1
- Fixed resolutions: 1024×1024, 1536×1024, 1024×1536
- Instruction-based editing for I2I

### EachLabs Providers

EachLabs provides access to multiple AI models through a unified API. These providers require an EachLabs proxy URL for authentication.

```typescript
import EachLabsImage from '@imgly/plugin-ai-image-generation-web/eachlabs';
```

#### 22. NanoBananaPro (Text-to-Image) via EachLabs

Nano Banana Pro multi-style image generation via EachLabs:

```typescript
text2image: EachLabsImage.NanoBananaPro.Text2Image({
    proxyUrl: 'http://your-eachlabs-proxy.com/api/proxy'
})
```

Key features:
- Multi-style image generation
- 10 aspect ratio options (1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3, 21:9, 9:21, 2.4:1)
- Multiple resolution options (1K, 2K, 4K)
- High-quality output

#### 23. NanoBananaPro Edit (Image-to-Image) via EachLabs

Nano Banana Pro image transformation via EachLabs:

```typescript
image2image: EachLabsImage.NanoBananaPro.Image2Image({
    proxyUrl: 'http://your-eachlabs-proxy.com/api/proxy'
})
```

Key features:
- Multi-style image transformation
- Multiple resolution options (1K, 2K, 4K)
- Supports up to 10 reference images
- Full canvas quick actions support: edit image, swap background, style transfer, artist styles, create variants, combine images, remix page

#### 24. Flux2Pro (Text-to-Image) via EachLabs

Black Forest Labs' Flux 2 Pro high-quality text-to-image generation via EachLabs:

```typescript
text2image: EachLabsImage.Flux2Pro.Text2Image({
    proxyUrl: 'http://your-eachlabs-proxy.com/api/proxy'
})
```

Key features:
- High-quality image generation from Black Forest Labs
- 6 image size options (square HD, square, portrait 4:3/16:9, landscape 4:3/16:9)
- Professional-grade output quality

#### 25. Flux2Pro Edit (Image-to-Image) via EachLabs

Black Forest Labs' Flux 2 Pro image transformation via EachLabs:

```typescript
image2image: EachLabsImage.Flux2Pro.Image2Image({
    proxyUrl: 'http://your-eachlabs-proxy.com/api/proxy'
})
```

Key features:
- High-quality image transformation
- Supports up to 4 reference images
- Full canvas quick actions support: edit image, swap background, style transfer, artist styles, create variants, combine images, remix page

#### 26. Flux2 (Text-to-Image) via EachLabs

Black Forest Labs' Flux 2 standard text-to-image generation via EachLabs:

```typescript
text2image: EachLabsImage.Flux2.Text2Image({
    proxyUrl: 'http://your-eachlabs-proxy.com/api/proxy'
})
```

Key features:
- Standard Flux 2 image generation from Black Forest Labs
- 6 image size options (square HD, square, portrait 4:3/16:9, landscape 4:3/16:9)
- Good quality output with faster generation

#### 27. Flux2 Edit (Image-to-Image) via EachLabs

Black Forest Labs' Flux 2 image transformation via EachLabs:

```typescript
image2image: EachLabsImage.Flux2.Image2Image({
    proxyUrl: 'http://your-eachlabs-proxy.com/api/proxy'
})
```

Key features:
- Standard Flux 2 image transformation
- Supports up to 3 reference images
- Full canvas quick actions support: edit image, swap background, style transfer, artist styles, create variants, combine images, remix page

#### 28. Flux2Flex (Text-to-Image) via EachLabs

Black Forest Labs' Flux 2 Flex text-to-image generation with automatic prompt expansion via EachLabs:

```typescript
text2image: EachLabsImage.Flux2Flex.Text2Image({
    proxyUrl: 'http://your-eachlabs-proxy.com/api/proxy'
})
```

Key features:
- Automatic prompt expansion using the model's knowledge
- 6 image size options (square HD, square, portrait 4:3/16:9, landscape 4:3/16:9)
- High-quality Flux 2 generation from Black Forest Labs

#### 29. Flux2Flex Edit (Image-to-Image) via EachLabs

Black Forest Labs' Flux 2 Flex image transformation with automatic prompt expansion via EachLabs:

```typescript
image2image: EachLabsImage.Flux2Flex.Image2Image({
    proxyUrl: 'http://your-eachlabs-proxy.com/api/proxy'
})
```

Key features:
- Automatic prompt expansion using the model's knowledge
- Automatic image size detection ("auto" mode)
- Supports up to 10 reference images
- Full canvas quick actions support: edit image, swap background, style transfer, artist styles, create variants, combine images, remix page

#### 30. OpenAI GPT Image (Text-to-Image) via EachLabs

OpenAI's GPT Image text-to-image generation via EachLabs:

```typescript
text2image: EachLabsImage.OpenAIGptImage.Text2Image({
    proxyUrl: 'http://your-eachlabs-proxy.com/api/proxy'
})
```

Key features:
- High-quality image generation from OpenAI
- 3 image size options (Square, Landscape, Portrait)
- Professional-grade output quality

#### 31. OpenAI GPT Image Edit (Image-to-Image) via EachLabs

OpenAI's GPT Image image transformation via EachLabs:

```typescript
image2image: EachLabsImage.OpenAIGptImage.Image2Image({
    proxyUrl: 'http://your-eachlabs-proxy.com/api/proxy'
})
```

Key features:
- High-quality image transformation
- Supports up to 16 reference images
- Full canvas quick actions support: edit image, swap background, style transfer, artist styles, create variants, combine images, remix page

#### 32. Seedream v4.5 (Text-to-Image) via EachLabs

ByteDance's Seedream v4.5 text-to-image generation via EachLabs:

```typescript
text2image: EachLabsImage.Seedream45.Text2Image({
    proxyUrl: 'http://your-eachlabs-proxy.com/api/proxy'
})
```

Key features:
- High-quality image generation from ByteDance
- 6 image size options (square HD, square, portrait 4:3/16:9, landscape 4:3/16:9)
- Improved facial details and text generation over v4.0

#### 33. Seedream v4.5 Edit (Image-to-Image) via EachLabs

ByteDance's Seedream v4.5 image transformation via EachLabs:

```typescript
image2image: EachLabsImage.Seedream45.Image2Image({
    proxyUrl: 'http://your-eachlabs-proxy.com/api/proxy'
})
```

Key features:
- High-quality image transformation
- Supports up to 10 reference images
- Full canvas quick actions support: edit image, swap background, style transfer, artist styles, create variants, combine images, remix page
- Improved facial details and text generation over v4.0

#### 34. Gemini 3 Pro Image (Text-to-Image) via EachLabs

Google's Gemini 3 Pro text-to-image generation via EachLabs:

```typescript
text2image: EachLabsImage.Gemini3Pro.Text2Image({
    proxyUrl: 'http://your-eachlabs-proxy.com/api/proxy'
})
```

Key features:
- High-quality image generation from Google Gemini
- 8 aspect ratio options (1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3, 21:9)
- Multiple resolution options (1K, 2K, 4K)
- Professional-grade output quality

#### 35. Gemini 3 Pro Image Edit (Image-to-Image) via EachLabs

Google's Gemini 3 Pro image transformation via EachLabs:

```typescript
image2image: EachLabsImage.Gemini3Pro.Image2Image({
    proxyUrl: 'http://your-eachlabs-proxy.com/api/proxy'
})
```

Key features:
- High-quality image transformation
- Supports up to 10 reference images
- Full canvas quick actions support: edit image, swap background, style transfer, artist styles, create variants, combine images, remix page

### Customizing Labels and Translations

You can customize all labels and text in the AI image generation interface using the translation system. This allows you to provide better labels for your users in any language.

#### Translation Key Structure

The system checks for translations in this order (highest to lowest priority):

1. **Provider-specific**: `ly.img.plugin-ai-image-generation-web.${provider}.property.${field}` - Override labels for a specific AI provider
2. **Generic**: `ly.img.plugin-ai-generation-web.property.${field}` - Override labels for all AI plugins

#### Basic Example

```typescript
// Customize labels for your AI image generation interface
cesdk.i18n.setTranslations({
  en: {
    // Generic labels (applies to ALL AI plugins)
    'ly.img.plugin-ai-generation-web.property.prompt': 'Describe what you want to create',
    'ly.img.plugin-ai-generation-web.property.image_size': 'Image Dimensions',

    // Provider-specific for RecraftV3
    'ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.property.prompt': 'Describe your Recraft image',
    'ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.property.image_size': 'Canvas Size',
    'ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.property.image_size.square_hd': 'Square HD (1024×1024)',
    'ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.property.image_size.portrait_4_3': 'Portrait 4:3 (768×1024)',

    // Provider-specific for IdeogramV3
    'ly.img.plugin-ai-image-generation-web.fal-ai/ideogram/v3.property.prompt': 'Describe your Ideogram image',
    'ly.img.plugin-ai-image-generation-web.fal-ai/ideogram/v3.property.style_mode': 'Style Mode',
    'ly.img.plugin-ai-image-generation-web.fal-ai/ideogram/v3.property.style_mode.REALISTIC': 'Photorealistic'
  }
});
```

#### QuickAction Translations

QuickActions (like "Edit Image", "Style Transfer", etc.) use their own translation keys with provider-specific overrides:

```typescript
cesdk.i18n.setTranslations({
  en: {
    // Provider-specific translations (highest priority)
    'ly.img.plugin-ai-image-generation-web.fal-ai/gemini-flash-edit.quickAction.editImage': 'Edit with Gemini',
    'ly.img.plugin-ai-image-generation-web.fal-ai/flux-pro/kontext.quickAction.styleTransfer': 'Style with Flux Pro Kontext',
    'ly.img.plugin-ai-image-generation-web.open-ai/gpt-image-1/image2image.quickAction.editImage': 'Edit with GPT',

    // Generic plugin translations
    'ly.img.plugin-ai-image-generation-web.quickAction.editImage': 'Edit Image...',
    'ly.img.plugin-ai-image-generation-web.quickAction.swapBackground': 'Swap Background...',
    'ly.img.plugin-ai-image-generation-web.quickAction.styleTransfer': 'Style Transfer...',
    'ly.img.plugin-ai-image-generation-web.quickAction.createVariant': 'Create Variant...',
    'ly.img.plugin-ai-image-generation-web.quickAction.artistTransfer': 'Painted By...',
    
    // QuickAction input fields and buttons
    'ly.img.plugin-ai-image-generation-web.quickAction.editImage.prompt': 'Edit Image...',
    'ly.img.plugin-ai-image-generation-web.quickAction.editImage.prompt.placeholder': 'e.g. "Add a sunset"',
    'ly.img.plugin-ai-image-generation-web.quickAction.editImage.apply': 'Change',
    'ly.img.plugin-ai-image-generation-web.quickAction.swapBackground.prompt': 'Swap Background...',
    'ly.img.plugin-ai-image-generation-web.quickAction.swapBackground.prompt.placeholder': 'e.g. "Beach at sunset"',
    'ly.img.plugin-ai-image-generation-web.quickAction.swapBackground.apply': 'Swap'
  }
});
```

**QuickAction Translation Priority:**
1. Provider-specific: `ly.img.plugin-ai-image-generation-web.${provider}.quickAction.${action}.${field}`
2. Generic plugin: `ly.img.plugin-ai-image-generation-web.quickAction.${action}.${field}`

**Translation Structure:**
- Base key (e.g., `.quickAction.editImage`): Button text when QuickAction is collapsed
- `.prompt`: Label for input field when expanded
- `.prompt.placeholder`: Placeholder text for input field
- `.apply`: Text for action/submit button

#### QuickAction Dropdown Options

Some QuickActions like Artist Transfer and Style Transfer include dropdown menus with predefined options. You can customize these dropdown labels using provider-specific translation keys:

```typescript
cesdk.i18n.setTranslations({
  en: {
    // Artist Transfer dropdown options (provider-specific)
    'ly.img.plugin-ai-image-generation-web.quickAction.artistTransfer.fal-ai/gemini-flash-edit.property.artist.van-gogh': 'Van Gogh',
    'ly.img.plugin-ai-image-generation-web.quickAction.artistTransfer.fal-ai/gemini-flash-edit.property.artist.monet': 'Monet',
    'ly.img.plugin-ai-image-generation-web.quickAction.artistTransfer.fal-ai/gemini-flash-edit.property.artist.picasso': 'Picasso',
    'ly.img.plugin-ai-image-generation-web.quickAction.artistTransfer.fal-ai/gemini-flash-edit.property.artist.dali': 'Dalí',
    'ly.img.plugin-ai-image-generation-web.quickAction.artistTransfer.fal-ai/gemini-flash-edit.property.artist.matisse': 'Matisse',
    'ly.img.plugin-ai-image-generation-web.quickAction.artistTransfer.fal-ai/gemini-flash-edit.property.artist.warhol': 'Warhol',
    'ly.img.plugin-ai-image-generation-web.quickAction.artistTransfer.fal-ai/gemini-flash-edit.property.artist.michelangelo': 'Michelangelo',
    'ly.img.plugin-ai-image-generation-web.quickAction.artistTransfer.fal-ai/gemini-flash-edit.property.artist.da-vinci': 'Da Vinci',
    'ly.img.plugin-ai-image-generation-web.quickAction.artistTransfer.fal-ai/gemini-flash-edit.property.artist.rembrandt': 'Rembrandt',
    'ly.img.plugin-ai-image-generation-web.quickAction.artistTransfer.fal-ai/gemini-flash-edit.property.artist.mondrian': 'Mondrian',
    'ly.img.plugin-ai-image-generation-web.quickAction.artistTransfer.fal-ai/gemini-flash-edit.property.artist.kahlo': 'Frida Kahlo',
    'ly.img.plugin-ai-image-generation-web.quickAction.artistTransfer.fal-ai/gemini-flash-edit.property.artist.hokusai': 'Hokusai',
    
    // Style Transfer dropdown options (provider-specific)  
    'ly.img.plugin-ai-image-generation-web.quickAction.styleTransfer.fal-ai/gemini-flash-edit.property.style.water': 'Watercolor Painting',
    'ly.img.plugin-ai-image-generation-web.quickAction.styleTransfer.fal-ai/gemini-flash-edit.property.style.oil': 'Oil Painting',
    'ly.img.plugin-ai-image-generation-web.quickAction.styleTransfer.fal-ai/gemini-flash-edit.property.style.charcoal': 'Charcoal Sketch',
    'ly.img.plugin-ai-image-generation-web.quickAction.styleTransfer.fal-ai/gemini-flash-edit.property.style.pencil': 'Pencil Drawing',
    'ly.img.plugin-ai-image-generation-web.quickAction.styleTransfer.fal-ai/gemini-flash-edit.property.style.pastel': 'Pastel Artwork',
    'ly.img.plugin-ai-image-generation-web.quickAction.styleTransfer.fal-ai/gemini-flash-edit.property.style.ink': 'Ink Wash',
    'ly.img.plugin-ai-image-generation-web.quickAction.styleTransfer.fal-ai/gemini-flash-edit.property.style.stained-glass': 'Stained Glass Window',
    'ly.img.plugin-ai-image-generation-web.quickAction.styleTransfer.fal-ai/gemini-flash-edit.property.style.japanese': 'Japanese Woodblock Print',
    
    // Generic fallback options (applies to all providers)
    'ly.img.plugin-ai-image-generation-web.quickAction.artistTransfer.property.artist.van-gogh': 'Van Gogh',
    'ly.img.plugin-ai-image-generation-web.quickAction.styleTransfer.property.style.water': 'Watercolor Painting'
  }
});
```

The system checks for translations in this order (highest to lowest priority):

1. **Provider-specific**: `ly.img.plugin-ai-image-generation-web.quickAction.${actionName}.${providerId}.property.${field}.${option}` - Override labels for a specific AI provider
2. **Generic**: `ly.img.plugin-ai-image-generation-web.quickAction.${actionName}.property.${field}.${option}` - Override labels for all AI plugins  

### Configuration Options

The plugin accepts the following configuration options:

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `text2image` | Provider \| Provider[] | Provider(s) for text-to-image generation. When multiple providers are provided, users can select between them | undefined |
| `image2image` | Provider \| Provider[] | Provider(s) for image-to-image transformation. When multiple providers are provided, users can select between them | undefined |
| `debug` | boolean | Enable debug logging | false |
| `dryRun` | boolean | Simulate generation without API calls | false |
| `middleware` | Function[] | Array of middleware functions to extend the generation process | undefined |

### Middleware Configuration

The `middleware` option allows you to add pre-processing and post-processing capabilities to the generation process:

```typescript
import ImageGeneration from '@imgly/plugin-ai-image-generation-web';
import FalAiImage from '@imgly/plugin-ai-image-generation-web/fal-ai';
import { loggingMiddleware, rateLimitMiddleware } from '@imgly/plugin-ai-generation-web';

// Create middleware functions
const logging = loggingMiddleware();
const rateLimit = rateLimitMiddleware({
  maxRequests: 10,
  timeWindowMs: 60000, // 1 minute
  onRateLimitExceeded: (input, options, info) => {
    console.log(`Rate limit exceeded: ${info.currentCount}/${info.maxRequests}`);
    return false; // Reject request
  }
});

// Apply middleware to plugin
cesdk.addPlugin(
  ImageGeneration({
    text2image: FalAiImage.RecraftV3({
      proxyUrl: 'http://your-proxy-server.com/api/proxy'
    }),
    // Or use: FalAiImage.Recraft20b({ proxyUrl: 'http://your-proxy-server.com/api/proxy' }),
    middleware: [logging, rateLimit] // Apply middleware in order
  })
);
```

Built-in middleware options:

- **loggingMiddleware**: Logs generation requests and responses
- **rateLimitMiddleware**: Limits the number of generation requests in a time window

#### Creating Custom Middleware

Custom middleware functions follow this pattern:

```typescript
const customMiddleware = async (input, options, next) => {
  // Pre-processing logic
  console.log('Before generation:', input);

  // Add custom fields or modify the input if needed
  const modifiedInput = {
    ...input,
    customField: 'custom value'
  };

  // Call the next middleware or generation function
  const result = await next(modifiedInput, options);

  // Post-processing logic
  console.log('After generation:', result);

  // You can also modify the result before returning it
  return result;
};
```

#### Preventing Default Feedback

Middleware can suppress default UI feedback behaviors using `options.preventDefault()`:

```typescript
const customErrorMiddleware = async (input, options, next) => {
  try {
    return await next(input, options);
  } catch (error) {
    // Prevent default error notification and block error state
    options.preventDefault();

    // When preventDefault() is called, you need to handle the block state yourself.
    // Here we set the error state to mimic the default behavior:
    options.blockIds?.forEach(blockId => {
      if (options.engine.block.isValid(blockId)) {
        options.engine.block.setState(blockId, { type: 'Error', error: 'Unknown' });
      }
    });
    // Alternative: Delete the placeholder block instead
    // options.blockIds?.forEach(blockId => {
    //   if (options.engine.block.isValid(blockId)) {
    //     options.engine.block.destroy(blockId);
    //   }
    // });

    // Show custom error notification
    options.cesdk?.ui.showNotification({
      type: 'error',
      message: `Custom error: ${error.message}`,
      action: {
        label: 'Contact Support',
        onClick: () => window.open('mailto:support@example.com')
      }
    });

    throw error;
  }
};
```

**What gets prevented:**
- Error/success notifications
- Block error state
- Console error logging

**What is NOT prevented:**
- Pending → Ready transition (loading spinner always stops)

For more details, see the [@imgly/plugin-ai-generation-web documentation](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-generation-web#preventing-default-feedback).

The middleware function signature is:

```typescript
type Middleware<I, O extends Output> = (
  input: I,
  options: GenerationOptions & {
    // The block IDs the generation is applied on
    blockIds?: number[] | null;
    
    // Function to add a cleanup handler
    addDisposer: (dispose: () => Promise<void>) => void;
  },
  next: (input: I, options: GenerationOptions) => Promise<GenerationResult<O>>
) => Promise<GenerationResult<O>>;
```

Middleware functions are applied in order, creating a chain of processing steps. The `next` parameter calls the next middleware in the chain or the generation function itself.

### Using a Proxy

For security reasons, it's recommended to use a proxy server to handle API requests to fal.ai. The proxy URL is required when configuring providers:

```typescript
text2image: FalAiImage.RecraftV3({
  proxyUrl: 'http://your-proxy-server.com/api/proxy',
  headers: {
    'x-custom-header': 'value',
    'x-client-version': '1.0.0'
  }
})

// Or use Recraft20b with icon style support:
// text2image: FalAiImage.Recraft20b({
//   proxyUrl: 'http://your-proxy-server.com/api/proxy',
//   headers: {
//     'x-custom-header': 'value',
//     'x-client-version': '1.0.0'
//   }
// })
```

The `headers` option allows you to include custom HTTP headers in all API requests. This is useful for:
- Adding custom client identification headers
- Including version information
- Passing through metadata required by your API
- Adding correlation IDs for request tracing

You'll need to implement a proxy server that forwards requests to fal.ai and handles authentication.

## API Reference

### Main Plugin

```typescript
ImageGeneration(options: PluginConfiguration): EditorPlugin
```

Creates and returns a plugin that can be added to CreativeEditor SDK.

### Plugin Configuration

```typescript
interface PluginConfiguration {
  // Provider(s) for text-to-image generation
  text2image?: AiImageProvider | AiImageProvider[];
  
  // Provider(s) for image-to-image generation
  image2image?: AiImageProvider | AiImageProvider[];
  
  // Enable debug logging
  debug?: boolean;
  
  // Skip actual API calls for testing
  dryRun?: boolean;
  
  // Extend the generation process
  middleware?: GenerationMiddleware;
}
```

### Fal.ai Providers

#### RecraftV3

```typescript
FalAiImage.RecraftV3(config: {
  proxyUrl: string;
  headers?: Record<string, string>;
  debug?: boolean;
})
```

#### Recraft20b

```typescript
FalAiImage.Recraft20b(config: {
  proxyUrl: string;
  headers?: Record<string, string>;
  debug?: boolean;
})
```

#### IdeogramV3

```typescript
FalAiImage.IdeogramV3(config: {
  proxyUrl: string;
  headers?: Record<string, string>;
  debug?: boolean;
})
```

#### IdeogramV3Remix

```typescript
FalAiImage.IdeogramV3Remix(config: {
  proxyUrl: string;
  headers?: Record<string, string>;
  debug?: boolean;
})
```

#### GeminiFlash25

```typescript
FalAiImage.GeminiFlash25(config: {
  proxyUrl: string;
  headers?: Record<string, string>;
  debug?: boolean;
})
```

#### GeminiFlashEdit

```typescript
FalAiImage.GeminiFlashEdit(config: {
  proxyUrl: string;
  headers?: Record<string, string>;
  debug?: boolean;
})
```

#### Gemini25FlashImageEdit

```typescript
FalAiImage.Gemini25FlashImageEdit(config: {
  proxyUrl: string;
  headers?: Record<string, string>;
  debug?: boolean;
})
```

#### QwenImageEdit

```typescript
FalAiImage.QwenImageEdit(config: {
  proxyUrl: string;
  headers?: Record<string, string>;
  debug?: boolean;
})
```

### OpenAI Providers

#### GptImage1.Text2Image

```typescript
OpenAiImage.GptImage1.Text2Image(config: {
  proxyUrl: string;
  headers?: Record<string, string>;
  debug?: boolean;
})
```

#### GptImage1.Image2Image

```typescript
OpenAiImage.GptImage1.Image2Image(config: {
  proxyUrl: string;
  headers?: Record<string, string>;
  debug?: boolean;
})
```

#### FluxProKontextEdit

```typescript
FalAiImage.FluxProKontextEdit(config: {
  proxyUrl: string;
  debug?: boolean;
})
```

#### FluxProKontextMaxEdit

```typescript
FalAiImage.FluxProKontextMaxEdit(config: {
  proxyUrl: string;
  debug?: boolean;
})
```

#### NanoBanana

```typescript
FalAiImage.NanoBanana(config: {
  proxyUrl: string;
  headers?: Record<string, string>;
  debug?: boolean;
})
```

#### NanoBananaPro

```typescript
FalAiImage.NanoBananaPro(config: {
  proxyUrl: string;
  headers?: Record<string, string>;
  debug?: boolean;
})
```

#### NanoBananaEdit

```typescript
FalAiImage.NanoBananaEdit(config: {
  proxyUrl: string;
  headers?: Record<string, string>;
  debug?: boolean;
})
```

#### NanoBananaProEdit

```typescript
FalAiImage.NanoBananaProEdit(config: {
  proxyUrl: string;
  headers?: Record<string, string>;
  debug?: boolean;
})
```

#### SeedreamV4

```typescript
FalAiImage.SeedreamV4(config: {
  proxyUrl: string;
  headers?: Record<string, string>;
  debug?: boolean;
})
```

#### SeedreamV4Edit

```typescript
FalAiImage.SeedreamV4Edit(config: {
  proxyUrl: string;
  headers?: Record<string, string>;
  debug?: boolean;
})
```

### Runware Providers

All Runware providers use the following configuration:

```typescript
interface RunwareProviderConfiguration {
  proxyUrl: string;        // HTTP endpoint URL for the Runware proxy
  debug?: boolean;         // Enable debug logging
  middlewares?: any[];     // Optional middleware functions
  history?: false | '@imgly/local' | '@imgly/indexedDB' | (string & {});
}
```

#### Flux2Dev.Text2Image / Flux2Dev.Image2Image

```typescript
RunwareImage.Flux2Dev.Text2Image(config: RunwareProviderConfiguration)
RunwareImage.Flux2Dev.Image2Image(config: RunwareProviderConfiguration)
```

#### Flux2Pro.Text2Image / Flux2Pro.Image2Image

```typescript
RunwareImage.Flux2Pro.Text2Image(config: RunwareProviderConfiguration)
RunwareImage.Flux2Pro.Image2Image(config: RunwareProviderConfiguration)
```

#### Flux2Flex.Text2Image / Flux2Flex.Image2Image

```typescript
RunwareImage.Flux2Flex.Text2Image(config: RunwareProviderConfiguration)
RunwareImage.Flux2Flex.Image2Image(config: RunwareProviderConfiguration)
```

#### Seedream4.Text2Image / Seedream4.Image2Image

```typescript
RunwareImage.Seedream4.Text2Image(config: RunwareProviderConfiguration)
RunwareImage.Seedream4.Image2Image(config: RunwareProviderConfiguration)
```

#### NanoBanana2Pro.Text2Image / NanoBanana2Pro.Image2Image

```typescript
RunwareImage.NanoBanana2Pro.Text2Image(config: RunwareProviderConfiguration)
RunwareImage.NanoBanana2Pro.Image2Image(config: RunwareProviderConfiguration)
```

#### GptImage1.Text2Image / GptImage1.Image2Image (Runware)

```typescript
RunwareImage.GptImage1.Text2Image(config: RunwareProviderConfiguration)
RunwareImage.GptImage1.Image2Image(config: RunwareProviderConfiguration)
```

### EachLabs Providers

All EachLabs providers use the following configuration:

```typescript
interface EachLabsProviderConfiguration {
  proxyUrl: string;        // HTTP endpoint URL for the EachLabs proxy
  debug?: boolean;         // Enable debug logging
  middlewares?: any[];     // Optional middleware functions
  history?: false | '@imgly/local' | '@imgly/indexedDB' | (string & {});
}
```

#### NanoBananaPro.Text2Image / NanoBananaPro.Image2Image

```typescript
EachLabsImage.NanoBananaPro.Text2Image(config: EachLabsProviderConfiguration)
EachLabsImage.NanoBananaPro.Image2Image(config: EachLabsProviderConfiguration)
```

#### Flux2Pro.Text2Image / Flux2Pro.Image2Image

```typescript
EachLabsImage.Flux2Pro.Text2Image(config: EachLabsProviderConfiguration)
EachLabsImage.Flux2Pro.Image2Image(config: EachLabsProviderConfiguration)
```

#### Flux2.Text2Image / Flux2.Image2Image

```typescript
EachLabsImage.Flux2.Text2Image(config: EachLabsProviderConfiguration)
EachLabsImage.Flux2.Image2Image(config: EachLabsProviderConfiguration)
```

#### Flux2Flex.Text2Image / Flux2Flex.Image2Image

```typescript
EachLabsImage.Flux2Flex.Text2Image(config: EachLabsProviderConfiguration)
EachLabsImage.Flux2Flex.Image2Image(config: EachLabsProviderConfiguration)
```

#### OpenAIGptImage.Text2Image / OpenAIGptImage.Image2Image

```typescript
EachLabsImage.OpenAIGptImage.Text2Image(config: EachLabsProviderConfiguration)
EachLabsImage.OpenAIGptImage.Image2Image(config: EachLabsProviderConfiguration)
```

#### Seedream45.Text2Image / Seedream45.Image2Image

```typescript
EachLabsImage.Seedream45.Text2Image(config: EachLabsProviderConfiguration)
EachLabsImage.Seedream45.Image2Image(config: EachLabsProviderConfiguration)
```

#### Gemini3Pro.Text2Image / Gemini3Pro.Image2Image

```typescript
EachLabsImage.Gemini3Pro.Text2Image(config: EachLabsProviderConfiguration)
EachLabsImage.Gemini3Pro.Image2Image(config: EachLabsProviderConfiguration)
```

## UI Integration

The plugin automatically registers the following UI components:

1. **Generation Panel**: A sidebar panel for text-to-image generation
2. **Quick Actions**: Canvas menu items for image-to-image transformations
3. **History Library**: Displays previously generated images
4. **Dock Component**: A button in the dock area to open the image generation panel

### Quick Action Features

The plugin includes several pre-configured quick actions for image generation providers:

#### Available Quick Actions

- **`ly.img.editImage`**: Change image based on description
  - Input: `{ prompt: string, uri: string }`

- **`ly.img.swapBackground`**: Change the background of the image
  - Input: `{ prompt: string, uri: string }`

- **`ly.img.createVariant`**: Create a variation of the image
  - Input: `{ prompt: string, uri: string }`

- **`ly.img.styleTransfer`**: Transform image into different art styles
  - Input: `{ style: string, uri: string }`

- **`ly.img.artistTransfer`**: Transform image in the style of famous artists
  - Input: `{ artist: string, uri: string }`

- **`ly.img.combineImages`**: Combine multiple images with instructions
  - Input: `{ prompt: string, uris: string[], exportFromBlockIds: number[] }`

- **`ly.img.remixPage`**: Convert the page into a single image
  - Input: `{ prompt: string, uri: string }`

- **`ly.img.remixPageWithPrompt`**: Remix the page with custom instructions
  - Input: `{ prompt: string, uri: string }`

- **`ly.img.gpt-image-1.changeStyleLibrary`**: Apply different art styles (GPT-specific)
  - Input: `{ prompt: string, uri: string }`

#### Provider Quick Action Support

Providers declare which quick actions they support through their configuration:

```typescript
const myImageProvider = {
    // ... other provider config
    input: {
        // ... panel config
        quickActions: {
            supported: {
                'ly.img.editImage': {
                    mapInput: (quickActionInput) => ({
                        prompt: quickActionInput.prompt,
                        image_url: quickActionInput.uri
                    })
                },
                'ly.img.swapBackground': {
                    mapInput: (quickActionInput) => ({
                        prompt: quickActionInput.prompt,
                        image_url: quickActionInput.uri
                    })
                },
                'ly.img.styleTransfer': {
                    mapInput: (quickActionInput) => ({
                        style: quickActionInput.style,
                        image_url: quickActionInput.uri
                    })
                }
                // Add more supported quick actions as needed
            }
        }
    }
};
```

### Panel IDs

- Main panel: `ly.img.ai.image-generation`
- Canvas quick actions: `ly.img.ai.image.canvasMenu`
- Provider-specific panels:
  - RecraftV3: `ly.img.ai.fal-ai/recraft-v3`
  - Recraft20b: `ly.img.ai.fal-ai/recraft/v2/text-to-image`
  - IdeogramV3: `ly.img.ai.fal-ai/ideogram/v3`
  - IdeogramV3Remix: `ly.img.ai.fal-ai/ideogram/v3/remix`
  - GeminiFlash25: `ly.img.ai.fal-ai/gemini-flash-2.5`
  - GeminiFlashEdit: `ly.img.ai.fal-ai/gemini-flash-edit`
  - QwenImageEdit: `ly.img.ai.fal-ai/qwen-image-edit`
  - GptImage1.Text2Image: `ly.img.ai.open-ai/gpt-image-1/text2image`
  - GptImage1.Image2Image: `ly.img.ai.open-ai/gpt-image-1/image2image`
  - FluxProKontextEdit: `ly.img.ai.fal-ai/flux-pro/kontext`
  - FluxProKontextMaxEdit: `ly.img.ai.fal-ai/flux-pro/kontext/max`
  - NanoBanana: `ly.img.ai.fal-ai/nano-banana`
  - NanoBananaPro: `ly.img.ai.fal-ai/nano-banana-pro`
  - NanoBananaEdit: `ly.img.ai.fal-ai/nano-banana/edit`
  - NanoBananaProEdit: `ly.img.ai.fal-ai/nano-banana-pro/edit`
  - SeedreamV4: `ly.img.ai.fal-ai/bytedance/seedream/v4/text-to-image`
  - SeedreamV4Edit: `ly.img.ai.fal-ai/bytedance/seedream/v4/edit`
  - Runware Flux2Dev.Text2Image: `ly.img.ai.runware/bfl/flux-2-dev`
  - Runware Flux2Dev.Image2Image: `ly.img.ai.runware/bfl/flux-2-dev/image2image`
  - Runware Flux2Pro.Text2Image: `ly.img.ai.runware/bfl/flux-2-pro`
  - Runware Flux2Pro.Image2Image: `ly.img.ai.runware/bfl/flux-2-pro/image2image`
  - Runware Flux2Flex.Text2Image: `ly.img.ai.runware/bfl/flux-2-flex`
  - Runware Flux2Flex.Image2Image: `ly.img.ai.runware/bfl/flux-2-flex/image2image`
  - Runware Seedream4.Text2Image: `ly.img.ai.runware/bytedance/seedream-4`
  - Runware Seedream4.Image2Image: `ly.img.ai.runware/bytedance/seedream-4/image2image`
  - Runware NanoBanana2Pro.Text2Image: `ly.img.ai.runware/google/nano-banana-2-pro`
  - Runware NanoBanana2Pro.Image2Image: `ly.img.ai.runware/google/nano-banana-2-pro/image2image`
  - Runware GptImage1.Text2Image: `ly.img.ai.runware/openai/gpt-image-1`
  - Runware GptImage1.Image2Image: `ly.img.ai.runware/openai/gpt-image-1/image2image`
  - EachLabs NanoBananaPro.Text2Image: `ly.img.ai.eachlabs/nano-banana-pro`
  - EachLabs NanoBananaPro.Image2Image: `ly.img.ai.eachlabs/nano-banana-pro/edit`
  - EachLabs Flux2Pro.Text2Image: `ly.img.ai.eachlabs/flux-2-pro`
  - EachLabs Flux2Pro.Image2Image: `ly.img.ai.eachlabs/flux-2-pro/edit`
  - EachLabs Flux2.Text2Image: `ly.img.ai.eachlabs/flux-2`
  - EachLabs Flux2.Image2Image: `ly.img.ai.eachlabs/flux-2/edit`
  - EachLabs Flux2Flex.Text2Image: `ly.img.ai.eachlabs/flux-2-flex`
  - EachLabs Flux2Flex.Image2Image: `ly.img.ai.eachlabs/flux-2-flex/edit`
  - EachLabs OpenAIGptImage.Text2Image: `ly.img.ai.eachlabs/openai-gpt-image`
  - EachLabs OpenAIGptImage.Image2Image: `ly.img.ai.eachlabs/openai-gpt-image/edit`
  - EachLabs Seedream45.Text2Image: `ly.img.ai.eachlabs/seedream-v4.5`
  - EachLabs Seedream45.Image2Image: `ly.img.ai.eachlabs/seedream-v4.5/edit`
  - EachLabs Gemini3Pro.Text2Image: `ly.img.ai.eachlabs/gemini-3-pro-image`
  - EachLabs Gemini3Pro.Image2Image: `ly.img.ai.eachlabs/gemini-3-pro-image/edit`

### Asset History

Generated images are automatically stored in asset sources with the following IDs:
- RecraftV3: `fal-ai/recraft-v3.history`
- Recraft20b: `fal-ai/recraft/v2/text-to-image.history`
- IdeogramV3: `fal-ai/ideogram/v3.history`
- IdeogramV3Remix: `fal-ai/ideogram/v3/remix.history`
- GeminiFlash25: `fal-ai/gemini-flash-2.5.history`
- GeminiFlashEdit: `fal-ai/gemini-flash-edit.history`
- QwenImageEdit: `fal-ai/qwen-image-edit.history`
- GptImage1.Text2Image: `open-ai/gpt-image-1/text2image.history`
- GptImage1.Image2Image: `open-ai/gpt-image-1/image2image.history`
- FluxProKontextEdit: `fal-ai/flux-pro/kontext.history`
- FluxProKontextMaxEdit: `fal-ai/flux-pro/kontext/max.history`
- NanoBanana: `fal-ai/nano-banana.history`
- NanoBananaPro: `fal-ai/nano-banana-pro.history`
- NanoBananaEdit: `fal-ai/nano-banana/edit.history`
- NanoBananaProEdit: `fal-ai/nano-banana-pro/edit.history`
- SeedreamV4: `fal-ai/bytedance/seedream/v4/text-to-image.history`
- SeedreamV4Edit: `fal-ai/bytedance/seedream/v4/edit.history`
- Runware Flux2Dev.Text2Image: `runware/bfl/flux-2-dev.history`
- Runware Flux2Dev.Image2Image: `runware/bfl/flux-2-dev/image2image.history`
- Runware Flux2Pro.Text2Image: `runware/bfl/flux-2-pro.history`
- Runware Flux2Pro.Image2Image: `runware/bfl/flux-2-pro/image2image.history`
- Runware Flux2Flex.Text2Image: `runware/bfl/flux-2-flex.history`
- Runware Flux2Flex.Image2Image: `runware/bfl/flux-2-flex/image2image.history`
- Runware Seedream4.Text2Image: `runware/bytedance/seedream-4.history`
- Runware Seedream4.Image2Image: `runware/bytedance/seedream-4/image2image.history`
- Runware NanoBanana2Pro.Text2Image: `runware/google/nano-banana-2-pro.history`
- Runware NanoBanana2Pro.Image2Image: `runware/google/nano-banana-2-pro/image2image.history`
- Runware GptImage1.Text2Image: `runware/openai/gpt-image-1.history`
- Runware GptImage1.Image2Image: `runware/openai/gpt-image-1/image2image.history`
- EachLabs NanoBananaPro.Text2Image: `eachlabs/nano-banana-pro.history`
- EachLabs NanoBananaPro.Image2Image: `eachlabs/nano-banana-pro/edit.history`
- EachLabs Flux2Pro.Text2Image: `eachlabs/flux-2-pro.history`
- EachLabs Flux2Pro.Image2Image: `eachlabs/flux-2-pro/edit.history`
- EachLabs Flux2.Text2Image: `eachlabs/flux-2.history`
- EachLabs Flux2.Image2Image: `eachlabs/flux-2/edit.history`
- EachLabs Flux2Flex.Text2Image: `eachlabs/flux-2-flex.history`
- EachLabs Flux2Flex.Image2Image: `eachlabs/flux-2-flex/edit.history`
- EachLabs OpenAIGptImage.Text2Image: `eachlabs/openai-gpt-image.history`
- EachLabs OpenAIGptImage.Image2Image: `eachlabs/openai-gpt-image/edit.history`
- EachLabs Seedream45.Text2Image: `eachlabs/seedream-v4.5.history`
- EachLabs Seedream45.Image2Image: `eachlabs/seedream-v4.5/edit.history`
- EachLabs Gemini3Pro.Text2Image: `eachlabs/gemini-3-pro-image.history`
- EachLabs Gemini3Pro.Image2Image: `eachlabs/gemini-3-pro-image/edit.history`

### Dock Integration

The plugin automatically registers a dock component with a sparkle icon that opens the image generation panel. To customize the component's position in the dock, use the `setDockOrder` method:

```typescript
// Add the AI Image component to the beginning of the dock
cesdk.ui.setDockOrder([
  'ly.img.ai.image-generation.dock',
  ...cesdk.ui.getDockOrder()
]);

// Or add it at a specific position
const currentOrder = cesdk.ui.getDockOrder();
currentOrder.splice(2, 0, 'ly.img.ai.image-generation.dock');
cesdk.ui.setDockOrder(currentOrder);
```

## Translations

For customization and localization, see the [translations.json](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-image-generation-web/translations.json) file which contains provider-specific translation keys for image generation interfaces.

## Related Packages

- [@imgly/plugin-ai-generation-web](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-generation-web) - Core utilities for AI generation
- [@imgly/plugin-ai-video-generation-web](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-video-generation-web) - AI video generation
- [@imgly/plugin-ai-audio-generation-web](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-audio-generation-web) - AI audio generation

## License

This plugin is part of the IMG.LY plugin ecosystem for CreativeEditor SDK. Please refer to the license terms in the package.
