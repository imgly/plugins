import CreativeEditorSDK from '@cesdk/cesdk-js';

// All translation keys from the AI plugins - copied directly from the translation files
const baseTranslations = {
  "ly.img.plugin-ai-generation-web.property.prompt": "Prompt",
  "ly.img.plugin-ai-generation-web.property.style": "Style",
  "ly.img.plugin-ai-generation-web.property.image_size": "Image Size",
  "ly.img.plugin-ai-generation-web.property.size": "Size",
  "ly.img.plugin-ai-generation-web.property.colors": "Colors",
  "ly.img.plugin-ai-generation-web.property.background": "Background",
  "ly.img.plugin-ai-generation-web.property.width": "Width",
  "ly.img.plugin-ai-generation-web.property.height": "Height",
  "ly.img.plugin-ai-generation-web.property.aspect_ratio": "Aspect Ratio",
  "ly.img.plugin-ai-generation-web.property.duration": "Duration",
  "ly.img.plugin-ai-generation-web.property.resolution": "Resolution",
  "ly.img.plugin-ai-generation-web.property.generate_audio": "Generate Audio",
  "ly.img.plugin-ai-generation-web.property.voice_id": "Voice",
  "ly.img.plugin-ai-generation-web.property.speed": "Speed",
  "ly.img.plugin-ai-generation-web.property.text": "Text",
  "ly.img.plugin-ai-generation-web.property.duration_seconds": "Duration (seconds)",
  "ly.img.plugin-ai-generation-web.property.temperature": "Creativity Level",
  "ly.img.plugin-ai-generation-web.property.maxTokens": "Maximum Response Length",
  "ly.img.plugin-ai-generation-web.property.blockId": "Block ID",
  "ly.img.plugin-ai-generation-web.property.initialText": "Initial Text",
  "ly.img.plugin-ai-generation-web.property.negative_prompt": "Negative Prompt",
  "ly.img.plugin-ai-generation-web.property.seed": "Seed",
  "ly.img.plugin-ai-generation-web.property.rendering_speed": "Rendering Speed",
  "ly.img.plugin-ai-generation-web.property.expand_prompt": "Expand Prompt",
  "ly.img.plugin-ai-generation-web.property.cfg_scale": "CFG Scale",
  "ly.img.plugin-ai-generation-web.property.style.type": "Type",
  "ly.img.plugin-ai-generation-web.property.style.type.image": "Image",
  "ly.img.plugin-ai-generation-web.property.style.type.vector": "Vector",
  "ly.img.plugin-ai-generation-web.property.style.type.icon": "Icon",
  "ly.img.plugin-ai-generation-web.property.image_size.square": "Square",
  "ly.img.plugin-ai-generation-web.property.image_size.square_hd": "Square HD",
  "ly.img.plugin-ai-generation-web.property.image_size.portrait": "Portrait",
  "ly.img.plugin-ai-generation-web.property.image_size.portrait_4_3": "Portrait 4:3",
  "ly.img.plugin-ai-generation-web.property.image_size.portrait_16_9": "Portrait 16:9",
  "ly.img.plugin-ai-generation-web.property.image_size.landscape": "Landscape",
  "ly.img.plugin-ai-generation-web.property.image_size.landscape_4_3": "Landscape 4:3",
  "ly.img.plugin-ai-generation-web.property.image_size.landscape_16_9": "Landscape 16:9",
  "ly.img.plugin-ai-generation-web.property.background.auto": "Auto",
  "ly.img.plugin-ai-generation-web.property.background.transparent": "Transparent",
  "ly.img.plugin-ai-generation-web.property.background.opaque": "Opaque",
  "ly.img.plugin-ai-generation-web.property.aspect_ratio.21:9": "21:9 (Ultra Wide)",
  "ly.img.plugin-ai-generation-web.property.aspect_ratio.16:9": "16:9 (Widescreen)",
  "ly.img.plugin-ai-generation-web.property.aspect_ratio.4:3": "4:3",
  "ly.img.plugin-ai-generation-web.property.aspect_ratio.3:2": "3:2",
  "ly.img.plugin-ai-generation-web.property.aspect_ratio.1:1": "1:1 (Square)",
  "ly.img.plugin-ai-generation-web.property.aspect_ratio.2:3": "2:3",
  "ly.img.plugin-ai-generation-web.property.aspect_ratio.3:4": "3:4",
  "ly.img.plugin-ai-generation-web.property.aspect_ratio.9:16": "9:16 (Vertical)",
  "ly.img.plugin-ai-generation-web.property.aspect_ratio.9:21": "9:21 (Ultra Tall)",
  "ly.img.plugin-ai-generation-web.property.duration.5": "5 seconds",
  "ly.img.plugin-ai-generation-web.property.duration.8": "8 seconds",
  "ly.img.plugin-ai-generation-web.property.duration.10": "10 seconds",
  "ly.img.plugin-ai-generation-web.property.duration.8s": "8 seconds",
  "ly.img.plugin-ai-generation-web.property.resolution.360p": "360p",
  "ly.img.plugin-ai-generation-web.property.resolution.540p": "540p",
  "ly.img.plugin-ai-generation-web.property.resolution.720p": "720p HD",
  "ly.img.plugin-ai-generation-web.property.resolution.1080p": "1080p Full HD",
  "ly.img.plugin-ai-generation-web.property.rendering_speed.TURBO": "Turbo",
  "ly.img.plugin-ai-generation-web.property.rendering_speed.BALANCED": "Balanced",
  "ly.img.plugin-ai-generation-web.property.rendering_speed.QUALITY": "Quality"
};

const imageTranslations = {
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.property.prompt": "Prompt",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.property.image_size": "Format",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.property.style": "Style",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.property.colors": "Colors",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.property.style.type": "Type",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.property.style.type.image": "Image",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.property.style.type.vector": "Vector",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.property.style.any": "Any",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.property.style.realistic_image": "Realistic Image",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.property.style.digital_illustration": "Digital Illustration",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.property.style.vector_illustration": "Vector Illustration",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.property.style.realistic_image/b_and_w": "Realistic - B&W",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.property.style.realistic_image/hard_flash": "Realistic - Hard Flash",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.property.style.realistic_image/hdr": "Realistic - HDR",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.property.style.realistic_image/natural_light": "Realistic - Natural Light",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.property.style.realistic_image/studio_portrait": "Realistic - Studio Portrait",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.property.style.realistic_image/enterprise": "Realistic - Enterprise",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.property.style.digital_illustration/pixel_art": "Digital - Pixel Art",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.property.style.digital_illustration/hand_drawn": "Digital - Hand Drawn",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.property.style.digital_illustration/grain": "Digital - Grain",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.property.style.vector_illustration/bold_stroke": "Vector - Bold Stroke",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.property.style.vector_illustration/line_art": "Vector - Line Art",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.property.style.vector_illustration/engraving": "Vector - Engraving",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft/v2/text-to-image.property.prompt": "Prompt",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft/v2/text-to-image.property.image_size": "Format",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft/v2/text-to-image.property.style": "Style",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft/v2/text-to-image.property.colors": "Colors",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft/v2/text-to-image.property.style.type": "Type",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft/v2/text-to-image.property.style.type.image": "Image",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft/v2/text-to-image.property.style.type.vector": "Vector",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft/v2/text-to-image.property.style.type.icon": "Icon",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft/v2/text-to-image.property.style.icon/broken_line": "Icon - Broken Line",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft/v2/text-to-image.property.style.icon/colored_outline": "Icon - Colored Outline",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft/v2/text-to-image.property.style.icon/colored_shapes": "Icon - Colored Shapes",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft/v2/text-to-image.property.style.icon/colored_shapes_gradient": "Icon - Colored Shapes Gradient",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft/v2/text-to-image.property.style.icon/doodle_fill": "Icon - Doodle Fill",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft/v2/text-to-image.property.style.icon/doodle_offset_fill": "Icon - Doodle Offset Fill",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft/v2/text-to-image.property.style.icon/offset_fill": "Icon - Offset Fill",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft/v2/text-to-image.property.style.icon/outline": "Icon - Outline",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft/v2/text-to-image.property.style.icon/outline_gradient": "Icon - Outline Gradient",
  "ly.img.plugin-ai-image-generation-web.fal-ai/recraft/v2/text-to-image.property.style.icon/uneven_fill": "Icon - Uneven Fill",
  "ly.img.plugin-ai-image-generation-web.fal-ai/ideogram/v3.property.prompt": "Prompt",
  "ly.img.plugin-ai-image-generation-web.fal-ai/ideogram/v3.property.style": "Style",
  "ly.img.plugin-ai-image-generation-web.fal-ai/ideogram/v3.property.image_size": "Format",
  "ly.img.plugin-ai-image-generation-web.fal-ai/ideogram/v3.property.rendering_speed": "Rendering Speed",
  "ly.img.plugin-ai-image-generation-web.fal-ai/ideogram/v3.property.expand_prompt": "Expand Prompt",
  "ly.img.plugin-ai-image-generation-web.fal-ai/ideogram/v3.property.seed": "Seed",
  "ly.img.plugin-ai-image-generation-web.fal-ai/ideogram/v3.property.style.AUTO": "Auto",
  "ly.img.plugin-ai-image-generation-web.fal-ai/ideogram/v3.property.style.GENERAL": "General",
  "ly.img.plugin-ai-image-generation-web.fal-ai/ideogram/v3.property.style.REALISTIC": "Realistic",
  "ly.img.plugin-ai-image-generation-web.fal-ai/ideogram/v3.property.style.DESIGN": "Design",
  "ly.img.plugin-ai-image-generation-web.fal-ai/ideogram/v3.property.rendering_speed.TURBO": "Turbo",
  "ly.img.plugin-ai-image-generation-web.fal-ai/ideogram/v3.property.rendering_speed.BALANCED": "Balanced",
  "ly.img.plugin-ai-image-generation-web.fal-ai/ideogram/v3.property.rendering_speed.QUALITY": "Quality",
  "ly.img.plugin-ai-image-generation-web.fal-ai/ideogram/v3/remix.property.prompt": "Prompt",
  "ly.img.plugin-ai-image-generation-web.fal-ai/ideogram/v3/remix.property.style": "Style",
  "ly.img.plugin-ai-image-generation-web.fal-ai/ideogram/v3/remix.property.image_size": "Format",
  "ly.img.plugin-ai-image-generation-web.fal-ai/flux-pro/kontext.property.prompt": "Prompt",
  "ly.img.plugin-ai-image-generation-web.fal-ai/flux-pro/kontext.property.aspect_ratio": "Aspect Ratio",
  "ly.img.plugin-ai-image-generation-web.fal-ai/flux-pro/kontext/max.property.prompt": "Prompt",
  "ly.img.plugin-ai-image-generation-web.fal-ai/flux-pro/kontext/max.property.aspect_ratio": "Aspect Ratio",
  "ly.img.plugin-ai-image-generation-web.fal-ai/gemini-flash-edit.property.prompt": "Prompt",
  "ly.img.plugin-ai-image-generation-web.fal-ai/gemini-flash-edit.property.image_url": "Source Image",
  "ly.img.plugin-ai-image-generation-web.open-ai/gpt-image-1/text2image.property.prompt": "Prompt",
  "ly.img.plugin-ai-image-generation-web.open-ai/gpt-image-1/text2image.property.style": "Style",
  "ly.img.plugin-ai-image-generation-web.open-ai/gpt-image-1/text2image.property.size": "Size",
  "ly.img.plugin-ai-image-generation-web.open-ai/gpt-image-1/text2image.property.background": "Background",
  "ly.img.plugin-ai-image-generation-web.open-ai/gpt-image-1/text2image.property.size.1024x1024": "1024×1024 (Square)",
  "ly.img.plugin-ai-image-generation-web.open-ai/gpt-image-1/text2image.property.size.1536x1024": "1536×1024 (Landscape)",
  "ly.img.plugin-ai-image-generation-web.open-ai/gpt-image-1/text2image.property.size.1024x1536": "1024×1536 (Portrait)",
  "ly.img.plugin-ai-image-generation-web.open-ai/gpt-image-1/image2image.property.prompt": "Prompt",
  "ly.img.plugin-ai-image-generation-web.open-ai/gpt-image-1/image2image.property.style": "Style",
  "ly.img.plugin-ai-image-generation-web.open-ai/gpt-image-1/image2image.property.size": "Size",
  "ly.img.plugin-ai-image-generation-web.open-ai/gpt-image-1/image2image.property.background": "Background",
  "ly.img.plugin-ai-image-generation-web.quickAction.editImage": "Edit Image",
  "ly.img.plugin-ai-image-generation-web.quickAction.editImage.prompt": "Describe your changes",
  "ly.img.plugin-ai-image-generation-web.quickAction.editImage.apply": "Apply Changes",
  "ly.img.plugin-ai-image-generation-web.quickAction.styleTransfer": "Style Transfer",
  "ly.img.plugin-ai-image-generation-web.quickAction.styleTransfer.prompt": "Choose a style",
  "ly.img.plugin-ai-image-generation-web.quickAction.styleTransfer.apply": "Apply Style",
  "ly.img.plugin-ai-image-generation-web.quickAction.artistTransfer": "Artist Style",
  "ly.img.plugin-ai-image-generation-web.quickAction.artistTransfer.prompt": "Choose an artist",
  "ly.img.plugin-ai-image-generation-web.quickAction.artistTransfer.apply": "Apply Artist Style",
  "ly.img.plugin-ai-image-generation-web.quickAction.createVariant": "Create Variant",
  "ly.img.plugin-ai-image-generation-web.quickAction.createVariant.prompt": "Describe the variation",
  "ly.img.plugin-ai-image-generation-web.quickAction.createVariant.apply": "Create Variant",
  "ly.img.plugin-ai-image-generation-web.quickAction.swapBackground": "Swap Background",
  "ly.img.plugin-ai-image-generation-web.quickAction.swapBackground.prompt": "Describe the new background",
  "ly.img.plugin-ai-image-generation-web.quickAction.swapBackground.apply": "Swap Background",
  "ly.img.plugin-ai-image-generation-web.quickAction.combineImages": "Combine Images",
  "ly.img.plugin-ai-image-generation-web.quickAction.combineImages.prompt": "How to combine the images",
  "ly.img.plugin-ai-image-generation-web.quickAction.combineImages.apply": "Combine",
  "ly.img.plugin-ai-image-generation-web.quickAction.remixPage": "Remix Page",
  "ly.img.plugin-ai-image-generation-web.quickAction.remixPage.prompt": "Describe the remix",
  "ly.img.plugin-ai-image-generation-web.quickAction.remixPage.apply": "Remix",
  "ly.img.plugin-ai-image-generation-web.quickAction.remixPageWithPrompt": "Remix Page with Prompt",
  "ly.img.plugin-ai-image-generation-web.quickAction.remixPageWithPrompt.prompt": "Custom remix instructions",
  "ly.img.plugin-ai-image-generation-web.quickAction.remixPageWithPrompt.apply": "Remix",
  "ly.img.plugin-ai-image-generation-web.quickAction.gpt-image-1.changeStyleLibrary": "Change Style",
  "ly.img.plugin-ai-image-generation-web.quickAction.gpt-image-1.changeStyleLibrary.prompt": "Choose a style",
  "ly.img.plugin-ai-image-generation-web.quickAction.gpt-image-1.changeStyleLibrary.apply": "Apply Style"
};

const textTranslations = {
  "ly.img.plugin-ai-text-generation-web.anthropic.property.prompt": "Prompt",
  "ly.img.plugin-ai-text-generation-web.anthropic.property.temperature": "Claude Creativity Level",
  "ly.img.plugin-ai-text-generation-web.anthropic.property.maxTokens": "Claude Response Length",
  "ly.img.plugin-ai-text-generation-web.anthropic.property.blockId": "Text Block ID",
  "ly.img.plugin-ai-text-generation-web.anthropic.property.initialText": "Original Text",
  "ly.img.plugin-ai-text-generation-web.openai.property.prompt": "Prompt",
  "ly.img.plugin-ai-text-generation-web.openai.property.temperature": "GPT Creativity Level",
  "ly.img.plugin-ai-text-generation-web.openai.property.maxTokens": "GPT Response Length",
  "ly.img.plugin-ai-text-generation-web.openai.property.blockId": "Text Block ID",
  "ly.img.plugin-ai-text-generation-web.openai.property.initialText": "Original Text",
  "ly.img.plugin-ai-text-generation-web.quickAction.improve": "Improve Text",
  "ly.img.plugin-ai-text-generation-web.quickAction.improve.prompt": "Text to improve",
  "ly.img.plugin-ai-text-generation-web.quickAction.improve.apply": "Improve",
  "ly.img.plugin-ai-text-generation-web.quickAction.fix": "Fix Grammar & Spelling",
  "ly.img.plugin-ai-text-generation-web.quickAction.fix.prompt": "Text to fix",
  "ly.img.plugin-ai-text-generation-web.quickAction.fix.apply": "Fix",
  "ly.img.plugin-ai-text-generation-web.quickAction.shorter": "Make Shorter",
  "ly.img.plugin-ai-text-generation-web.quickAction.shorter.prompt": "Text to shorten",
  "ly.img.plugin-ai-text-generation-web.quickAction.shorter.apply": "Shorten",
  "ly.img.plugin-ai-text-generation-web.quickAction.longer": "Make Longer",
  "ly.img.plugin-ai-text-generation-web.quickAction.longer.prompt": "Text to expand",
  "ly.img.plugin-ai-text-generation-web.quickAction.longer.apply": "Expand",
  "ly.img.plugin-ai-text-generation-web.quickAction.changeTone": "Change Tone",
  "ly.img.plugin-ai-text-generation-web.quickAction.changeTone.prompt": "Text to change",
  "ly.img.plugin-ai-text-generation-web.quickAction.changeTone.apply": "Change Tone",
  "ly.img.plugin-ai-text-generation-web.quickAction.translate": "Translate",
  "ly.img.plugin-ai-text-generation-web.quickAction.translate.prompt": "Text to translate",
  "ly.img.plugin-ai-text-generation-web.quickAction.translate.apply": "Translate",
  "ly.img.plugin-ai-text-generation-web.quickAction.changeTextTo": "Change Text To...",
  "ly.img.plugin-ai-text-generation-web.quickAction.changeTextTo.prompt": "Custom transformation",
  "ly.img.plugin-ai-text-generation-web.quickAction.changeTextTo.apply": "Transform"
};

const videoTranslations = {
  "ly.img.plugin-ai-video-generation-web.fal-ai/minimax/video-01-live.property.prompt": "Prompt",
  "ly.img.plugin-ai-video-generation-web.fal-ai/minimax/video-01-live.property.prompt_optimizer": "Use Prompt Optimizer",
  "ly.img.plugin-ai-video-generation-web.fal-ai/minimax/video-01-live/image-to-video.property.prompt": "Prompt",
  "ly.img.plugin-ai-video-generation-web.fal-ai/minimax/video-01-live/image-to-video.property.prompt_optimizer": "Use Prompt Optimizer",
  "ly.img.plugin-ai-video-generation-web.fal-ai/kling-video/v2.1/master/text-to-video.property.prompt": "Prompt",
  "ly.img.plugin-ai-video-generation-web.fal-ai/kling-video/v2.1/master/text-to-video.property.duration": "Duration",
  "ly.img.plugin-ai-video-generation-web.fal-ai/kling-video/v2.1/master/text-to-video.property.aspect_ratio": "Aspect Ratio",
  "ly.img.plugin-ai-video-generation-web.fal-ai/kling-video/v2.1/master/text-to-video.property.negative_prompt": "Negative Prompt",
  "ly.img.plugin-ai-video-generation-web.fal-ai/kling-video/v2.1/master/text-to-video.property.cfg_scale": "CFG Scale",
  "ly.img.plugin-ai-video-generation-web.fal-ai/kling-video/v2.1/master/text-to-video.property.duration.5": "5 seconds",
  "ly.img.plugin-ai-video-generation-web.fal-ai/kling-video/v2.1/master/text-to-video.property.duration.10": "10 seconds",
  "ly.img.plugin-ai-video-generation-web.fal-ai/kling-video/v2.1/master/text-to-video.property.aspect_ratio.16:9": "16:9 (Widescreen)",
  "ly.img.plugin-ai-video-generation-web.fal-ai/kling-video/v2.1/master/text-to-video.property.aspect_ratio.9:16": "9:16 (Vertical)",
  "ly.img.plugin-ai-video-generation-web.fal-ai/kling-video/v2.1/master/text-to-video.property.aspect_ratio.1:1": "1:1 (Square)",
  "ly.img.plugin-ai-video-generation-web.fal-ai/kling-video/v2.1/master/image-to-video.property.prompt": "Prompt",
  "ly.img.plugin-ai-video-generation-web.fal-ai/kling-video/v2.1/master/image-to-video.property.duration": "Duration",
  "ly.img.plugin-ai-video-generation-web.fal-ai/kling-video/v2.1/master/image-to-video.property.negative_prompt": "Negative Prompt",
  "ly.img.plugin-ai-video-generation-web.fal-ai/kling-video/v2.1/master/image-to-video.property.cfg_scale": "CFG Scale",
  "ly.img.plugin-ai-video-generation-web.fal-ai/pixverse/v3.5/text-to-video.property.prompt": "Prompt",
  "ly.img.plugin-ai-video-generation-web.fal-ai/pixverse/v3.5/text-to-video.property.aspect_ratio": "Aspect Ratio",
  "ly.img.plugin-ai-video-generation-web.fal-ai/pixverse/v3.5/text-to-video.property.resolution": "Resolution",
  "ly.img.plugin-ai-video-generation-web.fal-ai/pixverse/v3.5/text-to-video.property.style": "Style",
  "ly.img.plugin-ai-video-generation-web.fal-ai/pixverse/v3.5/text-to-video.property.duration": "Duration",
  "ly.img.plugin-ai-video-generation-web.fal-ai/pixverse/v3.5/text-to-video.property.seed": "Seed",
  "ly.img.plugin-ai-video-generation-web.fal-ai/pixverse/v3.5/text-to-video.property.negative_prompt": "Negative Prompt",
  "ly.img.plugin-ai-video-generation-web.fal-ai/pixverse/v3.5/text-to-video.property.style.anime": "Anime",
  "ly.img.plugin-ai-video-generation-web.fal-ai/pixverse/v3.5/text-to-video.property.style.3d_animation": "3D Animation",
  "ly.img.plugin-ai-video-generation-web.fal-ai/pixverse/v3.5/text-to-video.property.style.clay": "Clay",
  "ly.img.plugin-ai-video-generation-web.fal-ai/pixverse/v3.5/text-to-video.property.style.comic": "Comic",
  "ly.img.plugin-ai-video-generation-web.fal-ai/pixverse/v3.5/text-to-video.property.style.cyberpunk": "Cyberpunk",
  "ly.img.plugin-ai-video-generation-web.fal-ai/pixverse/v3.5/text-to-video.property.duration.5": "5 seconds",
  "ly.img.plugin-ai-video-generation-web.fal-ai/pixverse/v3.5/text-to-video.property.duration.8": "8 seconds",
  "ly.img.plugin-ai-video-generation-web.fal-ai/veo3.property.prompt": "Prompt",
  "ly.img.plugin-ai-video-generation-web.fal-ai/veo3.property.aspect_ratio": "Aspect Ratio",
  "ly.img.plugin-ai-video-generation-web.fal-ai/veo3.property.duration": "Duration",
  "ly.img.plugin-ai-video-generation-web.fal-ai/veo3.property.generate_audio": "Generate Audio",
  "ly.img.plugin-ai-video-generation-web.fal-ai/veo3.property.duration.8s": "8 seconds",
  "ly.img.plugin-ai-video-generation-web.quickAction.createVideo": "Create Video",
  "ly.img.plugin-ai-video-generation-web.quickAction.createVideo.prompt": "Video description",
  "ly.img.plugin-ai-video-generation-web.quickAction.createVideo.apply": "Generate Video"
};

const audioTranslations = {
  "ly.img.plugin-ai-audio-generation-web.elevenlabs/monolingual/v1.property.prompt": "Prompt",
  "ly.img.plugin-ai-audio-generation-web.elevenlabs/monolingual/v1.property.voice_id": "Voice",
  "ly.img.plugin-ai-audio-generation-web.elevenlabs/monolingual/v1.property.speed": "Speech Speed",
  "ly.img.plugin-ai-audio-generation-web.elevenlabs/sound-generation.property.text": "Sound description",
  "ly.img.plugin-ai-audio-generation-web.elevenlabs/sound-generation.property.duration_seconds": "Duration (seconds)"
};

/**
 * Test all translation keys by setting them with prefixes:
 * - & for generic/base translations
 * - @ for provider-specific translations
 */
export function testAllTranslations(cesdk: CreativeEditorSDK) {
  const allTranslations: Record<string, string> = {};

  // Process base translations (generic) with & prefix
  Object.entries(baseTranslations).forEach(([key, value]) => {
    allTranslations[key] = `&${value}`;
  });

  // Process image generation translations (provider-specific) with @ prefix
  Object.entries(imageTranslations).forEach(([key, value]) => {
    // Check if it's a provider-specific translation
    if (key.includes('.fal-ai/') || key.includes('.open-ai/') || key.includes('quickAction')) {
      allTranslations[key] = `@${value}`;
    } else {
      // Generic property that might be redefined
      allTranslations[key] = `&${value}`;
    }
  });

  // Process video generation translations (provider-specific) with @ prefix
  Object.entries(videoTranslations).forEach(([key, value]) => {
    if (key.includes('.fal-ai/') || key.includes('quickAction')) {
      allTranslations[key] = `@${value}`;
    } else {
      allTranslations[key] = `&${value}`;
    }
  });

  // Process audio generation translations (provider-specific) with @ prefix
  Object.entries(audioTranslations).forEach(([key, value]) => {
    if (key.includes('.elevenlabs/')) {
      allTranslations[key] = `@${value}`;
    } else {
      allTranslations[key] = `&${value}`;
    }
  });

  // Process text generation translations (provider-specific) with @ prefix
  Object.entries(textTranslations).forEach(([key, value]) => {
    if (key.includes('.anthropic.') || key.includes('.openai.') || key.includes('quickAction')) {
      allTranslations[key] = `@${value}`;
    } else {
      allTranslations[key] = `&${value}`;
    }
  });

  // Set all translations at once
  cesdk.setTranslations({
    en: allTranslations
  });

  // Log summary for debugging
  const genericCount = Object.values(allTranslations).filter(v => v.startsWith('&')).length;
  const providerCount = Object.values(allTranslations).filter(v => v.startsWith('@')).length;
  
  console.log('🔧 Translation Test Applied:');
  console.log(`📋 Total translations: ${Object.keys(allTranslations).length}`);
  console.log(`🔄 Generic translations (& prefix): ${genericCount}`);
  console.log(`🎯 Provider-specific translations (@ prefix): ${providerCount}`);
  console.log('💡 Look for & and @ prefixes in the UI to verify translation loading');

  return allTranslations;
}

/**
 * Reset translations to original values (remove prefixes)
 */
export function resetTranslations(cesdk: CreativeEditorSDK) {
  const allTranslations: Record<string, string> = {};

  // Merge all original translations without prefixes
  Object.assign(allTranslations, baseTranslations);
  Object.assign(allTranslations, imageTranslations);
  Object.assign(allTranslations, videoTranslations);
  Object.assign(allTranslations, audioTranslations);
  Object.assign(allTranslations, textTranslations);

  cesdk.setTranslations({
    en: allTranslations
  });

  console.log('✅ Translations reset to original values');
}