# Runware Available Models

This document lists all available models through the Runware API with their AIR identifiers, capabilities, specifications, and input schemas for provider implementation.

## Provider Documentation Links

| Provider | Documentation URL |
|----------|-------------------|
| Black Forest Labs | https://runware.ai/docs/en/providers/bfl.md |
| Bria | https://runware.ai/docs/en/providers/bria.md |
| ByteDance | https://runware.ai/docs/en/providers/bytedance.md |
| Google | https://runware.ai/docs/en/providers/google.md |
| Ideogram | https://runware.ai/docs/en/providers/ideogram.md |
| ImagineArt | https://runware.ai/docs/en/providers/imagineart.md |
| KlingAI | https://runware.ai/docs/en/providers/klingai.md |
| Lightricks | https://runware.ai/docs/en/providers/lightricks.md |
| Midjourney | https://runware.ai/docs/en/providers/midjourney.md |
| MiniMax | https://runware.ai/docs/en/providers/minimax.md |
| OpenAI | https://runware.ai/docs/en/providers/openai.md |
| PixVerse | https://runware.ai/docs/en/providers/pixverse.md |
| Runway | https://runware.ai/docs/en/providers/runway.md |
| Sourceful | https://runware.ai/docs/en/providers/sourceful.md |
| Vidu | https://runware.ai/docs/en/providers/vidu.md |

## Available Models

Each capability is tracked separately. Models with multiple capabilities have multiple rows.

| Provider | Model Name | AIR | Capability | Image Input Type | Release Date | Status |
|----------|-----------|-----|------------|------------------|--------------|--------|
| **Black Forest Labs** | FLUX.1.1 Pro | `bfl:2@1` | text-to-image | - | Oct 2024 | skipped |
| Black Forest Labs | FLUX.1.1 Pro Ultra | `bfl:2@2` | text-to-image | - | Nov 2024 | skipped |
| Black Forest Labs | FLUX.1 Fill Pro | `bfl:1@2` | inpainting | seed + mask | Nov 2024 | skipped |
| Black Forest Labs | FLUX.1 Expand Pro | `bfl:1@3` | outpainting | seed | Nov 2024 | skipped |
| Black Forest Labs | FLUX.1 Kontext [pro] | `bfl:3@1` | text-to-image | - | 2025 | skipped |
| Black Forest Labs | FLUX.1 Kontext [pro] | `bfl:3@1` | image-to-image | reference (2 max) | 2025 | skipped |
| Black Forest Labs | FLUX.1 Kontext [max] | `bfl:4@1` | text-to-image | - | 2025 | skipped |
| Black Forest Labs | FLUX.1 Kontext [max] | `bfl:4@1` | image-to-image | reference (2 max) | 2025 | skipped |
| Black Forest Labs | FLUX.2 [dev] | `runware:400@1` | text-to-image | - | Nov 2025 | implemented |
| Black Forest Labs | FLUX.2 [dev] | `runware:400@1` | image-to-image | reference (4 max) | Nov 2025 | implemented |
| Black Forest Labs | FLUX.2 [pro] | `bfl:5@1` | text-to-image | - | Nov 2025 | implemented |
| Black Forest Labs | FLUX.2 [pro] | `bfl:5@1` | image-to-image | reference (9 max) | Nov 2025 | implemented |
| Black Forest Labs | FLUX.2 [flex] | `bfl:6@1` | text-to-image | - | Nov 2025 | implemented |
| Black Forest Labs | FLUX.2 [flex] | `bfl:6@1` | image-to-image | reference (10 max) | Nov 2025 | implemented |
| **Bria** | Bria 3.2 | `bria:10@1` | text-to-image | - | Jun 2025 | skipped |
| Bria | Bria ControlNet (Canny) | `bria:10@10` | text-to-image (edge control) | control (edge) | Jun 2025 | skipped |
| Bria | Bria ControlNet (Depth) | `bria:10@11` | text-to-image (depth control) | control (depth) | Jun 2025 | skipped |
| Bria | Bria ControlNet (Recoloring) | `bria:10@12` | text-to-image (color control) | control (color) | Jun 2025 | skipped |
| Bria | Bria ControlNet (Color Grid) | `bria:10@13` | text-to-image (grid color control) | control (grid) | Jun 2025 | skipped |
| Bria | Bria IP Adapter (Regular) | `bria:10@20` | text-to-image (style reference) | style reference | Jun 2025 | skipped |
| Bria | Bria IP Adapter (Style) | `bria:10@21` | text-to-image (style matching) | style reference | Jun 2025 | skipped |
| Bria | Bria FIBO | `bria:20@1` | text-to-image | - | 2025 | skipped |
| Bria | Bria FIBO | `bria:20@1` | image-to-image | reference (refinement) | 2025 | skipped |
| Bria | Bria Video Increase Resolution | `bria:50@1` | video upscaling | - | 2025 | skipped |
| Bria | Bria Video Background Removal | `bria:51@1` | video background removal | - | 2025 | skipped |
| Bria | Bria Image Increase Resolution | `bria:52@1` | image upscaling | - | 2025 | skipped |
| **ByteDance** | SeedEdit 3.0 | `bytedance:4@1` | image-to-image | reference (1, instruction-edit) | Apr-Sep 2025 | skipped |
| ByteDance | Seedream 4.0 | `bytedance:5@0` | text-to-image | - | Sep 2025 | implemented |
| ByteDance | Seedream 4.0 | `bytedance:5@0` | image-to-image | reference (14 max, consistency) | Sep 2025 | implemented |
| ByteDance | Seedance 1.0 Lite | `bytedance:1@1` | text-to-video | - | Jun 2025 | skipped |
| ByteDance | Seedance 1.0 Lite | `bytedance:1@1` | image-to-video | first frame | Jun 2025 | skipped |
| ByteDance | Seedance 1.0 Pro | `bytedance:2@1` | text-to-video | - | Jun 2025 | skipped |
| ByteDance | Seedance 1.0 Pro | `bytedance:2@1` | image-to-video | first frame | Jun 2025 | skipped |
| ByteDance | Seedance 1.0 Pro Fast | `bytedance:2@2` | text-to-video | - | Jun 2025 | skipped |
| ByteDance | Seedance 1.0 Pro Fast | `bytedance:2@2` | image-to-video | first frame | Jun 2025 | skipped |
| ByteDance | OmniHuman-1 | `bytedance:5@1` | image-to-video (with audio) | first frame | 2025 | skipped |
| **Google** | Imagen 3.0 | `google:1@1` | text-to-image | - | Aug 2024 | skipped |
| Google | Imagen 3.0 Fast | `google:1@2` | text-to-image | - | Aug 2024 | skipped |
| Google | Imagen 4.0 Preview | `google:2@1` | text-to-image | - | May 2025 | skipped |
| Google | Imagen 4.0 Ultra | `google:2@2` | text-to-image | - | May 2025 | skipped |
| Google | Imagen 4.0 Fast | `google:2@3` | text-to-image | - | May 2025 | skipped |
| Google | Nano Banana (Gemini Flash 2.5) | `google:4@1` | text-to-image | - | 2025 | skipped |
| Google | Nano Banana (Gemini Flash 2.5) | `google:4@1` | image-to-image | reference (8 max, edit/fusion) | 2025 | skipped |
| Google | Nano Banana 2 Pro (Gemini 3 Pro) | `google:4@2` | text-to-image | - | 2025 | implemented |
| Google | Nano Banana 2 Pro (Gemini 3 Pro) | `google:4@2` | image-to-image | reference (14 max, style/lighting) | 2025 | implemented |
| Google | Veo 2 | `google:2@0` | text-to-video | - | Dec 2024 | skipped |
| Google | Veo 2 | `google:2@0` | image-to-video | first frame | Dec 2024 | skipped |
| Google | Veo 3 | `google:3@0` | text-to-video | - | May 2025 | skipped |
| Google | Veo 3 | `google:3@0` | image-to-video (with audio) | first frame | May 2025 | skipped |
| Google | Veo 3 Fast | `google:3@1` | text-to-video | - | May 2025 | skipped |
| Google | Veo 3 Fast | `google:3@1` | image-to-video (with audio) | first frame | May 2025 | skipped |
| Google | Veo 3.1 | `google:3@2` | text-to-video | - | 2025 | implemented |
| Google | Veo 3.1 | `google:3@2` | image-to-video (with audio) | first frame | 2025 | implemented |
| Google | Veo 3.1 Fast | `google:3@3` | text-to-video | - | 2025 | implemented |
| Google | Veo 3.1 Fast | `google:3@3` | image-to-video (with audio) | first frame | 2025 | implemented |
| **Ideogram** | Ideogram 1.0 | `ideogram:1@1` | text-to-image | - | Feb 2024 | skipped |
| Ideogram | Ideogram 1.0 Remix | `ideogram:1@2` | image-to-image (remix) | seed + style ref (remix) | Feb 2024 | skipped |
| Ideogram | Ideogram 2a | `ideogram:2@1` | text-to-image | - | Feb 2025 | skipped |
| Ideogram | Ideogram 2a Remix | `ideogram:2@2` | image-to-image (remix) | seed + style ref (remix) | Feb 2025 | skipped |
| Ideogram | Ideogram 2.0 | `ideogram:3@1` | text-to-image | - | Aug 2024 | skipped |
| Ideogram | Ideogram 2.0 Remix | `ideogram:3@2` | image-to-image (remix) | seed + style ref (remix) | Aug 2024 | skipped |
| Ideogram | Ideogram 2.0 Edit | `ideogram:3@3` | inpainting | seed + mask | Aug 2024 | skipped |
| Ideogram | Ideogram 2.0 Reframe | `ideogram:3@4` | outpainting | seed | Aug 2024 | skipped |
| Ideogram | Ideogram 3.0 | `ideogram:4@1` | text-to-image | - | Mar 2025 | skipped |
| Ideogram | Ideogram 3.0 Remix | `ideogram:4@2` | image-to-image (remix) | seed + style ref (4 max, remix) | Mar 2025 | skipped |
| Ideogram | Ideogram 3.0 Edit | `ideogram:4@3` | inpainting | seed + mask | Mar 2025 | skipped |
| Ideogram | Ideogram 3.0 Reframe | `ideogram:4@4` | outpainting | seed | Mar 2025 | skipped |
| Ideogram | Ideogram 3.0 Replace Background | `ideogram:4@5` | image-to-image (background) | seed (bg replace) | Mar 2025 | skipped |
| **ImagineArt** | ImagineArt 1.5 | `imagineart:1@5` | text-to-image | - | Nov 2025 | skipped |
| **KlingAI** | KlingAI 1.0 Standard | `klingai:1@1` | text-to-video | - | Jun 2024 | skipped |
| KlingAI | KlingAI 1.0 Standard | `klingai:1@1` | image-to-video | first frame | Jun 2024 | skipped |
| KlingAI | KlingAI 1.0 Pro | `klingai:1@2` | text-to-video | - | Jun 2024 | skipped |
| KlingAI | KlingAI 1.0 Pro | `klingai:1@2` | image-to-video | first frame | Jun 2024 | skipped |
| KlingAI | KlingAI 1.5 Standard | `klingai:2@1` | image-to-video | first frame | Sep 2024 | skipped |
| KlingAI | KlingAI 1.5 Pro | `klingai:2@2` | image-to-video | first frame | Sep 2024 | skipped |
| KlingAI | KlingAI 1.6 Standard | `klingai:3@1` | text-to-video | - | Dec 2024 | skipped |
| KlingAI | KlingAI 1.6 Standard | `klingai:3@1` | image-to-video | first frame | Dec 2024 | skipped |
| KlingAI | KlingAI 1.6 Pro | `klingai:3@2` | image-to-video | first frame | Dec 2024 | skipped |
| KlingAI | KlingAI 2.0 Master | `klingai:4@3` | text-to-video | - | Apr 2025 | skipped |
| KlingAI | KlingAI 2.0 Master | `klingai:4@3` | image-to-video | first frame | Apr 2025 | skipped |
| KlingAI | KlingAI 2.1 Standard | `klingai:5@1` | image-to-video | first frame | May 2025 | skipped |
| KlingAI | KlingAI 2.1 Pro | `klingai:5@2` | image-to-video | first frame | May 2025 | skipped |
| KlingAI | KlingAI 2.1 Master | `klingai:5@3` | text-to-video | - | May 2025 | skipped |
| KlingAI | KlingAI 2.1 Master | `klingai:5@3` | image-to-video | first frame | May 2025 | skipped |
| KlingAI | KlingAI 2.5 Turbo Standard | `klingai:6@0` | image-to-video | first frame | Sep 2025 | skipped |
| KlingAI | KlingAI 2.5 Turbo Pro | `klingai:6@1` | text-to-video | - | Sep 2025 | skipped |
| KlingAI | KlingAI 2.5 Turbo Pro | `klingai:6@1` | image-to-video | first frame | Sep 2025 | skipped |
| KlingAI | KlingAI Lip-Sync | `klingai:7@1` | video-to-video (lip sync) | - | 2025 | skipped |
| **Lightricks** | LTX-2 Pro | `lightricks:2@0` | text-to-video | - | Oct 2025 | skipped |
| Lightricks | LTX-2 Pro | `lightricks:2@0` | image-to-video | first frame | Oct 2025 | skipped |
| Lightricks | LTX-2 Fast | `lightricks:2@1` | text-to-video | - | Oct 2025 | skipped |
| Lightricks | LTX-2 Fast | `lightricks:2@1` | image-to-video | first frame | Oct 2025 | skipped |
| Lightricks | LTX-2 Retake | `lightricks:3@1` | video-to-video | - | Oct 2025 | skipped |
| **Midjourney** | Midjourney V6 | `midjourney:1@1` | text-to-image | - | Dec 2023 | skipped |
| Midjourney | Midjourney V6 | `midjourney:1@1` | image-to-image | reference (style/composition) | Dec 2023 | skipped |
| Midjourney | Midjourney V6.1 | `midjourney:2@1` | text-to-image | - | Jul 2024 | skipped |
| Midjourney | Midjourney V6.1 | `midjourney:2@1` | image-to-image | reference (style/composition) | Jul 2024 | skipped |
| Midjourney | Midjourney V7 | `midjourney:3@1` | text-to-image | - | Apr 2025 | skipped |
| Midjourney | Midjourney V7 | `midjourney:3@1` | image-to-image | reference (style/composition) | Apr 2025 | skipped |
| **MiniMax** | Video-01 Base | `minimax:1@1` | text-to-video | - | Aug 2024 | skipped |
| MiniMax | Video-01 Base | `minimax:1@1` | image-to-video | first frame | Aug 2024 | skipped |
| MiniMax | Video-01 Live | `minimax:2@3` | image-to-video | first frame | Jan 2025 | skipped |
| MiniMax | Video-01 Director | `minimax:2@1` | text-to-video | - | Jan 2025 | skipped |
| MiniMax | Video-01 Director | `minimax:2@1` | image-to-video | first frame | Jan 2025 | skipped |
| MiniMax | Hailuo 02 | `minimax:3@1` | text-to-video | - | Jun 2025 | skipped |
| MiniMax | Hailuo 2.3 | `minimax:4@1` | text-to-video | - | 2025 | skipped |
| MiniMax | Hailuo 2.3 | `minimax:4@1` | image-to-video | first frame | 2025 | skipped |
| MiniMax | Hailuo 2.3 Fast | `minimax:4@2` | image-to-video | first frame | 2025 | skipped |
| **OpenAI** | DALL·E 2 | `openai:2@2` | text-to-image | - | Apr 2022 | skipped |
| OpenAI | DALL·E 3 | `openai:2@3` | text-to-image | - | Oct 2023 | skipped |
| OpenAI | GPT Image 1 | `openai:1@1` | text-to-image | - | Mar 2025 | implemented |
| OpenAI | GPT Image 1 | `openai:1@1` | image-to-image | reference (edit) | Mar 2025 | implemented |
| OpenAI | Sora 2 | `openai:3@1` | text-to-video | - | Sep 2025 | implemented |
| OpenAI | Sora 2 | `openai:3@1` | image-to-video | first frame | Sep 2025 | implemented |
| OpenAI | Sora 2 Pro | `openai:3@2` | text-to-video | - | Sep 2025 | implemented |
| OpenAI | Sora 2 Pro | `openai:3@2` | image-to-video | first frame | Sep 2025 | implemented |
| **PixVerse** | PixVerse v3.5 | `pixverse:1@1` | text-to-video | - | Dec 2024 | skipped |
| PixVerse | PixVerse v3.5 | `pixverse:1@1` | image-to-video | first frame | Dec 2024 | skipped |
| PixVerse | PixVerse v4 | `pixverse:1@2` | text-to-video | - | Feb 2025 | skipped |
| PixVerse | PixVerse v4 | `pixverse:1@2` | image-to-video | first frame | Feb 2025 | skipped |
| PixVerse | PixVerse v4.5 | `pixverse:1@3` | text-to-video | - | May 2025 | skipped |
| PixVerse | PixVerse v4.5 | `pixverse:1@3` | image-to-video | first frame | May 2025 | skipped |
| PixVerse | PixVerse v5 | `pixverse:1@5` | text-to-video | - | Aug 2025 | skipped |
| PixVerse | PixVerse v5 | `pixverse:1@5` | image-to-video | first frame | Aug 2025 | skipped |
| PixVerse | PixVerse LipSync | `pixverse:lipsync@1` | video-to-video (lip sync) | - | 2025 | skipped |
| **Runway** | Runway Gen-4 Turbo | `runway:1@1` | image-to-video | first frame | Apr 2025 | skipped |
| Runway | Runway Aleph | `runway:2@1` | video-to-video | - | Jul 2025 | skipped |
| **Sourceful** | Riverflow 1.1 Mini | `sourceful:1@0` | image-to-image | reference (10 max, edit) | Oct 2025 | skipped |
| Sourceful | Riverflow 1.1 | `sourceful:1@1` | image-to-image | reference (10 max, edit) | Oct 2025 | skipped |
| Sourceful | Riverflow 1.1 Pro | `sourceful:1@2` | image-to-image | reference (10 max, edit) | Oct 2025 | skipped |
| Sourceful | Riverflow 2 Preview Fast | `sourceful:2@2` | text-to-image | - | Nov 2025 | skipped |
| Sourceful | Riverflow 2 Preview Fast | `sourceful:2@2` | image-to-image | reference (3 max, edit) | Nov 2025 | skipped |
| Sourceful | Riverflow 2 Preview Standard | `sourceful:2@1` | text-to-image | - | Nov 2025 | skipped |
| Sourceful | Riverflow 2 Preview Standard | `sourceful:2@1` | image-to-image | reference (3 max, edit) | Nov 2025 | skipped |
| Sourceful | Riverflow 2 Preview Max | `sourceful:2@3` | text-to-image | - | Nov 2025 | skipped |
| Sourceful | Riverflow 2 Preview Max | `sourceful:2@3` | image-to-image | reference (3 max, edit) | Nov 2025 | skipped |
| **Vidu** | Vidu Q1 Image | `vidu:q1@image` | text-to-image | - | Apr 2025 | skipped |
| Vidu | Vidu Q1 Image | `vidu:q1@image` | image-to-image | reference (7 max, multi-merge) | Apr 2025 | skipped |
| Vidu | Vidu 1.5 | `vidu:1@5` | text-to-video | - | Nov 2024 | skipped |
| Vidu | Vidu 1.5 | `vidu:1@5` | image-to-video | first frame | Nov 2024 | skipped |
| Vidu | Vidu 2.0 | `vidu:2@0` | image-to-video | first frame | Jan 2025 | skipped |
| Vidu | Vidu Q1 Classic | `vidu:1@0` | image-to-video ³ | first + last frame | Apr 2025 | skipped |
| Vidu | Vidu Q1 | `vidu:1@1` | text-to-video | - | Apr 2025 | skipped |
| Vidu | Vidu Q1 | `vidu:1@1` | image-to-video | first + last frame | Apr 2025 | skipped |
| Vidu | Vidu Q2 Turbo | `vidu:3@2` | text-to-video | - | Oct 2025 | skipped |
| Vidu | Vidu Q2 Turbo | `vidu:3@2` | image-to-video ³ | first + last frame | Oct 2025 | skipped |
| Vidu | Vidu Q2 Pro | `vidu:3@1` | text-to-video | - | Oct 2025 | skipped |
| Vidu | Vidu Q2 Pro | `vidu:3@1` | image-to-video ³ | first + last frame | Oct 2025 | skipped |

## Status Legend

| Status | Meaning |
|--------|---------|
| implemented | Provider is implemented |
| planned | Implementation planned |
| skipped | Intentionally not implemented (e.g., newer version available) |
| undecided | Decision pending |

## Capability Legend

Each row represents one capability = one provider implementation.

| Capability | Description | Provider File Pattern |
|------------|-------------|----------------------|
| text-to-image | Generate images from text prompts | `{Model}.text2image.ts` |
| image-to-image | Transform/edit existing images ¹ | `{Model}.image2image.ts` |
| inpainting | Edit specific regions of an image using masks | `{Model}.inpainting.ts` |
| outpainting | Extend image boundaries | `{Model}.outpainting.ts` |
| text-to-video | Generate videos from text prompts | `{Model}.text2video.ts` |
| image-to-video | Animate a single image into video ² | `{Model}.image2video.ts` |
| video-to-video | Transform or edit existing videos | `{Model}.video2video.ts` |
| video upscaling | Increase video resolution | - |
| video background removal | Remove backgrounds from video | - |
| image upscaling | Increase image resolution | - |

¹ *image-to-image includes reference-to-image capabilities (style/subject reference from input images)*
² *image-to-video includes first/last frame-to-video and reference-to-video capabilities*
³ *Supports first and last frame input for video generation*

## Image Input Type Legend

The "Image Input Type" column describes how input images are actually processed by each model:

| Type | Description | API Parameter | Use Case |
|------|-------------|---------------|----------|
| **-** | No image input (text-only) | N/A | Pure text-to-image/video generation |
| **seed** | Image IS the starting point for diffusion | `seedImage` | Direct transformation, outpainting |
| **seed + mask** | Seed image with mask for selective editing | `seedImage` + `maskImage` | Inpainting (edit masked regions only) |
| **seed + style ref** | Seed for base, separate style reference | `seedImage` + `styleReferenceImages` | Remix with stylistic variations |
| **reference** | Images INFLUENCE generation (visual guidance) | `referenceImages` or `inputs.referenceImages` | Style transfer, composition guidance, multi-image fusion |
| **control** | Structural/spatial guidance extraction | `controlImage` | Edge detection, depth maps, color guidance |
| **style reference** | Style/aesthetic guidance only | `styleReferenceImages` | IP Adapter style matching |
| **first frame** | Starting keyframe for video | `frameImages[0]` | Animate static image into video |
| **first + last frame** | Start and end keyframes | `frameImages[0,1]` | Define video trajectory between two images |

### Semantic Distinction

**Seed-based (Direct Transformation)**:
- The input image IS the starting point
- Model modifies the image through diffusion
- Controls: `strength` parameter (0-1, how much to preserve)
- Examples: Inpainting, outpainting, remix

**Reference-based (Visual Guidance)**:
- Input images INFLUENCE generation
- Model creates NEW content inspired by references
- No traditional strength parameter
- Examples: Style transfer, character consistency, multi-image merging

### Parenthetical Details

Additional context in parentheses explains:
- **Max count**: `(4 max)` = up to 4 images supported
- **Use case**: `(edit)` = text-guided editing, `(consistency)` = character/subject consistency
- **Special mode**: `(remix)` = creative reinterpretation with remixStrength control

## Release Date Sources

Release dates were researched from official announcements and verified sources:

- [Black Forest Labs Blog](https://blackforestlabs.ai/announcements/)
- [Bria 2024 Wrapped](https://blog.bria.ai/bria-2024-wrapped-a-year-of-visual-gen-ai-innovation)
- [ByteDance Seed](https://seed.bytedance.com/en/)
- [Google Cloud Blog - Veo 3, Imagen 4](https://cloud.google.com/blog/products/ai-machine-learning/announcing-veo-3-imagen-4-and-lyria-2-on-vertex-ai)
- [Ideogram Features](https://ideogram.ai/features/3.0)
- [ImagineArt 1.5 Announcement](https://www.imagine.art/announcements/imagineart-1.5)
- [KlingAI Release History](https://app.klingai.com/global/release-history)
- [Lightricks LTX-2 Press Release](https://www.prnewswire.com/news-releases/lightricks-releases-ltx-2-the-first-complete-open-source-ai-video-foundation-model-302593012.html)
- [Midjourney Version Docs](https://docs.midjourney.com/hc/en-us/articles/32199405667853-Version)
- [MiniMax Video-01 Announcement](https://www.minimax.io/news/video-01)
- [OpenAI Sora 2 Announcement](https://openai.com/index/sora-2/)
- [PixVerse Version History](https://app.pixverse.ai/)
- [Runway Research - Gen-4](https://runwayml.com/research/introducing-runway-gen-4)
- [Runway Research - Aleph](https://runwayml.com/research/introducing-runway-aleph)
- [Sourceful Riverflow Introduction](https://www.sourceful.com/research/introducing-sourceful-riverflow-1)
- [Vidu Q2 Press Release](https://www.prnewswire.com/news-releases/vidu-launches-q2-reference-to-video-pioneering-a-new-era-of-high-consistency-and-creative-control-302590002.html)
