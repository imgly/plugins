![Hero image showing the configuration abilities of CE.SDK](https://img.ly/static/cesdk_release_header.png)

# IMG.LY Plugins

Plugins enhance the capabilities of [CreativeEditor SDK (CE.SDK)](https://img.ly/docs/cesdk/) by allowing developers to create and integrate custom plugins. These plugins can extend the functionality of CE.SDK, providing more features and customization options for users.

- Extensibility: Easily add new features to CE.SDK.
- Customization: Tailor the functionality of CE.SDK to meet specific needs.
- Compatibility: Designed to work seamlessly with the latest version of CE.SDK.

# Currently Available Plugins

For more information about the particular plugins, please visit the according packages in this repository.

- [Background Removal](packages/plugin-background-removal-web/)
- [Cutouts](packages/plugin-cutout-library-web/)
- [QR Codes](packages/plugin-qr-code-web/)
- [Remote Asset Source](packages/plugin-remote-asset-source-web/)
- [Vectorizer](packages/plugin-vectorizer-web/)
- [AI Generation](packages/plugin-ai-generation-web/)
- [AI Apps](packages/plugin-ai-apps-web/)
- [AI Text Generation](packages/plugin-ai-text-generation-web/)
- [AI Image Generation](packages/plugin-ai-image-generation-web/)
- [AI Video Generation](packages/plugin-ai-video-generation-web/)
- [AI Audio Generation](packages/plugin-ai-audio-generation-web/)
- [AI Sticker Generation](packages/plugin-ai-sticker-generation-web/)

# Examples

This repository includes example applications demonstrating plugin usage:

- [examples/ai](examples/ai/) - Dedicated demo application for AI plugins
- [examples/web](examples/web/) - General plugin demonstrations
- [examples/gpt-demo](examples/gpt-demo/) - GPT integration example

## Running Examples

```bash
# Install dependencies
pnpm install

# Run AI plugins demo
pnpm dev:ai

# Run all examples
pnpm dev
```
