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

  // Common properties
  'ly.img.plugin-ai-generation-web.defaults.property.image_size': 'Image Size',
  'ly.img.plugin-ai-generation-web.defaults.property.size': 'Image Size',
  'ly.img.plugin-ai-generation-web.defaults.property.colors': 'Colors',
  'ly.img.plugin-ai-generation-web.defaults.property.background': 'Background',

  // Common dimension properties
  'ly.img.plugin-ai-generation-web.defaults.property.width': 'Width',
  'ly.img.plugin-ai-generation-web.defaults.property.height': 'Height',
  'ly.img.plugin-ai-generation-web.defaults.property.aspect_ratio':
    'Aspect Ratio',

  // Common temporal properties
  'ly.img.plugin-ai-generation-web.defaults.property.duration': 'Duration',
  'ly.img.plugin-ai-generation-web.defaults.property.resolution': 'Resolution',
  'ly.img.plugin-ai-generation-web.defaults.property.generate_audio':
    'Generate Audio',

  // Common audio properties
  'ly.img.plugin-ai-generation-web.defaults.property.voice_id': 'Voice',
  'ly.img.plugin-ai-generation-web.defaults.property.speed': 'Speed',
  'ly.img.plugin-ai-generation-web.defaults.property.text': 'Text',
  'ly.img.plugin-ai-generation-web.defaults.property.duration_seconds':
    'Duration (seconds)',

  // Custom renderer translations for Recraft providers
  'ly.img.plugin-ai-generation-web.defaults.property.style.type': 'Type',
  'ly.img.plugin-ai-generation-web.defaults.property.style.type.image': 'Image',
  'ly.img.plugin-ai-generation-web.defaults.property.style.type.vector':
    'Vector',
  'ly.img.plugin-ai-generation-web.defaults.property.style.type.icon': 'Icon',

  // Enum value translations - common formats
  'ly.img.plugin-ai-generation-web.defaults.property.image_size.square':
    'Square',
  'ly.img.plugin-ai-generation-web.defaults.property.image_size.portrait':
    'Portrait',
  'ly.img.plugin-ai-generation-web.defaults.property.image_size.landscape':
    'Landscape',

  // Enum value translations - background
  'ly.img.plugin-ai-generation-web.defaults.property.background.auto': 'Auto',
  'ly.img.plugin-ai-generation-web.defaults.property.background.transparent':
    'Transparent',

  // Enum value translations - common aspect ratios
  'ly.img.plugin-ai-generation-web.defaults.property.aspect_ratio.1:1':
    '1:1 (Square)',
  'ly.img.plugin-ai-generation-web.defaults.property.aspect_ratio.16:9':
    '16:9 (Widescreen)',
  'ly.img.plugin-ai-generation-web.defaults.property.aspect_ratio.9:16':
    '9:16 (Vertical)',
  'ly.img.plugin-ai-generation-web.defaults.property.aspect_ratio.4:3': '4:3',
  'ly.img.plugin-ai-generation-web.defaults.property.aspect_ratio.3:4': '3:4',

  // Enum value translations - common resolutions
  'ly.img.plugin-ai-generation-web.defaults.property.resolution.720p':
    '720p HD',
  'ly.img.plugin-ai-generation-web.defaults.property.resolution.1080p':
    '1080p Full HD'
};
