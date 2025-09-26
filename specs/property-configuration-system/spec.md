# Property Configuration System Specification

## Overview

The Property Configuration System provides a flexible and type-safe way to configure property defaults and behavior for AI generation providers. This system allows providers to define initial values for their properties, with support for both static values and dynamic functions that can adapt based on context.

## Core Concepts

### Property Configuration

Each provider can define configuration for its properties through the `properties` field in its configuration object. This configuration supports:

- **Default values**: Initial values for properties when the UI is first rendered
- **Dynamic defaults**: Functions that compute defaults based on context
- **Provider-specific extensions**: Type-safe context extensions for specialized properties

### Property Context

The context object provides runtime information to dynamic default functions, allowing them to make intelligent decisions about initial values.

## Base Context Structure

All property default functions receive a context object with the following base properties:

```typescript
interface PropertyContext {
  /**
   * Creative Engine instance
   * Always available for engine-level operations
   */
  engine: CreativeEngine;
  
  /**
   * Creative Editor SDK instance
   * May be undefined if running headless or without UI
   */
  cesdk?: CreativeEditorSDK;
  
  /**
   * Current locale for internationalization
   * Format: ISO 639-1 language code (e.g., 'en', 'de', 'ja')
   * Defaults to 'en' if not available
   */
  locale: string;
}
```

### Note on Property Dependencies

While it might seem useful to have access to other property values through `currentValues`, this creates several challenges:

1. **Initialization Order**: Properties need to be initialized in dependency order, which can become complex
2. **Circular Dependencies**: Two properties depending on each other would create an unresolvable cycle
3. **Timing Issues**: The context would need to be rebuilt for each property, impacting performance

**Alternative Solutions for Property Dependencies:**

1. **Use Provider-Specific Context**: Providers can extend the context with specific computed values that multiple properties can use
2. **Shared Configuration Values**: Use configuration-level values that multiple properties reference
3. **Post-Initialization Updates**: Handle dependencies after initial defaults through UI state management

## Configuration Interface

### Base Types

```typescript
/**
 * Configuration for a single property
 * @template T - The type of the property value
 * @template C - The context type (defaults to PropertyContext)
 */
interface PropertyConfig<T, C extends PropertyContext = PropertyContext> {
  /**
   * Default value for the property
   * Can be a static value or a function that returns the value
   */
  default?: T | ((context: C) => T);
  
  // Future extensions reserved for:
  // visible?: boolean | ((context: C) => boolean);
  // validate?: (value: T) => string | null;
  // dependsOn?: string[];
}

/**
 * Properties configuration for a provider
 * @template I - The input type of the provider
 */
type PropertiesConfiguration<I> = {
  [K in keyof Partial<I>]?: PropertyConfig<I[K]>;
};
```

### Integration with Provider Configuration

```typescript
interface CommonProviderConfiguration<I, O> {
  // ... existing fields (proxyUrl, headers, etc.)
  
  /**
   * Configure property behavior and defaults
   */
  properties?: PropertiesConfiguration<I>;
}
```

## Usage Examples

### 1. Static Default Values

The simplest use case is providing static default values for properties:

```typescript
RecraftV3({
  proxyUrl: 'https://api.example.com',
  properties: {
    style: {
      default: 'realistic_image'
    },
    prompt: {
      default: 'A beautiful landscape'
    },
    image_size: {
      default: 'square_hd'
    },
    negative_prompt: {
      default: 'blurry, low quality, distorted'
    }
  }
});
```

### 2. Dynamic Defaults with Base Context

Use functions to compute defaults based on runtime context:

```typescript
SomeImageProvider({
  proxyUrl: 'https://api.example.com',
  properties: {
    // Locale-based default
    prompt: {
      default: (context) => {
        switch(context.locale) {
          case 'de': return 'Erstelle ein schönes Bild';
          case 'ja': return '美しい画像を作成';
          case 'fr': return 'Créer une belle image';
          default: return 'Create a beautiful image';
        }
      }
    },
    
    // Engine-based default
    image_size: {
      default: (context) => {
        // Check engine capabilities or settings
        const maxResolution = context.engine.block.getMaxResolution?.();
        if (maxResolution && maxResolution > 2048) {
          return 'landscape_16_9';  // Higher resolution if supported
        }
        return 'square_hd';  // Standard default
      }
    },
    
    // Time-based default (using Date, not context)
    style: {
      default: (context) => {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 12) {
          return 'bright_morning';
        } else if (hour >= 18 || hour < 6) {
          return 'moody_evening';
        }
        return 'natural_light';
      }
    },
    
    // CESDK feature-based default
    negative_prompt: {
      default: (context) => {
        // Use CESDK features if available
        if (context.cesdk?.feature.isEnabled('ly.img.quality.high')) {
          return '';  // No negative prompt for high quality mode
        }
        return 'blurry, distorted';
      }
    }
  }
});
```

## Provider-Specific Context Extensions

Providers can extend the base context for properties that need additional information. This is done through TypeScript generics while maintaining full type safety.

### Utility Type for Context Extension

To avoid cumbersome type manipulations, the system provides a utility type that makes it easy to extend context for specific properties:

```typescript
/**
 * Utility type for extending property contexts selectively
 * @template I - The input type of the provider
 * @template ContextMap - Map of property names to their extended context types
 */
export type ExtendPropertyContexts<
  I,
  ContextMap extends Partial<Record<keyof I, PropertyContext>>
> = {
  [K in keyof Partial<I>]: K extends keyof ContextMap
    ? PropertyConfig<I[K], ContextMap[K]>
    : PropertyConfig<I[K]>
};
```

This utility type automatically:
- Applies extended context to specified properties
- Uses base `PropertyContext` for all other properties
- Maintains full type safety and IntelliSense support

### Example: Recraft Style Context Extension

> **Note**: In the actual implementation, only the `style` property of Recraft providers (RecraftV3, Recraft20b) will use extended context. All other properties will use the base `PropertyContext`.

The Recraft providers need to know which style type (image/vector/icon) is currently selected when determining style defaults.

#### Recraft-Specific Implementation Details

1. **CustomAssetSource Integration**: Recraft providers use `CustomAssetSource` instances to manage style options. Each style type (image/vector/icon) has its own asset source.

2. **Default Synchronization**: When a custom default is provided via configuration, it must be synchronized with the CustomAssetSource to ensure the UI shows the correct active/selected style.

3. **Current Behavior**: By default, CustomAssetSource automatically selects the first asset as active. This needs to be overridden when a custom default is configured.

4. **Required Changes**:
   - Get the initial default from CustomAssetSource's `getActiveSelectValue()`
   - If configuration provides a different default, update the asset source using `clearActiveAssets()` and `setAssetActive(newDefault)`
   - Ensure the UI state and asset source remain synchronized

```typescript
// Step 1: Define the extended context for Recraft style property
interface RecraftStyleContext extends PropertyContext {
  /**
   * Currently selected style type
   */
  type: 'image' | 'vector' | 'icon';
  
  /**
   * Available styles for the current type
   */
  availableStyles: string[];
  
  /**
   * Whether this is the initial render
   */
  isInitializing: boolean;
}

// Step 2: Use the utility type in configuration
interface RecraftProviderConfiguration 
  extends CommonProviderConfiguration<RecraftInput, RecraftOutput> {
  
  properties?: ExtendPropertyContexts<RecraftInput, {
    style: RecraftStyleContext;  // Only style gets extended context
    // All other properties automatically use base PropertyContext
  }>;
}

// Step 3: Usage with extended context
RecraftV3({
  proxyUrl: 'https://api.example.com',
  properties: {
    style: {
      default: (context) => {
        // TypeScript knows context is RecraftStyleContext
        if (context.type === 'image') {
          // Check if a saved style is available (would need to be loaded separately)
          const savedStyle = localStorage.getItem('recraft.imageStyle');
          if (savedStyle && context.availableStyles.includes(savedStyle)) {
            return savedStyle;
          }
          return 'realistic_image';
        } else if (context.type === 'vector') {
          return 'vintage_illustration';
        } else {
          return 'icon/broken_line';
        }
      }
    },
    
    prompt: {
      default: (context) => {
        // This uses base PropertyContext
        return 'Beautiful artwork';
      }
    }
  }
});
```

### Multiple Extended Properties Example

The utility type also handles multiple properties with different extended contexts:

```typescript
// Define multiple extended contexts
interface StyleContext extends PropertyContext {
  styleGroup: string;
  availableStyles: string[];
}

interface SizeContext extends PropertyContext {
  maxResolution: number;
  aspectRatios: string[];
}

// Extend multiple properties at once
interface MyProviderConfiguration 
  extends CommonProviderConfiguration<MyInput, MyOutput> {
  
  properties?: ExtendPropertyContexts<MyInput, {
    style: StyleContext;
    image_size: SizeContext;
    // prompt, negative_prompt, etc. use base PropertyContext
  }>;
}
```

### Implementation Pattern for Extended Context

When a provider needs to extend the context, it should:

1. **Define the extended context interface** that extends `PropertyContext`
2. **Override the property configuration type** to use the extended context for specific properties
3. **Build the extended context** when resolving defaults
4. **Maintain type safety** throughout the process
5. **Synchronize with UI components** (for Recraft: update CustomAssetSource)

Example implementation for Recraft providers:

```typescript
// In RecraftV3.ts
function initializeStyleAssetSource(
  cesdk: CreativeEditorSDK,
  config: RecraftProviderConfiguration,
  styleType: 'image' | 'vector' | 'icon',
  styles: Array<{id: string, label: string}>
): CustomAssetSource {
  // Create the asset source with default first selection
  const assetSource = new CustomAssetSource(
    `fal-ai/recraft-v3/styles/${styleType}`,
    styles.map(style => ({
      id: style.id,
      label: style.label,
      thumbUri: getStyleThumbnail(style.id)
    }))
  );
  
  // Get the default from asset source (first item)
  const assetSourceDefault = assetSource.getActiveSelectValue();
  
  // Resolve configured default if provided
  const configuredDefault = resolveStyleDefault(config, cesdk, styleType);
  
  // If configuration provides a different default, update the asset source
  if (configuredDefault && configuredDefault !== assetSourceDefault?.id) {
    assetSource.clearActiveAssets();
    assetSource.setAssetActive(configuredDefault);
  }
  
  return assetSource;
}

function resolveStyleDefault(
  config: RecraftProviderConfiguration,
  cesdk: CreativeEditorSDK,
  styleType: 'image' | 'vector' | 'icon'
): string | undefined {
  const defaultConfig = config.properties?.style?.default;
  
  if (!defaultConfig) {
    return undefined; // Use asset source's default
  }
  
  // Return static value if not a function
  if (typeof defaultConfig === 'string') {
    return defaultConfig;
  }
  
  // Build the extended context
  const context: RecraftStyleContext = {
    // Base context fields
    engine: cesdk.engine,
    cesdk,
    locale: cesdk.i18n.getLocale(),
    
    // Extended fields specific to Recraft
    type: styleType,
    availableStyles: getAvailableStylesForType(styleType),
    isInitializing: true
  };
  
  // Call the function with properly typed context
  return defaultConfig(context);
}

// Usage in provider initialization
const imageStyleAssetSource = initializeStyleAssetSource(
  cesdk, 
  config, 
  'image',
  STYLES_IMAGE
);

const vectorStyleAssetSource = initializeStyleAssetSource(
  cesdk,
  config,
  'vector', 
  STYLES_VECTOR
);

// Later in the UI state initialization
const initialImageStyle = imageStyleAssetSource.getActiveSelectValue();
const styleImageState = state<string>(
  'style/image',
  initialImageStyle?.id || 'realistic_image'
);
```

## Resolution Process

The default value resolution follows this process:

1. **Check for property configuration**: Look for the property in the `properties` configuration
2. **Evaluate default**: 
   - If static value, use directly
   - If function, build context and call function
3. **Fallback to schema default**: If no configuration, use OpenAPI schema default
4. **Final fallback**: Use provider-specific hardcoded default

```typescript
function resolvePropertyDefault<T>(
  propertyId: string,
  propertyConfig?: PropertyConfig<T>,
  schemaDefault?: T,
  fallback?: T
): T {
  // 1. Check property configuration
  if (propertyConfig?.default !== undefined) {
    const defaultValue = propertyConfig.default;
    
    // 2a. Static value
    if (typeof defaultValue !== 'function') {
      return defaultValue;
    }
    
    // 2b. Dynamic value
    const context = buildPropertyContext();
    return defaultValue(context);
  }
  
  // 3. Schema default
  if (schemaDefault !== undefined) {
    return schemaDefault;
  }
  
  // 4. Fallback
  return fallback!;
}
```

## Best Practices

### 1. Keep Context Building Efficient

Context should be built lazily and cached when possible:

```typescript
let contextCache: PropertyContext | null = null;

function getPropertyContext(): PropertyContext {
  if (!contextCache) {
    contextCache = buildPropertyContext();
  }
  return contextCache;
}
```

### 2. Type-Safe Context Extensions

Always use proper typing when extending context:

```typescript
// Good - Explicitly type extended context
interface MyProviderContext extends PropertyContext {
  additionalField: string;
}

const context: MyProviderContext = {
  engine: cesdk.engine,
  cesdk,
  locale: cesdk.i18n.getLocale(),
  additionalField: 'value'
};

// Bad - Using any or losing type safety
const context: any = {
  // ...
};
```

### 3. Provide Sensible Fallbacks

Always have a fallback chain for defaults:

```typescript
properties: {
  style: {
    default: (context) => {
      // 1. Locale-based default
      if (context.locale === 'ja') {
        return 'anime_style';
      }
      
      // 2. Check CESDK features
      if (context.cesdk?.feature.isEnabled('ly.img.artistic')) {
        return 'artistic_painting';
      }
      
      // 3. Standard default
      return 'realistic_image';
    }
  }
}
```

### 4. Document Extended Context

When extending context, clearly document what additional fields are available:

```typescript
/**
 * Extended context for style selection in Recraft providers
 * 
 * @extends PropertyContext
 * @property styleGroup - The currently selected style category
 * @property availableStyles - List of valid style IDs for the current group
 * @property isInitializing - True during initial UI render, false for updates
 */
interface RecraftStyleContext extends PropertyContext {
  // ... fields
}
```

## Migration Guide

For existing providers to adopt this system:

1. **Identify current defaults**: Find hardcoded defaults in the provider
2. **Create property configuration**: Add `properties` to provider configuration
3. **Move defaults to configuration**: Replace hardcoded values with configuration
4. **Add dynamic behavior**: Convert static defaults to functions where beneficial
5. **Test thoroughly**: Ensure defaults work in all scenarios

Example migration:

```typescript
// Before
const styleState = state<string>('style', 'realistic_image'); // Hardcoded

// After
const defaultStyle = resolvePropertyDefault(
  'style',
  config.properties?.style,
  'realistic_image'  // Fallback
);
const styleState = state<string>('style', defaultStyle);
```

## Future Extensions

The property configuration system is designed to be extensible. Future additions may include:

- **Validation rules**: Configure validation constraints such as min/max length for strings, min/max values for numbers, regex patterns, or custom validation functions
- **Property metadata**: Additional metadata like descriptions, tooltips, or help text that could be displayed in the UI
- **Conditional rendering**: Control when properties are shown based on other property values or context (complementing the Feature API)
- **Value transformations**: Transform property values before they're sent to the API (e.g., format conversions, unit conversions)

These extensions would follow the same pattern of optional fields in the `PropertyConfig` interface, maintaining backward compatibility.