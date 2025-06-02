# Creating a Custom AI Image Generation Provider

This tutorial will guide you through creating a custom AI-powered image generation provider for CreativeEditor SDK (CE.SDK) using the `@imgly/plugin-ai-generation-web` package. You'll learn how to implement an AI provider from scratch using the schema-based approach and how to seamlessly integrate sophisticated AI image generation capabilities with CE.SDK.

## Prerequisites

-   Basic knowledge of TypeScript and React
-   Familiarity with CreativeEditor SDK
-   An image generation API to integrate with

## 1. Project Setup

First, set up your project and install the necessary packages:

```bash
# Create a new project or use an existing one
mkdir my-image-provider
cd my-image-provider

# Initialize package.json
npm init -y

# Install required dependencies
npm install @imgly/plugin-ai-generation-web @cesdk/cesdk-js typescript
```

## 2. Understanding the Provider Interface

The core of the AI generation system is the `Provider` interface. For image generation, we implement this interface with `kind: 'image'`.

Key components of an image provider:

-   **id**: Unique identifier for your provider
-   **kind**: Always 'image' for image generation
-   **initialize**: Setup function for any necessary configuration
-   **input**: Configuration for the input UI panel and parameters
-   **output**: Configuration for generation behavior and result handling

## 3. Creating an OpenAPI Schema

For schema-based input, you need an OpenAPI schema that defines your input parameters. Create a file called `myApiSchema.json`:

```json
{
    "openapi": "3.0.0",
    "info": {
        "title": "My Image Generator API",
        "version": "1.0.0"
    },
    "components": {
        "schemas": {
            "GenerationInput": {
                "type": "object",
                "required": ["prompt"],
                "properties": {
                    "prompt": {
                        "type": "string",
                        "title": "Description",
                        "description": "Describe the image you want to generate",
                        "x-imgly-builder": {
                            "component": "TextArea"
                        }
                    },
                    "width": {
                        "type": "integer",
                        "title": "Width",
                        "default": 512,
                        "enum": [256, 512, 768, 1024],
                        "x-imgly-builder": {
                            "component": "Select"
                        }
                    },
                    "height": {
                        "type": "integer",
                        "title": "Height",
                        "default": 512,
                        "enum": [256, 512, 768, 1024],
                        "x-imgly-builder": {
                            "component": "Select"
                        }
                    },
                    "style": {
                        "type": "string",
                        "title": "Style",
                        "default": "photorealistic",
                        "enum": [
                            "photorealistic",
                            "cartoon",
                            "sketch",
                            "painting"
                        ],
                        "x-imgly-builder": {
                            "component": "Select"
                        }
                    }
                },
                "x-order-properties": ["prompt", "width", "height", "style"]
            }
        }
    }
}
```

## 4. Creating a Schema-Based Image Provider

Let's create a simple provider that generates images by calling your API. Create a file called `MyImageProvider.ts`:

```typescript
import {
    Provider,
    ImageOutput,
    enhanceProvider,
    loggingMiddleware,
    uploadMiddleware,
    // Quick action helper components
    QuickActionChangeImage,
    QuickActionSwapImageBackground,
    QuickActionImageVariant
} from '@imgly/plugin-ai-generation-web';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
import apiSchema from './myApiSchema.json';

// Define your input type based on your schema
interface MyProviderInput {
    prompt: string;
    width: number;
    height: number;
    style: string;
    image_url?: string; // For image-to-image operations
}

// Create your base provider function  
function createMyImageProvider(
    cesdk: CreativeEditorSDK,
    {
        apiKey,
        apiUrl = 'https://your-api-url.com'
    }: {
        apiKey: string;
        apiUrl?: string;
    }
): Provider<'image', MyProviderInput, ImageOutput> {
    // Create and return the provider
    const provider: Provider<'image', MyProviderInput, ImageOutput> = {
            // Unique identifier for your provider
            id: 'my-image-provider',

            // Define output type as 'image'
            kind: 'image',

            // Initialize your provider
            initialize: async ({ engine, cesdk }) => {
                console.log('Initializing my image provider');
                // Any setup needed (e.g., API client initialization)
            },

            // Define input panel and UI using schema
            input: {
                panel: {
                    type: 'schema',
                    document: apiSchema, // Your OpenAPI schema
                    inputReference: '#/components/schemas/GenerationInput', // Reference to your input schema
                    userFlow: 'placeholder', // Creates a block first, then updates it with the generated content
                    orderExtensionKeyword: 'x-order-properties', // Used to control property display order

                    // Convert API input to block parameters
                    getBlockInput: async (input) => ({
                        image: {
                            width: input.width || 512,
                            height: input.height || 512,
                            label: `AI: ${input.prompt?.substring(0, 20)}...`
                        }
                    })
                },
                
                // Add quick actions for canvas menu
                quickActions: {
                    actions: [
                        // Use helper components for common quick actions
                        QuickActionChangeImage<MyProviderInput, ImageOutput>({
                            cesdk,
                            // Map input from quick action to your provider's input format
                            mapInput: (input) => ({
                                prompt: input.prompt,
                                image_url: input.uri,
                                width: 512,
                                height: 512,
                                style: 'photorealistic'
                            })
                        }),
                        
                        QuickActionSwapImageBackground<MyProviderInput, ImageOutput>({
                            cesdk,
                            mapInput: (input) => ({
                                prompt: input.prompt,
                                image_url: input.uri,
                                width: 512,
                                height: 512,
                                style: 'photorealistic'
                            })
                        }),
                        
                        QuickActionImageVariant<MyProviderInput, ImageOutput>({
                            cesdk,
                            onApply: async ({ prompt, uri, duplicatedBlockId }, context) => {
                                // Generate a variant for the duplicated block
                                return context.generate(
                                    {
                                        prompt,
                                        image_url: uri,
                                        width: 512,
                                        height: 512,
                                        style: 'photorealistic'
                                    },
                                    {
                                        blockIds: [duplicatedBlockId]
                                    }
                                );
                            }
                        })
                    ]
                }
            },

            // Define output generation behavior
            output: {
                // Allow cancellation of generation
                abortable: true,

                // Store generated assets in browser's IndexedDB
                history: '@imgly/indexedDB',

                // Add middleware for logging and uploading
                middleware: [
                    loggingMiddleware(),
                    // Example of upload middleware that stores generated images on your server
                    uploadMiddleware(async (output) => {
                        // Upload the image to your server
                        const response = await fetch('https://your-server.com/api/upload', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ 
                                url: output.url,
                                type: 'ai-generated-image'
                            })
                        });
                        
                        const result = await response.json();
                        
                        // Return the output with the updated URL from your server
                        return {
                            ...output,
                            url: result.storedImageUrl
                        };
                    })
                ],

                // Configure success/error notifications
                notification: {
                    success: {
                        show: true,
                        message: 'Image generated successfully!'
                    },
                    error: {
                        show: true,
                        message: (context) =>
                            `Generation failed: ${context.error}`
                    }
                },

                // The core generation function
                generate: async (input, { abortSignal }) => {
                    try {
                        const requestBody: any = {
                            prompt: input.prompt,
                            width: input.width,
                            height: input.height,
                            style: input.style
                        };
                        
                        // If we have an image_url, this is an image-to-image operation
                        if (input.image_url) {
                            requestBody.image_url = input.image_url;
                        }
                        
                        // Call your API to generate an image
                        const response = await fetch(apiUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${apiKey}`
                            },
                            body: JSON.stringify(requestBody),
                            signal: abortSignal
                        });

                        if (!response.ok) {
                            throw new Error(
                                `API error: ${response.statusText}`
                            );
                        }

                        const data = await response.json();

                        // Return the image URL
                        return {
                            kind: 'image',
                            url: data.imageUrl // Replace with the actual property from your API response
                        };
                    } catch (error) {
                        console.error('Image generation failed:', error);
                        throw error;
                    }
                }
            }
        };

    return provider;
}

// Use enhanceProvider to get automatic canvas menu integration
export const MyImageProvider = enhanceProvider(createMyImageProvider, {
    canvasMenu: {
        image: {
            id: 'ly.img.ai.image.canvasMenu',
            children: [
                'my-image-provider.changeImage',
                'my-image-provider.swapBackground', 
                'my-image-provider.createVariant'
            ]
        }
    }
});
```

## 5. Integrating with CE.SDK

Now let's integrate your provider with CE.SDK using the `@imgly/plugin-ai-image-generation-web` package.

Create an `index.ts` file:

```typescript
import CreativeEditorSDK from '@cesdk/cesdk-js';
import ImageGeneration from '@imgly/plugin-ai-image-generation-web';
import { MyImageProvider } from './MyImageProvider';

// Initialize the editor
async function initializeEditor(container: HTMLElement) {
    const cesdk = await CreativeEditorSDK.create(container, {
        license: 'your-cesdk-license-key'
    });

    // Add default asset sources
    await cesdk.addDefaultAssetSources();

    // Add your image generation provider
    cesdk.addPlugin(
        ImageGeneration({
            text2image: MyImageProvider({
                apiKey: 'your-api-key',
                apiUrl: 'https://your-api-url.com',
                addToCanvasMenu: true // This is the default
            }),
            debug: true
        })
    );
    
    // Create a design scene
    await cesdk.createDesignScene();

    // Add the dock component to open the AI image generation panel
    cesdk.ui.setDockOrder([
      'ly.img.ai/image-generation.dock',
      ...cesdk.ui.getDockOrder()
    ]);

    // Note: Canvas menu quick actions are automatically added by the enhanced provider
    // You can access the canvas menu ID via: MyImageProvider.canvasMenu.image.id

    return cesdk;
}

// Start the editor when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('cesdk-container');
    if (container) {
        initializeEditor(container);
    }
});
```

## 6. Create an HTML Page

Create an `index.html` file to host your editor:

```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>AI Image Generation with CE.SDK</title>
        <style>
            body,
            html {
                margin: 0;
                padding: 0;
                height: 100%;
                width: 100%;
                overflow: hidden;
            }
            #cesdk-container {
                width: 100%;
                height: 100vh;
            }
        </style>
    </head>
    <body>
        <div id="cesdk-container"></div>
        <script src="./dist/index.js"></script>
    </body>
</html>
```

## 7. Build and Run the Example

Let's set up a complete build and run process using esbuild. Note that you're free to use whatever build setup you're most comfortable with (webpack, Vite, Parcel, etc.) - the following is just an example to get you started quickly.

### Setting up TypeScript

Create a basic TypeScript configuration:

```bash
# Create a tsconfig.json file
npx tsc --init
```

Edit the generated `tsconfig.json` to include these recommended settings:

```json
{
    "compilerOptions": {
        "target": "ES2020",
        "module": "ESNext",
        "moduleResolution": "node",
        "esModuleInterop": true,
        "strict": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "resolveJsonModule": true,
        "outDir": "./dist",
        "jsx": "react"
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist"]
}
```

### Setting up esbuild

Install esbuild as a development dependency:

```bash
npm install --save-dev esbuild
```

Create a build script in your `package.json`:

```json
{
    "name": "my-image-provider",
    "version": "1.0.0",
    "scripts": {
        "build": "esbuild index.ts --bundle --outfile=dist/index.js --platform=browser",
        "dev": "esbuild index.ts --bundle --outfile=dist/index.js --platform=browser --watch --servedir=."
    },
    "dependencies": {
        "@cesdk/cesdk-js": "^1.48.0",
        "@imgly/plugin-ai-generation-web": "^0.1.0",
        "@imgly/plugin-ai-image-generation-web": "^0.1.0"
    },
    "devDependencies": {
        "esbuild": "^0.19.0",
        "typescript": "^5.0.0"
    }
}
```

### Project Structure

Make sure your files are organized as follows:

```
my-image-provider/
├── index.html
├── index.ts
├── MyImageProvider.ts
├── myApiSchema.json
├── package.json
└── tsconfig.json
```

### Running the Example

Now you can build and run your example:

```bash
# For production build
npm run build

# For development with live reload
npm run dev
```

If you use `npm run dev`, esbuild will start a development server and you can view your project at http://localhost:8000.

Alternatively, you can use any static file server after building:

```bash
# Using serve (you might need to install it first with: npm install -g serve)
serve

# Or with Python's built-in HTTP server
python -m http.server

# Or with PHP's built-in server
php -S localhost:8000
```

### Troubleshooting

If you encounter issues:

1. Check browser console for errors
2. Verify that your API endpoint is correctly configured
3. Make sure the CE.SDK license key is valid
4. Check that all dependencies are installed correctly

Remember that this build setup is just an example - feel free to adapt it to your existing workflow or preferred build tools. The key components are:

1. TypeScript compilation
2. Bundling your code
3. Serving the HTML and bundled JavaScript

## Conclusion

You've now created a custom image generation provider for CE.SDK using the enhanced provider approach! Your provider integrates with the AI image generation plugin and provides a seamless user experience for generating images.

The enhanced provider approach offers several advantages:

-   **Automatic canvas menu integration**: Quick actions are automatically added to canvas menus
-   **Schema-based UI generation**: Automatic UI generation based on your OpenAPI schema
-   **Built-in validation**: Input validation based on schema constraints
-   **Consistent UI experience**: Matches the CE.SDK style guidelines
-   **Easy configuration**: Simple `addToCanvasMenu` option for controlling canvas menu behavior
-   **Canvas menu access**: Direct access to canvas menu component IDs via `.canvasMenu` properties

Next steps:

1. Customize specific property renderers using the `renderCustomProperty` option
2. Add more advanced validation in your schema
3. Implement proper error handling and retry logic
4. Add custom asset sources for generated images
5. Explore advanced middleware options for upload handling and rate limiting

## Additional Resources

-   [CreativeEditor SDK Documentation](https://docs.img.ly/cesdk)
-   [`@imgly/plugin-ai-generation-web` Documentation](https://www.npmjs.com/package/@imgly/plugin-ai-generation-web)
-   [OpenAPI Specification](https://spec.openapis.org/oas/v3.0.3)
