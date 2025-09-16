# Changelog - AI Plugins

## [Unreleased]

### New Features

-   [video-generation] **ByteDance Seedance v1 Pro Provider**: Added ByteDance Seedance v1 Pro image-to-video provider via fal.ai with dynamic motion generation from still images, multiple aspect ratio options (21:9, 16:9, 4:3, 1:1, 3:4, 9:16, or auto from image), adjustable duration (3-12 seconds), and resolution options (480p, 720p, 1080p)

## [0.2.6] - 2025-09-09

### New Features

-   [all] **Feature API Integration**: Added comprehensive Feature API support across all AI plugins to control visibility and availability of features through feature flags. Core features include `providerSelect`, `quickAction`, `quickAction.providerSelect`, `fromText`, and `fromImage` flags.
-   [all] **Quick Action Feature Flags**: Each quick action now automatically registers and respects its own feature flag (e.g., `ly.img.plugin-ai-image-generation-web.quickAction.editImage`), allowing fine-grained control over which quick actions are available to users.
-   [image-generation] **Provider Style Group Control**: Added Feature API support for Recraft providers to control style group visibility. RecraftV3 supports `style.image` and `style.vector` flags, while Recraft20b adds `style.icon` flag for controlling icon style availability.
-   [all] **Provider Selection Feature Flags**: Added support for controlling provider selection UI in both panels (`providerSelect`) and quick actions (`quickAction.providerSelect`), with proper handling when multiple providers are configured.

## [0.2.5] - 2025-09-03

### New Features

-   [image-generation] **NanoBanana Provider**: Added NanoBanana text-to-image provider via fal.ai with fast generation times, 1024×1024 resolution, support for multiple output formats (JPEG, PNG), configurable number of images (1-4), and remixPageWithPrompt quick action
-   [image-generation] **NanoBananaEdit Provider**: Added NanoBananaEdit image-to-image provider via fal.ai for editing existing images with text prompts, supporting all standard quick actions (editImage, swapBackground, styleTransfer, artistTransfer, createVariant, combineImages with up to 10 images, remixPage, remixPageWithPrompt)
-   [all] **AI Style Asset Library Translations**: AI style presets in asset libraries now automatically use localized names and descriptions from provider translation files, eliminating the need for manual translation configuration

### Bug Fixes

-   [all] **fal.ai Provider Configuration**: Fixed singleton configuration conflict when using multiple fal.ai providers with different proxy URLs. Each provider now maintains its own client instance instead of overwriting a global configuration
-   [video-generation] **Missing Dependency**: Added missing `@fal-ai/client` dependency to plugin-ai-video-generation-web package.json to ensure the package works correctly when installed independently

## [0.2.4] - 2025-08-07

### New Features

-   [all] **Provider Label Translations**: Added support for provider label translations
-   [all] **Extended Provider Configuration**: Added support for `history` and `supportedQuickActions` configuration fields in `CommonProviderConfiguration`, allowing customers to:
    -   Override provider's default history asset source (`history` field) - can be set to `false` to disable history, `'@imgly/local'` for temporary storage, `'@imgly/indexedDB'` for persistent browser storage, or any custom asset source ID
    -   Configure supported quick actions (`supportedQuickActions` field) - can disable quick actions by setting to `false`/`null`, keep defaults with `true`, or override with custom mappings and configurations
    -   Both fields are optional and maintain backward compatibility with existing provider configurations
-   [generation-web] **Utility Function**: Added `mergeQuickActionsConfig` utility function for merging provider defaults with user configuration overrides, exported from `@imgly/plugin-ai-generation-web` with comprehensive Jest test coverage

## [0.2.3] - 2025-07-23

-   [all] **Automatic History Asset Library Entries**: Composite history asset sources now automatically have corresponding asset library entries created with the same IDs (e.g., `ly.img.ai.image-generation.history`)
-   [all] **Provider Selection in Expanded Quick Actions**: When a quick action is expanded, users can now switch between all providers that support that specific quick action, enhancing flexibility in provider selection
-   [all] **Quick Action Can Disable Lock**: Some quick actions can now decide to not lock the block when operating on a block. Examples are `CreateVariant` and `CombineImages`.
-   [image-generation] **Ideogram V3**: Added support for Ideogram V3 provider for image generation, which supports text-to-image and image-to-image generation

## [0.2.2] - 2025-07-16

-   [ai-apps] Fix issue with undefined `cesdk` instance

## [0.2.1] - 2025-07-15

-   [ai-apps] Fix issue where AI apps panel displayed empty content when no provider app was available
-   [ai-apps] Maintain backwards compatibility by registering legacy AI apps ID, alongside new `ly.img.ai.apps` panel ID

## [0.2.0] - 2025-07-15

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
-   [image-generation] **Flux Pro Kontext Provider**: Added Flux Pro Kontext provider for image editing with style transfer and artist style options
-   [image-generation] **Flux Pro Kontext Max Provider**: Added Flux Pro Kontext Max provider for enhanced image editing capabilities
-   [video-generation] **Veo3 Provider**: Added Veo3 text-to-video provider via fal.ai with support for 16:9, 9:16, and 1:1 aspect ratios and 8-second duration
-   [video-generation] **Kling Video V2.1 Master Providers**: Added Kling Video V2.1 Master providers for both text-to-video and image-to-video generation with configurable duration (5s/10s) and aspect ratios
-   [text-generation] **Model Selection**: OpenAI and Anthropic providers now support configurable model selection through the `model` parameter

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
