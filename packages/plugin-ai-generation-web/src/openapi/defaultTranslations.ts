/**
 * Default translations for AI generation properties and enum values.
 * These are automatically applied as fallback translations for all AI providers.
 *
 * Structure:
 * - Property translations: `ly.img.plugin-ai-generation-web.defaults.property.${property.id}`
 * - Enum value translations: `ly.img.plugin-ai-generation-web.defaults.property.${property.id}.${enumValue}`
 *
 * Based on actual OpenAPI Input schemas from all AI provider packages.
 */
export const defaultTranslations: Record<string, string> = {
  // Core generation properties (found in all Input schemas)
  'ly.img.plugin-ai-generation-web.defaults.property.prompt': 'Prompt',
  'ly.img.plugin-ai-generation-web.defaults.property.style': 'Style',
  'ly.img.plugin-ai-generation-web.defaults.property.seed': 'Seed',

  // Image-specific properties
  'ly.img.plugin-ai-generation-web.defaults.property.image_size': 'Format',
  'ly.img.plugin-ai-generation-web.defaults.property.size': 'Format', // OpenAI specific
  'ly.img.plugin-ai-generation-web.defaults.property.image_url': 'Image URL',
  'ly.img.plugin-ai-generation-web.defaults.property.colors': 'Colors',
  'ly.img.plugin-ai-generation-web.defaults.property.num_images': 'Num Images',
  'ly.img.plugin-ai-generation-web.defaults.property.output_format':
    'Output Format',
  'ly.img.plugin-ai-generation-web.defaults.property.background': 'Background',

  // Generation control properties
  'ly.img.plugin-ai-generation-web.defaults.property.guidance_scale':
    'Guidance Scale (CFG)',
  'ly.img.plugin-ai-generation-web.defaults.property.cfg_scale': 'CFG Scale',
  'ly.img.plugin-ai-generation-web.defaults.property.strength': 'Strength',
  'ly.img.plugin-ai-generation-web.defaults.property.safety_tolerance':
    'Safety Tolerance',
  'ly.img.plugin-ai-generation-web.defaults.property.sync_mode': 'Sync Mode',
  'ly.img.plugin-ai-generation-web.defaults.property.rendering_speed':
    'Rendering Speed',
  'ly.img.plugin-ai-generation-web.defaults.property.expand_prompt':
    'Expand Prompt',
  'ly.img.plugin-ai-generation-web.defaults.property.prompt_optimizer':
    'Prompt Optimizer',
  'ly.img.plugin-ai-generation-web.defaults.property.negative_prompt':
    'Negative Prompt',

  // Dimension properties (from nested ImageSize object)
  'ly.img.plugin-ai-generation-web.defaults.property.width': 'Width',
  'ly.img.plugin-ai-generation-web.defaults.property.height': 'Height',
  'ly.img.plugin-ai-generation-web.defaults.property.aspect_ratio':
    'Aspect Ratio',

  // Video-specific properties
  'ly.img.plugin-ai-generation-web.defaults.property.duration': 'Duration',
  'ly.img.plugin-ai-generation-web.defaults.property.resolution': 'Resolution',
  'ly.img.plugin-ai-generation-web.defaults.property.generate_audio':
    'Generate Audio',

  // Audio-specific properties
  'ly.img.plugin-ai-generation-web.defaults.property.voice_id': 'Voice',
  'ly.img.plugin-ai-generation-web.defaults.property.speed': 'Speed',
  'ly.img.plugin-ai-generation-web.defaults.property.text': 'Prompt', // ElevenLabs specific
  'ly.img.plugin-ai-generation-web.defaults.property.duration_seconds':
    'Duration (sec.)',

  // Enum value translations - image_size/format
  'ly.img.plugin-ai-generation-web.defaults.property.image_size.square_hd':
    'Square HD',
  'ly.img.plugin-ai-generation-web.defaults.property.image_size.square':
    'Square',
  'ly.img.plugin-ai-generation-web.defaults.property.image_size.portrait_4_3':
    'Portrait 4:3',
  'ly.img.plugin-ai-generation-web.defaults.property.image_size.portrait_16_9':
    'Portrait 16:9',
  'ly.img.plugin-ai-generation-web.defaults.property.image_size.landscape_4_3':
    'Landscape 4:3',
  'ly.img.plugin-ai-generation-web.defaults.property.image_size.landscape_16_9':
    'Landscape 16:9',

  // Enum value translations - OpenAI size
  'ly.img.plugin-ai-generation-web.defaults.property.size.1024x1024': 'Square',
  'ly.img.plugin-ai-generation-web.defaults.property.size.1536x1024':
    'Landscape',
  'ly.img.plugin-ai-generation-web.defaults.property.size.1024x1536':
    'Portrait',

  // Enum value translations - background
  'ly.img.plugin-ai-generation-web.defaults.property.background.auto': 'Auto',
  'ly.img.plugin-ai-generation-web.defaults.property.background.transparent':
    'Transparent',
  'ly.img.plugin-ai-generation-web.defaults.property.background.opaque':
    'Opaque',

  // Enum value translations - output_format
  'ly.img.plugin-ai-generation-web.defaults.property.output_format.jpeg':
    'JPEG',
  'ly.img.plugin-ai-generation-web.defaults.property.output_format.png': 'PNG',

  // Enum value translations - rendering_speed
  'ly.img.plugin-ai-generation-web.defaults.property.rendering_speed.TURBO':
    'Turbo',
  'ly.img.plugin-ai-generation-web.defaults.property.rendering_speed.BALANCED':
    'Balanced',
  'ly.img.plugin-ai-generation-web.defaults.property.rendering_speed.QUALITY':
    'Quality',

  // Enum value translations - common styles
  'ly.img.plugin-ai-generation-web.defaults.property.style.any': 'Any',
  'ly.img.plugin-ai-generation-web.defaults.property.style.realistic_image':
    'Realistic Image',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration':
    'Digital Illustration',
  'ly.img.plugin-ai-generation-web.defaults.property.style.vector_illustration':
    'Vector Illustration',
  'ly.img.plugin-ai-generation-web.defaults.property.style.anime': 'Anime',
  'ly.img.plugin-ai-generation-web.defaults.property.style.3d_animation':
    '3D Animation',
  'ly.img.plugin-ai-generation-web.defaults.property.style.clay': 'Clay',
  'ly.img.plugin-ai-generation-web.defaults.property.style.comic': 'Comic',
  'ly.img.plugin-ai-generation-web.defaults.property.style.cyberpunk':
    'Cyberpunk',
  'ly.img.plugin-ai-generation-web.defaults.property.style.AUTO': 'Auto',
  'ly.img.plugin-ai-generation-web.defaults.property.style.GENERAL': 'General',
  'ly.img.plugin-ai-generation-web.defaults.property.style.REALISTIC':
    'Realistic',
  'ly.img.plugin-ai-generation-web.defaults.property.style.DESIGN': 'Design',

  // Enum value translations - common aspect ratios
  'ly.img.plugin-ai-generation-web.defaults.property.aspect_ratio.16:9': '16:9',
  'ly.img.plugin-ai-generation-web.defaults.property.aspect_ratio.9:16': '9:16',
  'ly.img.plugin-ai-generation-web.defaults.property.aspect_ratio.1:1': '1:1',
  'ly.img.plugin-ai-generation-web.defaults.property.aspect_ratio.4:3': '4:3',
  'ly.img.plugin-ai-generation-web.defaults.property.aspect_ratio.3:4': '3:4',
  'ly.img.plugin-ai-generation-web.defaults.property.aspect_ratio.21:9': '21:9',
  'ly.img.plugin-ai-generation-web.defaults.property.aspect_ratio.9:21': '9:21',
  'ly.img.plugin-ai-generation-web.defaults.property.aspect_ratio.3:2': '3:2',
  'ly.img.plugin-ai-generation-web.defaults.property.aspect_ratio.2:3': '2:3',

  // Enum value translations - video resolution
  'ly.img.plugin-ai-generation-web.defaults.property.resolution.360p': '360p',
  'ly.img.plugin-ai-generation-web.defaults.property.resolution.540p': '540p',
  'ly.img.plugin-ai-generation-web.defaults.property.resolution.720p': '720p',
  'ly.img.plugin-ai-generation-web.defaults.property.resolution.1080p': '1080p',

  // Enum value translations - duration (common values)
  'ly.img.plugin-ai-generation-web.defaults.property.duration.5': '5 seconds',
  'ly.img.plugin-ai-generation-web.defaults.property.duration.8': '8 seconds',
  'ly.img.plugin-ai-generation-web.defaults.property.duration.10': '10 seconds',
  'ly.img.plugin-ai-generation-web.defaults.property.duration.8s': '8 seconds',

  // Enum value translations - safety tolerance
  'ly.img.plugin-ai-generation-web.defaults.property.safety_tolerance.1':
    'Level 1',
  'ly.img.plugin-ai-generation-web.defaults.property.safety_tolerance.2':
    'Level 2',
  'ly.img.plugin-ai-generation-web.defaults.property.safety_tolerance.3':
    'Level 3',
  'ly.img.plugin-ai-generation-web.defaults.property.safety_tolerance.4':
    'Level 4',
  'ly.img.plugin-ai-generation-web.defaults.property.safety_tolerance.5':
    'Level 5',
  'ly.img.plugin-ai-generation-web.defaults.property.safety_tolerance.6':
    'Level 6'
};
