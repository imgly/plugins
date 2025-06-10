# Integrating AI Capabilities into CreativeEditor SDK

This tutorial will guide you through integrating AI-powered generation capabilities into your CreativeEditor SDK application using the `@imgly/plugin-ai-apps-web` package. You'll learn how to set up various AI providers for generating images, videos, audio, and text.

## Prerequisites

-   Basic knowledge of JavaScript/TypeScript and React
-   Familiarity with CreativeEditor SDK
-   API keys for AI services (Anthropic, fal.ai, ElevenLabs, etc.)

## 1. Project Setup

First, set up your project and install the necessary packages:

```bash
# Initialize a new project or use an existing one
npm install @cesdk/cesdk-js
npm install @imgly/plugin-ai-apps-web

# Install individual AI generation packages as needed
npm install @imgly/plugin-ai-image-generation-web
npm install @imgly/plugin-ai-video-generation-web
npm install @imgly/plugin-ai-audio-generation-web
npm install @imgly/plugin-ai-text-generation-web
```

## 2. Full Integration Example

Here's a comprehensive example demonstrating how to integrate all AI capabilities with CreativeEditor SDK:

```tsx
import React, { useRef } from 'react';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import AiApps from '@imgly/plugin-ai-apps-web';

// Import providers from individual AI generation packages
import Anthropic from '@imgly/plugin-ai-text-generation-web/anthropic';
import FalAiImage from '@imgly/plugin-ai-image-generation-web/fal-ai';
import FalAiVideo from '@imgly/plugin-ai-video-generation-web/fal-ai';
import Elevenlabs from '@imgly/plugin-ai-audio-generation-web/elevenlabs';

// Import middleware utilities
import { uploadMiddleware } from '@imgly/plugin-ai-generation-web';

function App() {
    const cesdk = useRef<CreativeEditorSDK>();

    return (
        <div
            style={{ width: '100vw', height: '100vh' }}
            ref={(domElement) => {
                if (domElement != null) {
                    CreativeEditorSDK.create(domElement, {
                        license: 'your-license-key',
                        callbacks: {
                            onUpload: 'local',
                            onExport: 'download'
                        },
                        ui: {
                            elements: {
                                navigation: {
                                    action: {
                                        load: true,
                                        export: true
                                    }
                                }
                            }
                        }
                    }).then(async (instance) => {
                        cesdk.current = instance;

                        // Add asset sources
                        await Promise.all([
                            instance.addDefaultAssetSources(),
                            instance.addDemoAssetSources({ sceneMode: 'Video' })
                        ]);

                        // Configure AI Apps dock position
                        instance.ui.setDockOrder([
                            'ly.img.ai/apps.dock',
                            ...instance.ui.getDockOrder()
                        ]);

                        // Note: Canvas menu quick actions are automatically added by the providers
                        // You can access them via provider canvasMenu properties if needed:
                        // - AnthropicProvider.canvasMenu.text.id
                        // - FalAiImage.RecraftV3.canvasMenu.image.id
                        // - FalAiVideo.MinimaxVideo01LiveImageToVideo.canvasMenu.image.id

                        // Create a video scene to utilize all capabilities
                        await instance.createVideoScene();

                        // Add the AI Apps plugin with all providers
                        instance.addPlugin(
                            AiApps({
                                providers: {
                                    // Text generation and transformation
                                    text2text: Anthropic.AnthropicProvider({
                                        proxyUrl:
                                            'https://your-server.com/api/anthropic-proxy'
                                    }),

                                    // Image generation
                                    text2image: FalAiImage.RecraftV3({
                                        proxyUrl: 'https://your-server.com/api/fal-ai-proxy',
                                        // Add upload middleware to store generated images on your server
                                        middleware: [
                                            uploadMiddleware(async (output) => {
                                                // Upload the generated image to your server
                                                const response = await fetch('https://your-server.com/api/store-image', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ 
                                                        imageUrl: output.url,
                                                        metadata: { source: 'ai-generation' }
                                                    })
                                                });
                                                
                                                const result = await response.json();
                                                
                                                // Return the output with your server's URL
                                                return {
                                                    ...output,
                                                    url: result.permanentUrl
                                                };
                                            })
                                        ]
                                    }),
                                    image2image: FalAiImage.GeminiFlashEdit({
                                        proxyUrl:
                                            'https://your-server.com/api/fal-ai-proxy'
                                    }),

                                    // Video generation
                                    text2video: FalAiVideo.MinimaxVideo01Live({
                                        proxyUrl:
                                            'https://your-server.com/api/fal-ai-proxy'
                                    }),
                                    image2video:
                                        FalAiVideo.MinimaxVideo01LiveImageToVideo(
                                            {
                                                proxyUrl:
                                                    'https://your-server.com/api/fal-ai-proxy'
                                            }
                                        ),

                                    // Audio generation
                                    text2speech:
                                        Elevenlabs.ElevenMultilingualV2({
                                            proxyUrl:
                                                'https://your-server.com/api/elevenlabs-proxy'
                                        }),
                                    text2sound: Elevenlabs.ElevenSoundEffects({
                                        proxyUrl:
                                            'https://your-server.com/api/elevenlabs-proxy'
                                    })
                                }
                            })
                        );
                    });
                } else if (cesdk.current != null) {
                    cesdk.current.dispose();
                }
            }}
        ></div>
    );
}

export default App;
```

## 3. AI Provider Configuration

Each AI provider type serves a specific purpose and creates different types of content:

### Text Generation (Anthropic)

```typescript
text2text: AnthropicProvider({
    proxyUrl: 'https://your-server.com/api/anthropic-proxy'
});
```

The text provider enables capabilities like:

-   Improving writing quality
-   Fixing spelling and grammar
-   Making text shorter or longer
-   Changing tone (professional, casual, friendly)
-   Translating to different languages
-   Custom text transformations

### Image Generation (fal.ai)

```typescript
// Text-to-image generation
text2image: FalAiImage.RecraftV3({
  proxyUrl: 'https://your-server.com/api/fal-ai-proxy'
}),

// Image-to-image transformation
image2image: FalAiImage.GeminiFlashEdit({
  proxyUrl: 'https://your-server.com/api/fal-ai-proxy'
})
```

Image generation features include:

-   Creating images from text descriptions
-   Multiple style options (realistic, illustration, vector)
-   Various size presets and custom dimensions
-   Transforming existing images based on text prompts

### Video Generation (fal.ai)

```typescript
// Text-to-video generation
text2video: FalAiVideo.MinimaxVideo01Live({
  proxyUrl: 'https://your-server.com/api/fal-ai-proxy'
}),

// Image-to-video transformation
image2video: FalAiVideo.MinimaxVideo01LiveImageToVideo({
  proxyUrl: 'https://your-server.com/api/fal-ai-proxy'
})
```

Video generation capabilities include:

-   Creating videos from text descriptions
-   Transforming still images into videos
-   Fixed output dimensions (typically 1280×720)
-   5-second video duration

### Audio Generation (ElevenLabs)

```typescript
// Text-to-speech generation
text2speech: Elevenlabs.ElevenMultilingualV2({
  proxyUrl: 'https://your-server.com/api/elevenlabs-proxy'
}),

// Sound effect generation
text2sound: Elevenlabs.ElevenSoundEffects({
  proxyUrl: 'https://your-server.com/api/elevenlabs-proxy'
})
```

Audio generation features include:

-   Text-to-speech with multiple voices
-   Multilingual support
-   Adjustable speaking speed
-   Sound effect generation from text descriptions
-   Creating ambient sounds and effects

## 4. UI Integration

The AI Apps plugin registers several UI components to CreativeEditor SDK:

### AI Dock Button

The main entry point for AI features is the AI dock button, which you can position in the dock:

```typescript
// Add the AI dock component to the beginning of the dock
cesdk.ui.setDockOrder(['ly.img.ai/apps.dock', ...cesdk.ui.getDockOrder()]);

// Or add it at a specific position
const currentOrder = cesdk.ui.getDockOrder();
currentOrder.splice(2, 0, 'ly.img.ai/apps.dock');
cesdk.ui.setDockOrder(currentOrder);
```

### Canvas Menu Options

AI text and image transformations are automatically added to the canvas context menu by the enhanced providers. You can access canvas menu component IDs from the providers:

```typescript
// Canvas menu components are automatically registered
// Access them via enhanced provider properties:
const textCanvasMenu = AnthropicProvider.canvasMenu.text.id; // 'ly.img.ai.text.canvasMenu'
const imageCanvasMenu = FalAiImage.RecraftV3.canvasMenu.image.id; // 'ly.img.ai.image.canvasMenu'

// Manual ordering (if needed):
cesdk.ui.setCanvasMenuOrder([
    AnthropicProvider.canvasMenu.text.id,
    FalAiImage.RecraftV3.canvasMenu.image.id,
    ...cesdk.ui.getCanvasMenuOrder()
]);
```

### Customizing Quick Actions

If you need to customize which quick actions appear or their order, you can disable automatic canvas menu registration and configure manually:

#### Disabling Automatic Registration

```typescript
// Configure providers without automatic canvas menu registration
instance.addPlugin(
    AiApps({
        providers: {
            text2text: AnthropicProvider({
                proxyUrl: 'https://your-server.com/api/anthropic-proxy',
                addToCanvasMenu: false // Disable automatic registration
            }),
            text2image: FalAiImage.RecraftV3({
                proxyUrl: 'https://your-server.com/api/fal-ai-proxy',
                addToCanvasMenu: false
            }),
            image2image: FalAiImage.GeminiFlashEdit({
                proxyUrl: 'https://your-server.com/api/fal-ai-proxy',
                addToCanvasMenu: false
            })
        }
    })
);
```

#### Manual Canvas Menu Configuration

```typescript
// Manually configure canvas menu with custom quick action selection and order
instance.ui.setCanvasMenuOrder([
    {
        id: 'ly.img.ai.text.canvasMenu',
        children: [
            'anthropic.improve',      // Most commonly used
            'anthropic.fix',
            'ly.img.separator',
            'anthropic.translate',    // Prioritized for international users
            'anthropic.changeTextTo'  // Custom transformations
            // Removed: shorter, longer, changeTone for simplified menu
        ]
    },
    {
        id: 'ly.img.ai.image.canvasMenu',
        children: [
            'fal-ai/gemini-flash-edit.changeImage',     // Primary image editing
            'fal-ai/gemini-flash-edit.swapBackground',  // Popular feature
            'ly.img.separator',
            'fal-ai/gemini-flash-edit.createVariant',   // Creative options
            'fal-ai/minimax/video-01-live/image-to-video.createVideo' // Video creation
            // Removed: styleTransfer, artistStyles for focused experience
        ]
    },
    ...instance.ui.getCanvasMenuOrder()
]);
```

#### Quick Action Customization Strategies

**For Simplified User Experience:**
- Remove advanced features like style transfer and tone changing
- Keep only the most commonly used actions
- Focus on core editing capabilities

**For Power Users:**
- Include all available quick actions
- Organize by frequency of use
- Group related actions with separators

**For Specific Use Cases:**
- **Content Creation**: Prioritize `improve`, `changeTextTo`, `createVariant`
- **International Apps**: Prioritize `translate`, `changeTone`
- **Quick Edits**: Focus on `fix`, `changeImage`, `swapBackground`

#### Accessing Provider Quick Action Lists

```typescript
// Get the full list of available quick actions from each provider
const textQuickActions = AnthropicProvider.canvasMenu.text.children;
// ['anthropic.improve', 'anthropic.fix', 'anthropic.shorter', ...]

const imageQuickActions = FalAiImage.GeminiFlashEdit.canvasMenu.image.children;
// ['fal-ai/gemini-flash-edit.changeImage', 'fal-ai/gemini-flash-edit.swapBackground', ...]

// Use these arrays as a base for your custom configuration
cesdk.ui.setCanvasMenuOrder([
    {
        id: 'ly.img.ai.text.canvasMenu',
        children: textQuickActions.slice(0, 4) // Take only first 4 actions
    },
    ...cesdk.ui.getCanvasMenuOrder()
]);
```

### AI Apps Menu

In video mode, clicking the AI dock button shows cards for all available AI generation types. This menu automatically adjusts based on the available providers you've configured.

## 5. Using Middleware

The AI generation framework supports middleware that can enhance or modify the generation process. Middleware functions are executed in sequence and can perform operations before generation, after generation, or both.

### Common Middleware Types

#### Upload Middleware

The `uploadMiddleware` is useful when you need to store generated content on your server before it's used:

```typescript
import { uploadMiddleware } from '@imgly/plugin-ai-generation-web';

// In your provider configuration
middleware: [
  uploadMiddleware(async (output) => {
    // Upload the output to your server
    const response = await fetch('https://your-server.com/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: output.url })
    });
    
    const result = await response.json();
    
    // Return updated output with your server's URL
    return {
      ...output,
      url: result.permanentUrl
    };
  })
]
```

Use cases for upload middleware:
- Storing generated assets in your own cloud storage
- Adding watermarks or processing assets before use
- Tracking/logging generated content
- Implementing licensing or rights management

#### Rate Limiting Middleware

To prevent abuse of AI services, you can implement rate limiting:

```typescript
import { rateLimitMiddleware } from '@imgly/plugin-ai-generation-web';

// In your provider configuration
middleware: [
  rateLimitMiddleware({
    maxRequests: 10,
    timeWindowMs: 60 * 60 * 1000, // 1 hour
    onRateLimitExceeded: (input, options, info) => {
      // Show a notice to the user
      console.log(`Rate limit reached: ${info.currentCount}/${info.maxRequests}`);
      return false; // Reject the request
    }
  })
]
```

#### Custom Error Handling Middleware

You can create custom middleware for error handling:

```typescript
const errorMiddleware = async (input, options, next) => {
  try {
    return await next(input, options);
  } catch (error) {
    // Handle error (show UI notification, log, etc.)
    console.error('Generation failed:', error);
    // You can rethrow or return a fallback
    throw error;
  }
};
```

### Middleware Order

The order of middleware is important - they're executed in the sequence provided:

```typescript
middleware: [
  // Executes first
  rateLimitMiddleware({ maxRequests: 10, timeWindowMs: 3600000 }),
  
  // Executes second (only if rate limit wasn't exceeded)
  loggingMiddleware(),
  
  // Executes third (after generation completes)
  uploadMiddleware(async (output) => { /* ... */ })
]
```

## 6. Using Proxy Services

For security reasons, you should never include your AI service API keys directly in client-side code. Instead, you should set up proxy services that securely forward requests to AI providers while keeping your API keys secure on the server side.

Each AI provider configuration requires a `proxyUrl` parameter, which should point to your server-side endpoint that handles authentication and forwards requests to the AI service:

```typescript
text2image: FalAiImage.RecraftV3({
    proxyUrl: 'https://your-server.com/api/falai'
});
```

### Proxy Implementation Requirements

Your proxy should implement specific requirements for each AI service:

#### 1. Anthropic Proxy

- **Target URL**: `https://api.anthropic.com/`
- **Authentication Header**: Add `X-Api-Key` header with your Anthropic API key
- **Request Handling**: Forward request body as-is to Anthropic API
- **Response Handling**: Remove `content-encoding` headers to handle compressed responses correctly

#### 2. fal.ai Proxy

- **Dynamic URL**: Use a special header called `x-fal-target-url` to determine the actual endpoint
- **Authentication Header**: Add `Authorization: Key YOUR_FAL_KEY` header
- **Request Forwarding**: Preserve the complete request body and query parameters
- For more information on the requirements, refer to fal.ai's [documentation](https://docs.fal.ai/model-endpoints/server-side/#the-proxy-formula).

#### 3. ElevenLabs Proxy

- **Target URL**: `https://api.elevenlabs.io/`
- **Authentication Header**: Add `xi-api-key` header with your ElevenLabs API key
- **Headers**: Add an `Accept: audio/mpeg` header for audio requests.
- **Response Handling**: Remove `content-encoding` headers to handle compressed responses correctly

#### 4. OpenAI Proxy

- **Target URL**: `https://api.openai.com/v1/`
- **Authentication Header**: Add `Authorization: Bearer YOUR_OPENAI_API_KEY` header
- **Response Handling**: Remove `content-encoding` headers to handle compressed responses correctly
- **Rate Limiting**: Implement rate limiting based on your OpenAI plan tier (recommended)
- For more information on the requirements, refer to OpenAI's [documentation](https://platform.openai.com/docs/api-reference/debugging-requests)

### Important Information for All Proxies

**Response Streaming**

To handle large responses efficiently, response streaming should be enabled for all proxies. Common approaches include:

-   **Axios**: `responseType: 'stream'`
-   **Fetch API**: Access `response.body` as a `ReadableStream`
-   **Node.js native HTTP clients**: Use stream-based responses
-   **Other HTTP clients**: Check documentation for streaming support


### General Proxy Design

A well-designed proxy service should:

1. **Route requests** to the appropriate AI service based on the endpoint path
2. **Add authentication** headers containing your API keys
3. **Forward the request body** to maintain payload integrity
4. **Handle response streaming** for services that support it (like Anthropic)
5. **Implement proper CORS headers** to allow browser requests
6. **Add appropriate error handling** and logging
7. **Consider rate limiting** to protect your API keys from overuse

### Security Considerations

When implementing your proxy:

- Store API keys securely as environment variables
- Implement request validation to prevent abuse
- Consider adding user authentication to your proxy endpoints
- Monitor usage to detect unusual patterns
- Implement proper error handling without leaking sensitive information

This approach ensures your API keys remain secure while still allowing your application to utilize AI services. For a complete example of a proxy implementation, you can find various proxy templates online that can be adapted for your specific needs.

## Quick Actions Reference

For a complete reference of all available quick actions and their IDs, see the individual plugin documentation:

- **Text Quick Actions** (Anthropic): `anthropic.improve`, `anthropic.fix`, `anthropic.shorter`, `anthropic.longer`, `anthropic.changeTone`, `anthropic.translate`, `anthropic.changeTextTo`
- **Image Quick Actions** (GeminiFlashEdit): `fal-ai/gemini-flash-edit.changeImage`, `fal-ai/gemini-flash-edit.swapBackground`, `fal-ai/gemini-flash-edit.styleTransfer`, `fal-ai/gemini-flash-edit.artistStyles`, `fal-ai/gemini-flash-edit.createVariant`
- **Video Quick Actions**: `fal-ai/minimax/video-01-live/image-to-video.createVideo`

Each quick action ID follows the pattern `{provider-model-key}.{action-name}` to ensure uniqueness across providers.

## Conclusion

By following this tutorial, you've learned how to integrate powerful AI generation capabilities into your CreativeEditor SDK application. You now know how to:

1. Set up various AI providers for different content types
2. Configure the AI Apps plugin with all necessary providers
3. Integrate AI features into the editor UI
4. Protect your API keys with proxy services

This integration enables your users to create impressive content with AI assistance directly within your application, enhancing their creative workflow and the overall value of your product.

For more details about each AI provider, refer to the individual package documentation:

-   [@imgly/plugin-ai-generation-web](https://github.com/imgly/plugin-ai-generation-web)
-   [@imgly/plugin-ai-image-generation-web](https://github.com/imgly/plugin-ai-image-generation-web)
-   [@imgly/plugin-ai-video-generation-web](https://github.com/imgly/plugin-ai-video-generation-web)
-   [@imgly/plugin-ai-audio-generation-web](https://github.com/imgly/plugin-ai-audio-generation-web)
-   [@imgly/plugin-ai-text-generation-web](https://github.com/imgly/plugin-ai-text-generation-web)
