# Middleware preventDefault() API

## Overview

This specification defines a simple, explicit API for middleware to suppress default UI feedback behaviors (notifications, block states, console logging) when handling success or error scenarios themselves.

## Problem Statement

Currently, there is no explicit API for middleware to suppress default UI feedback behaviors when handling success or error scenarios themselves. Developers need a simple, discoverable way to:

1. Show custom error notifications instead of default ones
2. Handle errors silently (logging only, no UI feedback)
3. Implement retry logic with custom progress indication
4. Add custom success notifications for quick actions (which are silent by default)

### Requirements

1. **Simple**: One method call, no complex configuration
2. **Explicit**: Clear intent - "I'm preventing default behavior"
3. **Discoverable**: Easy to find in middleware options
4. **Generic**: Works for success and error scenarios
5. **Future-proof**: Automatically covers new default behaviors

## Solution: preventDefault() API

Add a simple, explicit method to middleware options that suppresses all default UI feedback behaviors.

### Design Principles

1. **Simple**: One method call, no complex configuration
2. **Explicit**: Clear intent - "I'm preventing default behavior"
3. **Familiar**: Matches DOM `preventDefault()` pattern developers already know
4. **Generic**: Works for success and error scenarios
5. **Future-proof**: Automatically covers new default behaviors

## API Design

### Interface Addition

```typescript
interface MiddlewareOptions {
  // ... existing properties
  blockIds?: number[];
  abortSignal?: AbortSignal;
  engine: CreativeEngine;
  cesdk?: CreativeEditorSDK;

  /**
   * Prevents default UI feedback behaviors for this generation.
   *
   * **What gets prevented:**
   * - Error/success notifications
   * - Block error state
   * - Console error logging
   *
   * **What is NOT prevented (always happens):**
   * - Pending → Ready block state transition (loading spinner always stops)
   * - Block validity checks
   * - Middleware execution flow
   *
   * @example
   * ```typescript
   * catch (error) {
   *   options.preventDefault();
   *   myCustomErrorHandler(error);
   *   throw error;
   * }
   * ```
   */
  preventDefault(): void;

  /**
   * Check if default behaviors have been prevented.
   *
   * @returns `true` if preventDefault() was called
   *
   * @example
   * ```typescript
   * if (!options.defaultPrevented()) {
   *   // Show default notification
   * }
   * ```
   *
   * @internal
   */
  defaultPrevented(): boolean;
}
```

### Internal Implementation

```typescript
interface MiddlewareOptions {
  // Public API
  preventDefault(): void;
  defaultPrevented(): boolean;

  // Internal state (not exposed to middleware)
  _defaultPrevented?: boolean;
}

// In middleware initialization
const options: MiddlewareOptions = {
  blockIds,
  abortSignal,
  engine,
  cesdk,
  _defaultPrevented: false,

  preventDefault: function() {
    this._defaultPrevented = true;
  },

  defaultPrevented: function() {
    return this._defaultPrevented === true;
  }
};
```

## Default Behaviors Prevented

When `preventDefault()` is called, the following behaviors are suppressed:

### 1. Error Notifications
- **Location**: `handleGenerationError.ts`
- **Behavior**: Default error toast notification
- **Types**:
  - Provider-configured error notifications
  - Generic fallback error notification

### 2. Success Notifications
- **Location**: `renderGenerationComponents.ts:160-166`
- **Behavior**: Success toast notification (panel generation only)
- **Types**:
  - Provider-configured success notifications
  - Default "Generation successful" message

### 3. Block Error State
- **Location**: `handleGenerateFromPanel.ts:224-237, 312-320`
- **Behavior**: Setting blocks to `{ type: 'Error', error: 'Unknown' }` on failure
- **Effect**: Block shows error icon/indicator (panel generation only)

### 4. Console Error Logging
- **Location**: `handleGenerationError.ts:16`
- **Behavior**: `console.error('Generation failed:', error)`
- **Note**: Middleware can still log errors themselves

### 5. Quick Action Generic Error
- **Location**: `handleGenerateFromQuickAction.ts:269-272`
- **Behavior**: "A technical issue has occurred." notification
- **Note**: Quick actions show generic errors, not provider-configured ones

## What preventDefault() Does NOT Prevent

The following behaviors **always happen** regardless of `preventDefault()`:

### 1. Pending → Ready Transition (ALWAYS HAPPENS)

**Location**: `pendingMiddleware.ts:34-37` (finally block)

**Behavior**: Blocks are **always** returned to `Ready` state after generation completes (success or error)

**Why**: The `Pending` state is a loading indicator that must be cleared when the operation completes, otherwise blocks would be stuck in a loading state forever.

**Code**:
```typescript
finally {
  blockIds.forEach((blockId) => {
    if (options.engine.block.isValid(blockId))
      options.engine.block.setState(blockId, { type: 'Ready' });
  });
}
```

**This is correct behavior** - you want the loading spinner to stop regardless of whether you're showing custom notifications.

### 2. Block State Flow

#### Success Case (BOTH with and without preventDefault()):
```
Pending (loading spinner) → Ready (normal state)
```

#### Error Case WITHOUT preventDefault():
```
Panel Generation:  Pending → Error (red icon/indicator)
Quick Actions:     Pending → Ready (no error icon)
```

#### Error Case WITH preventDefault():
```
Both:              Pending → Ready (no error icon)
```

### 3. Summary Table

| Scenario | preventDefault()? | Block Visual State After | Notification Shown? |
|----------|-------------------|-------------------------|---------------------|
| ✅ Success | No | Ready (normal) | ✅ Yes (if configured) |
| ✅ Success | Yes | Ready (normal) | ❌ No |
| ❌ Error (Panel) | No | Error (red icon) | ✅ Yes (always) |
| ❌ Error (Panel) | Yes | Ready (normal) | ❌ No |
| ❌ Error (Quick Action) | No | Ready (normal) | ✅ Yes (generic) |
| ❌ Error (Quick Action) | Yes | Ready (normal) | ❌ No |

### 4. Key Takeaways

- ✅ **preventDefault() prevents**: Notifications, error block state, console logging
- ❌ **preventDefault() does NOT prevent**: Pending → Ready transition (loading spinner always stops)
- 💡 **Why**: Loading state management is separate from feedback/notification management
- 🎯 **Use case**: Show custom notifications while still clearing loading state properly

## Usage Examples

### Example 1: Custom Error Notification

```typescript
const customErrorMiddleware: Middleware<any, any> = async (input, options, next) => {
  try {
    return await next(input, options);
  } catch (error) {
    // Prevent default error notification
    options.preventDefault();

    // Show custom notification
    options.cesdk?.ui.showNotification({
      type: 'error',
      message: `🔥 Custom error: ${error.message}`,
      duration: 5000,
      action: {
        label: 'Contact Support',
        onClick: () => window.open('mailto:support@example.com')
      }
    });

    // Re-throw original error
    throw error;
  }
};
```

### Example 2: Silent Failure with External Logging

```typescript
const silentErrorMiddleware: Middleware<any, any> = async (input, options, next) => {
  try {
    return await next(input, options);
  } catch (error) {
    // Prevent all default UI feedback
    options.preventDefault();

    // Log to external service only
    errorTracker.capture({
      error: error,
      context: {
        provider: options.providerId,
        input: input,
        blockIds: options.blockIds
      }
    });

    throw error;
  }
};
```

### Example 3: Custom Success Notification for Quick Actions

```typescript
const quickActionSuccessMiddleware: Middleware<any, any> = async (input, options, next) => {
  const result = await next(input, options);

  // Quick actions normally don't show success notifications
  // Prevent default (silent) and add custom feedback
  options.preventDefault();

  options.cesdk?.ui.showNotification({
    type: 'success',
    message: '✨ Transformation complete!',
    duration: 3000
  });

  return result;
};
```

### Example 4: Retry Logic with Custom Progress

```typescript
const retryMiddleware: Middleware<any, any> = async (input, options, next) => {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      return await next(input, options);
    } catch (error) {
      attempt++;

      if (attempt < maxRetries) {
        // Prevent default error notification during retries
        options.preventDefault();

        // Show retry progress
        options.cesdk?.ui.showNotification({
          type: 'info',
          message: `Retrying... (${attempt}/${maxRetries})`,
          duration: 2000
        });

        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        // Final attempt failed - show custom error
        options.preventDefault();
        options.cesdk?.ui.showNotification({
          type: 'error',
          message: `Failed after ${maxRetries} attempts`,
          action: {
            label: 'Try Again',
            onClick: () => {/* trigger generation */}
          }
        });
        throw error;
      }
    }
  }

  throw new Error('Retry logic failed unexpectedly');
};
```

### Example 5: Error-Type Specific Handling

```typescript
const smartErrorMiddleware: Middleware<any, any> = async (input, options, next) => {
  try {
    return await next(input, options);
  } catch (error) {
    const cesdk = options.cesdk;
    if (!cesdk) throw error;

    // Prevent default for all error types we handle
    options.preventDefault();

    // Handle different error types
    if (error.message?.includes('rate limit')) {
      cesdk.ui.showDialog({
        type: 'warning',
        content: 'Rate limit reached. Upgrade for more generations.',
        actions: {
          label: 'Upgrade',
          onClick: () => window.open('/pricing', '_blank')
        }
      });
    } else if (error.message?.includes('network')) {
      cesdk.ui.showNotification({
        type: 'error',
        message: 'Network error. Please check your connection.',
        action: {
          label: 'Retry',
          onClick: async () => {/* retry logic */}
        }
      });
    } else if (error.message?.includes('401')) {
      cesdk.ui.showNotification({
        type: 'error',
        message: 'Authentication failed. Please check your API key.'
      });
    } else {
      // Default fallback for unknown errors
      cesdk.ui.showNotification({
        type: 'error',
        message: `Generation failed: ${error.message || 'Unknown error'}`
      });
    }

    throw error;
  }
};
```

### Example 6: A/B Testing Different Error Messages

```typescript
const abTestMiddleware: Middleware<any, any> = async (input, options, next) => {
  try {
    return await next(input, options);
  } catch (error) {
    options.preventDefault();

    const variant = getABTestVariant(userId);

    if (variant === 'friendly') {
      options.cesdk?.ui.showNotification({
        type: 'error',
        message: "Oops! 😅 We couldn't complete that. Want to try again?",
        action: {
          label: 'Try Again',
          onClick: () => {/* retry */}
        }
      });
    } else {
      options.cesdk?.ui.showNotification({
        type: 'error',
        message: `Error: ${error.message}`
      });
    }

    trackEvent('error_shown', { variant });
    throw error;
  }
};
```

### Example 7: Grouped Error Notifications

```typescript
const errorGroupingMiddleware: Middleware<any, any> = (() => {
  const errorBuffer: Error[] = [];
  let timer: NodeJS.Timeout | null = null;

  return async (input, options, next) => {
    try {
      return await next(input, options);
    } catch (error) {
      // Suppress individual error notification
      options.preventDefault();

      // Add to buffer
      errorBuffer.push(error);

      // Debounce: show grouped notification
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (errorBuffer.length === 1) {
          options.cesdk?.ui.showNotification({
            type: 'error',
            message: errorBuffer[0].message
          });
        } else {
          options.cesdk?.ui.showNotification({
            type: 'error',
            message: `${errorBuffer.length} generations failed.`,
            action: {
              label: 'Show Details',
              onClick: () => console.table(errorBuffer)
            }
          });
        }
        errorBuffer.length = 0;
      }, 2000);

      throw error;
    }
  };
})();
```

### Example 8: Conditional Prevention

```typescript
const conditionalMiddleware: Middleware<any, any> = async (input, options, next) => {
  try {
    return await next(input, options);
  } catch (error) {
    // Only handle rate limit errors ourselves
    if (error.message?.includes('rate limit')) {
      options.preventDefault();

      options.cesdk?.ui.showDialog({
        type: 'warning',
        content: 'Rate limit reached!'
      });

      throw error;
    }

    // For other errors, let default behavior handle it
    throw error;
  }
};
```

### Example 9: Custom Non-Dismissing Notification with Manual Block State

```typescript
const persistentErrorWithBlockState: Middleware<any, any> = async (input, options, next) => {
  try {
    return await next(input, options);
  } catch (error) {
    // Suppress all defaults
    options.preventDefault();

    // Manually set blocks to error state
    options.blockIds?.forEach(blockId => {
      if (options.cesdk?.engine.block.isValid(blockId)) {
        options.cesdk.engine.block.setState(blockId, {
          type: 'Error',
          error: 'Unknown'
        });
      }
    });

    // Show persistent custom notification
    options.cesdk?.ui.showNotification({
      type: 'error',
      message: 'Critical error occurred. Please contact support immediately.',
      duration: Infinity, // Non-dismissing
      action: {
        label: 'Contact Support',
        onClick: () => {
          window.open('mailto:support@example.com?subject=Generation%20Error');
        }
      }
    });

    throw error;
  }
};
```

**Result:**
- ✅ Block shows Error icon/indicator (manually set)
- ✅ Custom notification shown (non-dismissing)
- ❌ Default notification suppressed
- ❌ Console logging suppressed

**Key Insight**: Since middleware has access to `options.cesdk` and `options.blockIds`, it can directly manipulate block states when needed, eliminating the need for granular control parameters.

## Implementation Changes

### Files to Modify

#### 1. `packages/plugin-ai-generation-web/src/middleware/middleware.ts`

```typescript
// Add to MiddlewareOptions interface
export interface MiddlewareOptions {
  blockIds?: number[];
  abortSignal?: AbortSignal;
  engine: CreativeEngine;
  cesdk?: CreativeEditorSDK;

  /**
   * Prevents all default UI feedback behaviors.
   */
  preventDefault(): void;

  /**
   * Check if default behaviors have been prevented.
   * @internal
   */
  defaultPrevented(): boolean;

  // Internal flag (not in interface)
  _defaultPrevented?: boolean;
}

// Update options creation in composeMiddlewares or handlers
function createMiddlewareOptions(/* params */): MiddlewareOptions {
  const options: MiddlewareOptions = {
    blockIds,
    abortSignal,
    engine,
    cesdk,
    _defaultPrevented: false,

    preventDefault: function() {
      this._defaultPrevented = true;
    },

    defaultPrevented: function() {
      return this._defaultPrevented === true;
    }
  };

  return options;
}
```

#### 2. `packages/plugin-ai-generation-web/src/generation/handleGenerationError.ts`

```typescript
function handleGenerationError<K extends OutputKind, I, O extends Output>(
  error: unknown,
  options: {
    cesdk: CreativeEditorSDK;
    provider: Provider<K, I, O>;
    getInput?: GetInput<I>;
    middlewareOptions?: MiddlewareOptions; // 👈 Add this
  }
) {
  const { cesdk, provider, getInput, middlewareOptions } = options;

  // Check if default was prevented
  if (middlewareOptions?.defaultPrevented()) {
    return; // Skip all default behavior (notifications + console logging)
  }

  // Original logic (console.error, showErrorNotification, etc.)
  console.error('Generation failed:', error);

  const shown = showErrorNotification(
    cesdk,
    provider.output.notification,
    () => ({
      input: getInput?.().input,
      error
    })
  );

  if (!shown) {
    cesdk.ui.showNotification({
      type: 'error',
      message: extractErrorMessage(error)
    });
  }
}
```

#### 3. `packages/plugin-ai-generation-web/src/ui/components/renderGenerationComponents.ts`

```typescript
// In the catch block around line 167
} catch (error) {
  // Do not treat abort errors as errors
  if (isAbortError(error)) {
    return;
  }

  handleGenerationError(error, {
    cesdk,
    provider,
    getInput,
    middlewareOptions: options // 👈 Pass middleware options
  });
}

// In success notification around line 160-166
if (result.status === 'success' && result.type === 'sync') {
  // Check if default was prevented
  if (!options?.defaultPrevented()) {
    const notification = provider.output.notification;
    showSuccessNotification(cesdk, notification, () => ({
      input: getInput().input,
      output: result.output
    }));
  }
}
```

#### 4. `packages/plugin-ai-generation-web/src/generation/handleGenerateFromPanel.ts`

```typescript
// Around line 224-237 and 312-320
if (result.status !== 'success') {
  // Check if default was prevented
  if (!options.middlewareOptions?.defaultPrevented()) {
    if (
      placeholderBlock != null &&
      cesdk.engine.block.isValid(placeholderBlock)
    ) {
      if (result.status === 'aborted') {
        cesdk.engine.block.destroy(placeholderBlock);
      } else {
        cesdk.engine.block.setState(placeholderBlock, {
          type: 'Error',
          error: 'Unknown'
        });
      }
    }
  }
  return result;
}
```

#### 5. `packages/plugin-ai-generation-web/src/generation/handleGenerateFromQuickAction.ts`

```typescript
// Around line 268-272
} catch (error) {
  // Check if default was prevented
  if (!options.middlewareOptions?.defaultPrevented()) {
    options.cesdk.ui.showNotification({
      type: 'error',
      message: 'A technical issue has occurred.'
    });
  }

  unlockFromEditMode();
  targetBlockIds.forEach((blockId) => {
    if (options.cesdk.engine.block.isValid(blockId)) {
      metadata.clear(blockId);
    }
  });
  throw error;
}
```

#### 6. `packages/plugin-ai-generation-web/src/generation/createGenerateFunction.ts`

```typescript
// Update to pass middleware options through the chain
export type Generate<I, O extends Output> = (
  input: I,
  options?: {
    blockIds?: number[];
    abortSignal?: AbortSignal;
    middlewares?: Middleware<I, O>[];
    debug?: boolean;
    dryRun?: boolean;
  }
) => Promise<Result<O>>;

// Inside createGenerateFunction, create and pass options
function createGenerateFunction<K extends OutputKind, I, O extends Output>(
  context: { /* ... */ }
): Generate<I, O> {
  return async (input: I, options) => {
    if (options?.abortSignal?.aborted) return { status: 'aborted' };

    // Create middleware options with preventDefault
    const middlewareOptions: MiddlewareOptions = {
      blockIds: options?.blockIds,
      abortSignal: options?.abortSignal,
      engine: context.engine,
      cesdk: context.cesdk,
      _defaultPrevented: false,
      preventDefault: function() {
        this._defaultPrevented = true;
      },
      defaultPrevented: function() {
        return this._defaultPrevented === true;
      }
    };

    // Compose middlewares
    const composedMiddlewares = composeMiddlewares<I, O>([
      ...(context.provider.output.middleware ?? []),
      ...(options?.middlewares ?? []),
      loggingMiddleware({ enable: options?.debug }),
      dryRunMiddleware({
        enable: options?.dryRun,
        kind: context.provider.kind
      })
    ]);

    // Trigger generation with middleware options
    try {
      const { result: output } = await composedMiddlewares(
        context.provider.output.generate
      )(input, middlewareOptions); // 👈 Pass options

      // ... rest of logic
    } catch (error) {
      // ... error handling with middlewareOptions
    }
  };
}
```

## Testing Requirements

### Unit Tests

#### 1. Test preventDefault() functionality
- `preventDefault()` sets internal flag
- `defaultPrevented()` returns correct state
- Multiple calls to `preventDefault()` are idempotent

#### 2. Test notification suppression
- Error notifications are suppressed when `preventDefault()` called
- Success notifications are suppressed when `preventDefault()` called
- Notifications shown when `preventDefault()` not called

#### 3. Test block state suppression
- Error block state not set when `preventDefault()` called
- Error block state set when `preventDefault()` not called

#### 4. Test middleware composition
- `preventDefault()` works in first middleware
- `preventDefault()` works in last middleware
- Multiple middlewares can check `defaultPrevented()`

#### 5. Test edge cases
- Multiple calls to `preventDefault()` are idempotent
- Works correctly with `AbortController` signals
- Works in both panel and quick action contexts

### Integration Tests

#### 1. Panel generation with custom error
- Generate from panel → error
- Middleware calls `preventDefault()` and shows custom notification
- Verify: No default notification, custom notification shown

#### 2. Quick action with custom success
- Trigger quick action → success
- Middleware calls `preventDefault()` and shows custom notification
- Verify: No default (silent), custom notification shown

#### 3. Retry middleware
- Generate → error → retry → success
- Middleware calls `preventDefault()` on first error
- Verify: Retry notification shown, no default error notification

#### 4. Manual block state with custom notification
- Panel generation → error
- Middleware calls `preventDefault()` and manually sets block to Error state
- Shows custom non-dismissing notification
- Verify:
  - Block shows Error state (manually set)
  - Custom notification shown (persistent)
  - No default notification

## Documentation Updates

### 1. Middleware Documentation

**File**: `packages/plugin-ai-generation-web/README.md`

Add new section:

```markdown
### Preventing Default Feedback

By default, the library shows notifications and updates block states for errors and successes. To handle feedback yourself, use `options.preventDefault()`:

\`\`\`typescript
const customErrorMiddleware: Middleware<any, any> = async (input, options, next) => {
  try {
    return await next(input, options);
  } catch (error) {
    // Prevent default error notification
    options.preventDefault();

    // Show your custom notification
    options.cesdk?.ui.showNotification({
      type: 'error',
      message: 'Custom error: ' + error.message
    });

    throw error;
  }
};
\`\`\`

**What gets prevented:**
- Error/success notifications
- Block error state (error icon)
- Console error logging

**What is NOT prevented:**
- Pending → Ready transition (loading spinner always stops)

**This ensures blocks don't get stuck in loading state while giving you full control over error/success feedback.**

**Common use cases:**
- Custom error notifications
- Silent failures (logging only)
- Retry logic
- A/B testing error messages
- Grouped/debounced notifications
```


### 3. API Reference

**File**: Add to TypeDoc comments or API documentation

```typescript
/**
 * Middleware options passed to all middleware functions.
 */
interface MiddlewareOptions {
  /**
   * Prevents all default UI feedback behaviors for this generation.
   *
   * Call this when you want to handle success/error feedback yourself.
   *
   * **Default behaviors that are suppressed:**
   * - Error/success notifications (toast messages)
   * - Block error state (Error icon on failure)
   * - Console error logging
   *
   * **What is NOT prevented (always happens):**
   * - Pending → Ready block state transition (loading spinner always stops)
   *
   * **Common use cases:**
   * - Custom error notifications
   * - Silent failures (logging only)
   * - Custom success feedback for quick actions
   * - Retry logic with custom progress indication
   * - Grouped/debounced error notifications
   *
   * @example Custom error notification
   * ```typescript
   * catch (error) {
   *   options.preventDefault();
   *   myCustomErrorHandler(error);
   *   throw error;
   * }
   * ```
   *
   * @example Silent failure
   * ```typescript
   * catch (error) {
   *   options.preventDefault();
   *   errorTracker.capture(error);
   *   throw error;
   * }
   * ```
   */
  preventDefault(): void;

  /**
   * Check if default behaviors have been prevented.
   *
   * Useful for middleware that want to check if another middleware
   * already handled feedback.
   *
   * @returns `true` if preventDefault() was called, `false` otherwise
   *
   * @example
   * ```typescript
   * if (!options.defaultPrevented()) {
   *   // Show default notification
   * }
   * ```
   *
   * @internal
   */
  defaultPrevented(): boolean;
}
```

### 4. Examples Documentation

**File**: `packages/plugin-ai-generation-web/docs/examples/middleware.md` (create)

Add all 9 usage examples from this spec with explanations.

### 5. CLAUDE.md Update

**File**: `packages/plugin-ai-generation-web/CLAUDE.md`

```markdown
## Middleware preventDefault() API

Middleware can suppress default UI feedback by calling `options.preventDefault()`.

### What gets prevented:
- Error/success notifications
- Block error state (error icon)
- Console error logging

### What is NOT prevented:
- Pending → Ready transition (loading spinner always stops)

### Example:
\`\`\`typescript
catch (error) {
  options.preventDefault();
  // Custom handling
  throw error;
}
\`\`\`

See full spec: `specs/middleware-prevent-default-api/spec.md`
```

## Changelog Entry

### Version

**Target**: Next minor version (e.g., `1.5.0`)

### Category

**Type**: `feat` (new feature)

### Entry

```markdown
## [1.5.0] - YYYY-MM-DD

### Added

- **Middleware preventDefault() API**: Added `options.preventDefault()` method to middleware for suppressing default UI feedback behaviors (notifications, block states, console logging). This provides an explicit, discoverable way to handle success/error feedback in custom middleware. (#XXX)

  ```typescript
  const middleware: Middleware<any, any> = async (input, options, next) => {
    try {
      return await next(input, options);
    } catch (error) {
      options.preventDefault(); // Suppress default error notification
      myCustomErrorHandler(error);
      throw error;
    }
  };
  ```

  **What gets prevented:**
  - Error/success notifications (toast messages)
  - Block error state (error icon)
  - Console error logging

  **What is NOT prevented:**
  - Pending → Ready transition (loading spinner always stops)

  **Common use cases:**
  - Custom error notifications
  - Silent failures with external logging
  - Retry logic with custom progress
  - A/B testing error messages
  - Grouped/debounced notifications

### Documentation

- Added comprehensive middleware documentation with 9 usage examples
- Added API reference with detailed TSDoc comments
- Added examples documentation showing common patterns
```

## Implementation Checklist

- [ ] Update `MiddlewareOptions` interface in `middleware.ts`
- [ ] Implement `preventDefault()` and `defaultPrevented()` in options creation
- [ ] Update `handleGenerationError.ts` to check `defaultPrevented()`
- [ ] Update `renderGenerationComponents.ts` to check `defaultPrevented()`
- [ ] Update `handleGenerateFromPanel.ts` to check `defaultPrevented()`
- [ ] Update `handleGenerateFromQuickAction.ts` to check `defaultPrevented()`
- [ ] Update `createGenerateFunction.ts` to create and pass middleware options
- [ ] Write unit tests for `preventDefault()` functionality
- [ ] Write integration tests for all use cases
- [ ] Update README.md with preventDefault() section
- [ ] Add TSDoc comments to API
- [ ] Create examples documentation
- [ ] Update CLAUDE.md
- [ ] Update CHANGELOG.md
- [ ] Test all 9 usage examples end-to-end

## Open Questions

1. **Should `preventDefault()` be granular?**
   - ✅ **RESOLVED**: No, keep it simple (all-or-nothing)
   - Middleware has direct access to `options.cesdk` and `options.blockIds`
   - Can manually manipulate block states when needed (see Example 9)
   - Simpler API is better than unnecessary complexity

2. **Should `defaultPrevented()` be public or internal?**
   - Current: Marked as `@internal` in docs
   - Use case: Middleware checking if another middleware already handled feedback
   - **Decision**: Make public but document as advanced use case

3. **Should we add `event` parameter like DOM?**
   - Example: `preventDefault(event)` where event has `{ type: 'error' | 'success' }`
   - **Decision**: Not needed, middleware already knows context

4. **Should pendingMiddleware respect preventDefault()?**
   - Current: No, pendingMiddleware Pending→Ready transitions are NOT prevented
   - Reason: Pending state management is separate from feedback - loading spinners must always stop
   - **Decision**: Keep separate, document clearly that Pending→Ready always happens

## Success Criteria

1. ✅ Developers can suppress default notifications with one clear method call
2. ✅ API is self-documenting (method name makes intent clear)
3. ✅ All 9 usage examples work correctly
4. ✅ Works seamlessly with existing middleware patterns
5. ✅ Documentation is comprehensive and easy to find
6. ✅ Tests cover all suppression scenarios
7. ✅ No breaking changes to existing middleware
8. ✅ Customer use case works (error block state + custom non-dismissing notification)

## Timeline Estimate

- **Design & Spec**: 4 hours (complete)
- **Implementation**: 8 hours
  - Core API: 2 hours
  - Integration in handlers: 3 hours
  - Tests: 3 hours
- **Documentation**: 4 hours
- **Review & Polish**: 2 hours
- **Total**: ~18 hours (~2-3 days)
