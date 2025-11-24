# Runware Available Models

This document lists all available models through the Runware API with their AIR identifiers, capabilities, and specifications.

## Image Generation Models

### Black Forest Labs (BFL)

**Docs**: https://runware.ai/docs/en/providers/bfl

| Model | AIR ID | Capabilities | Parameters/Restrictions |
|-------|--------|--------------|------------------------|
| FLUX.1.1 Pro | `bfl:1@1` | T2I | Width/Height: 256-1440px, CFG: 1.5-5, Steps: 1-50 |
| FLUX.1.1 Pro Ultra | `bfl:2@2` | T2I | Up to 4MP resolution, raw mode available |
| FLUX.1 Kontext [pro] | `bfl:3@1` | I2I (editing) | Fast iterative editing, style preservation |
| FLUX.1 Kontext [max] | `bfl:4@1` | I2I (editing) | Premium quality, sharp edits, typography support |


### Google

**Docs**: https://runware.ai/docs/en/providers/google

| Model | AIR ID | Capabilities | Parameters/Restrictions |
|-------|--------|--------------|------------------------|
| Imagen 3.0 | `google:1@1` | T2I | High-quality with better lighting, fewer artifacts |
| Imagen 3.0 Fast | `google:1@2` | T2I | Faster generation |
| Imagen 4 Preview | `google:2@1` | T2I | 2K resolution, improved text capabilities |
| Imagen 4 Ultra | `google:2@2` | T2I | Photorealism, exceptional detail and color |
| Imagen 4 Fast | `google:2@3` | T2I | Optimized for latency-sensitive use cases |
| Nano Banana / Gemini Flash 2.5 | `google:4@1` | T2I | Multi-image generation, coherent character identity |
| Nano Banana 2 Pro | `google:4@2` | T2I | Advanced reasoning for controlled visual creation |

### OpenAI

**Docs**: https://runware.ai/docs/en/providers/openai

| Model | AIR ID | Capabilities | Parameters/Restrictions |
|-------|--------|--------------|------------------------|
| GPT Image 1 | `openai:1@1` | T2I, I2I | March 2025, advanced prompt following, text layout |

### ByteDance (Image)

**Docs**: https://runware.ai/docs/en/providers/bytedance

| Model | AIR ID | Capabilities | Parameters/Restrictions |
|-------|--------|--------------|------------------------|
| Seedream 3.0 | `bytedance:3@1` | T2I | Up to 2048x2048, bilingual support, industry-leading text rendering |
| SeedEdit 3.0 | `bytedance:4@1` | I2I (editing) | 4K output capability, precise editing |
| Seedream 4.0 | `bytedance:5@0` | T2I | Ultra-fast 2K-4K generation, bilingual support |

### Bria

**Docs**: https://runware.ai/docs/en/providers/bria

| Model | AIR ID | Capabilities | Parameters/Restrictions |
|-------|--------|--------------|------------------------|
| Bria 3.2 | `bria:10@1` | T2I | Commercial-ready, trained on licensed data |
| Bria FIBO | `bria:20@1` | T2I | Converts prompts to JSON schemas before rendering |

### Ideogram

**Docs**: https://runware.ai/docs/en/providers/ideogram

| Model | AIR ID | Capabilities | Parameters/Restrictions |
|-------|--------|--------------|------------------------|
| Ideogram 3.0 | `ideogram:4@1` | T2I | Design-level, sharp text rendering, style preset |
| Ideogram 3.0 Remix | `ideogram:4@2` | I2I | Reinterprets with fresh styles |
| Ideogram 3.0 Edit | `ideogram:4@3` | I2I | Inpainting for surgical edits |
| Ideogram 3.0 Reframe | `ideogram:4@4` | I2I | Style-consistent outpainting |
| Ideogram 3.0 Replace BG | `ideogram:4@5` | I2I | Background swapping |

### KlingAI (Image)

**Docs**: https://runware.ai/docs/en/providers/klingai

| Model | AIR ID | Capabilities | Parameters/Restrictions |
|-------|--------|--------------|------------------------|
| Kolors 2.0 | `klingai:5@10` | T2I | Photorealistic, natural color balance |
| Kolors 2.1 | `klingai:4@10` | T2I | Refined edge rendering, lighting realism |

### Sourceful

**Docs**: https://runware.ai/docs/en/providers/sourceful

| Model | AIR ID | Capabilities | Parameters/Restrictions |
|-------|--------|--------------|------------------------|
| Riverflow 1.1 Mini | `sourceful:1@0` | I2I | Fast, cost-efficient editing |
| Riverflow 1.1 | `sourceful:1@1` | I2I | Up to 10 input images, 11 aspect ratios, transparent BG |
| Riverflow 1.1 Pro | `sourceful:1@2` | I2I | Superior quality and stability |
| Riverflow 2 Preview Fast | `sourceful:2@2` | I2I | Lightweight for quick workflows |
| Riverflow 2 Preview Standard | `sourceful:2@1` | I2I | Balanced realism with reference integration |
| Riverflow 2 Preview Max | `sourceful:2@3` | I2I | Highest quality for demanding commercial work |

### Runware Native / Community

**Docs**: https://runware.ai/models

| Model | AIR ID | Capabilities | Parameters/Restrictions |
|-------|--------|--------------|------------------------|
| HiDream-I1 Full | `runware:97@1` | T2I | Uncensored creative generation, LoRA support |
| HiDream-I1 Dev | `runware:97@2` | T2I | Speed-quality balance |
| HiDream-I1 Fast | `runware:97@3` | T2I | Rapid iterations |
| FLUX.1 Krea [dev] | `runware:107@1` | T2I | Photorealistic open-weights |
| Qwen-Image | `runware:108@1` | T2I | Vision-language, strong detail |
| Qwen-Image-Edit | `runware:108@20` | I2I | Intelligent editing |
| Qwen-Image-Edit Lightning | `runware:108@21` | I2I | 8-step fast version |
| Qwen-Image-Edit-Plus | `runware:108@22` | I2I | Multi-image, ControlNet support |
| FLUX.1 Fill [dev] OneReward | `runware:121@1` | I2I | Context-aware inpainting |
| Flex.1-alpha | `runware:160@1` | T2I | Compact 8B, optional guidance |

---

## Video Generation Models

### KlingAI (Video)

**Docs**: https://runware.ai/docs/en/providers/klingai

| Model | AIR ID | Capabilities | Duration | Resolution |
|-------|--------|--------------|----------|------------|
| Kling 1.0 Standard | `klingai:1@1` | T2V, I2V | 5-10s | 720p |
| Kling 1.0 Pro | `klingai:1@2` | T2V, I2V | 5-10s | 720p |
| Kling 1.5 Standard | `klingai:2@1` | I2V only | 5-10s | 720p-1080p |
| Kling 1.5 Pro | `klingai:2@2` | I2V only | 5-10s | 1080p |
| Kling 1.6 Standard | `klingai:3@1` | T2V, I2V | 5-10s | 720p-1080p |
| Kling 1.6 Pro | `klingai:3@2` | I2V only | 5-10s | 1080p |
| Kling 2.0 Master | `klingai:4@3` | T2V, I2V | 10s | 1080p |
| Kling 2.1 Master | `klingai:5@3` | T2V, I2V | 5-10s | 1080p |

**KlingAI Specs:** Dimensions: 1280x720 (16:9), 720x720 (1:1), 720x1280 (9:16) | FPS: 30 | Input: 300-2048px, 20MB max

### MiniMax (Hailuo)

**Docs**: https://runware.ai/docs/en/providers/minimax

| Model | AIR ID | Capabilities | Duration | Resolution |
|-------|--------|--------------|----------|------------|
| Video-01 Base | `minimax:1@1` | T2V, I2V, Ref2V | 6s | 768p |
| Video-01 Director | `minimax:2@1` | T2V, I2V | 6s | 768p |
| Video-01 Live | `minimax:2@3` | I2V only | 6s | 768p |
| Hailuo 02 | `minimax:3@1` | T2V, I2V | 10s | 1080p |

**MiniMax Specs:** Prompt: 2-3000 chars | FPS: 25

### PixVerse

**Docs**: https://runware.ai/docs/en/providers/pixverse

| Model | AIR ID | Capabilities | Duration | Resolution |
|-------|--------|--------------|----------|------------|
| PixVerse v3.5 | `pixverse:1@1` | T2V, I2V | 5-8s | 1080p |
| PixVerse v4.5 | `pixverse:1@3` | T2V, I2V | 5-8s | 1080p |
| PixVerse v5 | `pixverse:1@5` | T2V, I2V | 5-8s | 1080p |
| PixVerse LipSync | `pixverse:lipsync@1` | Audio2V | - | - |

**PixVerse Specs:** Prompt: 2-2048 chars | FPS: 16/24 | Input: 300-4000px, 20MB max | Effects: AI Kiss, AI Hug, Muscle Surge

### Vidu

**Docs**: https://runware.ai/docs/en/providers/vidu

| Model | AIR ID | Capabilities | Duration | Resolution |
|-------|--------|--------------|----------|------------|
| Vidu Q1 Classic | `vidu:1@0` | First/Last frame | 5s | 1080p |
| Vidu 1.5 | `vidu:1@5` | T2V, I2V, Ref2V | 4-8s | 1080p |
| Vidu 2.0 | `vidu:2@0` | I2V, Ref2V | 4-8s | 1080p |
| Vidu Q2 Pro | `vidu:3@1` | T2V, First/Last, Ref2V | 1-8s | 1080p |
| Vidu Q2 Turbo | `vidu:3@2` | T2V, First/Last, Ref2V | 1-8s | 1080p |

**Vidu Specs:** FPS: 24 | Input: 300-2048px, 20MB max

### Google Veo

**Docs**: https://runware.ai/docs/en/providers/google

| Model | AIR ID | Capabilities | Duration | Resolution |
|-------|--------|--------------|----------|------------|
| Veo 2 | `google:2@0` | T2V, I2V | 8s | 720p |
| Veo 3 | `google:3@2` | T2V, I2V | 8s | 720p-1080p |
| Veo 3 Fast | `google:3@1` | T2V, I2V | 8s | 720p-1080p |

**Veo Specs:** FPS: 24 | Veo 3 supports native audio (dialogue, ambience, SFX)

### Runway

**Docs**: https://runware.ai/docs/en/providers/runway

| Model | AIR ID | Capabilities | Duration | Resolution |
|-------|--------|--------------|----------|------------|
| Gen-4 Turbo | `runway:1@1` | I2V only | 2-10s | 720p-1080p |
| Aleph (V2V) | `runway:2@1` | V2V | - | - |

**Runway Specs:** Dimensions: 1280x720, 720x1280, 1104x832, 832x1104, 960x960, 1584x672

### ByteDance (Seedance)

**Docs**: https://runware.ai/docs/en/providers/bytedance

| Model | AIR ID | Capabilities | Duration | Resolution |
|-------|--------|--------------|----------|------------|
| Seedance 1.0 Lite | `bytedance:1@1` | T2V, I2V | 1.2-12s | 480p-720p |
| Seedance 1.0 Pro | `bytedance:2@1` | T2V, I2V | 1.2-12s | 480p-1080p |
| Seedance 1.0 Pro Fast | `bytedance:2@2` | T2V, I2V | 1.2-12s | 480p-1080p |
| OmniHuman-1 | `bytedance:5@1` | I2V (portrait animation) | - | - |

**Seedance Specs:** FPS: 24 | Duration increments: 0.1s

### Lightricks (LTX)

**Docs**: https://runware.ai/docs/en/providers/lightricks

| Model | AIR ID | Capabilities | Duration | Resolution |
|-------|--------|--------------|----------|------------|
| LTX-2 Standard | `lightricks:2@0` | T2V, I2V | 6-10s | 720p-1080p |
| LTX-2 High-Speed | `lightricks:2@1` | T2V, I2V | 6-10s | 720p-1080p |

**LTX Specs:** Prompt: 2-10000 chars | FPS: 25/50 | No seed support | Max input: 7MB

---

## Legend

| Abbreviation | Meaning |
|--------------|---------|
| T2I | Text-to-Image |
| I2I | Image-to-Image |
| T2V | Text-to-Video |
| I2V | Image-to-Video |
| V2V | Video-to-Video |
| Ref2V | Reference-to-Video |
| Audio2V | Audio-driven Video |

---

## Sources

- [Runware Models Browser](https://runware.ai/models)
- [Runware Providers Documentation](https://runware.ai/docs/en/providers/)
- [Runware Video Inference API](https://runware.ai/docs/en/video-inference/api-reference)
- [Runware FLUX Tools](https://runware.ai/docs/en/image-inference/flux-tools)
