# Changelog - AI Plugins

## [Unreleased]

## [0.2.13] - 2025-12-15

### New Features

-   [all] **Runware Partner Integration**: Added Runware as a new AI provider service, offering access to multiple image and video generation models through a unified API. Runware provides a single endpoint for accessing various AI models with consistent configuration.
    - **Image Generation**: FLUX.2 [dev], FLUX.2 [pro], FLUX.2 [flex], Seedream 4.0, Seedream 4.5, Nano Banana 2 Pro, GPT Image 1, GPT Image 1 Mini (all with text-to-image and image-to-image variants)
    - **Video Generation**: Google Veo 3.1, Veo 3.1 Fast, OpenAI Sora 2, Sora 2 Pro (all with text-to-video and image-to-video variants)

## [0.2.12] - 2025-11-21

## [0.2.11] - 2025-11-21

### New Features

-   [generation-web] **Input Placeholder Customization**: Added support for customizing placeholder text in input fields (e.g., prompt textarea) through the i18n translation system. Placeholders follow the same priority chain as labels:
    1. Provider-specific: `ly.img.plugin-ai-{kind}-generation-web.{provider.id}.property.{field}.placeholder`
    2. Global: `ly.img.plugin-ai-generation-web.property.{field}.placeholder`
    3. Provider defaults: `ly.img.plugin-ai-{kind}-generation-web.{provider.id}.defaults.property.{field}.placeholder`
    4. Global defaults: `ly.img.plugin-ai-generation-web.defaults.property.{field}.placeholder`
-   [image-generation] **Gemini Provider Placeholders**: Added example placeholder text to Gemini providers (GeminiFlash25 and Gemini25FlashImageEdit) demonstrating provider-specific placeholder customization
-   [image-generation] **NanoBananaPro Provider**: Added NanoBananaPro text-to-image provider via fal.ai, an enhanced version of NanoBanana with advanced configuration options including 10 aspect ratio presets (1:1, 3:2, 2:3, 4:3, 3:4, 16:9, 9:16, 21:9, 9:21, 2.4:1), resolution multipliers (1K, 2K, 4K for standard/high/ultra quality), dynamic dimension calculation based on aspect ratio and resolution, and remixPageWithPrompt quick action support
-   [image-generation] **NanoBananaProEdit Provider**: Added NanoBananaProEdit image-to-image provider via fal.ai for professional-grade image editing with text prompts, supporting resolution control (1K/2K/4K), all standard quick actions (editImage, swapBackground, styleTransfer, artistTransfer, createVariant, combineImages with up to 10 images, remixPage, remixPageWithPrompt), and automatic dimension preservation from source images

## [0.2.10] - 2025-10-22

### New Features

-   [video-generation] **Google Veo 3.1 Provider Suite**: Added comprehensive Google Veo 3.1 video generation providers via fal.ai, offering multiple models optimized for different use cases:
    - **Text-to-Video Providers**:
        - `Veo31TextToVideo`: Standard quality text-to-video with configurable aspect ratios (16:9, 9:16, 1:1), variable duration (4s, 6s, 8s), resolution options (720p, 1080p), and optional audio generation
        - `Veo31FastTextToVideo`: Faster and more cost-effective text-to-video variant with same capabilities as standard version
    - **Image-to-Video Providers**:
        - `Veo31ImageToVideo`: Standard quality image-to-video with auto aspect ratio detection, multiple preset options (16:9, 9:16, 1:1), resolution options (720p, 1080p), fixed 8-second duration, and optional audio generation
        - `Veo31FastImageToVideo`: Faster and more cost-effective image-to-video variant with same capabilities
    - **First-Last Frame Providers** (experimental dual-image transformation):
        - `Veo31FirstLastFrameToVideo`: Standard quality interpolation between two images (first and last frame)
        - `Veo31FastFirstLastFrameToVideo`: Faster variant with dual image input UI, multiple aspect ratios (16:9, 9:16, 1:1, 4:3, 3:4), resolution options (480p, 720p, 1080p), adjustable duration (2-8 seconds), optional prompt guidance, and optional audio generation
    - **Quick Action Support**: Added "Animate Between Images" quick action for creating smooth transitions between two selected images using the first-last-frame providers

## [0.2.9] - 2025-10-16

### New Features

-   [image-generation] **GeminiFlash25 Provider**: Added Google Gemini Flash 2.5 text-to-image provider via fal.ai with fast generation times, multiple aspect ratios (1:1, 3:4, 4:3, 9:16, 16:9), custom dimensions support, and multiple output formats (JPEG, PNG, WEBP)
-   [image-generation] **Gemini25FlashImageEdit Provider**: Added Google Gemini 2.5 Flash Image Edit provider via fal.ai for advanced image editing with multi-image support (1-10 images), comprehensive quick actions support (editImage, swapBackground, styleTransfer, artistTransfer, createVariant, combineImages, remixPage, remixPageWithPrompt), text-based editing instructions, and fast processing times

### Improvements

-   [generation-web] **Middleware preventDefault() API**: Added `options.preventDefault()` method to suppress default UI feedback (notifications, block states, console logging) when handling errors in custom middleware
-   [all] **Internationalization Support**: All hardcoded strings across AI plugins have been removed and replaced with translation keys, enabling full localization support for plugin labels, actions, styles, and error messages
-   [all] **Translation Keys Available**: Added comprehensive translation keys for:
    -   Panel and dock labels (AI Image, AI Video, AI Sticker, AI Voice, Sound Generation)
    -   Action labels (Generate Image, Generate Video, Generate Sticker)
    -   Style transfer options (None, Anime, Cyberpunk, Kodak 400, Watercolor, Dark Fantasy, Vaporwave, Vector Flat, 3D Animation, Ukiyo-e, Surreal, Steampunk, Night Bokeh, Pop Art)
    -   Error messages and UI elements
-   [all] **Backwards Compatibility**: Translation system automatically detects CE.SDK version and gracefully falls back to English strings for CE.SDK versions < 1.59.0, ensuring no breaking changes for existing integrations

### Fixed

-   [generation-web] **Placeholder Block Error State**: Fixed placeholder blocks getting stuck in Pending state when generation fails or is aborted. Blocks are now properly destroyed when generation is aborted, or moved to Error state when generation fails, preventing perpetual loading spinners in the UI.
-   [generation-web] **Middleware Block Targeting**: Fixed middleware to correctly receive block IDs for placeholder blocks and quick action targets. Previously, middleware would fall back to `findAllSelected()` which could target incorrect blocks if the selection changed during generation. Now placeholder blocks created during panel generation and target blocks from quick actions are explicitly passed to middleware, ensuring operations like pending state, locking, and highlighting affect the correct blocks.

### Changed

-   [generation-web] **BlockIds Type Refinement**: Removed unused `| null` type from `blockIds` parameter in `GenerationOptions` and `Generate` function signature. The `null` value was documented but never implemented or used. Use an empty array `[]` instead of `null` to explicitly target no blocks.

## [0.2.8] - 2025-09-29

### New Features

-   [image-generation] **SeedreamV4 Provider**: Added ByteDance Seedream 4.0 text-to-image provider via fal.ai for high-quality image generation with multiple size presets (square HD 2048×2048, square 1024×1024, portrait/landscape variants), custom dimensions support (1024-4096 pixels), and safety checker enabled by default
-   [image-generation] **SeedreamV4Edit Provider**: Added ByteDance Seedream 4.0 image-to-image provider via fal.ai for advanced image editing with unified generation/editing architecture, support for multiple input images (up to 10), and full canvas quick actions support (editImage, swapBackground, styleTransfer, artistTransfer, createVariant, combineImages, remixPage, remixPageWithPrompt)

### Fixed

-   [sticker-generation] **Fixed Input Types Not Enabled**: Fixed an issue where the sticker generation panel would show "No input types are enabled" error by properly enabling the `fromText` and `fromImage` feature flags during plugin initialization

## [0.2.7] - 2025-09-26

### New Features

-   [image-generation] **QwenImageEdit Provider**: Added Qwen image editing provider via fal.ai for advanced image-to-image transformation with text prompts, supporting all standard quick actions
-   [video-generation] **MinimaxHailuo02StandardImageToVideo Provider**: Added Minimax Hailuo-02 Standard image-to-video provider via fal.ai for transforming still images into videos with selectable resolutions (512P: 912×512, 768P: 1280×720) and adjustable durations (6 or 10 seconds)
-   [video-generation] **ByteDance Seedance v1 Pro Providers**: Added ByteDance Seedance v1 Pro text-to-video and image-to-video providers via fal.ai with:
    - Text-to-video generation from text descriptions with customizable aspect ratios
    - Image-to-video transformation with dynamic motion generation from still images
    - Multiple aspect ratio options (21:9, 16:9, 4:3, 1:1, 3:4, 9:16, or auto from image for i2v)
    - Adjustable duration (3-12 seconds, default 5)
    - Resolution options (480p, 720p, 1080p)
    - Proper aspect ratio handling in placeholder blocks based on user selection

-   [all] **Property Configuration System**: Providers can now define default values for their properties. Defaults can be static values or dynamic based on context (language, design state, etc.)

-   [image-generation] **Recraft Provider Defaults**: Recraft providers (V3 and 20b) now support configurable default values for all properties, including dynamic style defaults based on the selected style type

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
