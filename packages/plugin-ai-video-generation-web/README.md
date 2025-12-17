# IMG.LY AI Video Generation for Web

A plugin for integrating AI video generation capabilities into CreativeEditor SDK.

## Overview

The `@imgly/plugin-ai-video-generation-web` package enables users to generate videos using AI directly within CreativeEditor SDK. This shipped provider leverages the [fal.ai](https://fal.ai) platform to provide high-quality video generation from text-to-video and image-to-video transformations.

Features include:

-   Text-to-video generation
-   Image-to-video transformations
-   Multiple model options
-   Automatic history tracking
-   Canvas menu quick actions
-   Seamless integration with CreativeEditor SDK

## Installation

```bash
npm install @imgly/plugin-ai-video-generation-web
```

## Usage

### Basic Configuration

To use the plugin, import it and configure it with your preferred providers:

#### Single Provider Configuration

```typescript
import CreativeEditorSDK from '@cesdk/cesdk-js';
import VideoGeneration from '@imgly/plugin-ai-video-generation-web';
import FalAiVideo from '@imgly/plugin-ai-video-generation-web/fal-ai';
// For Runware providers
import RunwareVideo from '@imgly/plugin-ai-video-generation-web/runware';

// Initialize CreativeEditor SDK
CreativeEditorSDK.create(domElement, {
    license: 'your-license-key'
    // Other configuration options...
}).then(async (cesdk) => {
    // Add the video generation plugin
    cesdk.addPlugin(
        VideoGeneration({
            // Text-to-video provider
            text2video: FalAiVideo.MinimaxVideo01Live({
                proxyUrl: 'http://your-proxy-server.com/api/proxy',
                headers: {
                    'x-custom-header': 'value',
                    'x-client-version': '1.0.0'
                },
                // Optional: Configure default property values
                properties: {
                    duration: { default: 5 },  // Default duration in seconds
                    aspect_ratio: { default: '16:9' }  // Default aspect ratio
                }
            }),

            // Image-to-video provider (optional)
            image2video: FalAiVideo.MinimaxVideo01LiveImageToVideo({
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
import VideoGeneration from '@imgly/plugin-ai-video-generation-web';
import FalAiVideo from '@imgly/plugin-ai-video-generation-web/fal-ai';

// Initialize CreativeEditor SDK
CreativeEditorSDK.create(domElement, {
    license: 'your-license-key'
    // Other configuration options...
}).then(async (cesdk) => {
    // Add the video generation plugin with multiple providers
    cesdk.addPlugin(
        VideoGeneration({
            // Multiple text-to-video providers
            text2video: [
                FalAiVideo.MinimaxVideo01Live({
                    proxyUrl: 'http://your-proxy-server.com/api/proxy',
                    headers: {
                        'x-custom-header': 'value',
                        'x-client-version': '1.0.0'
                    }
                }),
                FalAiVideo.PixverseV35TextToVideo({
                    proxyUrl: 'http://your-proxy-server.com/api/proxy',
                    headers: {
                        'x-custom-header': 'value',
                        'x-client-version': '1.0.0'
                    }
                })
            ],

            // Image-to-video provider (optional)
            image2video: FalAiVideo.MinimaxVideo01LiveImageToVideo({
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

### Providers

The plugin comes with pre-configured providers for fal.ai models:

#### 1. MinimaxVideo01Live (Text-to-Video)

A model that generates videos based on text prompts:

```typescript
text2video: FalAiVideo.MinimaxVideo01Live({
    proxyUrl: 'http://your-proxy-server.com/api/proxy',
    headers: {
        'x-custom-header': 'value',
        'x-client-version': '1.0.0'
    },
    // Optional: Configure default property values
    properties: {
        prompt_optimizer: { default: true }  // Enable automatic prompt enhancement
    }
});
```

Key features:

-   Generate videos from text descriptions
-   Fixed output dimensions (1280×720)
-   5-second video duration
-   Custom headers support for API requests

**Custom Translations:**

```typescript
cesdk.i18n.setTranslations({
  en: {
    'ly.img.plugin-ai-video-generation-web.fal-ai/minimax/video-01-live.property.prompt': 'Describe your Minimax video'
  }
});
```

#### 2. MinimaxVideo01LiveImageToVideo (Image-to-Video)

A model that transforms still images into videos:

```typescript
image2video: FalAiVideo.MinimaxVideo01LiveImageToVideo({
    proxyUrl: 'http://your-proxy-server.com/api/proxy',
    headers: {
        'x-custom-header': 'value',
        'x-client-version': '1.0.0'
    },
    // Optional: Configure default property values
    properties: {
        prompt_optimizer: { default: true }  // Enable automatic prompt enhancement
    }
});
```

Key features:

-   Transform existing images into videos
-   Available through canvas quick actions
-   Maintains original image aspect ratio
-   Custom headers support for API requests

#### 3. MinimaxHailuo02StandardImageToVideo (Image-to-Video)

An advanced model that transforms still images into videos using Hailuo 02 Standard:

```typescript
image2video: FalAiVideo.MinimaxHailuo02StandardImageToVideo({
    proxyUrl: 'http://your-proxy-server.com/api/proxy',
    headers: {
        'x-custom-header': 'value',
        'x-client-version': '1.0.0'
    },
    // Optional: Configure default property values
    properties: {
        resolution: { default: '768P' },  // Options: '512P' (912×512), '768P' (1280×720)
        duration: { default: 6 }          // Duration in seconds (6 or 10)
    }
});
```

Key features:

-   Transform existing images into videos
-   Available through canvas quick actions
-   Selectable resolutions (512P: 912×512, 768P: 1280×720)
-   Adjustable durations (6 or 10 seconds)
-   Custom headers support for API requests

#### 4. PixverseV35TextToVideo (Text-to-Video)

An alternative text-to-video model:

```typescript
text2video: FalAiVideo.PixverseV35TextToVideo({
    proxyUrl: 'http://your-proxy-server.com/api/proxy',
    headers: {
        'x-custom-header': 'value',
        'x-client-version': '1.0.0'
    },
    // Optional: Configure default property values
    properties: {
        seed: { default: 42 }  // Fixed seed for reproducible generation
    }
});
```

Key features:

-   Alternative text-to-video generation
-   Custom headers support for API requests

#### 5. KlingVideoV21MasterTextToVideo (Text-to-Video)

A model based on KlingVideo V2.1 that generates videos from text prompts:

```typescript
text2video: FalAiVideo.KlingVideoV21MasterTextToVideo({
    proxyUrl: 'http://your-proxy-server.com/api/proxy',
    // Optional: Configure default property values
    properties: {
        aspect_ratio: { default: '16:9' },  // Options: '16:9', '9:16', '1:1'
        duration: { default: '5s' }         // Options: '5s', '10s'
    }
});
```

Key features:

-   Generate videos from text descriptions
-   Adjustable aspect ratios (16:9, 9:16, 1:1)
-   Selectable durations (5 s or 10 s)
-   Adaptive resolution (height fixed at 720 px, width is calculated)

**Custom Translations:**

```typescript
cesdk.i18n.setTranslations({
  en: {
    'ly.img.plugin-ai-video-generation-web.fal-ai/kling-video/v2.1/master/text-to-video.property.prompt': 'Describe your KlingVideo',
    'ly.img.plugin-ai-video-generation-web.fal-ai/kling-video/v2.1/master/text-to-video.property.aspect_ratio': 'Video Format',
    'ly.img.plugin-ai-video-generation-web.fal-ai/kling-video/v2.1/master/text-to-video.property.duration': 'Video Length (seconds)'
  }
});
```

#### 6. KlingVideoV21MasterImageToVideo (Image-to-Video)

A model that converts still images into videos using KlingVideo V2.1:

```typescript
image2video: FalAiVideo.KlingVideoV21MasterImageToVideo({
    proxyUrl: 'http://your-proxy-server.com/api/proxy',
    // Optional: Configure default property values
    properties: {
        duration: { default: '5s' }  // Options: '5s', '10s'
    }
});
```

Key features:

-   Transform existing images into videos
-   Maintains original image aspect ratio (fallback to 1280 × 720)
-   Canvas quick-action integration
-   Selectable durations (5 s or 10 s)

#### 6. ByteDanceSeedanceV1ProImageToVideo (Image-to-Video)

A model that transforms images into videos using ByteDance Seedance v1 Pro:

```typescript
image2video: FalAiVideo.ByteDanceSeedanceV1ProImageToVideo({
    proxyUrl: 'http://your-proxy-server.com/api/proxy',
    // Optional: Configure default property values
    properties: {
        aspect_ratio: { default: 'auto' },     // Options: '21:9', '16:9', '4:3', '1:1', '3:4', '9:16', 'auto'
        duration: { default: 5 },              // Duration in seconds (3-12)
        resolution: { default: '720p' }        // Options: '480p', '720p', '1080p'
    }
});
```

Key features:

-   Transform existing images into dynamic videos
-   Multiple aspect ratio options (21:9, 16:9, 4:3, 1:1, 3:4, 9:16, or auto from image)
-   Adjustable duration (3-12 seconds, default 5)
-   Resolution options (480p, 720p, 1080p)
-   Maintains image quality while adding motion

#### 7. ByteDanceSeedanceV1ProTextToVideo (Text-to-Video)

A model that generates videos from text using ByteDance Seedance v1 Pro:

```typescript
text2video: FalAiVideo.ByteDanceSeedanceV1ProTextToVideo({
    proxyUrl: 'http://your-proxy-server.com/api/proxy',
    // Optional: Configure default property values
    properties: {
        aspect_ratio: { default: '16:9' },     // Options: '21:9', '16:9', '4:3', '1:1', '3:4', '9:16'
        duration: { default: 5 },              // Duration in seconds (3-12)
        resolution: { default: '720p' }        // Options: '480p', '720p', '1080p'
    }
});
```

Key features:

-   Generate videos from text descriptions
-   Multiple aspect ratio options (21:9, 16:9, 4:3, 1:1, 3:4, 9:16)
-   Adjustable duration (3-12 seconds, default 5)
-   Resolution options (480p, 720p, 1080p)
-   High-quality motion synthesis from text prompts

#### 8. Veo3TextToVideo (Text-to-Video)

An advanced text-to-video model:

```typescript
text2video: FalAiVideo.Veo3TextToVideo({
    proxyUrl: 'http://your-proxy-server.com/api/proxy',
    // Optional: Configure default property values
    properties: {
        aspect_ratio: { default: '16:9' },     // Options: '16:9', '9:16', '1:1'
        duration: { default: 8 }               // Fixed at 8 seconds for this provider
    }
});
```

Key features:

-   Generate videos from text descriptions
-   Supports aspect ratios 16:9, 9:16 and 1:1 (defaults to 16:9)
-   Fixed duration of 8 seconds
-   Optional audio generation via `generate_audio`

#### 9. Veo31TextToVideo (Text-to-Video)

Google's Veo 3.1 text-to-video model with enhanced capabilities:

```typescript
text2video: FalAiVideo.Veo31TextToVideo({
    proxyUrl: 'http://your-proxy-server.com/api/proxy',
    // Optional: Configure default property values
    properties: {
        aspect_ratio: { default: '16:9' },     // Options: '16:9', '9:16', '1:1'
        duration: { default: '8s' },           // Options: '4s', '6s', '8s'
        resolution: { default: '720p' },       // Options: '720p', '1080p'
        generate_audio: { default: true }      // Enable audio generation
    }
});
```

Key features:

-   Generate videos from text descriptions
-   Supports aspect ratios 16:9, 9:16 and 1:1 (defaults to 16:9)
-   Variable duration options: 4s, 6s, or 8s
-   Resolution options: 720p (1280×720) or 1080p (1920×1080)
-   Optional audio generation

#### 10. Veo31FastTextToVideo (Text-to-Video)

Faster and more cost-effective version of Google's Veo 3.1 text-to-video model:

```typescript
text2video: FalAiVideo.Veo31FastTextToVideo({
    proxyUrl: 'http://your-proxy-server.com/api/proxy',
    // Optional: Configure default property values
    properties: {
        aspect_ratio: { default: '16:9' },     // Options: '16:9', '9:16', '1:1'
        duration: { default: '8s' },           // Options: '4s', '6s', '8s'
        resolution: { default: '720p' },       // Options: '720p', '1080p'
        generate_audio: { default: true }      // Enable audio generation
    }
});
```

Key features:

-   Generate videos from text descriptions with faster processing
-   Supports aspect ratios 16:9, 9:16 and 1:1 (defaults to 16:9)
-   Variable duration options: 4s, 6s, or 8s
-   Resolution options: 720p (1280×720) or 1080p (1920×1080)
-   Optional audio generation
-   More cost-effective than the standard Veo 3.1 model

#### 11. Veo31ImageToVideo (Image-to-Video)

A model that transforms still images into videos using Google's Veo 3.1:

```typescript
image2video: FalAiVideo.Veo31ImageToVideo({
    proxyUrl: 'http://your-proxy-server.com/api/proxy',
    // Optional: Configure default property values
    properties: {
        aspect_ratio: { default: 'auto' },     // Options: 'auto', '9:16', '16:9', '1:1'
        resolution: { default: '720p' },       // Options: '720p', '1080p'
        duration: { default: '8s' },           // Fixed at 8 seconds
        generate_audio: { default: true }      // Enable audio generation
    }
});
```

Key features:

-   Transform existing images into videos
-   Multiple aspect ratio options (auto, 9:16, 16:9, 1:1)
-   Resolution options: 720p (1280×720) or 1080p (1920×1080)
-   Fixed duration of 8 seconds
-   Optional audio generation
-   Canvas quick-action integration
-   Auto aspect ratio preserves source image dimensions

#### 12. Veo31FastImageToVideo (Image-to-Video)

Faster and more cost-effective version of Google's Veo 3.1 image-to-video model:

```typescript
image2video: FalAiVideo.Veo31FastImageToVideo({
    proxyUrl: 'http://your-proxy-server.com/api/proxy',
    // Optional: Configure default property values
    properties: {
        aspect_ratio: { default: 'auto' },     // Options: 'auto', '9:16', '16:9', '1:1'
        resolution: { default: '720p' },       // Options: '720p', '1080p'
        duration: { default: '8s' },           // Fixed at 8 seconds
        generate_audio: { default: true }      // Enable audio generation
    }
});
```

Key features:

-   Transform existing images into videos with faster processing
-   Multiple aspect ratio options (auto, 9:16, 16:9, 1:1)
-   Resolution options: 720p (1280×720) or 1080p (1920×1080)
-   Fixed duration of 8 seconds
-   Optional audio generation
-   Canvas quick-action integration
-   More cost-effective than the standard Veo 3.1 model
-   Auto aspect ratio preserves source image dimensions

#### 13. Veo31FastFirstLastFrameToVideo (Image-to-Video)

An experimental dual-image transformation model using Veo 3.1 Fast that creates videos by interpolating between two images:

```typescript
image2video: FalAiVideo.Veo31FastFirstLastFrameToVideo({
    proxyUrl: 'http://your-proxy-server.com/api/proxy',
    // Optional: Configure default property values
    properties: {
        aspect_ratio: { default: 'auto' },     // Options: 'auto', '9:16', '16:9', '1:1'
        resolution: { default: '720p' },       // Options: '720p', '1080p'
        duration: { default: '8s' }            // Fixed at 8 seconds
    }
});
```

Key features:

-   Transform two images (first frame and last frame) into smooth video transitions
-   Multiple aspect ratio options (auto, 9:16, 16:9, 1:1)
-   Resolution options (720p, 1080p)
-   Fixed duration of 8 seconds
-   Custom UI with dual image selectors for first and last frames
-   Optional prompt guidance for transition control
-   Optional audio generation

**Note:** This provider uses a custom UI implementation with two image input fields (first_frame_url and last_frame_url) instead of the standard single image selector. This is a proof-of-concept implementation for handling multiple image inputs in video generation.

### Runware Providers

Runware provides access to multiple AI video models through a unified API. These providers require a Runware proxy URL for authentication.

#### 14. Veo31 (Text-to-Video & Image-to-Video) via Runware

Google's Veo 3.1 model accessed through Runware:

```typescript
// Text-to-Video
text2video: RunwareVideo.Veo31.Text2Video({
    proxyUrl: 'http://your-runware-proxy.com/api/proxy'
})

// Image-to-Video
image2video: RunwareVideo.Veo31.Image2Video({
    proxyUrl: 'http://your-runware-proxy.com/api/proxy'
})
```

Key features:
- Google's latest video generation model via Runware
- Text-to-video and image-to-video support
- Aspect ratios: 16:9, 9:16
- Duration: Fixed at 8 seconds
- Optional audio generation
- Async delivery with polling

#### 15. Veo31Fast (Text-to-Video & Image-to-Video) via Runware

Faster version of Google's Veo 3.1 model:

```typescript
// Text-to-Video
text2video: RunwareVideo.Veo31Fast.Text2Video({
    proxyUrl: 'http://your-runware-proxy.com/api/proxy'
})

// Image-to-Video
image2video: RunwareVideo.Veo31Fast.Image2Video({
    proxyUrl: 'http://your-runware-proxy.com/api/proxy'
})
```

Key features:
- Faster generation times
- Same capabilities as Veo31
- More cost-effective
- Aspect ratios: 16:9, 9:16
- Duration: Fixed at 8 seconds

#### 16. Sora2 (Text-to-Video & Image-to-Video) via Runware

OpenAI's Sora 2 video generation model:

```typescript
// Text-to-Video
text2video: RunwareVideo.Sora2.Text2Video({
    proxyUrl: 'http://your-runware-proxy.com/api/proxy'
})

// Image-to-Video
image2video: RunwareVideo.Sora2.Image2Video({
    proxyUrl: 'http://your-runware-proxy.com/api/proxy'
})
```

Key features:
- OpenAI's advanced video generation model
- Text-to-video and image-to-video support
- Accurate physics simulation
- Synchronized dialogue and high-fidelity visuals
- Resolutions: 1280×720, 720×1280
- Durations: 4, 8, or 12 seconds

#### 17. Sora2Pro (Text-to-Video & Image-to-Video) via Runware

Professional version of OpenAI's Sora 2:

```typescript
// Text-to-Video
text2video: RunwareVideo.Sora2Pro.Text2Video({
    proxyUrl: 'http://your-runware-proxy.com/api/proxy'
})

// Image-to-Video
image2video: RunwareVideo.Sora2Pro.Image2Video({
    proxyUrl: 'http://your-runware-proxy.com/api/proxy'
})
```

Key features:
- Enhanced quality over standard Sora 2
- Text-to-video and image-to-video support
- Professional-grade output
- Resolutions: 1280×720, 720×1280, 1792×1024 (7:4), 1024×1792 (4:7)
- Durations: 4, 8, or 12 seconds

### EachLabs Providers

EachLabs provides access to multiple AI video models through a unified API. These providers require an EachLabs proxy URL for authentication.

#### 18. KlingV26ProTextToVideo (Text-to-Video) via EachLabs

Kling v2.6 Pro text-to-video model accessed through EachLabs:

```typescript
import EachLabsVideo from '@imgly/plugin-ai-video-generation-web/eachlabs';

text2video: EachLabsVideo.KlingV26ProTextToVideo({
    proxyUrl: 'http://your-eachlabs-proxy.com/api/proxy',
    // Optional: Configure default values
    middlewares: [rateLimitMiddleware, errorMiddleware]
})
```

Key features:
- Kling v2.6 Pro - latest high-quality video generation
- Aspect ratios: 16:9, 9:16, 1:1
- Duration: 5 or 10 seconds
- Native audio generation (Chinese/English)
- Async delivery with polling

#### 19. KlingV26ProImageToVideo (Image-to-Video) via EachLabs

Kling v2.6 Pro image-to-video model:

```typescript
import EachLabsVideo from '@imgly/plugin-ai-video-generation-web/eachlabs';

image2video: EachLabsVideo.KlingV26ProImageToVideo({
    proxyUrl: 'http://your-eachlabs-proxy.com/api/proxy',
    // Optional: Configure default values
    middlewares: [rateLimitMiddleware, errorMiddleware]
})
```

Key features:
- Transform existing images into videos
- Duration: 5 or 10 seconds
- Native audio generation (Chinese/English)
- Canvas quick-action integration
- Maintains image aspect ratio

### Feature Control

You can control various aspects of the video generation plugin using the Feature API:

```typescript
// Disable text-to-video generation
cesdk.feature.enable('ly.img.plugin-ai-video-generation-web.fromText', false);

// Disable image-to-video generation  
cesdk.feature.enable('ly.img.plugin-ai-video-generation-web.fromImage', false);

// Disable provider selection
cesdk.feature.enable('ly.img.plugin-ai-video-generation-web.providerSelect', false);

// Disable specific quick actions
cesdk.feature.enable('ly.img.plugin-ai-video-generation-web.quickAction.createVideo', false);
```

For more information about Feature API and available feature flags, see the [@imgly/plugin-ai-generation-web documentation](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-generation-web#available-feature-flags).

### Customizing Labels and Translations

You can customize all labels and text in the AI video generation interface using the translation system. This allows you to provide better labels for your users in any language.

#### Translation Key Structure

The system checks for translations in this order (highest to lowest priority):

1. **Provider-specific**: `ly.img.plugin-ai-video-generation-web.${provider}.property.${field}` - Override labels for a specific AI provider
2. **Generic**: `ly.img.plugin-ai-generation-web.property.${field}` - Override labels for all AI plugins

#### Basic Example

```typescript
// Customize labels for your AI video generation interface
cesdk.i18n.setTranslations({
  en: {
    // Generic labels (applies to ALL AI plugins)
    'ly.img.plugin-ai-generation-web.property.prompt': 'Describe what you want to create',
    'ly.img.plugin-ai-generation-web.property.duration': 'Video Duration',

    // Provider-specific for MinimaxVideo01Live
    'ly.img.plugin-ai-video-generation-web.fal-ai/minimax/video-01-live.property.prompt': 'Describe your video',
    'ly.img.plugin-ai-video-generation-web.fal-ai/minimax/video-01-live.property.duration': 'Video Length',

    // Provider-specific for KlingVideoV21Master
    'ly.img.plugin-ai-video-generation-web.fal-ai/kling-video/v2.1/master/text-to-video.property.aspect_ratio': 'Video Aspect Ratio',
    'ly.img.plugin-ai-video-generation-web.fal-ai/kling-video/v2.1/master/text-to-video.property.duration': 'Video Duration (seconds)'
  }
});
```

#### QuickAction Translations

Video QuickActions (like "Create Video from Image") use their own translation keys with provider-specific overrides:

```typescript
cesdk.i18n.setTranslations({
  en: {
    // Provider-specific translations (highest priority)
    'ly.img.plugin-ai-video-generation-web.fal-ai/minimax/video-01-live.quickAction.createVideo': 'Generate Minimax Video...',
    'ly.img.plugin-ai-video-generation-web.fal-ai/minimax/video-01-live.quickAction.createVideo.prompt': 'Minimax Video Prompt',
    
    // Generic plugin translations
    'ly.img.plugin-ai-video-generation-web.quickAction.createVideo': 'Create Video...',
    'ly.img.plugin-ai-video-generation-web.quickAction.createVideo.prompt': 'Video Prompt',
    'ly.img.plugin-ai-video-generation-web.quickAction.createVideo.prompt.placeholder': 'e.g. "Make the image move slowly"',
    'ly.img.plugin-ai-video-generation-web.quickAction.createVideo.apply': 'Generate'
  }
});
```

**QuickAction Translation Priority:**
1. Provider-specific: `ly.img.plugin-ai-video-generation-web.${provider}.quickAction.${action}.${field}`
2. Generic plugin: `ly.img.plugin-ai-video-generation-web.quickAction.${action}.${field}`

**Translation Structure:**
- Base key (e.g., `.quickAction.createVideo`): Button text when QuickAction is collapsed
- `.prompt`: Label for input field when expanded
- `.prompt.placeholder`: Placeholder text for input field
- `.apply`: Text for action/submit button

### Configuration Options

The plugin accepts the following configuration options:

| Option        | Type                 | Description                                     | Default   |
| ------------- | -------------------- | ----------------------------------------------- | --------- |
| `text2video`  | Provider \| Provider[] | Provider(s) for text-to-video generation. When multiple providers are provided, users can select between them | undefined |
| `image2video` | Provider \| Provider[] | Provider(s) for image-to-video transformation. When multiple providers are provided, users can select between them | undefined |
| `debug`       | boolean              | Enable debug logging                            | false     |
| `dryRun`      | boolean              | Simulate generation without API calls           | false     |
| `middleware`  | Function[]           | Array of middleware functions for the generation | undefined |

### Middleware Configuration

The `middleware` option allows you to add pre-processing and post-processing capabilities to the generation process:

```typescript
import VideoGeneration from '@imgly/plugin-ai-video-generation-web';
import FalAiVideo from '@imgly/plugin-ai-video-generation-web/fal-ai';
import { loggingMiddleware, rateLimitMiddleware } from '@imgly/plugin-ai-generation-web';

// Create middleware functions
const logging = loggingMiddleware();
const rateLimit = rateLimitMiddleware({
  maxRequests: 5,
  timeWindowMs: 300000, // 5 minutes
  onRateLimitExceeded: (input, options, info) => {
    console.log(`Video generation rate limit exceeded: ${info.currentCount}/${info.maxRequests}`);
    return false; // Reject request
  }
});

// Create custom middleware
const customMiddleware = async (input, options, next) => {
  console.log('Before generation:', input);
  
  // Add custom fields or modify the input
  const modifiedInput = {
    ...input,
    customField: 'custom value'
  };
  
  // Call the next middleware or generation function
  const result = await next(modifiedInput, options);
  
  console.log('After generation:', result);
  
  // You can also modify the result before returning it
  return result;
};

// Apply middleware to plugin
cesdk.addPlugin(
  VideoGeneration({
    text2video: FalAiVideo.MinimaxVideo01Live({
      proxyUrl: 'http://your-proxy-server.com/api/proxy'
    }),
    middleware: [logging, rateLimit, customMiddleware] // Apply middleware in order
  })
);
```

Built-in middleware options:

- **loggingMiddleware**: Logs generation requests and responses
- **rateLimitMiddleware**: Limits the number of generation requests in a time window

You can also create custom middleware functions to meet your specific needs.

#### Preventing Default Feedback

Middleware can suppress default UI feedback behaviors using `options.preventDefault()`:

```typescript
const customErrorMiddleware = async (input, options, next) => {
  try {
    return await next(input, options);
  } catch (error) {
    // Prevent default error notification
    options.preventDefault();

    // Show custom error notification
    options.cesdk?.ui.showNotification({
      type: 'error',
      message: `Video generation failed: ${error.message}`,
      action: {
        label: 'Try Again',
        onClick: () => {/* retry logic */}
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

### Using a Proxy

For security reasons, it's recommended to use a proxy server to handle API requests to fal.ai. The proxy URL is required when configuring providers:

```typescript
text2video: FalAiVideo.MinimaxVideo01Live({
    proxyUrl: 'http://your-proxy-server.com/api/proxy',
    headers: {
        'x-custom-header': 'value',
        'x-client-version': '1.0.0'
    }
});
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
VideoGeneration(options: PluginConfiguration): EditorPlugin
```

Creates and returns a plugin that can be added to CreativeEditor SDK.

### Plugin Configuration

```typescript
interface PluginConfiguration {
    // Provider(s) for text-to-video generation
    text2video?: AiVideoProvider | AiVideoProvider[];

    // Provider(s) for image-to-video generation
    image2video?: AiVideoProvider | AiVideoProvider[];

    // Enable debug logging
    debug?: boolean;

    // Skip actual API calls for testing
    dryRun?: boolean;

    // Extend the generation process
    middleware?: GenerationMiddleware;
}
```

### Fal.ai Providers

#### MinimaxVideo01Live

```typescript
FalAiVideo.MinimaxVideo01Live(config: {
  proxyUrl: string;
  headers?: Record<string, string>;
  debug?: boolean;
}): AiVideoProvider
```

#### MinimaxVideo01LiveImageToVideo

```typescript
FalAiVideo.MinimaxVideo01LiveImageToVideo(config: {
  proxyUrl: string;
  headers?: Record<string, string>;
  debug?: boolean;
}): AiVideoProvider
```

#### MinimaxHailuo02StandardImageToVideo

```typescript
FalAiVideo.MinimaxHailuo02StandardImageToVideo(config: {
  proxyUrl: string;
  headers?: Record<string, string>;
  debug?: boolean;
}): AiVideoProvider
```

#### PixverseV35TextToVideo

```typescript
FalAiVideo.PixverseV35TextToVideo(config: {
  proxyUrl: string;
  headers?: Record<string, string>;
  debug?: boolean;
}): AiVideoProvider
```

#### KlingVideoV21MasterTextToVideo

```typescript
FalAiVideo.KlingVideoV21MasterTextToVideo(config: {
  proxyUrl: string;
  debug?: boolean;
}): AiVideoProvider
```

#### KlingVideoV21MasterImageToVideo

```typescript
FalAiVideo.KlingVideoV21MasterImageToVideo(config: {
  proxyUrl: string;
  debug?: boolean;
}): AiVideoProvider
```

#### ByteDanceSeedanceV1ProImageToVideo

```typescript
FalAiVideo.ByteDanceSeedanceV1ProImageToVideo(config: {
  proxyUrl: string;
  debug?: boolean;
}): AiVideoProvider
```

#### ByteDanceSeedanceV1ProTextToVideo

```typescript
FalAiVideo.ByteDanceSeedanceV1ProTextToVideo(config: {
  proxyUrl: string;
  debug?: boolean;
}): AiVideoProvider
```

#### Veo3TextToVideo

```typescript
FalAiVideo.Veo3TextToVideo(config: {
  proxyUrl: string;
  debug?: boolean;
}): AiVideoProvider
```

#### Veo31TextToVideo

```typescript
FalAiVideo.Veo31TextToVideo(config: {
  proxyUrl: string;
  debug?: boolean;
}): AiVideoProvider
```

#### Veo31FastTextToVideo

```typescript
FalAiVideo.Veo31FastTextToVideo(config: {
  proxyUrl: string;
  debug?: boolean;
}): AiVideoProvider
```

#### Veo31ImageToVideo

```typescript
FalAiVideo.Veo31ImageToVideo(config: {
  proxyUrl: string;
  debug?: boolean;
}): AiVideoProvider
```

#### Veo31FastImageToVideo

```typescript
FalAiVideo.Veo31FastImageToVideo(config: {
  proxyUrl: string;
  debug?: boolean;
}): AiVideoProvider
```

#### Veo31FastFirstLastFrameToVideo

```typescript
FalAiVideo.Veo31FastFirstLastFrameToVideo(config: {
  proxyUrl: string;
  debug?: boolean;
}): AiVideoProvider
```

### Runware Providers

All Runware video providers use the following configuration:

```typescript
interface RunwareProviderConfiguration {
  proxyUrl: string;        // HTTP endpoint URL for the Runware proxy
  debug?: boolean;         // Enable debug logging
  middlewares?: any[];     // Optional middleware functions
  history?: false | '@imgly/local' | '@imgly/indexedDB' | (string & {});
}
```

#### Veo31.Text2Video / Veo31.Image2Video

```typescript
RunwareVideo.Veo31.Text2Video(config: RunwareProviderConfiguration)
RunwareVideo.Veo31.Image2Video(config: RunwareProviderConfiguration)
```

#### Veo31Fast.Text2Video / Veo31Fast.Image2Video

```typescript
RunwareVideo.Veo31Fast.Text2Video(config: RunwareProviderConfiguration)
RunwareVideo.Veo31Fast.Image2Video(config: RunwareProviderConfiguration)
```

#### Sora2.Text2Video / Sora2.Image2Video

```typescript
RunwareVideo.Sora2.Text2Video(config: RunwareProviderConfiguration)
RunwareVideo.Sora2.Image2Video(config: RunwareProviderConfiguration)
```

#### Sora2Pro.Text2Video / Sora2Pro.Image2Video

```typescript
RunwareVideo.Sora2Pro.Text2Video(config: RunwareProviderConfiguration)
RunwareVideo.Sora2Pro.Image2Video(config: RunwareProviderConfiguration)
```

### EachLabs Providers

All EachLabs video providers use the following configuration:

```typescript
interface EachLabsProviderConfiguration {
  proxyUrl: string;        // HTTP endpoint URL for the EachLabs proxy
  debug?: boolean;         // Enable debug logging
  middlewares?: any[];     // Optional middleware functions
  history?: false | '@imgly/local' | '@imgly/indexedDB' | (string & {});
}
```

#### KlingV26ProTextToVideo

```typescript
EachLabsVideo.KlingV26ProTextToVideo(config: EachLabsProviderConfiguration)
```

#### KlingV26ProImageToVideo

```typescript
EachLabsVideo.KlingV26ProImageToVideo(config: EachLabsProviderConfiguration)
```

## UI Integration

The plugin automatically registers the following UI components:

1. **Generation Panel**: A sidebar panel for text-to-video generation
2. **Quick Actions**: Canvas menu items for image-to-video transformations
3. **History Library**: Displays previously generated videos
4. **Dock Component**: A button in the dock area to open the video generation panel

### Panel IDs

-   Main panel: `ly.img.ai.video-generation`
-   Canvas quick actions: `ly.img.ai.video.canvasMenu`
-   Provider-specific panels:
    -   MinimaxVideo01Live: `ly.img.ai.fal-ai/minimax/video-01-live`
    -   MinimaxVideo01LiveImageToVideo: `ly.img.ai.fal-ai/minimax/video-01-live/image-to-video`
    -   MinimaxHailuo02StandardImageToVideo: `ly.img.ai.fal-ai/minimax/hailuo-02/standard/image-to-video`
    -   PixverseV35TextToVideo: `ly.img.ai.fal-ai/pixverse/v3.5/text-to-video`
    -   KlingVideoV21MasterTextToVideo: `ly.img.ai.fal-ai/kling-video/v2.1/master/text-to-video`
    -   KlingVideoV21MasterImageToVideo: `ly.img.ai.fal-ai/kling-video/v2.1/master/image-to-video`
    -   ByteDanceSeedanceV1ProImageToVideo: `ly.img.ai.fal-ai/bytedance/seedance/v1/pro/image-to-video`
    -   ByteDanceSeedanceV1ProTextToVideo: `ly.img.ai.fal-ai/bytedance/seedance/v1/pro/text-to-video`
    -   Veo3TextToVideo: `ly.img.ai.fal-ai/veo3`
    -   Veo31TextToVideo: `ly.img.ai.fal-ai/veo3.1`
    -   Veo31FastTextToVideo: `ly.img.ai.fal-ai/veo3.1/fast`
    -   Veo31ImageToVideo: `ly.img.ai.fal-ai/veo3.1/image-to-video`
    -   Veo31FastImageToVideo: `ly.img.ai.fal-ai/veo3.1/fast/image-to-video`
    -   Veo31FastFirstLastFrameToVideo: `ly.img.ai.fal-ai/veo3.1/fast/first-last-frame-to-video`
    -   Runware Veo31.Text2Video: `ly.img.ai.runware/google/veo-3-1`
    -   Runware Veo31.Image2Video: `ly.img.ai.runware/google/veo-3-1/image2video`
    -   Runware Veo31Fast.Text2Video: `ly.img.ai.runware/google/veo-3-1-fast`
    -   Runware Veo31Fast.Image2Video: `ly.img.ai.runware/google/veo-3-1-fast/image2video`
    -   Runware Sora2.Text2Video: `ly.img.ai.runware/openai/sora-2`
    -   Runware Sora2.Image2Video: `ly.img.ai.runware/openai/sora-2/image2video`
    -   Runware Sora2Pro.Text2Video: `ly.img.ai.runware/openai/sora-2-pro`
    -   Runware Sora2Pro.Image2Video: `ly.img.ai.runware/openai/sora-2-pro/image2video`
    -   EachLabs KlingV26ProTextToVideo: `ly.img.ai.eachlabs/kling-v2-6-pro-text-to-video`
    -   EachLabs KlingV26ProImageToVideo: `ly.img.ai.eachlabs/kling-v2-6-pro-image-to-video`

### Asset History

Generated videos are automatically stored in asset sources with the following IDs:

-   MinimaxVideo01Live: `fal-ai/minimax/video-01-live.history`
-   MinimaxVideo01LiveImageToVideo: `fal-ai/minimax/video-01-live/image-to-video.history`
-   MinimaxHailuo02StandardImageToVideo: `fal-ai/minimax/hailuo-02/standard/image-to-video.history`
-   PixverseV35TextToVideo: `fal-ai/pixverse/v3.5/text-to-video.history`
-   KlingVideoV21MasterTextToVideo: `fal-ai/kling-video/v2.1/master/text-to-video.history`
-   KlingVideoV21MasterImageToVideo: `fal-ai/kling-video/v2.1/master/image-to-video.history`
-   ByteDanceSeedanceV1ProImageToVideo: `fal-ai/bytedance/seedance/v1/pro/image-to-video.history`
-   ByteDanceSeedanceV1ProTextToVideo: `fal-ai/bytedance/seedance/v1/pro/text-to-video.history`
-   Veo3TextToVideo: `fal-ai/veo3.history`
-   Veo31TextToVideo: `fal-ai/veo3.1.history`
-   Veo31FastTextToVideo: `fal-ai/veo3.1/fast.history`
-   Veo31ImageToVideo: `fal-ai/veo3.1/image-to-video.history`
-   Veo31FastImageToVideo: `fal-ai/veo3.1/fast/image-to-video.history`
-   Veo31FastFirstLastFrameToVideo: `fal-ai/veo3.1/fast/first-last-frame-to-video.history`
-   Runware Veo31.Text2Video: `runware/google/veo-3-1.history`
-   Runware Veo31.Image2Video: `runware/google/veo-3-1/image2video.history`
-   Runware Veo31Fast.Text2Video: `runware/google/veo-3-1-fast.history`
-   Runware Veo31Fast.Image2Video: `runware/google/veo-3-1-fast/image2video.history`
-   Runware Sora2.Text2Video: `runware/openai/sora-2.history`
-   Runware Sora2.Image2Video: `runware/openai/sora-2/image2video.history`
-   Runware Sora2Pro.Text2Video: `runware/openai/sora-2-pro.history`
-   Runware Sora2Pro.Image2Video: `runware/openai/sora-2-pro/image2video.history`
-   EachLabs KlingV26ProTextToVideo: `eachlabs/kling-v2-6-pro-text-to-video.history`
-   EachLabs KlingV26ProImageToVideo: `eachlabs/kling-v2-6-pro-image-to-video.history`

### Dock Integration

The plugin automatically registers a dock component with a sparkle icon that opens the video generation panel. To customize the component's position in the dock, use the `setDockOrder` method:

```typescript
// Add the AI Video component to the beginning of the dock
cesdk.ui.setDockOrder([
  'ly.img.ai.video-generation.dock',
  ...cesdk.ui.getDockOrder()
]);

// Or add it at a specific position
const currentOrder = cesdk.ui.getDockOrder();
currentOrder.splice(2, 0, 'ly.img.ai.video-generation.dock');
cesdk.ui.setDockOrder(currentOrder);
```

## Translations

For customization and localization, see the [translations.json](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-video-generation-web/translations.json) file which contains provider-specific translation keys for video generation interfaces.

## Related Packages

-   [@imgly/plugin-ai-generation-web](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-generation-web) - Core utilities for AI generation
-   [@imgly/plugin-ai-image-generation-web](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-image-generation-web) - AI image generation
-   [@imgly/plugin-ai-audio-generation-web](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-audio-generation-web) - AI audio generation

## License

This plugin is part of the IMG.LY plugin ecosystem for CreativeEditor SDK. Please refer to the license terms in the package.
