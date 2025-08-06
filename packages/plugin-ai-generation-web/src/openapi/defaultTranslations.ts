/**
 * Default translations for AI generation properties and enum values.
 * These are automatically applied as fallback translations for all AI providers.
 *
 * Structure:
 * - Property translations: `ly.img.ai.defaults.property.${property.id}`
 * - Enum value translations: `ly.img.ai.defaults.property.${property.id}.${enumValue}`
 *
 * Based on actual OpenAPI Input schemas from all AI provider packages.
 */
export const defaultTranslations: Record<string, string> = {
  // Core generation properties (found in all Input schemas)
  'ly.img.ai.defaults.property.prompt': 'Prompt',
  'ly.img.ai.defaults.property.style': 'Style',
  'ly.img.ai.defaults.property.seed': 'Seed',

  // Image-specific properties
  'ly.img.ai.defaults.property.image_size': 'Format',
  'ly.img.ai.defaults.property.size': 'Format', // OpenAI specific
  'ly.img.ai.defaults.property.image_url': 'Image URL',
  'ly.img.ai.defaults.property.colors': 'Colors',
  'ly.img.ai.defaults.property.num_images': 'Num Images',
  'ly.img.ai.defaults.property.output_format': 'Output Format',
  'ly.img.ai.defaults.property.background': 'Background',

  // Generation control properties
  'ly.img.ai.defaults.property.guidance_scale': 'Guidance Scale (CFG)',
  'ly.img.ai.defaults.property.cfg_scale': 'CFG Scale',
  'ly.img.ai.defaults.property.strength': 'Strength',
  'ly.img.ai.defaults.property.safety_tolerance': 'Safety Tolerance',
  'ly.img.ai.defaults.property.sync_mode': 'Sync Mode',
  'ly.img.ai.defaults.property.rendering_speed': 'Rendering Speed',
  'ly.img.ai.defaults.property.expand_prompt': 'Expand Prompt',
  'ly.img.ai.defaults.property.prompt_optimizer': 'Prompt Optimizer',
  'ly.img.ai.defaults.property.negative_prompt': 'Negative Prompt',

  // Dimension properties (from nested ImageSize object)
  'ly.img.ai.defaults.property.width': 'Width',
  'ly.img.ai.defaults.property.height': 'Height',
  'ly.img.ai.defaults.property.aspect_ratio': 'Aspect Ratio',

  // Video-specific properties
  'ly.img.ai.defaults.property.duration': 'Duration',
  'ly.img.ai.defaults.property.resolution': 'Resolution',
  'ly.img.ai.defaults.property.generate_audio': 'Generate Audio',

  // Audio-specific properties
  'ly.img.ai.defaults.property.voice_id': 'Voice',
  'ly.img.ai.defaults.property.speed': 'Speed',
  'ly.img.ai.defaults.property.text': 'Prompt', // ElevenLabs specific
  'ly.img.ai.defaults.property.duration_seconds': 'Duration (sec.)',

  // Enum value translations - image_size/format
  'ly.img.ai.defaults.property.image_size.square_hd': 'Square HD',
  'ly.img.ai.defaults.property.image_size.square': 'Square',
  'ly.img.ai.defaults.property.image_size.portrait_4_3': 'Portrait 4:3',
  'ly.img.ai.defaults.property.image_size.portrait_16_9': 'Portrait 16:9',
  'ly.img.ai.defaults.property.image_size.landscape_4_3': 'Landscape 4:3',
  'ly.img.ai.defaults.property.image_size.landscape_16_9': 'Landscape 16:9',

  // Enum value translations - OpenAI size
  'ly.img.ai.defaults.property.size.1024x1024': 'Square',
  'ly.img.ai.defaults.property.size.1536x1024': 'Landscape',
  'ly.img.ai.defaults.property.size.1024x1536': 'Portrait',

  // Enum value translations - background
  'ly.img.ai.defaults.property.background.auto': 'Auto',
  'ly.img.ai.defaults.property.background.transparent': 'Transparent',
  'ly.img.ai.defaults.property.background.opaque': 'Opaque',

  // Enum value translations - output_format
  'ly.img.ai.defaults.property.output_format.jpeg': 'JPEG',
  'ly.img.ai.defaults.property.output_format.png': 'PNG',

  // Enum value translations - rendering_speed
  'ly.img.ai.defaults.property.rendering_speed.TURBO': 'Turbo',
  'ly.img.ai.defaults.property.rendering_speed.BALANCED': 'Balanced',
  'ly.img.ai.defaults.property.rendering_speed.QUALITY': 'Quality',

  // Enum value translations - common styles
  'ly.img.ai.defaults.property.style.any': 'Any',
  'ly.img.ai.defaults.property.style.realistic_image': 'Realistic Image',
  'ly.img.ai.defaults.property.style.digital_illustration':
    'Digital Illustration',
  'ly.img.ai.defaults.property.style.vector_illustration':
    'Vector Illustration',
  'ly.img.ai.defaults.property.style.anime': 'Anime',
  'ly.img.ai.defaults.property.style.3d_animation': '3D Animation',
  'ly.img.ai.defaults.property.style.clay': 'Clay',
  'ly.img.ai.defaults.property.style.comic': 'Comic',
  'ly.img.ai.defaults.property.style.cyberpunk': 'Cyberpunk',
  'ly.img.ai.defaults.property.style.AUTO': 'Auto',
  'ly.img.ai.defaults.property.style.GENERAL': 'General',
  'ly.img.ai.defaults.property.style.REALISTIC': 'Realistic',
  'ly.img.ai.defaults.property.style.DESIGN': 'Design',

  // Enum value translations - common aspect ratios
  'ly.img.ai.defaults.property.aspect_ratio.16:9': '16:9',
  'ly.img.ai.defaults.property.aspect_ratio.9:16': '9:16',
  'ly.img.ai.defaults.property.aspect_ratio.1:1': '1:1',
  'ly.img.ai.defaults.property.aspect_ratio.4:3': '4:3',
  'ly.img.ai.defaults.property.aspect_ratio.3:4': '3:4',
  'ly.img.ai.defaults.property.aspect_ratio.21:9': '21:9',
  'ly.img.ai.defaults.property.aspect_ratio.9:21': '9:21',
  'ly.img.ai.defaults.property.aspect_ratio.3:2': '3:2',
  'ly.img.ai.defaults.property.aspect_ratio.2:3': '2:3',

  // Enum value translations - video resolution
  'ly.img.ai.defaults.property.resolution.360p': '360p',
  'ly.img.ai.defaults.property.resolution.540p': '540p',
  'ly.img.ai.defaults.property.resolution.720p': '720p',
  'ly.img.ai.defaults.property.resolution.1080p': '1080p',

  // Enum value translations - duration (common values)
  'ly.img.ai.defaults.property.duration.5': '5 seconds',
  'ly.img.ai.defaults.property.duration.8': '8 seconds',
  'ly.img.ai.defaults.property.duration.10': '10 seconds',
  'ly.img.ai.defaults.property.duration.8s': '8 seconds',

  // Enum value translations - safety tolerance
  'ly.img.ai.defaults.property.safety_tolerance.1': 'Level 1',
  'ly.img.ai.defaults.property.safety_tolerance.2': 'Level 2',
  'ly.img.ai.defaults.property.safety_tolerance.3': 'Level 3',
  'ly.img.ai.defaults.property.safety_tolerance.4': 'Level 4',
  'ly.img.ai.defaults.property.safety_tolerance.5': 'Level 5',
  'ly.img.ai.defaults.property.safety_tolerance.6': 'Level 6'
};
