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
    '1080p Full HD',

  // Recraft V3 Image Styles
  'ly.img.plugin-ai-generation-web.defaults.property.style.realistic_image': 'Realistic Image',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration': 'Digital Illustration',
  'ly.img.plugin-ai-generation-web.defaults.property.style.realistic_image/b_and_w': 'Black & White',
  'ly.img.plugin-ai-generation-web.defaults.property.style.realistic_image/hard_flash': 'Hard Flash',
  'ly.img.plugin-ai-generation-web.defaults.property.style.realistic_image/hdr': 'HDR',
  'ly.img.plugin-ai-generation-web.defaults.property.style.realistic_image/natural_light': 'Natural Light',
  'ly.img.plugin-ai-generation-web.defaults.property.style.realistic_image/studio_portrait': 'Studio Portrait',
  'ly.img.plugin-ai-generation-web.defaults.property.style.realistic_image/enterprise': 'Enterprise',
  'ly.img.plugin-ai-generation-web.defaults.property.style.realistic_image/motion_blur': 'Motion Blur',
  'ly.img.plugin-ai-generation-web.defaults.property.style.realistic_image/evening_light': 'Evening Light',
  'ly.img.plugin-ai-generation-web.defaults.property.style.realistic_image/faded_nostalgia': 'Faded Nostalgia',
  'ly.img.plugin-ai-generation-web.defaults.property.style.realistic_image/forest_life': 'Forest Life',
  'ly.img.plugin-ai-generation-web.defaults.property.style.realistic_image/mystic_naturalism': 'Mystic Naturalism',
  'ly.img.plugin-ai-generation-web.defaults.property.style.realistic_image/natural_tones': 'Natural Tones',
  'ly.img.plugin-ai-generation-web.defaults.property.style.realistic_image/organic_calm': 'Organic Calm',
  'ly.img.plugin-ai-generation-web.defaults.property.style.realistic_image/real_life_glow': 'Real Life Glow',
  'ly.img.plugin-ai-generation-web.defaults.property.style.realistic_image/retro_realism': 'Retro Realism',
  'ly.img.plugin-ai-generation-web.defaults.property.style.realistic_image/retro_snapshot': 'Retro Snapshot',
  'ly.img.plugin-ai-generation-web.defaults.property.style.realistic_image/urban_drama': 'Urban Drama',
  'ly.img.plugin-ai-generation-web.defaults.property.style.realistic_image/village_realism': 'Village Realism',
  'ly.img.plugin-ai-generation-web.defaults.property.style.realistic_image/warm_folk': 'Warm Folk',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration/pixel_art': 'Pixel Art',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration/hand_drawn': 'Hand Drawn',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration/grain': 'Grain',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration/infantile_sketch': 'Infantile Sketch',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration/2d_art_poster': '2D Art Poster',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration/handmade_3d': 'Handmade 3D',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration/hand_drawn_outline': 'Hand Drawn Outline',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration/engraving_color': 'Engraving Color',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration/2d_art_poster_2': '2D Art Poster 2',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration/antiquarian': 'Antiquarian',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration/bold_fantasy': 'Bold Fantasy',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration/child_book': 'Child Book',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration/child_books': 'Child Books',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration/cover': 'Cover',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration/crosshatch': 'Crosshatch',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration/digital_engraving': 'Digital Engraving',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration/expressionism': 'Expressionism',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration/freehand_details': 'Freehand Details',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration/grain_20': 'Grain 20',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration/graphic_intensity': 'Graphic Intensity',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration/hard_comics': 'Hard Comics',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration/long_shadow': 'Long Shadow',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration/modern_folk': 'Modern Folk',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration/multicolor': 'Multicolor',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration/neon_calm': 'Neon Calm',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration/noir': 'Noir',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration/nostalgic_pastel': 'Nostalgic Pastel',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration/outline_details': 'Outline Details',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration/pastel_gradient': 'Pastel Gradient',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration/pastel_sketch': 'Pastel Sketch',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration/pop_art': 'Pop Art',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration/pop_renaissance': 'Pop Renaissance',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration/street_art': 'Street Art',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration/tablet_sketch': 'Tablet Sketch',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration/urban_glow': 'Urban Glow',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration/urban_sketching': 'Urban Sketching',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration/vanilla_dreams': 'Vanilla Dreams',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration/young_adult_book': 'Young Adult Book',
  'ly.img.plugin-ai-generation-web.defaults.property.style.digital_illustration/young_adult_book_2': 'Young Adult Book 2',

  // Recraft V3 Vector Styles
  'ly.img.plugin-ai-generation-web.defaults.property.style.vector_illustration': 'Vector Illustration',
  'ly.img.plugin-ai-generation-web.defaults.property.style.vector_illustration/bold_stroke': 'Bold Stroke',
  'ly.img.plugin-ai-generation-web.defaults.property.style.vector_illustration/chemistry': 'Chemistry',
  'ly.img.plugin-ai-generation-web.defaults.property.style.vector_illustration/colored_stencil': 'Colored Stencil',
  'ly.img.plugin-ai-generation-web.defaults.property.style.vector_illustration/contour_pop_art': 'Contour Pop Art',
  'ly.img.plugin-ai-generation-web.defaults.property.style.vector_illustration/cosmics': 'Cosmics',
  'ly.img.plugin-ai-generation-web.defaults.property.style.vector_illustration/cutout': 'Cutout',
  'ly.img.plugin-ai-generation-web.defaults.property.style.vector_illustration/depressive': 'Depressive',
  'ly.img.plugin-ai-generation-web.defaults.property.style.vector_illustration/editorial': 'Editorial',
  'ly.img.plugin-ai-generation-web.defaults.property.style.vector_illustration/emotional_flat': 'Emotional Flat',
  'ly.img.plugin-ai-generation-web.defaults.property.style.vector_illustration/infographical': 'Infographical',
  'ly.img.plugin-ai-generation-web.defaults.property.style.vector_illustration/marker_outline': 'Marker Outline',
  'ly.img.plugin-ai-generation-web.defaults.property.style.vector_illustration/mosaic': 'Mosaic',
  'ly.img.plugin-ai-generation-web.defaults.property.style.vector_illustration/naivector': 'Naive Vector',
  'ly.img.plugin-ai-generation-web.defaults.property.style.vector_illustration/roundish_flat': 'Roundish Flat',
  'ly.img.plugin-ai-generation-web.defaults.property.style.vector_illustration/segmented_colors': 'Segmented Colors',
  'ly.img.plugin-ai-generation-web.defaults.property.style.vector_illustration/sharp_contrast': 'Sharp Contrast',
  'ly.img.plugin-ai-generation-web.defaults.property.style.vector_illustration/thin': 'Thin',
  'ly.img.plugin-ai-generation-web.defaults.property.style.vector_illustration/vector_photo': 'Vector Photo',
  'ly.img.plugin-ai-generation-web.defaults.property.style.vector_illustration/vivid_shapes': 'Vivid Shapes',
  'ly.img.plugin-ai-generation-web.defaults.property.style.vector_illustration/engraving': 'Engraving',
  'ly.img.plugin-ai-generation-web.defaults.property.style.vector_illustration/line_art': 'Line Art',
  'ly.img.plugin-ai-generation-web.defaults.property.style.vector_illustration/line_circuit': 'Line Circuit',
  'ly.img.plugin-ai-generation-web.defaults.property.style.vector_illustration/linocut': 'Linocut',

  // Recraft V3 Icon Styles
  'ly.img.plugin-ai-generation-web.defaults.property.style.icon/broken_line': 'Broken Line',
  'ly.img.plugin-ai-generation-web.defaults.property.style.icon/colored_outline': 'Colored Outline',
  'ly.img.plugin-ai-generation-web.defaults.property.style.icon/colored_shapes': 'Colored Shapes',
  'ly.img.plugin-ai-generation-web.defaults.property.style.icon/colored_shapes_gradient': 'Colored Shapes Gradient',
  'ly.img.plugin-ai-generation-web.defaults.property.style.icon/doodle_fill': 'Doodle Fill',
  'ly.img.plugin-ai-generation-web.defaults.property.style.icon/doodle_offset_fill': 'Doodle Offset Fill',
  'ly.img.plugin-ai-generation-web.defaults.property.style.icon/offset_fill': 'Offset Fill',
  'ly.img.plugin-ai-generation-web.defaults.property.style.icon/outline': 'Outline',
  'ly.img.plugin-ai-generation-web.defaults.property.style.icon/outline_gradient': 'Outline Gradient',
  'ly.img.plugin-ai-generation-web.defaults.property.style.icon/uneven_fill': 'Uneven Fill',

  // GPT Image 1 Styles
  'ly.img.plugin-ai-generation-web.defaults.property.style.none': 'None',
  'ly.img.plugin-ai-generation-web.defaults.property.style.anime-celshaded': 'Anime',
  'ly.img.plugin-ai-generation-web.defaults.property.style.cyberpunk-neon': 'Cyberpunk',
  'ly.img.plugin-ai-generation-web.defaults.property.style.kodak-portra-400': 'Kodak 400',
  'ly.img.plugin-ai-generation-web.defaults.property.style.watercolor-storybook': 'Watercolor',
  'ly.img.plugin-ai-generation-web.defaults.property.style.dark-fantasy-realism': 'Dark Fantasy',
  'ly.img.plugin-ai-generation-web.defaults.property.style.vaporwave-retrofuturism': 'Vaporwave',
  'ly.img.plugin-ai-generation-web.defaults.property.style.minimal-vector-flat': 'Vector Flat',
  'ly.img.plugin-ai-generation-web.defaults.property.style.pixarstyle-3d-render': '3D Animation',
  'ly.img.plugin-ai-generation-web.defaults.property.style.ukiyoe-woodblock': 'Ukiyo‑e',
  'ly.img.plugin-ai-generation-web.defaults.property.style.surreal-dreamscape': 'Surreal',
  'ly.img.plugin-ai-generation-web.defaults.property.style.steampunk-victorian': 'Steampunk',
  'ly.img.plugin-ai-generation-web.defaults.property.style.nightstreet-photo-bokeh': 'Night Bokeh',
  'ly.img.plugin-ai-generation-web.defaults.property.style.comicbook-pop-art': 'Pop Art'
};
