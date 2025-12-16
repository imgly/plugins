# EachLabs Provider Inventory

This document tracks EachLabs AI models for implementation, focusing on image and video generation.

**Last Updated**: 2025-12-15

## API Reference

- **List Models**: `GET https://api.eachlabs.ai/v1/models?limit=500`
- **Model Details**: `GET https://api.eachlabs.ai/v1/model?slug=<slug>`

## Status Legend

| Status | Meaning |
|--------|---------|
| implemented | Provider is implemented |
| planned | Implementation planned |
| skipped | Intentionally not implemented |

## Output Type Legend

| Output Type | Meaning |
|-------------|---------|
| image | Single image output |
| array | Multiple images output (batch) |
| video | Video output |

---

## Image Generation (Text-to-Image)

| Slug | Title | Output Type | Status | Notes |
|------|-------|-------------|--------|-------|
| flux-2-pro | Flux 2 Pro | image | implemented | Latest Flux, high quality |
| flux-2 | Flux 2 | array | planned | Standard Flux 2 |
| flux-2-flex | Flux 2 \| Flex | image | planned | Prompt expansion enabled |
| gemini-3-pro-image-preview | Gemini 3 \| Pro \| Image Preview | array | planned | Google Gemini image generation |
| bytedance-seedream-v4-5-text-to-image | Bytedance \| Seedream \| v4.5 \| Text to Image | array | planned | Latest Seedream |
| nano-banana-pro | Nano Banana Pro | array | implemented | Multi-style generation |
| openai-image-generation | GPT-1 \| Image Generation | image | implemented | OpenAI GPT Image |

## Image Generation (Image-to-Image / Edit)

| Slug | Title | Output Type | Status | Notes |
|------|-------|-------------|--------|-------|
| flux-2-pro-edit | Flux 2 Pro \| Edit | image | implemented | Edit with Flux 2 Pro |
| flux-2-edit | Flux 2 \| Edit | array | planned | Standard Flux 2 edit |
| flux-2-flex-edit | Flux 2 \| Flex \| Edit | image | planned | Flex edit variant |
| gemini-3-pro-image-preview-edit | Gemini 3 Pro \| Image Edit | array | planned | Google Gemini edit |
| bytedance-seedream-v4-5-edit | Bytedance \| Seedream \| v4.5 \| Edit | array | planned | Seedream edit |
| nano-banana-pro-edit | Nano Banana Pro \| Edit | array | implemented | Multi-style edit |
| openai-image-edit | GPT-1 \| Image Edit | image | implemented | OpenAI GPT Image edit |

## Video Generation (Text-to-Video)

| Slug | Title | Output Type | Status | Notes |
|------|-------|-------------|--------|-------|
| kling-v2-6-pro-text-to-video | Kling \| v2.6 \| Pro \| Text to Video | video | planned | Latest Kling, high quality |
| veo3-1-text-to-video | Veo 3.1 \| Text to Video | video | planned | Google Veo 3.1 |

## Video Generation (Image-to-Video)

| Slug | Title | Output Type | Status | Notes |
|------|-------|-------------|--------|-------|
| kling-v2-6-pro-image-to-video | Kling \| v2.6 \| Pro \| Image to Video | video | planned | Latest Kling I2V |
| kling-o1-image-to-video | Kling O1 \| Image to Video | video | planned | Kling O1 variant |
| veo3-1-image-to-video | Veo 3.1 \| Image to Video | video | planned | Google Veo 3.1 I2V |

---

## Summary

### Implemented

**Image Generation (T2I):** 3 models
- nano-banana-pro
- flux-2-pro
- openai-image-generation

**Image Generation (I2I/Edit):** 3 models
- nano-banana-pro-edit
- flux-2-pro-edit
- openai-image-edit

### Planned for Implementation

**Image Generation (T2I):** 4 models
- flux-2, flux-2-flex
- gemini-3-pro-image-preview
- bytedance-seedream-v4-5-text-to-image

**Image Generation (I2I/Edit):** 4 models
- flux-2-edit, flux-2-flex-edit
- gemini-3-pro-image-preview-edit
- bytedance-seedream-v4-5-edit

**Video Generation (T2V):** 2 models
- kling-v2-6-pro-text-to-video
- veo3-1-text-to-video

**Video Generation (I2V):** 3 models
- kling-v2-6-pro-image-to-video
- kling-o1-image-to-video
- veo3-1-image-to-video

### Statistics

| Category | Implemented | Planned | Total |
|----------|-------------|---------|-------|
| Image T2I | 3 | 4 | 7 |
| Image I2I | 3 | 4 | 7 |
| Video T2V | 0 | 2 | 2 |
| Video I2V | 0 | 3 | 3 |
| **Total** | **6** | **13** | **19** |
