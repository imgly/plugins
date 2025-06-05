# IMG.LY AI Generation Utilities

A powerful toolkit for implementing AI generation providers in CreativeEditor SDK.

## Overview

This package provides the foundation for creating AI generation plugins for CreativeEditor SDK. It offers a standardized interface for implementing AI generation providers that can create images, videos, audio, or text assets. The package includes utilities for handling:

-   Provider registration and initialization
-   User interface generation

## Getting Started

### Installation

```bash
npm install @imgly/plugin-ai-generation-web
```

### Creating a Custom Provider

The core of this package is the `Provider` interface which defines the contract for AI generation providers. Before we go into details, here's how to implement a basic provider:

```typescript
import {
    Provider,
    ImageOutput,
    initProvider,
    loggingMiddleware,
    CommonProviderConfiguration
} from '@imgly/plugin-ai-generation-web';

// Define your provider configuration interface
interface MyProviderConfiguration 
    extends CommonProviderConfiguration<MyInputType, ImageOutput> {
    // Add any provider-specific configuration here
    baseURL?: string;
}

// Create a provider factory function
function createMyImageProvider(config: MyProviderConfiguration): Provider<'image', MyInputType, ImageOutput> {
  return {
    // Unique identifier for this provider
    id: 'my-image-provider',

    // Define output asset type, other options are 'video', 'audio', 'text'
    kind: 'image',

    // Initialize the provider
    initialize: async ({ engine, cesdk }) => {
        // Setup APIs, register further components, etc.
        myAIApi.configure({ 
            apiKey: 'YOUR_API_KEY',
            headers: config.headers  // Use custom headers if provided
        });
    },

    // Define input panel and UI components
    input: {
        // Define how the input panel is rendered
        panel: {
            // Option 1: Schema-based UI (using OpenAPI)
            type: 'schema',
            document: myApiSchema,
            inputReference: '#/components/schemas/GenerationInput',
            getBlockInput: async (input) => ({
                image: { width: 1024, height: 1024 }
            })
        },

        // Optional: Quick actions for the quick action (sub)menu in the canvas menu
        quickActions: {
            actions: [
                {
                    id: 'enhance-image',
                    version: '1',
                    enable: true,
                    render: (context, quickActionContext) => {
                        // Render quick action UI
                    }
                }
            ]
        }
    },

    // Define output generation behavior
    output: {
        // Allow cancellation
        abortable: true,

        // Store generated assets, options are:
        // - false: No history
        // - '@imgly/local': In-memory storage (lost on refresh)
        // - '@imgly/indexedDB': Browser IndexedDB storage
        // - any other string: Handled as a custom asset source ID
        history: '@imgly/indexedDB',

        // Add middleware for pre/post-processing of the generation
        middleware: [loggingMiddleware()],

        // Configure success/error notifications
        notification: {
            success: {
                show: true,
                message: 'Generation successful!'
            }
        },

        // Core generation function
        generate: async (input, { abortSignal, engine }) => {
            // Call your AI API and return result
            const response = await myAIApi.generateImage(input, {
                headers: config.headers  // Pass custom headers to API
            });

            return {
                kind: 'image',
                url: response.imageUrl
            };
        }
    }
  };
}

// Usage example
const myImageProvider = createMyImageProvider({
    proxyUrl: 'https://your-api-proxy.example.com',
    headers: {
        'x-client-version': '1.0.0',
        'x-request-source': 'cesdk-plugin'
    },
    debug: false,
    middleware: [loggingMiddleware()],
    baseURL: 'https://assets.example.com'
});
```

## Provider Interface

The Provider interface is generic and type-safe, supporting four output kinds:

```typescript
// K: Output kind ('image', 'video', 'audio', 'text')
// I: Input type specific to your provider, i.e. what does the generate function need
// O: Output type (ImageOutput, VideoOutput, AudioOutput, TextOutput)
// C: Chunk type for streaming (optional, defaults to O)
interface Provider<K extends OutputKind, I, O extends Output, C = O> { ... }
```

## Common Provider Configuration

All providers should extend the `CommonProviderConfiguration` interface, which provides standardized configuration options:

```typescript
interface CommonProviderConfiguration<I, O extends Output> {
    // The proxy URL to use for the provider
    proxyUrl: string;
    
    // Enable debug mode for additional logging
    debug?: boolean;
    
    // Middleware for request/response processing
    middleware?: Middleware<I, O>[];
    
    // Custom headers to include in all API requests
    headers?: Record<string, string>;
}
```

The `headers` property allows you to include custom HTTP headers in all API requests made by your provider. This is useful for:
- Adding custom client identification headers
- Including version information
- Passing through metadata required by your API
- Adding correlation IDs for request tracing

**Implementation Note:** When implementing your provider's `generate` function, ensure you merge the custom headers with any required headers for your API. For example:

```typescript
// In your generate function
const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        ...config.headers  // Spread custom headers
    },
    body: JSON.stringify(requestData)
});
```

Example provider configuration:

```typescript
const myProvider = createMyProvider({
    proxyUrl: 'https://api.example.com',
    headers: {
        'x-client-version': '1.0.0',
        'x-request-source': 'cesdk-plugin'
    },
    debug: false,
    middleware: [loggingMiddleware()]
});
```

### Key Provider Options

-   **id**: Unique identifier for your provider
-   **kind**: Type of asset generated ('image', 'video', 'audio', 'text')
-   **name**: Optional human-readable name
-   **initialize**: Setup function called when the provider is loaded
-   **input**: Configuration for input UI and parameters
-   **output**: Configuration for generation and result handling

#### Provider Output Options

The `output` property has several important options:

-   **generate**: Main function that performs the actual generation
-   **history**: Asset storage strategy ('false', '@imgly/local', '@imgly/indexedDB', or custom ID)
-   **abortable**: Whether generation can be cancelled by the user
-   **middleware**: Array of middleware functions for pre/post-processing
-   **notification**: Success and error notification configuration
-   **generationHintText**: Text to display below the generation button

##### Notification Configuration

The notification system allows fine-grained control over success and error messages:

```typescript
notification: {
  success: {
    // Control whether to show notifications (can be dynamic)
    show: true, // or (context) => shouldShow(context)

    // Message text or i18n key (can be dynamic)
    message: 'Generation successful!', // or (context) => getMessage(context)

    // Optional action button
    action: {
      label: 'View', // or (context) => getLabel(context)
      onClick: (context) => { /* handle click */ }
    },

    // How long to show the notification
    duration: 'short' // or 'medium', 'long', 'infinite'
  },

  error: {
    // Similar options for error notifications
    show: true,
    message: 'Generation failed', // or (context) => getErrorMessage(context)
    // ...
  }
}
```

##### Streaming Generation

The `generate` function can return a simple output object or an AsyncGenerator for streaming results:

```typescript
// Simple response
generate: async (input, options) => {
  const result = await api.generateImage(input);
  return { kind: 'image', url: result.url };
}

// Streaming response (right now only supported for text)
generate: async function* (input, options) {
  const stream = api.streamGenerationResult(input);

  let inferredText: string = '';
  // Yield interim results
  for await (const chunk of stream) {
    inferredText += chunk;
    yield { kind: 'text', text: inferredText };
  }

  // Return final result
  return { kind: 'text', url: inferredText };
}
```

##### Generation Hint Text

The `generationHintText` property allows providers to display helpful information below the generation button:

```typescript
generationHintText: "Generation may take up to a minute. You can close this panel and will be notified when ready."
```

## Input Panel Types

The package supports two approaches for creating input panels:

### 1. Schema-based Input Panels

The `schema` type uses OpenAPI specification to declaratively define your input form.

```typescript
input: {
  panel: {
    type: 'schema',
    // Complete OpenAPI v3 document describing your inputs
    document: myOpenAPISchema,
    // JSON pointer to your input schema within the document
    inputReference: '#/components/schemas/GenerationInput',
    // Optional property to control display order
    orderExtensionKeyword: 'x-order-properties',
    // Function that converts input to block parameters
    getBlockInput: async (input) => ({
      image: { width: 1024, height: 1024 }
    }),
    // Optional custom renderers for specific properties found in the schema
    renderCustomProperty: {
      // This is a custom renderer for a fictional `imageUrl` property
      imageUrl: (context, property) => {
        const valueState = context.state('imageUrl', '');
        context.builder.TextInput('imageUrl', {
          label: 'Image URL',
          ...valueState
        });

        // Return a function that returns the value for this property
        return () => { id: property.id, type: 'string', value: valueState.value };
      }
    }
  }
}
```

#### OpenAPI Schema Example

```json
{
    "openapi": "3.0.0",
    "components": {
        "schemas": {
            "GenerationInput": {
                "type": "object",
                "required": ["prompt"],
                "properties": {
                    "prompt": {
                        "type": "string",
                        "title": "Prompt",
                        "description": "Describe what you want to generate",
                        "x-imgly-builder": {
                            "component": "TextArea"
                        }
                    },
                    "width": {
                        "type": "integer",
                        "title": "Width",
                        "default": 1024,
                        "enum": [512, 1024, 2048],
                        "x-imgly-builder": {
                            "component": "Select"
                        }
                    }
                },
                "x-order-properties": ["prompt", "width"]
            }
        }
    }
}
```

#### Benefits of Schema-based Input

-   Built-in validation based on schema constraints
-   AI provider like fal.ai provide schemas for their models
-   Automatic UI component generation based on property types
-   Extensions like `x-imgly-builder` to specify component types
-   Property ordering via `orderExtensionKeyword`
-   Customizable property rendering with `renderCustomProperty`

### 2. Custom Input Panels

The `custom` type gives you complete control over UI components.

```typescript
input: {
  panel: {
    type: 'custom',
    render: (context, options) => {
      // Use the builder pattern to create UI components
      const promptState = context.state('prompt', '');
      context.builder.TextArea('prompt', {
        label: 'Prompt',
        ...promptState
      });

      // Set up width selection
      const widthState = context.state('width', 1024);
      context.builder.Select('width', {
        label: 'Width',
        options: [
          { value: 512, label: '512px' },
          { value: 1024, label: '1024px' },
          { value: 2048, label: '2048px' }
        ],
        ...widthState
      });

      // Return functions to get input values and block parameters
      return {
        // The input for the generate function
        getInput: () => ({
          prompt: promptState.value,
          width: widthState.value
        }),
        // The input for the block creation
        getBlockInput: () => ({
          image: {
            width: widthState.value,
            height: widthState.value,
            label: `AI Image: ${promptState.value.substring(0, 20)}...`
          }
        })
      };
    }
  }
}
```

#### Benefits of Custom Input Panels

-   Complete control over UI components and layout
-   Complex logic between fields (dependencies, conditionals)
-   Dynamic UI that changes based on user interactions

#### Panel User Flow Options

Both panel types accept additional configuration:

```typescript
panel: {
  type: 'schema', // or 'custom'
  // ...panel type specific options

  // Control the generation flow
  userFlow: 'placeholder', // or 'generation-only' (default)

  // Include/exclude history library from panel
  includeHistoryLibrary: true // (default)
}
```

-   **userFlow**:

    -   `placeholder`: Creates a block as a placeholder with loading state when generation starts
    -   `generation-only`: Only triggers generation without creating a placeholder

-   **includeHistoryLibrary**: Controls whether the history library is shown in the panel

## The `getBlockInput` Function

The `getBlockInput` function is crucial for both panel types. It converts your input into the parameters needed to create a block in CreativeEditor SDK.

### What It Does

-   Defines dimensions, duration, and appearance of asset blocks
-   Creates placeholders before generation completes
-   Maps your AI provider's inputs to standardized block parameters

### Required Return Values by Output Kind

Each output kind requires specific parameters:

#### For Images

```typescript
getBlockInput: async (input) => ({
    image: {
        width: 1024, // Required - Width in pixels
        height: 1024, // Required - Height in pixels
        label: 'My Image' // Optional - Display name
    }
});
```

#### For Videos

```typescript
getBlockInput: async (input) => ({
    video: {
        width: 1280, // Required - Width in pixels
        height: 720, // Required - Height in pixels
        duration: 10, // Required - Duration in seconds
        label: 'My Video' // Optional - Display name
    }
});
```

#### For Audio

```typescript
getBlockInput: async (input) => ({
    audio: {
        duration: 30, // Optional - Duration in seconds
        thumbnailUrl: 'path/to/img.jpg', // Optional - URL for thumbnail
        label: 'My Audio' // Optional - Display name
    }
});
```

#### For Text

```typescript
getBlockInput: async (input) => ({
    text: {
        length: 250, // Required - Approximate character length
        label: 'My Text' // Optional - Display name
    }
});
```

## Quick Actions

Quick Actions provide context-aware AI generation capabilities directly in CreativeEditor SDK's canvas menu. Unlike panels (which appear in the side panel), quick actions appear when users select elements on the canvas.

Instead of adding a single button for every different generation provider, a single quick action menu is registered and used by all providers. This allows users to select the desired action without cluttering the UI.

### Purpose of Quick Actions

-   **Context-Aware**: Operate on selected blocks in the canvas
-   **Streamlined Workflow**: Allow users to apply AI transformations without switching to a panel
-   **Immediate Feedback**: Provide quick access to common AI operations
-   **In-Canvas Experience**: Keep users in their creative workflow

### Quick Action Structure

```typescript
quickActions: {
    actions: [
        {
            // Unique identifier
            id: 'enhance-image',

            // Version for compatibility
            version: '1',

            // Enable/disable based on condition
            // E.g., you should check for the correct block type here.
            enable: true, // or a function: (context) => boolean

            // Optional scope requirements
            scopes: ['text.edit'],

            // Optional confirmation after generation
            confirmation: true,

            // Prevent selection changes during confirmation
            lockDuringConfirmation: true,

            // Basic menu item rendering
            render: (context, quickActionContext) => {
                // Add button to quick action menu
            },

            // Optional expanded mode rendering
            renderExpanded: (context, quickActionContext) => {
                // Render more complex interface
            }
        }
    ];
}
```

### Quick Action Helper Components

The package provides several helper components for common quick action patterns:

#### 1. QuickActionBaseButton

A simple button that triggers an action when clicked:

```typescript
import { QuickActionBaseButton } from '@imgly/plugin-ai-generation-web';

const quickAction = QuickActionBaseButton<MyInput, ImageOutput>({
  quickAction: {
    id: 'enhanceImage',
    version: '1',
    enable: true
  },
  buttonOptions: {
    icon: '@imgly/MagicWand'
  },
  onClick: async (context) => {
    await context.generate({
      prompt: 'Enhance this image and improve quality'
    });
  }
});
```

#### 2. QuickActionBasePrompt

A button that expands to show a text prompt input:

```typescript
import { QuickActionBasePrompt } from '@imgly/plugin-ai-generation-web';

const quickAction = QuickActionBasePrompt<MyInput, ImageOutput>({
  quickAction: {
    id: 'changeImage',
    version: '1',
    enable: true,
    confirmation: true
  },
  buttonOptions: {
    icon: '@imgly/Edit'
  },
  textAreaOptions: {
    placeholder: 'Describe the changes you want...'
  },
  onApply: async (prompt, context) => {
    return context.generate({
      prompt: prompt,
      // other parameters
    });
  }
});
```

#### 3. QuickActionBaseSelect

A button that opens a menu with selectable options:

```typescript
import { QuickActionBaseSelect } from '@imgly/plugin-ai-generation-web';

const quickAction = QuickActionBaseSelect<MyInput, ImageOutput>({
  cesdk: cesdk,
  quickAction: {
    id: 'styleTransfer',
    version: '1',
    enable: true,
    confirmation: true
  },
  buttonOptions: {
    icon: '@imgly/Appearance'
  },
  items: [
    {
      id: 'water',
      label: 'Watercolor Painting',
      prompt: 'Convert to watercolor painting.'
    },
    {
      id: 'oil',
      label: 'Oil Painting',
      prompt: 'Render in oil painting style.'
    }
  ],
  mapInput: (input) => ({
    prompt: input.item.prompt,
    image_url: input.uri
  })
});
```

### Ready-to-Use Image Quick Actions

The package includes several ready-to-use quick actions for common image manipulation tasks:

#### 1. QuickActionChangeImage

Changes an image based on a text prompt:

```typescript
import { QuickActionChangeImage } from '@imgly/plugin-ai-generation-web';

const changeImageAction = QuickActionChangeImage<MyInput, ImageOutput>({
  cesdk: cesdk,
  mapInput: (input) => ({
    prompt: input.prompt,
    image_url: input.uri
  })
});
```

#### 2. QuickActionSwapImageBackground

Changes just the background of an image:

```typescript
import { QuickActionSwapImageBackground } from '@imgly/plugin-ai-generation-web';

const swapBackgroundAction = QuickActionSwapImageBackground<MyInput, ImageOutput>({
  cesdk: cesdk,
  mapInput: (input) => ({
    prompt: input.prompt,
    image_url: input.uri
  })
});
```

#### 3. QuickActionImageVariant

Creates a variant of an image by duplicating it first:

```typescript
import { QuickActionImageVariant } from '@imgly/plugin-ai-generation-web';

const imageVariantAction = QuickActionImageVariant<MyInput, ImageOutput>({
  cesdk: cesdk,
  onApply: async ({ prompt, uri, duplicatedBlockId }, context) => {
    return context.generate(
      {
        prompt,
        image_url: uri
      },
      {
        blockIds: [duplicatedBlockId]
      }
    );
  }
});
```

### Simple Quick Action Example

```typescript
{
  id: 'enhance-image',
  version: '1',
  enable: true,
  render: ({ builder }, { generate, closeMenu }) => {
    builder.Button('enhance', {
      label: 'Enhance Image',
      icon: '@imgly/MagicWand',
      onClick: async () => {
        // Generate with fixed parameters
        await generate({
          prompt: 'Enhance this image and improve quality'
        });
        closeMenu();
      }
    });
  }
}
```

### Quick Action with Expanded Menu

This example shows how to create a quick action that expands into a more complex UI with input fields. During expansion, the content of the complete menu is replaced with the `renderExpanded` function.

```typescript
{
  id: 'change-image',
  version: '1',
  enable: true,
  render: ({ builder }, { toggleExpand }) => {
    // Render basic button that expands to complex UI
    builder.Button('change', {
      label: 'Change Image',
      icon: '@imgly/Edit',
      onClick: toggleExpand // Switch to expanded view
    });
  },
  renderExpanded: ({ builder, state }, { generate, toggleExpand }) => {
    // Create more complex UI with input fields
    const promptState = state('prompt', '');

    builder.TextArea('prompt', {
      label: 'Prompt',
      placeholder: 'Describe the changes you want...',
      ...promptState
    });

    builder.Separator('separator');

    // Add footer with cancel/apply buttons
    builder.ButtonRow('footer', {
      children: () => {
        builder.Button('cancel', {
          label: 'Back',
          onClick: toggleExpand // Return to basic view
        });

        builder.Button('apply', {
          label: 'Generate',
          color: 'accent',
          onClick: async () => {
            await generate({
              prompt: promptState.value
            });
            toggleExpand(); // Close expanded view after generation
          }
        });
      }
    });
  }
}
```

### Quick Action Context

The `quickActionContext` parameter gives you access to:

-   **blockIds**: Array of currently selected block IDs
-   **closeMenu**: Function to close the quick action menu
-   **toggleExpand**: Function to toggle between basic and expanded views
-   **generate**: Function to trigger generation with input parameters
-   **handleGenerationError**: Function to handle and display generation errors

### Key Use Cases

1. **One-Click Actions**: Simple transformations with predefined parameters
2. **Context-Aware Generation**: Using properties of selected blocks as inputs
3. **Multi-Step Workflows**: Expanded UIs for complex generation tasks
4. **Block Manipulation**: Applying AI-generated content to existing blocks
5. **Visual Selection**: Displaying visual options that apply different styles

### Quick Action vs Panel: When to Use Each

**Use Quick Actions when:**

-   The operation is context-dependent on selected blocks
-   The operation is commonly used and benefits from quick access
-   The input requirements are simple or can be preset
-   The action works directly with content already on the canvas

**Use Panels when:**

-   The operation requires complex input forms
-   The generation is independent of canvas selections
-   Users need to browse a history of generated assets
-   The operation creates entirely new content rather than modifying existing content

## Using Your Provider

Once you've created your provider, you need to initialize it with CreativeEditor SDK and integrate it into the UI. This section covers how to use your provider effectively.

### Initializing Your Provider

The most basic way is to use the `initProvider` function to register your provider with CreativeEditor SDK:

```typescript
import { initProvider } from '@imgly/plugin-ai-generation-web';

// Create your provider with custom headers
const myProvider = createMyProvider({
    proxyUrl: 'https://your-api-proxy.example.com',
    headers: {
        'x-custom-header': 'value',
        'x-client-version': '1.0.0'
    }
});

// Initialize the provider with CreativeEditor SDK
function setupMyProvider(cesdk) {
    const result = initProvider(
        myProvider,
        {
            engine: cesdk.engine,
            cesdk
        },
        {
            debug: false, // Enable/disable debug logging
            dryRun: false // Enable/disable dry run mode (no actual API calls)
        }
    );

    return result;
}
```

Now you can render the provider's UI components in your application. The `initProvider` function takes care of registering the provider with CreativeEditor SDK and setting up the necessary UI components (see the next section for the ids of the panel).

Alternatively, the `initProvider` function returns an object with `renderBuilderFunctions` which contains render functions that can be used to create custom UI.

### Panel IDs and Registration

When a provider is initialized, it automatically registers panels with specific IDs. These panel IDs follow a consistent pattern:

```
ly.img.ai/{provider-id}
```

For example:

-   A provider with ID `my-image-provider` registers a panel with ID `ly.img.ai/my-image-provider`
-   A provider with ID `fal-ai/recraft-v3` registers a panel with ID `ly.img.ai/fal-ai/recraft-v3`

You can programmatically get a panel ID using the `getPanelId` function:

```typescript
import { getPanelId } from '@imgly/plugin-ai-generation-web';

// Get panel ID for a provider
const panelId = getPanelId('my-image-provider'); // returns "ly.img.ai/my-image-provider"

// Open the panel
cesdk.ui.openPanel(panelId);
```

For quick actions in the canvas menu, the following format is used:

```
ly.img.ai.{kind}.canvasMenu
```

For example:

-   Image quick actions: `ly.img.ai.image.canvasMenu`
-   Video quick actions: `ly.img.ai.video.canvasMenu`
-   Audio quick actions: `ly.img.ai.audio.canvasMenu`
-   Text quick actions: `ly.img.ai.text.canvasMenu`

### Using with Existing AI Generation Plugins

IMG.LY offers several pre-built AI generation packages that contain a few popular providers as well as combining different models for the same `kind`, e.g. to combine text2image and image2image models in a single panel.

-   `@imgly/plugin-ai-image-generation-web`: For image generation
-   `@imgly/plugin-ai-video-generation-web`: For video generation
-   `@imgly/plugin-ai-audio-generation-web`: For audio generation
-   `@imgly/plugin-ai-text-generation-web`: For text generation

You can use these packages with different AI provider implementations:

```typescript
import CreativeEditorSDK from '@cesdk/cesdk-js';

// Import plugin packages
import ImageGeneration from '@imgly/plugin-ai-image-generation-web';
import FalAiImage from '@imgly/plugin-ai-image-generation-web/fal-ai';
import VideoGeneration from '@imgly/plugin-ai-video-generation-web';
import FalAiVideo from '@imgly/plugin-ai-video-generation-web/fal-ai';
import AudioGeneration from '@imgly/plugin-ai-audio-generation-web';
import Elevenlabs from '@imgly/plugin-ai-audio-generation-web/elevenlabs';
import TextGeneration from '@imgly/plugin-ai-text-generation-web';
import Anthropic from '@imgly/plugin-ai-text-generation-web/anthropic';

// Initialize CreativeEditor SDK
CreativeEditorSDK.create(domElement, {
    license: 'your-license-key'
    // Other configuration options...
}).then(async (cesdk) => {
    // Add default asset sources
    await cesdk.addDefaultAssetSources();

    // Text generation with Anthropic
    cesdk.addPlugin(
        TextGeneration({
            provider: Anthropic.AnthropicProvider({
                proxyUrl: 'https://your-anthropic-proxy.example.com'
            })
        })
    );

    // Image generation with Fal.ai models
    cesdk.addPlugin(
        ImageGeneration({
            text2image: FalAiImage.RecraftV3({
                proxyUrl: 'https://your-falai-proxy.example.com'
            }),
            image2image: FalAiImage.GeminiFlashEdit({
                proxyUrl: 'https://your-falai-proxy.example.com'
            })
        })
    );

    // Video generation
    cesdk.addPlugin(
        VideoGeneration({
            text2video: FalAiVideo.MinimaxVideo01Live({
                proxyUrl: 'https://your-falai-proxy.example.com'
            }),
            image2video: FalAiVideo.MinimaxVideo01LiveImageToVideo({
                proxyUrl: 'https://your-falai-proxy.example.com'
            })
        })
    );

    // Audio generation
    cesdk.addPlugin(
        AudioGeneration({
            text2speech: Elevenlabs.ElevenMultilingualV2({
                proxyUrl: 'https://your-elevenlabs-proxy.example.com'
            }),
            text2sound: Elevenlabs.ElevenSoundEffects({
                proxyUrl: 'https://your-elevenlabs-proxy.example.com'
            })
        })
    );

    // Add the quick action menu to the canvas menu
    cesdk.ui.setCanvasMenuOrder([
        'ly.img.ai.text.canvasMenu',
        'ly.img.ai.image.canvasMenu',
        ...cesdk.ui.getCanvasMenuOrder()
    ]);
});
```

## Advanced Features

### Middleware

The package includes a middleware system to augment the generation flow:

#### Rate Limiting Middleware

```typescript
// NOTE:: This middleware will not protect against calling the server directly as
// many times as you want. It is only meant to be used for rate-limiting the UI before it
// hits the server.
// Always secure your API endpoints with authentication and authorization or server-side
// rate-limiting.
import { rateLimitMiddleware } from '@imgly/plugin-ai-generation-web';

// Create a rate limiting middleware
const rateLimit = rateLimitMiddleware({
    maxRequests: 10,
    timeWindowMs: 60000, // 1 minute
    onRateLimitExceeded: (input, options, info) => {
        console.log(
            `Rate limit exceeded: ${info.currentCount}/${info.maxRequests}`
        );
        return false; // Reject request
    }
});

// Apply middleware to your provider
const provider = {
    // ...provider config
    output: {
        middleware: [rateLimit]
        // ...other output config
    }
};
```

#### Upload Middleware

The `uploadMiddleware` allows you to upload the output of a generation process to a server or cloud storage before it's returned to the user. This is useful when:

- You need to store generated content on your own servers
- You want to process or transform the content before it's used
- You need to handle licensing or attribution for the generated content
- You need to apply additional validation or security checks

```typescript
import { uploadMiddleware } from '@imgly/plugin-ai-generation-web';

// Create an upload middleware with your custom upload function
const upload = uploadMiddleware(async (output) => {
  // Upload the output to your server/storage
  const response = await fetch('https://your-api.example.com/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(output)
  });
  
  // Get the response which should include the new URL
  const result = await response.json();
  
  // Return the output with the updated URL from your server
  return {
    ...output,
    url: result.url
  };
});

// Apply middleware to your provider
const provider = {
  // ...provider config
  output: {
    middleware: [upload]
    // ...other output config
  }
};
```

**Important notes about uploadMiddleware:**
- It automatically detects and skips async generators (streaming results)
- For non-streaming results, it awaits the upload function and returns the updated output
- The upload function should return the same type of output object (but with modified properties like URL)
- You can chain it with other middleware functions

## TypeScript Support

This package is fully typed with TypeScript, providing excellent IntelliSense support during development.
