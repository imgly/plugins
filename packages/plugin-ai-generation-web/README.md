# IMG.LY AI Generation Utilities

A powerful toolkit for implementing AI generation providers in CreativeEditor SDK.

## Overview

**Note**: This package is only relevant if you need to create new AI providers or extend existing functionality. For simple integration of AI features, use the [@imgly/plugin-ai-apps-web](https://github.com/imgly/plugins/tree/main/packages/plugin-ai-apps-web) package instead.

This package provides the foundation for creating AI generation plugins for CreativeEditor SDK. It offers a standardized interface for implementing AI generation providers that can create images, videos, audio, or text assets. The package includes utilities for handling:

- Provider registration and initialization
- User interface generation
- Global action registry for quick actions and plugin actions
- Type-safe quick action definitions
- Cross-plugin action support

## Getting Started

### Installation

```bash
npm install @imgly/plugin-ai-generation-web
```

### Creating a Custom Provider

The core of this package is the `Provider` interface which defines the contract for AI generation providers. Here's how to implement a basic provider:

```typescript
import {
    Provider,
    ImageOutput,
    initializeProvider,
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

        // Quick actions supported by this provider
        quickActions: {
            supported: {
                'ly.img.editImage': {
                    mapInput: (input) => ({
                        prompt: input.prompt,
                        image_url: input.uri
                    })
                },
                'ly.img.styleTransfer': {
                    mapInput: (input) => ({
                        prompt: input.style,
                        image_url: input.uri
                    })
                }
            }
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
    proxyUrl: 'http://your-proxy-server.com/api/proxy',
    headers: {
        'x-client-version': '1.0.0',
        'x-request-source': 'cesdk-plugin'
    },
    debug: false,
    middleware: [loggingMiddleware()],
    baseURL: 'https://assets.example.com'
});
```

## Action Registry

The package includes a global `ActionRegistry` for managing quick actions and plugin actions. To register a new action:

```typescript
import { ActionRegistry } from '@imgly/plugin-ai-generation-web';

// Get the global registry instance
const registry = ActionRegistry.get();

// Register a quick action
const unregister = registry.register({
    id: 'my-quick-action',
    type: 'quick',
    kind: 'image',
    label: 'My Quick Action',
    enable: true,
    render: (context) => {
        // Render the quick action UI
        context.builder.Button('my-button', {
            label: 'Generate',
            onClick: async () => {
                await context.generate({ prompt: 'Hello world' });
            }
        });
    }
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

**Implementation Note:** When implementing your provider's `generate` function, ensure you merge the custom headers with any required headers for your API:

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

### Key Provider Options

- **id**: Unique identifier for your provider
- **kind**: Type of asset generated ('image', 'video', 'audio', 'text')
- **name**: Optional human-readable name
- **initialize**: Setup function called when the provider is loaded
- **input**: Configuration for input UI and parameters
- **output**: Configuration for generation and result handling

#### Provider Output Options

The `output` property has several important options:

- **generate**: Main function that performs the actual generation
- **history**: Asset storage strategy ('false', '@imgly/local', '@imgly/indexedDB', or custom ID)
- **abortable**: Whether generation can be cancelled by the user
- **middleware**: Array of middleware functions for pre/post-processing
- **notification**: Success and error notification configuration
- **generationHintText**: Text to display below the generation button

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

// Streaming response (currently only supported for text)
generate: async function* (input, options) {
  const stream = api.streamGenerationResult(input);

  let inferredText: string = '';
  // Yield interim results
  for await (const chunk of stream) {
    inferredText += chunk;
    yield { kind: 'text', text: inferredText };
  }

  // Return final result
  return { kind: 'text', text: inferredText };
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
          inputLabel: 'Image URL',
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

- Built-in validation based on schema constraints
- AI providers like fal.ai provide schemas for their models
- Automatic UI component generation based on property types
- Extensions like `x-imgly-builder` to specify component types
- Property ordering via `orderExtensionKeyword`
- Customizable property rendering with `renderCustomProperty`

### 2. Custom Input Panels

The `custom` type gives you complete control over UI components. For more details on how to build custom panels and see all available builder components, refer to the [Create a Custom Panel](https://img.ly/docs/cesdk/js/user-interface/ui-extensions/create-custom-panel-d87b83/) guide.

```typescript
input: {
  panel: {
    type: 'custom',
    render: (context, options) => {
      // Use the builder pattern to create UI components
      const promptState = context.state('prompt', '');
      context.builder.TextArea('prompt', {
        inputLabel: 'Prompt',
        ...promptState
      });

      // Set up width selection
      const widthState = context.state('width', 1024);
      context.builder.Select('width', {
        inputLabel: 'Width',
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

- Complete control over UI components and layout
- Complex logic between fields (dependencies, conditionals)
- Dynamic UI that changes based on user interactions

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

- **userFlow**:
  - `placeholder`: Creates a block as a placeholder with loading state when generation starts
  - `generation-only`: Only triggers generation without creating a placeholder

- **includeHistoryLibrary**: Controls whether the history library is shown in the panel

## The `getBlockInput` Function

The `getBlockInput` function is crucial for both panel types. It converts your input into the parameters needed to create a block in CreativeEditor SDK.

### What It Does

- Defines dimensions, duration, and appearance of asset blocks
- Creates placeholders before generation completes
- Maps your AI provider's inputs to standardized block parameters

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

### Available Quick Action IDs

Here are all the quick action IDs that can be used in the `supported` field of your provider configuration:

#### Image Quick Actions

- **`ly.img.artistTransfer`**: Transform image in the style of famous artists
  - Input: `{ artist: string, uri: string }`

- **`ly.img.combineImages`**: Combine multiple images with instructions
  - Input: `{ prompt: string, uris: string[], exportFromBlockIds: number[] }`

- **`ly.img.createVariant`**: Create a variation of the image
  - Input: `{ prompt: string, uri: string }`

- **`ly.img.editImage`**: Change image based on description
  - Input: `{ prompt: string, uri: string }`

- **`ly.img.remixPage`**: Convert the page into a single image
  - Input: `{ prompt: string, uri: string }`

- **`ly.img.remixPageWithPrompt`**: Remix the page with custom instructions
  - Input: `{ prompt: string, uri: string }`

- **`ly.img.styleTransfer`**: Transform image into different art styles
  - Input: `{ style: string, uri: string }`

- **`ly.img.swapBackground`**: Change the background of the image
  - Input: `{ prompt: string, uri: string }`

- **`ly.img.gpt-image-1.changeStyleLibrary`**: Apply different art styles (GPT-specific)
  - Input: `{ prompt: string, uri: string }`

#### Text Quick Actions

- **`ly.img.changeTextTo`**: Change text to a different format or style
  - Input: `{ prompt: string, customPrompt: string }`

- **`ly.img.changeTone`**: Change the tone of the text
  - Input: `{ prompt: string, type: string }`

- **`ly.img.fix`**: Fix spelling and grammar
  - Input: `{ prompt: string }`

- **`ly.img.improve`**: Improve writing quality
  - Input: `{ prompt: string }`

- **`ly.img.longer`**: Make text longer
  - Input: `{ prompt: string }`

- **`ly.img.shorter`**: Make text shorter
  - Input: `{ prompt: string }`

- **`ly.img.translate`**: Translate text to different languages
  - Input: `{ prompt: string, language: string }`

#### Video Quick Actions

- **`ly.img.createVideo`**: Opens the image2video generation panel with the current image
  - Input: `{ uri: string }`

### Provider Quick Action Support

Providers declare which quick actions they support and how to map quick action inputs to provider inputs:

```typescript
const myProvider = {
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
                'ly.img.styleTransfer': {
                    mapInput: (quickActionInput) => ({
                        style: quickActionInput.style,
                        image_url: quickActionInput.uri
                    })
                }
            }
        }
    }
};
```

### Quick Action Expanded View

Quick actions can have two rendering modes:

1. **Collapsed View**: Shows as a simple button in the quick action menu alongside other actions
2. **Expanded View**: Takes over the entire menu space, hiding other actions while the user interacts with this specific action

The expanded view is useful for quick actions that need user input (like text prompts). When a quick action is expanded, the complete menu is replaced with the expanded interface, and other menu items are not shown until the user either completes the action or cancels back to the collapsed view.

```typescript
render: ({ builder, isExpanded, toggleExpand }) => {
    if (isExpanded) {
        // Expanded view - takes over the entire menu
        builder.TextArea('prompt', { /* input fields */ });
        builder.ButtonRow('actions', { /* confirm/cancel buttons */ });
    } else {
        // Collapsed view - simple button alongside other actions
        builder.Button('expand', { 
            label: 'Edit Image...',
            onClick: toggleExpand 
        });
    }
}
```

## Customizing Labels and Text

You can customize all labels and text in the AI generation interface using the translation system. This allows you to provide better labels for your users in any language.

### Translation Priority

The system checks for translations in this order (highest to lowest priority):

1. **Provider & Kind-specific**: `ly.img.plugin-ai-${kind}-generation-web.property.${provider}.${field}` - Override labels for a specific AI provider and generation type (for customers)
2. **Generic**: `ly.img.plugin-ai-generation-web.property.${field}` - Override labels for all AI plugins (for customers)

Where `${kind}` can be:
- `image` for image generation plugins
- `video` for video generation plugins  
- `audio` for audio generation plugins
- `text` for text generation plugins

### Basic Example

```typescript
// Customize labels for your AI generation interface
cesdk.i18n.setTranslations({
  en: {
    // Generic labels (applies to ALL AI plugins)
    'ly.img.plugin-ai-generation-web.property.prompt': 'Describe what you want to create',
    'ly.img.plugin-ai-generation-web.property.image_size': 'Image Dimensions',
    'ly.img.plugin-ai-generation-web.property.duration': 'Video Length',

    // Provider-specific for images (highest priority)
    'ly.img.plugin-ai-image-generation-web.property.fal-ai/recraft-v3.prompt': 'Describe your Recraft image',
    'ly.img.plugin-ai-image-generation-web.property.fal-ai/recraft-v3.image_size': 'Canvas Size',

    // Provider-specific for videos (highest priority)
    'ly.img.plugin-ai-video-generation-web.property.fal-ai/veo3.prompt': 'Describe your video scene',
    'ly.img.plugin-ai-video-generation-web.property.fal-ai/veo3.duration': 'Video Duration'
  }
});
```

### Dropdown Options

For dropdown menus, add the option value to the translation key:

```typescript
cesdk.i18n.setTranslations({
  en: {
    // Image generation dropdown options
    'ly.img.plugin-ai-image-generation-web.property.fal-ai/recraft-v3.image_size.square_hd': 'Square HD (1024×1024)',
    'ly.img.plugin-ai-image-generation-web.property.fal-ai/recraft-v3.image_size.portrait_4_3': 'Portrait 4:3 (768×1024)',

    // Video generation dropdown options
    'ly.img.plugin-ai-video-generation-web.property.fal-ai/veo3.duration.5': '5 seconds',
    'ly.img.plugin-ai-video-generation-web.property.fal-ai/veo3.duration.10': '10 seconds'
  }
});
```

### QuickAction Translations

QuickActions (like "Edit Image", "Style Transfer", etc.) use their own translation keys:

```typescript
cesdk.i18n.setTranslations({
  en: {
    // Image generation QuickActions
    'ly.img.plugin-ai-image-generation-web.quickAction.editImage.label': 'Edit Image...',
    'ly.img.plugin-ai-image-generation-web.quickAction.editImage.prompt.label': 'Edit Image...',
    'ly.img.plugin-ai-image-generation-web.quickAction.editImage.apply': 'Change',

    // Text generation QuickActions  
    'ly.img.plugin-ai-text-generation-web.quickAction.improve.label': 'Improve Text',
    'ly.img.plugin-ai-text-generation-web.quickAction.translate.label': 'Translate Text',

    // Video generation QuickActions
    'ly.img.plugin-ai-video-generation-web.quickAction.createVideo.label': 'Create Video'
  }
});
```

**QuickAction Translation Structure:**
- `.label`: Button text when QuickAction is collapsed
- `.prompt.label`: Label for input field when expanded
- `.prompt.placeholder`: Placeholder text for input field
- `.apply`: Text for action/submit button

## Using Your Provider

Once you've created your provider, you need to initialize it with CreativeEditor SDK and integrate it into the UI.

### Initializing Your Provider

Use the `initializeProvider` function to register your provider:

```typescript
import { initializeProvider } from '@imgly/plugin-ai-generation-web';

// Create your provider
const myProvider = createMyProvider({
    proxyUrl: 'http://your-proxy-server.com/api/proxy',
    headers: {
        'x-custom-header': 'value',
        'x-client-version': '1.0.0'
    }
});

// Initialize the provider
function setupMyProvider(cesdk) {
    const result = initializeProvider(
        myProvider,
        {
            engine: cesdk.engine,
            cesdk
        },
        {
            debug: false,
            dryRun: false
        }
    );

    return result;
}
```

### Panel IDs and Registration

When a provider is initialized, it automatically registers panels with specific IDs:

```
ly.img.plugin-ai-{kind}-generation-web.{provider-id}
```

For example:
- A provider with ID `my-image-provider` for images registers a panel with ID `ly.img.plugin-ai-image-generation-web.my-image-provider`
- A provider with ID `fal-ai/recraft-v3` for images registers a panel with ID `ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3`

You can programmatically get a panel ID using the `getPanelId` function:

```typescript
import { getPanelId } from '@imgly/plugin-ai-generation-web';

// Get panel ID for a provider
const panelId = getPanelId('my-image-provider');

// Open the panel
cesdk.ui.openPanel(panelId);
```

### Quick Action Menu Registration

Quick actions are automatically registered in canvas menus with these IDs:

```
ly.img.plugin-ai-{kind}-generation-web.canvasMenu
```

For example:
- Image quick actions: `ly.img.plugin-ai-image-generation-web.canvasMenu`
- Video quick actions: `ly.img.plugin-ai-video-generation-web.canvasMenu`
- Audio quick actions: `ly.img.plugin-ai-audio-generation-web.canvasMenu`
- Text quick actions: `ly.img.plugin-ai-text-generation-web.canvasMenu`

### Using with Existing AI Generation Plugins

IMG.LY offers several pre-built AI generation packages that work with this base plugin:

```typescript
import CreativeEditorSDK from '@cesdk/cesdk-js';

// Import plugin packages
import ImageGeneration from '@imgly/plugin-ai-image-generation-web';
import FalAiImage from '@imgly/plugin-ai-image-generation-web/fal-ai';
import VideoGeneration from '@imgly/plugin-ai-video-generation-web';
import FalAiVideo from '@imgly/plugin-ai-video-generation-web/fal-ai';

// Initialize CreativeEditor SDK
CreativeEditorSDK.create(domElement, {
    license: 'your-license-key'
}).then(async (cesdk) => {
    // Add default asset sources
    await cesdk.addDefaultAssetSources();

    // Image generation with Fal.ai models
    cesdk.addPlugin(
        ImageGeneration({
            text2image: FalAiImage.RecraftV3({
                proxyUrl: 'http://your-proxy-server.com/api/proxy'
            }),
            // Alternative: FalAiImage.Recraft20b({ proxyUrl: 'http://your-proxy-server.com/api/proxy' }),
            image2image: FalAiImage.GeminiFlashEdit({
                proxyUrl: 'http://your-proxy-server.com/api/proxy'
            })
        })
    );

    // Video generation
    cesdk.addPlugin(
        VideoGeneration({
            text2video: FalAiVideo.MinimaxVideo01Live({
                proxyUrl: 'http://your-proxy-server.com/api/proxy'
            })
        })
    );

    // Add quick action menus to canvas
    cesdk.ui.setCanvasMenuOrder([
        'ly.img.plugin-ai-image-generation-web.canvasMenu',
        'ly.img.plugin-ai-video-generation-web.canvasMenu',
        ...cesdk.ui.getCanvasMenuOrder()
    ]);
});
```

## Advanced Features

### Middleware

The package includes a middleware system to augment the generation flow:

#### Rate Limiting Middleware

```typescript
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

**Note**: This middleware provides client-side rate limiting for UI purposes only. Always implement proper server-side rate limiting and authentication for production APIs.

#### Upload Middleware

The `uploadMiddleware` allows you to upload generated content to your own servers:

```typescript
import { uploadMiddleware } from '@imgly/plugin-ai-generation-web';

// Create an upload middleware
const upload = uploadMiddleware(async (output) => {
  // Upload the output to your server/storage
  const response = await fetch('https://your-api.example.com/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(output)
  });
  
  const result = await response.json();
  
  // Return the output with the updated URL
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

### Provider Registry

The `ProviderRegistry` is a global singleton that manages all registered providers:

```typescript
import { ProviderRegistry } from '@imgly/plugin-ai-generation-web';

// Get the global registry
const registry = ProviderRegistry.get();

// Get all registered providers
const allProviders = registry.getAll();

// Get providers by kind
const imageProviders = registry.getByKind('image');

// Find a specific provider
const myProvider = registry.getById('my-provider-id');
```

## TypeScript Support

This package is fully typed with TypeScript, providing excellent IntelliSense support during development:

- **Generic Provider Types**: Strongly typed providers with input/output validation
- **Quick Action Types**: Type-safe quick action definitions with proper input mapping
- **Registry Types**: Fully typed action and provider registries
- **Middleware Types**: Typed middleware functions for better composition

## API Reference

### Core Exports

```typescript
// Provider types and interfaces
export { Provider, ImageOutput, VideoOutput, AudioOutput, TextOutput } from './core/provider';

// Action registry
export { ActionRegistry, QuickActionDefinition, PluginActionDefinition } from './core/ActionRegistry';

// Provider registry
export { ProviderRegistry } from './core/ProviderRegistry';

// Initialization functions
export { initializeProvider, initializeProviders } from './providers/';

// Middleware
export { loggingMiddleware, rateLimitMiddleware, uploadMiddleware } from './middleware/';

// Utilities
export { getPanelId, enableQuickActionForImageFill } from './utils/';
```

### Initialization Functions

#### initializeProviders

The `initializeProviders` function is used to initialize multiple providers at once. It creates a composite history asset source and library entry for all providers of the same kind.

```typescript
const result = await initializeProviders(
    providers,
    { engine, cesdk },
    config
);

// Return value structure:
{
    panel: {
        builderRenderFunction: Function // UI builder function for provider selection
    },
    history: {
        assetSourceId: string,         // ID of the composite history asset source
        assetLibraryEntryId: string    // ID of the automatically created asset library entry
    },
    providerInitializationResults: Array<{
        provider: Provider,
        result: ProviderInitializationResult
    }>
}
```

**Key Points:**
- Creates a composite history asset source with ID format: `ly.img.plugin-ai-{kind}-generation-web.history`
- Automatically creates an asset library entry with the same ID as the asset source
- The library entry is configured with appropriate settings (sortBy: insertedAt descending, canRemove: true, etc.)
- Returns both the asset source ID and library entry ID for reference

### Common Types

```typescript
// Provider configuration
interface CommonProviderConfiguration<I, O extends Output> {
    proxyUrl: string;
    debug?: boolean;
    middleware?: Middleware<I, O>[];
    headers?: Record<string, string>;
}

// Quick action definition
interface QuickActionDefinition<Q extends Record<string, any>> {
    id: string;
    type: 'quick';
    kind: OutputKind;
    label?: string;
    enable: boolean | ((context: { engine: CreativeEngine }) => boolean);
    render: (context: QuickActionRenderContext<Q>) => void;
}
```
