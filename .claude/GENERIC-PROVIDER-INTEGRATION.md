# CLAUDE.md - Generic AI Provider Integration Guide

## Universal AI Provider Integration Process

This guide is used by ALL generic provider generators (`generic-provider-generator-t2i`, `generic-provider-generator-i2i`, `generic-provider-generator-t2v`, `generic-provider-generator-i2v`) when integrating any AI model from any API provider.

### Supported Providers & Models

**OpenAI:**
- DALL-E 2/3 (T2I), GPT-4 Vision (I2I), Sora (T2V/I2V when released)
- Authentication: Bearer token
- Base URL: `https://api.openai.com/v1`

**Anthropic:**
- Claude 3.5 Sonnet Vision (I2I), future generation models
- Authentication: x-api-key  
- Base URL: `https://api.anthropic.com/v1`

**Google:**
- Gemini Vision (I2I), Imagen (T2I), Veo (T2V), Imagen Video (I2V)
- Authentication: API key
- Base URL: `https://generativelanguage.googleapis.com/v1beta`

**Stability AI:**
- Stable Diffusion (T2I), Stable Video Diffusion (I2V/T2V)
- Authentication: Bearer token
- Base URL: `https://api.stability.ai/v2beta`

**Adobe:**
- Firefly Generate (T2I), Firefly Edit (I2I)
- Authentication: Bearer token + x-api-key
- Base URL: `https://firefly-api.adobe.io/v3`

**RunwayML:**
- Gen-2/Gen-3 (T2V/I2V)
- Authentication: Bearer token
- Base URL: `https://api.runwayml.com/v1`

**Custom APIs:**
- Any REST API with AI generation capabilities

### Universal Implementation Pattern

All providers follow this structure, regardless of type:

```typescript
export function {ProviderModel}(
  config: ProviderConfiguration
): (context: { cesdk: CreativeEditorSDK }) => Promise<Provider<'{kind}', Input, Output>> {
  return async ({ cesdk }) => {
    return {
      id: '{provider}/{model}/{type}',
      kind: '{kind}', // 'image' for T2I/I2I, 'video' for T2V/I2V
      name: '{Provider Model Display Name}',
      input: {
        panel: {
          type: 'schema',
          document: Schema,
          inputReference: '#/components/schemas/Input',
          includeHistoryLibrary: true,
          orderExtensionKeyword: 'x-order-properties',
          getBlockInput: getBlockInputFunction,
          userFlow: getUserFlow() // 'placeholder' for T2I/T2V, 'image' for I2I/I2V
        }
      },
      output: {
        abortable: true,
        history: '@imgly/indexedDB',
        middleware: config.middlewares ?? config.middleware ?? [],
        generate: generateFunction
      }
    };
  };
}
```

### Provider Type Patterns

#### Text-to-Image (T2I)
```typescript
// File: {Provider}{Model}.text2image.ts
kind: 'image'
userFlow: 'placeholder'
getBlockInput: (input) => Promise.resolve({ image: { width: input.width || 1024, height: input.height || 1024 } })

// Generate function
const response = await fetch(`${baseUrl}/images/generations`, {
  method: 'POST',
  headers: authHeaders,
  body: JSON.stringify({
    prompt: input.prompt,
    size: input.size || '1024x1024'
  })
});

return { kind: 'image', url: result.url };
```

#### Image-to-Image (I2I)
```typescript
// File: {Provider}{Model}.image2image.ts
kind: 'image'
userFlow: 'image'
getBlockInput: (input) => Promise.resolve({ image: { width: input.width || 1024, height: input.height || 1024 } })

// Generate function with image parameter
generate: async (input: Input, { abortSignal, image }: { abortSignal?: AbortSignal, image?: string }) => {
  // Handle image conversion (base64/FormData/URL)
  const imageData = await processImage(image);
  
  const response = await fetch(`${baseUrl}/images/edit`, {
    method: 'POST',
    headers: authHeaders,
    body: createRequestBody(imageData, input)
  });
  
  return { kind: 'image', url: result.url };
}
```

#### Text-to-Video (T2V)
```typescript
// File: {Provider}{Model}.text2video.ts
kind: 'video'
userFlow: 'placeholder'
getBlockInput: (input) => Promise.resolve({ video: { width: input.width || 1024, height: input.height || 576, duration: input.duration || 5 } })

// Generate function
const response = await fetch(`${baseUrl}/video/generate`, {
  method: 'POST',
  headers: authHeaders,
  body: JSON.stringify({
    prompt: input.prompt,
    duration: input.duration || 5
  })
});

return { kind: 'video', url: result.video_url, duration: result.duration, thumbnail: result.thumbnail_url };
```

#### Image-to-Video (I2V)
```typescript
// File: {Provider}{Model}.image2video.ts
kind: 'video'
userFlow: 'image'
getBlockInput: (input) => Promise.resolve({ video: { width: input.width || 1024, height: input.height || 576, duration: input.duration || 5 } })

// Generate function with image parameter
generate: async (input: Input, { abortSignal, image }: { abortSignal?: AbortSignal, image?: string }) => {
  const imageData = await processImage(image);
  
  const response = await fetch(`${baseUrl}/video/animate`, {
    method: 'POST',
    headers: authHeaders,
    body: createVideoRequestBody(imageData, input)
  });
  
  return { kind: 'video', url: result.video_url, duration: result.duration, thumbnail: image };
}
```

### Universal Authentication Patterns

#### Global API Key Pattern (OpenAI style)
```typescript
const hasGlobalAPIKey = cesdk.ui.experimental.hasGlobalStateValue('{PROVIDER}_API_KEY');
const baseUrl = hasGlobalAPIKey ? '{DIRECT_API_URL}' : config.proxyUrl;

const headers = hasGlobalAPIKey 
  ? {
      'Authorization': `Bearer ${cesdk.ui.experimental.getGlobalStateValue('{PROVIDER}_API_KEY')}`,
      'Content-Type': 'application/json',
      ...(config.headers ?? {})
    }
  : {
      'Content-Type': 'application/json',
      ...(config.headers ?? {})
    };
```

#### Multi-Key Pattern (Adobe style)
```typescript
const apiKey = cesdk.ui.experimental.getGlobalStateValue('{PROVIDER}_API_KEY');
const clientId = cesdk.ui.experimental.getGlobalStateValue('{PROVIDER}_CLIENT_ID');

const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'x-api-key': clientId,
  'Content-Type': 'application/json'
};
```

### Universal Schema Patterns

#### Basic Input Schema Template
```json
{
  "components": {
    "schemas": {
      "Input": {
        "type": "object",
        "properties": {
          // For I2I/I2V only
          "image_url": {
            "type": "string",
            "title": "Image URL", 
            "description": "URL of the input image",
            "x-order-properties": 1
          },
          // For all types
          "prompt": {
            "type": "string",
            "title": "Prompt",
            "description": "Text description/instructions",
            "x-order-properties": 2
          },
          // For T2V/I2V only
          "duration": {
            "type": "number",
            "title": "Duration (seconds)",
            "minimum": 1,
            "maximum": 30,
            "default": 5,
            "x-order-properties": 3
          },
          // Common parameters
          "size": {
            "type": "string",
            "title": "Size",
            "enum": ["1024x1024", "1536x1024", "1024x1536"],
            "default": "1024x1024",
            "x-order-properties": 4
          }
        },
        "required": ["prompt"] // Add "image_url" for I2I/I2V
      }
    }
  }
}
```

### Universal Image/Video Handling

#### Image Processing Utilities
```typescript
// Base64 conversion for APIs that need it
const imageToBase64 = async (imageUrl: string): Promise<string> => {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
};

// FormData for file uploads
const createFormData = async (image: string, input: any): Promise<FormData> => {
  const formData = new FormData();
  const imageBlob = await fetch(image).then(r => r.blob());
  formData.append('image', imageBlob, 'input.jpg');
  formData.append('prompt', input.prompt);
  return formData;
};
```

#### Async Generation with Polling
```typescript
// For long-running generation tasks
const pollForResult = async (taskId: string, baseUrl: string, headers: any, abortSignal?: AbortSignal) => {
  let attempts = 0;
  const maxAttempts = 120; // 10 minutes
  
  while (attempts < maxAttempts) {
    if (abortSignal?.aborted) {
      throw new Error('Generation cancelled');
    }
    
    const statusResponse = await fetch(`${baseUrl}/status/${taskId}`, { headers });
    const result = await statusResponse.json();
    
    if (result.status === 'completed') {
      return result;
    } else if (result.status === 'failed') {
      throw new Error(`Generation failed: ${result.error}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;
  }
  
  throw new Error('Generation timed out');
};
```

### Universal Error Handling

```typescript
// Input validation
if (!input.prompt?.trim()) {
  throw new Error('Prompt is required');
}

// For I2I/I2V: Image validation
if (!image && (providerType === 'I2I' || providerType === 'I2V')) {
  throw new Error('Image is required for this provider');
}

// API response validation
if (!response.ok) {
  const error = await response.json();
  throw new Error(`${providerName} API Error: ${error.message || response.statusText}`);
}

// Output validation
const result = await response.json();
const outputUrl = result.url || result.video_url || result.data?.[0]?.url;
if (!outputUrl) {
  throw new Error(`No output returned from ${providerName} API`);
}
```

### Directory Structure

```
src/
├── {provider-name}/
│   ├── {Model}.{type}.ts          // text2image, image2image, text2video, image2video
│   ├── {Model}.{type}.json        // Corresponding schema
│   ├── index.ts                   // Provider exports
│   └── utils.ts                   // Shared utilities (optional)
```

### Integration Steps

1. **Create Provider Files**
   - TypeScript implementation following type-specific pattern
   - JSON schema with appropriate parameters
   - Utility functions if needed

2. **Update Index Exports**
   ```typescript
   import { Model as Model{Type} } from './{Model}.{type}';
   
   const {Provider} = {
     {Model}: {
       {Type}: Model{Type}  // Text2Image, Image2Image, Text2Video, Image2Video
     }
   };
   
   export default {Provider};
   ```

3. **Add to Demo**
   ```typescript
   // In ai-demo.tsx appropriate category
   {Provider}{MediaType}.{Model}.{Type}({
     middleware: [{type}RateLimitMiddleware, errorMiddleware],
     proxyUrl: import.meta.env.VITE_{PROVIDER}_PROXY_URL,
     apiKey: import.meta.env.VITE_{PROVIDER}_API_KEY
   })
   ```

### Universal Testing Checklist

- [ ] Provider compiles without TypeScript errors
- [ ] JSON schema validates correctly
- [ ] Provider appears in correct demo category
- [ ] Generation workflow works end-to-end
- [ ] Media displays/plays correctly
- [ ] Error handling works (invalid inputs, API failures)
- [ ] Abort signal works for cancellation
- [ ] Authentication works (API key + proxy modes)
- [ ] Middleware integration works
- [ ] History/library integration works

### Provider-Specific Implementation Notes

When implementing, consider:
- **API Format**: REST vs GraphQL vs custom protocols
- **Authentication**: Bearer token, API key, multi-key, OAuth
- **Request Format**: JSON, FormData, multipart
- **Response Format**: Direct URLs, base64, async task IDs
- **Rate Limits**: Different limits per provider
- **File Limits**: Size, format, resolution restrictions
- **Error Codes**: Provider-specific error handling

### Final Validation

After implementation, the `pnpm-workflow-fixer` will:
- Verify provider compiles and integrates correctly
- Ensure proper demo integration in appropriate category
- Test generation workflow and media handling
- Run `pnpm build` to check for compilation errors
- Fix any integration issues found

**CRITICAL**: Always end your implementation by outputting:
```
ROUTE_TO_AGENT: pnpm-workflow-fixer
```

This ensures proper integration validation and automatic fixes for any issues found.