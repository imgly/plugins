# Feature API Test Suite

This document describes the Feature API tests created for the AI plugins.

## Test Coverage

### 1. Quick Action Feature Flag Registration
**Location**: `plugin-ai-{image|text}-generation-web/src/quickActions/__tests__/`

Tests that each quick action correctly registers its feature flag when initialized:
- ✅ Verifies `cesdk.feature.enable()` is called with correct key
- ✅ Validates i18n translations are set
- ✅ Checks quick action metadata (id, type, kind)

### 2. Provider Style Group Feature Flags
**Location**: `plugin-ai-image-generation-web/src/fal-ai/__tests__/RecraftV3.test.ts`

Tests style group filtering based on feature flags:
- ✅ Returns "any" style when all groups disabled
- ✅ Filters styles based on enabled feature flags
- ✅ Validates feature flag key patterns

### 3. Provider Selection Visibility
**Location**: `plugin-ai-generation-web/src/providers/__tests__/providerSelection.test.ts`

Tests provider selection UI visibility:
- ✅ Panel provider selector respects feature flags
- ✅ Quick action provider selector respects feature flags
- ✅ fromText/fromImage feature flags work correctly
- ✅ Feature flag hierarchy is maintained

### 4. Quick Action Menu Rendering
**Location**: `plugin-ai-generation-web/src/ui/__tests__/quickActionMenuFeatureFlags.test.ts`

Tests quick action filtering in menus:
- ✅ Individual quick actions filtered by feature flags
- ✅ Main quickAction flag disables all actions
- ✅ Dynamic visibility updates when flags change
- ✅ Provider selection in expanded state

### 5. Feature Flag Key Generation
**Location**: `plugin-ai-generation-web/src/__tests__/featureFlags.test.ts`

Tests feature flag key patterns and generation:
- ✅ Panel feature keys (providerSelect, fromText, fromImage)
- ✅ Quick action feature keys for all plugin types
- ✅ Provider style feature keys
- ✅ Hierarchical key relationships
- ✅ Edge cases (provider IDs with slashes)

## Running the Tests

### For packages with Jest configured:
```bash
# Run all AI plugin tests
pnpm --filter "@imgly/plugin-ai-*" test

# Run specific test file
pnpm --filter "@imgly/plugin-ai-generation-web" test featureFlags.test.ts
```

### For packages without Jest (image/text plugins):
The test files serve as implementation examples and can be run once Jest is configured.

## Test Patterns Used

1. **Mocking**: All tests use Jest mocks for CESDK instance
2. **Isolation**: Each test is independent and doesn't require full plugin initialization
3. **Coverage**: Tests cover both positive and negative cases
4. **Validation**: Tests validate key format patterns to prevent typos

## Benefits

These tests ensure:
- Feature flags are correctly registered
- Feature flag hierarchy is respected
- UI elements properly respond to feature flags
- Naming conventions are maintained
- No regression in feature flag functionality