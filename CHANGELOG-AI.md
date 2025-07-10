# Changelog - AI Plugins

## [Unreleased]

### Breaking Changes

-   [all] **Provider Initialization**: `initProvider` is replaced with `initializeProviders` and `initializeProvider` with a different signature
-   [all] **Quick Actions Structure**: `provider.input.quickctions.actions` replaced with `provider.input.quickActions.supported`
-   [all] **History Asset Sources**: Combined history asset source is now not added to the default asset libraries anymore. Add the following sources to any library entry (default or not):
    -   Image Generation History: `ly.img.ai.image-generation.history`
    -   Video Generation History: `ly.img.ai.video-generation.history`
    -   Audio Generation History: `ly.img.ai.audio-generation.history`
    -   Sticker Generation History: `ly.img.ai.sticker-generation.history`
-   [all] **ID Format Standardization**: All `ly.img.ai/` prefixed IDs changed to use dot notation `ly.img.ai.` for consistency
    -   Panel IDs: `ly.img.ai/apps` → `ly.img.ai.apps`, `ly.img.ai/image-generation` → `ly.img.ai.image-generation`
    -   Dock IDs: `ly.img.ai/apps.dock` → `ly.img.ai.apps.dock`

### New Features

-   [all] **Multiple Providers Support**: All plugin packages now support arrays of providers with automatic selection UI
-   [image-generation] **Recraft20b Provider**: Added new Recraft20b (v2) provider via fal.ai with support for icon styles including `broken_line`, `colored_outline`, `colored_shapes`, and more
-   [sticker-generation] **New Sticker Generation Plugin**: Added `@imgly/plugin-ai-sticker-generation-web` plugin for AI-powered sticker generation with support for text-to-sticker generation using Recraft20b provider with icon styles

### Deprecated Features

-   [all] **Middleware Configuration**: The `middleware` property in provider configurations is deprecated. Use `middlewares` instead. The old property will continue to work for now.

## [0.1.10] - 2025-06-20

-   [all] Fix issue with GPT provider when using text provider

## [0.1.9] - 2025-06-05

-   [all] Add support for custom headers

## [0.1.8] - 2025-05-26

-   [ai-apps] Handle `sceneMode` change in upcoming CE.SDK version 1.52.0

## [0.1.0] - 2025-04-17

-   [all] Initial release
