# Fix: Property Configuration Not Reaching Render Functions

## Problem Summary

The property configuration (e.g., `properties: { prompt: { default: "..." } }`) passed to providers like RecraftV3 is not reaching the renderProperty functions, causing defaults not to be applied.

### Root Cause

When a provider is initialized with configuration:
```typescript
FalAiImage.RecraftV3({
  proxyUrl: '...',
  properties: {
    prompt: { default: "My horse in the style of Van Gogh" },
    style: { default: 'realistic_image/hdr' },
    image_size: { default: 'portrait_4_3' }
  }
})
```

The configuration flow loses the provider-specific config:

1. RecraftV3 receives the config with `properties`
2. RecraftV3 passes config to createImageProvider
3. createImageProvider returns a Provider object (doesn't include the config)
4. ImageGeneration plugin initializes providers with its own plugin-level config
5. renderProperty functions receive only the plugin config, NOT the provider config
6. `(config as any).properties?.[propertyId]` returns undefined

## Solution: Pass Both Configs Through Initialization Chain

### Implementation Steps

#### 1. Add configuration field to Provider type
**File:** `packages/plugin-ai-generation-web/src/core/provider.ts`

Add an optional `configuration` field to the Provider interface:
```typescript
interface Provider<K extends OutputKind, I, O extends Output> {
  // ... existing fields ...

  /**
   * Provider-specific configuration passed during initialization
   * @internal
   */
  configuration?: any;
}
```

#### 2. Store config in Provider object
**File:** `packages/plugin-ai-image-generation-web/src/fal-ai/createImageProvider.ts`

Around line 80, add the configuration to the provider object:
```typescript
const provider: Provider<'image', I, ImageOutput> = {
  id: options.modelKey,
  kind: 'image',
  name: options.name,
  configuration: config,  // ADD THIS LINE - store the provider-specific config
  initialize: async (context) => {
    // ... existing code ...
  },
  // ... rest of provider ...
}
```

#### 3. Update InitializationContext to include provider config
**File:** `packages/plugin-ai-generation-web/src/types.ts`

Around line 144, update the InitializationContext type:
```typescript
export type InitializationContext<
  K extends OutputKind,
  I,
  O extends Output,
  P extends PanelInput<K, I> = PanelInput<K, I>
> = {
  provider: Provider<K, I, O>;
  panelInput?: P;
  options: UIOptions;
  config: InternalPluginConfiguration<K, I, O>;  // Plugin-level config
  providerConfig?: any;  // ADD THIS - Provider-specific config
};
```

#### 4. Pass provider config through initialization
**File:** `packages/plugin-ai-generation-web/src/providers/initializeProvider.ts`

Around line 15, update the context creation:
```typescript
const context: InitializationContext<K, I, O> = {
  provider,
  panelInput: provider.input?.panel,
  options: {
    cesdk: options.cesdk,
    engine: options.cesdk.engine
  },
  config: internalConfig,
  providerConfig: provider.configuration  // ADD THIS - pass provider config
};
```

#### 5. Pass provider config to panel render functions
**File:** `packages/plugin-ai-generation-web/src/ui/panels/createPanelRenderFunctionFromSchema.ts`

The function signature already receives the context, but we need to ensure both configs are available to renderProperty. Around line 70, update the renderProperty call:
```typescript
const getInput = renderProperty(
  context,
  property,
  provider,
  panelInput,
  options,
  config,
  provider.kind,
  context.providerConfig  // ADD THIS - pass provider config as additional parameter
);
```

#### 6. Update renderProperty to accept provider config
**File:** `packages/plugin-ai-generation-web/src/openapi/renderProperty.ts`

Update the renderProperty function signature (around line 56):
```typescript
function renderProperty<K extends OutputKind, I, O extends Output>(
  context: BuilderRenderFunctionContext<any>,
  property: Property,
  provider: Provider<K, I, O>,
  panelInput: PanelInputSchema<K, I>,
  options: UIOptions,
  config: CommonConfiguration<I, O>,
  kind: K,
  providerConfig?: any  // ADD THIS parameter
): GetPropertyInput | undefined {
```

Then update all the render functions (renderStringProperty, renderEnumProperty, etc.) to:
1. Accept the providerConfig parameter
2. Check providerConfig?.properties first, then fall back to config?.properties

For example, in renderStringProperty (around line 230):
```typescript
// Resolve default value from property configuration
const propertyContext = buildPropertyContext(engine, options.cesdk);
// Check provider config first, then plugin config
const propertyConfig = providerConfig?.properties?.[propertyId] ??
                       (config as any).properties?.[propertyId];
```

Update ALL calls to child render functions to pass the providerConfig parameter.

#### 7. Update recursive render calls
In renderObjectProperty and renderAnyOfProperty, ensure providerConfig is passed to recursive renderProperty calls.

## Testing

After implementation, test with the example in `examples/web/src/pages/ai-demo.tsx`:

1. The prompt should be pre-populated with "My horse in the style of Van Gogh"
2. The style should default to 'realistic_image/hdr'
3. The image_size should default to 'portrait_4_3'

## Alternative Approach (Simpler)

If modifying all the function signatures is too complex, an alternative is to attach the provider config to the context object that's already being passed:

1. In createPanelRenderFunctionFromSchema, add providerConfig to the context
2. In renderProperty functions, access it via `context.providerConfig`

This would require fewer signature changes but might be less explicit.

## Notes

- The provider-specific config should take precedence over plugin-level config
- Both configs should be available for maximum flexibility
- This change maintains backward compatibility as providerConfig is optional