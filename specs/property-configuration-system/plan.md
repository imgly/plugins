# Property Configuration System Implementation Plan

## Executive Summary

**Objective:** Implement a flexible property configuration system for AI providers with context-aware defaults
**Approach:** Add property configuration to CommonProviderConfiguration with TypeScript utility types for extensions
**Timeline:** 4-5 days estimated total effort
**Risk Level:** Medium - Complex TypeScript generics but well-defined specification

## Specification Reference

- Original spec: `specs/property-configuration-system/spec.md`
- Related docs: Provider system documentation in plugin-ai-generation-web

## Success Criteria

### Functional Requirements
- [x] Static default values work for all property types
- [x] Dynamic default functions receive proper context
- [x] Recraft providers use extended context for style property
- [x] CustomAssetSource synchronizes with configured defaults
- [x] Type safety maintained throughout with IntelliSense support

### Non-Functional Requirements
- [x] Performance: Context building < 10ms
- [x] Security: No sensitive data exposed in context
- [x] Compatibility: All existing providers continue working unchanged
- [x] Type Safety: Full TypeScript type inference and checking

### Definition of Done
- [x] All automated tests passing
- [ ] Code review completed
- [ ] Documentation updated with examples
- [ ] Migration guide written for providers
- [x] Recraft providers migrated to use new system
- [x] Demo app updated to showcase configuration

## Out of Scope

- Property validation rules (future extension)
- Property metadata/descriptions (future extension)
- Conditional rendering based on values (handled by Feature API)
- Value transformations (future extension)
- Cross-property dependencies (intentionally excluded)

## Technical Design

### Architecture Overview
```
CommonProviderConfiguration<I, O>
  └── properties?: PropertiesConfiguration<I>
       └── [propertyName]: PropertyConfig<T, C>
            ├── default?: T | ((context: C) => T)
            └── (future extensions)

PropertyContext (base)
  ├── engine: CreativeEngine
  ├── cesdk?: CreativeEditorSDK
  └── locale: string

ExtendPropertyContexts<I, ContextMap> (utility type)
  └── Maps properties to their context types
```

### Data Model Changes
- Add `properties` field to CommonProviderConfiguration interface
- No database/schema changes required

### API Changes
- Non-breaking addition to provider configuration
- Backward compatible - existing providers work unchanged

## Implementation Phases

### Phase 0: Prerequisites
**Goal:** Ensure all dependencies and groundwork are in place
**Estimated Effort:** 2 hours

#### TODOs:
- [x] Review existing provider code in packages/plugin-ai-generation-web
- [x] Set up local development environment with pnpm workspace
- [x] Verify all AI plugin tests pass: `pnpm --filter "@imgly/plugin-ai-*" check:all`
- [x] Create feature branch: `feature/property-configuration-system`
- [x] Understand CustomAssetSource implementation in CE.SDK

**Verification:**
- [x] Can run `pnpm build` successfully
- [x] Can run `pnpm --filter "@imgly/plugin-ai-*" check:all` successfully
- [x] Understand provider initialization flow

---

### Phase 1: Core Type System and Interfaces
**Goal:** Establish the type foundation for property configuration
**Estimated Effort:** 4 hours

#### TODOs:

##### Task 1.1: Create Property Configuration Types
**File:** `packages/plugin-ai-generation-web/src/core/propertyConfiguration.ts` (new file)
**Changes Required:**
- [x] Create new file for property configuration types
- [x] Import CreativeEngine and CreativeEditorSDK types
- [x] Define PropertyContext base interface
- [x] Define PropertyConfig generic interface
- [x] Define PropertiesConfiguration type
- [x] Add JSDoc comments for all types

**Code Skeleton:**
```typescript
// packages/plugin-ai-generation-web/src/core/propertyConfiguration.ts
import type { CreativeEngine } from '@cesdk/cesdk-js';
import type { CreativeEditorSDK } from '@cesdk/cesdk-js';

/**
 * Base context provided to all property default functions
 */
export interface PropertyContext {
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

/**
 * Configuration for a single property
 * @template T - The type of the property value
 * @template C - The context type (defaults to PropertyContext)
 */
export interface PropertyConfig<T, C extends PropertyContext = PropertyContext> {
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
export type PropertiesConfiguration<I> = {
  [K in keyof Partial<I>]?: PropertyConfig<I[K]>;
};
```

##### Task 1.2: Create Utility Type for Context Extension
**File:** `packages/plugin-ai-generation-web/src/core/propertyConfiguration.ts` (append)
**Changes Required:**
- [x] Add ExtendPropertyContexts utility type
- [x] Add comprehensive JSDoc documentation
- [x] Add type examples in comments

**Code Skeleton:**
```typescript
/**
 * Utility type for extending property contexts selectively
 * @template I - The input type of the provider
 * @template ContextMap - Map of property names to their extended context types
 * 
 * @example
 * ```typescript
 * type MyConfig = ExtendPropertyContexts<MyInput, {
 *   style: StyleContext;  // style property gets StyleContext
 *   // other properties get PropertyContext
 * }>;
 * ```
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

##### Task 1.3: Update CommonProviderConfiguration Interface
**File:** `packages/plugin-ai-generation-web/src/types.ts`
**Changes Required:**
- [x] Import PropertyConfiguration types
- [x] Add properties field to CommonProviderConfiguration
- [x] Update JSDoc comments

**Code Skeleton:**
```typescript
// Add import at top of file
import type { PropertiesConfiguration } from './core/propertyConfiguration.js';

// Update CommonProviderConfiguration interface (around line 62)
export interface CommonProviderConfiguration<I, O extends Output>
  extends CommonConfiguration<I, O> {
  // ... existing fields ...
  
  /**
   * Configure property behavior and defaults
   * @example
   * ```typescript
   * {
   *   properties: {
   *     style: { default: 'realistic_image' },
   *     prompt: { default: (ctx) => ctx.locale === 'de' ? 'Erstelle...' : 'Create...' }
   *   }
   * }
   * ```
   */
  properties?: PropertiesConfiguration<I>;
}
```

##### Task 1.4: Export Property Configuration Types
**File:** `packages/plugin-ai-generation-web/src/index.ts`
**Changes Required:**
- [x] Export property configuration types from core module

**Code Skeleton:**
```typescript
// Add to exports
export type {
  PropertyContext,
  PropertyConfig,
  PropertiesConfiguration,
  ExtendPropertyContexts
} from './core/propertyConfiguration.js';
```

#### Testing Checklist:
- [x] TypeScript compilation passes with new types
- [x] Existing providers still compile without changes
- [x] IntelliSense shows proper type hints

#### Phase 1 Verification:
- [x] All TODOs completed
- [x] Tests passing: `pnpm --filter "@imgly/plugin-ai-generation-web" check:types`
- [x] No breaking changes to existing code
- [x] Documentation added to all new types

---

### Phase 2: Property Resolution System
**Goal:** Implement the core logic for resolving property defaults
**Estimated Effort:** 6 hours

#### TODOs:

##### Task 2.1: Create Context Building Functions
**File:** `packages/plugin-ai-generation-web/src/utils/propertyContext.ts` (new file)
**Changes Required:**
- [x] Create file for context building utilities
- [x] Implement buildPropertyContext function
- [x] Add context caching mechanism
- [x] Handle locale extraction from CE.SDK

**Code Skeleton:**
```typescript
// packages/plugin-ai-generation-web/src/utils/propertyContext.ts
import type { CreativeEngine } from '@cesdk/cesdk-js';
import type { CreativeEditorSDK } from '@cesdk/cesdk-js';
import type { PropertyContext } from '../core/propertyConfiguration.js';

/**
 * Build the base property context from available sources
 */
export function buildPropertyContext(
  engine: CreativeEngine,
  cesdk?: CreativeEditorSDK
): PropertyContext {
  // TODO: Get locale from cesdk or default to 'en'
  const locale = cesdk?.i18n?.getLocale?.() || 'en';
  
  return {
    engine,
    cesdk,
    locale
  };
}

/**
 * Context cache for performance optimization
 */
export class PropertyContextCache {
  private cache: PropertyContext | null = null;
  
  /**
   * Get cached context or build new one
   */
  getContext(
    engine: CreativeEngine,
    cesdk?: CreativeEditorSDK
  ): PropertyContext {
    if (!this.cache) {
      this.cache = buildPropertyContext(engine, cesdk);
    }
    return this.cache;
  }
  
  /**
   * Clear the cache (e.g., when locale changes)
   */
  clear(): void {
    this.cache = null;
  }
}
```

##### Task 2.2: Create Property Resolution Functions
**File:** `packages/plugin-ai-generation-web/src/utils/propertyResolver.ts` (new file)
**Changes Required:**
- [x] Create file for property resolution logic
- [x] Implement resolvePropertyDefault function
- [x] Handle static vs dynamic defaults
- [x] Implement fallback chain logic

**Code Skeleton:**
```typescript
// packages/plugin-ai-generation-web/src/utils/propertyResolver.ts
import type { PropertyConfig, PropertyContext } from '../core/propertyConfiguration.js';

/**
 * Resolve the default value for a property
 * @template T - The property value type
 * @template C - The context type
 */
export function resolvePropertyDefault<T, C extends PropertyContext = PropertyContext>(
  propertyId: string,
  propertyConfig: PropertyConfig<T, C> | undefined,
  context: C,
  schemaDefault?: T,
  fallback?: T
): T | undefined {
  // TODO: 1. Check property configuration
  if (propertyConfig?.default !== undefined) {
    const defaultValue = propertyConfig.default;
    
    // TODO: 2a. Static value
    if (typeof defaultValue !== 'function') {
      return defaultValue;
    }
    
    // TODO: 2b. Dynamic value - call function with context
    return (defaultValue as (context: C) => T)(context);
  }
  
  // TODO: 3. Schema default
  if (schemaDefault !== undefined) {
    return schemaDefault;
  }
  
  // TODO: 4. Fallback
  return fallback;
}

/**
 * Batch resolve multiple property defaults
 */
export function resolvePropertyDefaults<I, C extends PropertyContext = PropertyContext>(
  properties: Array<{
    id: keyof I;
    config?: PropertyConfig<I[keyof I], C>;
    schemaDefault?: I[keyof I];
    fallback?: I[keyof I];
  }>,
  context: C
): Partial<I> {
  const resolved: Partial<I> = {};
  
  for (const prop of properties) {
    const value = resolvePropertyDefault(
      prop.id as string,
      prop.config,
      context,
      prop.schemaDefault,
      prop.fallback
    );
    
    if (value !== undefined) {
      resolved[prop.id] = value;
    }
  }
  
  return resolved;
}
```

##### Task 2.3: Add Unit Tests for Resolution
**File:** `packages/plugin-ai-generation-web/tests/propertyResolver.test.ts` (new file)
**Changes Required:**
- [x] Create test file
- [x] Test static default resolution
- [x] Test dynamic default resolution
- [x] Test fallback chain
- [x] Test context passing

**Code Skeleton:**
```typescript
// packages/plugin-ai-generation-web/tests/propertyResolver.test.ts
import { describe, it, expect } from 'vitest';
import { resolvePropertyDefault } from '../src/utils/propertyResolver.js';
import type { PropertyContext } from '../src/core/propertyConfiguration.js';

describe('propertyResolver', () => {
  const mockContext: PropertyContext = {
    engine: {} as any, // Mock engine
    cesdk: undefined,
    locale: 'en'
  };
  
  it('should resolve static default value', () => {
    // TODO: Test static value resolution
    const result = resolvePropertyDefault(
      'testProp',
      { default: 'static-value' },
      mockContext
    );
    expect(result).toBe('static-value');
  });
  
  it('should resolve dynamic default value', () => {
    // TODO: Test function-based default
    const result = resolvePropertyDefault(
      'testProp',
      { default: (ctx) => `locale-${ctx.locale}` },
      mockContext
    );
    expect(result).toBe('locale-en');
  });
  
  it('should follow fallback chain', () => {
    // TODO: Test config -> schema -> fallback order
    const result = resolvePropertyDefault(
      'testProp',
      undefined, // No config
      mockContext,
      'schema-default',
      'fallback-default'
    );
    expect(result).toBe('schema-default');
  });
  
  it('should use fallback when no other defaults', () => {
    // TODO: Test final fallback
    const result = resolvePropertyDefault(
      'testProp',
      undefined,
      mockContext,
      undefined,
      'fallback-value'
    );
    expect(result).toBe('fallback-value');
  });
});
```

#### Testing Checklist:
- [x] Unit tests written and passing
- [x] Context building works correctly
- [x] Resolution follows correct precedence
- [x] Type inference works properly

#### Phase 2 Verification:
- [x] All TODOs completed
- [x] Tests passing: `pnpm --filter "@imgly/plugin-ai-generation-web" test`
- [x] Code review for resolution logic
- [x] Performance: resolution < 1ms per property

---

### Phase 3: Recraft Provider Integration
**Goal:** Implement extended context for Recraft providers with CustomAssetSource synchronization
**Estimated Effort:** 8 hours

#### TODOs:

##### Task 3.1: Define Recraft Style Context
**File:** `packages/plugin-ai-image-generation-web/src/fal-ai/recraftTypes.ts` (new file)
**Changes Required:**
- [x] Create file for Recraft-specific types
- [x] Define RecraftStyleContext interface
- [x] Define Recraft configuration types
- [x] Export types for use in providers

**Code Skeleton:**
```typescript
// packages/plugin-ai-image-generation-web/src/fal-ai/recraftTypes.ts
import type { PropertyContext, ExtendPropertyContexts } from '@imgly/plugin-ai-generation-web';
import type { CommonProviderConfiguration } from '@imgly/plugin-ai-generation-web';
import type { RecraftV3TextToImageInput, RecraftV3Output } from './RecraftV3.schema.js';
import type { Recraft20bTextToImageInput, Recraft20bOutput } from './Recraft20b.schema.js';

/**
 * Extended context for Recraft style property
 */
export interface RecraftStyleContext extends PropertyContext {
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

/**
 * Configuration for RecraftV3 provider with extended style context
 */
export interface RecraftV3Configuration 
  extends CommonProviderConfiguration<RecraftV3TextToImageInput, RecraftV3Output> {
  
  properties?: ExtendPropertyContexts<RecraftV3TextToImageInput, {
    style: RecraftStyleContext;
    // All other properties use base PropertyContext
  }>;
  
  baseURL?: string;
}

/**
 * Configuration for Recraft20b provider with extended style context
 */
export interface Recraft20bConfiguration
  extends CommonProviderConfiguration<Recraft20bTextToImageInput, Recraft20bOutput> {
  
  properties?: ExtendPropertyContexts<Recraft20bTextToImageInput, {
    style: RecraftStyleContext;
    // All other properties use base PropertyContext
  }>;
  
  baseURL?: string;
}
```

##### Task 3.2: Create Recraft Context Utilities
**File:** `packages/plugin-ai-image-generation-web/src/fal-ai/recraftUtils.ts` (new file)
**Changes Required:**
- [x] Create utility functions for Recraft providers
- [x] Implement initializeStyleAssetSource with default synchronization
- [x] Implement resolveStyleDefault function
- [x] Add helper to get available styles

**Code Skeleton:**
```typescript
// packages/plugin-ai-image-generation-web/src/fal-ai/recraftUtils.ts
import type { CreativeEditorSDK } from '@cesdk/cesdk-js';
import { CustomAssetSource } from '@cesdk/cesdk-js';
import type { RecraftStyleContext, RecraftV3Configuration } from './recraftTypes.js';
import { buildPropertyContext } from '@imgly/plugin-ai-generation-web';
import { STYLES_IMAGE, STYLES_VECTOR } from './RecraftV3.constants.js';
import { STYLES_ICON } from './Recraft20b.constants.js';

/**
 * Get available styles for a given style type
 */
export function getAvailableStylesForType(
  type: 'image' | 'vector' | 'icon'
): string[] {
  switch (type) {
    case 'image':
      return STYLES_IMAGE.map(s => s.id);
    case 'vector':
      return STYLES_VECTOR.map(s => s.id);
    case 'icon':
      return STYLES_ICON.map(s => s.id);
    default:
      return [];
  }
}

/**
 * Resolve style default from configuration
 */
export function resolveStyleDefault(
  config: RecraftV3Configuration,
  cesdk: CreativeEditorSDK,
  styleType: 'image' | 'vector' | 'icon'
): string | undefined {
  const defaultConfig = config.properties?.style?.default;
  
  if (!defaultConfig) {
    return undefined; // Use asset source's default
  }
  
  // TODO: Return static value if not a function
  if (typeof defaultConfig === 'string') {
    return defaultConfig;
  }
  
  // TODO: Build the extended context
  const baseContext = buildPropertyContext(cesdk.engine, cesdk);
  const context: RecraftStyleContext = {
    ...baseContext,
    type: styleType,
    availableStyles: getAvailableStylesForType(styleType),
    isInitializing: true
  };
  
  // TODO: Call the function with properly typed context
  return defaultConfig(context);
}

/**
 * Initialize a style asset source with configured default
 */
export function initializeStyleAssetSource(
  cesdk: CreativeEditorSDK,
  config: RecraftV3Configuration,
  styleType: 'image' | 'vector' | 'icon',
  styles: Array<{id: string, label: string}>,
  sourceId: string,
  getStyleThumbnail: (id: string) => string,
  translateLabel?: (value: string) => string
): CustomAssetSource {
  // TODO: Create the asset source with default first selection
  const assetSource = new CustomAssetSource(
    sourceId,
    styles.map(style => ({
      id: style.id,
      label: style.label,
      thumbUri: getStyleThumbnail(style.id)
    })),
    {
      translateLabel
    }
  );
  
  // TODO: Get the default from asset source (first item)
  const assetSourceDefault = assetSource.getActiveSelectValue();
  
  // TODO: Resolve configured default if provided
  const configuredDefault = resolveStyleDefault(config, cesdk, styleType);
  
  // TODO: If configuration provides a different default, update the asset source
  if (configuredDefault && configuredDefault !== assetSourceDefault?.id) {
    assetSource.clearActiveAssets();
    assetSource.setAssetActive(configuredDefault);
  }
  
  return assetSource;
}
```

##### Task 3.3: Update RecraftV3 Provider
**File:** `packages/plugin-ai-image-generation-web/src/fal-ai/RecraftV3.ts`
**Changes Required:**
- [x] Import new types and utilities
- [x] Change ProviderConfiguration to RecraftV3Configuration
- [x] Use initializeStyleAssetSource for asset sources
- [x] Resolve other property defaults

**Code Skeleton:**
```typescript
// Update imports
import type { RecraftV3Configuration } from './recraftTypes.js';
import { initializeStyleAssetSource, resolveStyleDefault } from './recraftUtils.js';
import { resolvePropertyDefault, buildPropertyContext } from '@imgly/plugin-ai-generation-web';

// Change type annotation (line ~42)
interface ProviderConfiguration extends RecraftV3Configuration {
  // Remove this interface, use RecraftV3Configuration directly
}

// Update function signature (line ~51)
export function RecraftV3(
  config: RecraftV3Configuration  // Changed from ProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', RecraftV3TextToImageInput, RecraftV3Output>> {
  // ... existing implementation
}

// Update getProvider function (line ~61)
function getProvider(
  cesdk: CreativeEditorSDK,
  config: RecraftV3Configuration  // Changed from ProviderConfiguration
): Provider<'image', RecraftV3TextToImageInput, RecraftV3Output> {
  // ... existing setup code ...
  
  // Replace imageStyleAssetSource initialization (lines 84-99)
  imageStyleAssetSource = initializeStyleAssetSource(
    cesdk,
    config,
    'image',
    STYLES_IMAGE,
    styleImageAssetSourceId,
    (id) => getStyleThumbnail(id, baseURL),
    createTranslationCallback(cesdk, modelKey, 'style', 'image')
  );
  
  // Replace vectorStyleAssetSource initialization (lines 100-115)
  vectorStyleAssetSource = initializeStyleAssetSource(
    cesdk,
    config,
    'vector',
    STYLES_VECTOR,
    styleVectorAssetSourceId,
    (id) => getStyleThumbnail(id, baseURL),
    createTranslationCallback(cesdk, modelKey, 'style', 'image')
  );
  
  // Get initial values (lines 117-120) remain the same
  const initialImageStyle = imageStyleAssetSource.getActiveSelectValue();
  const initialVectorStyle = vectorStyleAssetSource.getActiveSelectValue();
  
  // ... rest of provider setup ...
  
  // In the render function, resolve other property defaults
  // Add after style state initialization (around line 235)
  const propertyContext = buildPropertyContext(cesdk.engine, cesdk);
  
  // Resolve prompt default
  const defaultPrompt = resolvePropertyDefault(
    'prompt',
    config.properties?.prompt,
    propertyContext,
    undefined, // No schema default
    '' // Fallback
  );
  
  // Use defaults in state initialization
  const promptState = state<string>('prompt', defaultPrompt || '');
  
  // ... continue with other properties ...
}
```

##### Task 3.4: Update Recraft20b Provider
**File:** `packages/plugin-ai-image-generation-web/src/fal-ai/Recraft20b.ts`
**Changes Required:**
- [x] Apply same changes as RecraftV3
- [x] Handle additional icon style type
- [x] Update all three asset sources

**Code Skeleton:**
```typescript
// Similar changes to RecraftV3
// Import new types and utilities
import type { Recraft20bConfiguration } from './recraftTypes.js';
import { initializeStyleAssetSource } from './recraftUtils.js';

// Update provider configuration type
export function Recraft20b(
  config: Recraft20bConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', Recraft20bTextToImageInput, Recraft20bOutput>> {
  // ... implementation with three style types (image, vector, icon)
}
```

##### Task 3.5: Add Integration Tests
**File:** `packages/plugin-ai-image-generation-web/tests/recraft-config.test.ts` (new file)
**Changes Required:**
- [x] Create test file for Recraft configuration
- [x] Test static style defaults
- [x] Test dynamic style defaults with context
- [x] Test CustomAssetSource synchronization
- [x] Test fallback behavior

**Code Skeleton:**
```typescript
// packages/plugin-ai-image-generation-web/tests/recraft-config.test.ts
import { describe, it, expect, vi } from 'vitest';
import { RecraftV3 } from '../src/fal-ai/RecraftV3.js';

describe('Recraft Property Configuration', () => {
  it('should apply static style default', async () => {
    // TODO: Mock CE.SDK and test static default
    const config = {
      proxyUrl: 'https://api.example.com',
      properties: {
        style: {
          default: 'vintage_illustration'
        }
      }
    };
    
    // TODO: Verify CustomAssetSource gets updated
  });
  
  it('should apply dynamic style default based on context', async () => {
    // TODO: Test function-based default
    const config = {
      proxyUrl: 'https://api.example.com',
      properties: {
        style: {
          default: (context) => {
            if (context.type === 'vector') {
              return 'vintage_illustration';
            }
            return 'realistic_image';
          }
        }
      }
    };
    
    // TODO: Verify correct style selected based on type
  });
  
  it('should synchronize with CustomAssetSource', async () => {
    // TODO: Test that clearActiveAssets and setAssetActive are called
  });
});
```

#### Testing Checklist:
- [x] Recraft providers compile with new types
- [x] Style defaults work statically and dynamically
- [x] CustomAssetSource synchronizes correctly
- [x] Other properties can use base context

#### Phase 3 Verification:
- [x] All TODOs completed
- [x] Tests passing: `pnpm --filter "@imgly/plugin-ai-image-generation-web" test`
- [x] Recraft providers work in demo app
- [x] Type safety maintained throughout

---

### Phase 4: Additional Provider Examples and Documentation
**Goal:** Add property configuration to other providers and create comprehensive documentation
**Estimated Effort:** 4 hours

#### TODOs:

##### Task 4.1: Add Configuration to OpenAI Provider
**File:** `packages/plugin-ai-image-generation-web/src/openai/DallE3.ts`
**Changes Required:**
- [ ] Add property configuration support
- [ ] Set sensible defaults for common properties
- [ ] Use locale-based prompt defaults

**Code Skeleton:**
```typescript
// Example configuration in provider usage
DallE3({
  proxyUrl: 'https://api.example.com',
  properties: {
    prompt: {
      default: (context) => {
        switch(context.locale) {
          case 'de': return 'Erstelle ein Bild';
          case 'ja': return '画像を作成';
          default: return 'Create an image';
        }
      }
    },
    quality: {
      default: 'standard'
    },
    size: {
      default: '1024x1024'
    },
    style: {
      default: (context) => {
        // Use vivid style if high quality feature is enabled
        if (context.cesdk?.feature.isEnabled('ly.img.quality.high')) {
          return 'vivid';
        }
        return 'natural';
      }
    }
  }
});
```

##### Task 4.2: Create Migration Guide
**File:** `packages/plugin-ai-generation-web/docs/property-configuration-migration.md` (new file)
**Changes Required:**
- [ ] Create migration guide document
- [ ] Show before/after examples
- [ ] List benefits of migration
- [ ] Provide step-by-step instructions

**Code Skeleton:**
```markdown
# Property Configuration Migration Guide

## Overview
The Property Configuration System allows providers to define default values for their properties...

## Benefits
- Context-aware defaults based on locale, engine capabilities, etc.
- Type-safe configuration with IntelliSense support
- Cleaner separation of configuration from implementation

## Migration Steps

### Step 1: Identify Current Defaults
Find hardcoded defaults in your provider implementation...

### Step 2: Add Property Configuration
```typescript
// Before
const styleState = state<string>('style', 'realistic_image');

// After
const defaultStyle = resolvePropertyDefault(
  'style',
  config.properties?.style,
  propertyContext,
  'realistic_image'  // Fallback
);
const styleState = state<string>('style', defaultStyle);
```

### Step 3: Test Your Changes
...

## Examples
[Include comprehensive examples]
```

##### Task 4.3: Add Examples to Demo App
**File:** `examples/web/src/components/ai-demo.tsx` (or similar)
**Changes Required:**
- [ ] Add example showing static defaults
- [ ] Add example showing dynamic defaults
- [ ] Add example with Recraft extended context
- [ ] Document in demo README

#### Testing Checklist:
- [ ] Migration guide is clear and comprehensive
- [ ] Examples work in demo app
- [ ] Documentation is accurate

#### Phase 4 Verification:
- [ ] All TODOs completed
- [ ] Documentation reviewed
- [ ] Demo examples working
- [ ] Migration guide tested with real provider

---

## Testing Strategy

### Unit Tests
**Files to create/modify:**
- `packages/plugin-ai-generation-web/tests/propertyResolver.test.ts`
- `packages/plugin-ai-generation-web/tests/propertyContext.test.ts`
- `packages/plugin-ai-image-generation-web/tests/recraft-config.test.ts`

**Test Cases:**
- [x] Static default resolution
- [x] Dynamic default resolution with context
- [x] Fallback chain (config → schema → hardcoded)
- [x] Context building with all fields
- [x] Context caching behavior
- [x] ExtendPropertyContexts type inference
- [x] Recraft style synchronization
- [x] Error handling for invalid defaults

### Integration Tests
**Files to create/modify:**
- `packages/plugin-ai-image-generation-web/tests/integration/provider-config.test.ts`

**Test Scenarios:**
- [x] Provider initialization with property configuration
- [x] Multiple properties with mixed static/dynamic defaults
- [x] Locale changes affecting defaults
- [x] Feature flag changes affecting defaults

### Performance Tests
- [x] Measure context building time (target: < 10ms)
- [x] Measure property resolution time (target: < 1ms per property)
- [x] Test with 50+ properties configured

### Manual Testing Script
1. Start demo app with configured providers
2. Verify Recraft style defaults apply correctly
3. Change locale and verify prompt defaults update
4. Toggle feature flags and verify conditional defaults
5. Check CustomAssetSource shows correct active style
6. Verify all providers work without configuration (backward compatibility)

## Rollout Strategy

### Phase A: Internal Testing
- [ ] Deploy to development environment
- [ ] Test with all existing providers
- [ ] Verify no breaking changes

### Phase B: Provider Migration
- [ ] Migrate Recraft providers first (most complex)
- [ ] Migrate OpenAI providers
- [ ] Migrate other providers incrementally

### Phase C: Documentation Release
- [ ] Publish migration guide
- [ ] Update provider documentation
- [ ] Add to main README

## Monitoring & Observability

### Metrics to Track
- [ ] Property resolution time: < 1ms average
- [ ] Context building time: < 10ms average
- [ ] Memory usage: No significant increase

### Alerts to Configure
- [ ] Resolution failures (should be zero)
- [ ] Performance degradation > 10ms

## Documentation Updates

### Code Documentation
- [ ] Add JSDoc comments to all public APIs
- [ ] Document all type parameters
- [ ] Include usage examples in comments

### User Documentation
- [ ] Update provider configuration guide
- [ ] Add property configuration section to README
- [ ] Create cookbook with common patterns

## Risk Mitigation

### Identified Risks
1. **TypeScript Complexity**
   - Probability: Medium
   - Impact: Medium
   - Mitigation: Use utility types to simplify
   - Contingency: Provide simpler alternative API

2. **CustomAssetSource Synchronization**
   - Probability: Low
   - Impact: High
   - Mitigation: Thorough testing of Recraft providers
   - Contingency: Revert to original behavior if issues

3. **Performance Impact**
   - Probability: Low
   - Impact: Low
   - Mitigation: Context caching, lazy evaluation
   - Contingency: Make feature opt-in initially

## Dependencies

### External Dependencies
- [ ] @cesdk/cesdk-js: Must support CustomAssetSource.clearActiveAssets/setAssetActive
- [ ] TypeScript: Version 5.0+ for utility type features

### Internal Dependencies
- [ ] plugin-ai-generation-web must be built first
- [ ] All provider packages depend on updated types

## Timeline

### Day 1
- [x] Phase 0: Prerequisites (2 hours)
- [x] Phase 1: Core Type System (4 hours)

### Day 2
- [x] Phase 2: Property Resolution System (6 hours)

### Day 3
- [x] Phase 3: Recraft Provider Integration (8 hours)

### Day 4
- [ ] Phase 4: Documentation and Examples (4 hours)
- [ ] Testing: Unit and integration tests (4 hours)

### Day 5
- [ ] Testing: Complete test coverage
- [ ] Documentation: Final review
- [ ] Code review and fixes

## Open Questions

None - specification is comprehensive and clear.

## References

- Original specification: `specs/property-configuration-system/spec.md`
- Provider documentation: Internal provider guides
- CustomAssetSource API: CE.SDK documentation
- TypeScript utility types: TS documentation