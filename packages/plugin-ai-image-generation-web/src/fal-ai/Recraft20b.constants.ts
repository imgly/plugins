const ImageSizeEnumToSize: Record<string, { width: number; height: number }> = {
  square_hd: { width: 1024, height: 1024 },
  square: { width: 512, height: 512 },
  portrait_4_3: { width: 1024, height: 1365 },
  portrait_16_9: { width: 1024, height: 1820 },
  landscape_4_3: { width: 1365, height: 1024 },
  landscape_16_9: { width: 1820, height: 1024 }
};

export function getImageDimensions(id: string): {
  width: number;
  height: number;
} {
  return ImageSizeEnumToSize[id];
}

export type StyleId =
  | 'any'
  | 'realistic_image'
  | 'digital_illustration'
  | 'vector_illustration'
  | 'realistic_image/b_and_w'
  | 'realistic_image/hard_flash'
  | 'realistic_image/hdr'
  | 'realistic_image/natural_light'
  | 'realistic_image/studio_portrait'
  | 'realistic_image/enterprise'
  | 'realistic_image/motion_blur'
  | 'realistic_image/evening_light'
  | 'realistic_image/faded_nostalgia'
  | 'realistic_image/forest_life'
  | 'realistic_image/mystic_naturalism'
  | 'realistic_image/natural_tones'
  | 'realistic_image/organic_calm'
  | 'realistic_image/real_life_glow'
  | 'realistic_image/retro_realism'
  | 'realistic_image/retro_snapshot'
  | 'realistic_image/urban_drama'
  | 'realistic_image/village_realism'
  | 'realistic_image/warm_folk'
  | 'digital_illustration/pixel_art'
  | 'digital_illustration/hand_drawn'
  | 'digital_illustration/grain'
  | 'digital_illustration/infantile_sketch'
  | 'digital_illustration/2d_art_poster'
  | 'digital_illustration/handmade_3d'
  | 'digital_illustration/hand_drawn_outline'
  | 'digital_illustration/engraving_color'
  | 'digital_illustration/2d_art_poster_2'
  | 'digital_illustration/antiquarian'
  | 'digital_illustration/bold_fantasy'
  | 'digital_illustration/child_book'
  | 'digital_illustration/child_books'
  | 'digital_illustration/cover'
  | 'digital_illustration/crosshatch'
  | 'digital_illustration/digital_engraving'
  | 'digital_illustration/expressionism'
  | 'digital_illustration/freehand_details'
  | 'digital_illustration/grain_20'
  | 'digital_illustration/graphic_intensity'
  | 'digital_illustration/hard_comics'
  | 'digital_illustration/long_shadow'
  | 'digital_illustration/modern_folk'
  | 'digital_illustration/multicolor'
  | 'digital_illustration/neon_calm'
  | 'digital_illustration/noir'
  | 'digital_illustration/nostalgic_pastel'
  | 'digital_illustration/outline_details'
  | 'digital_illustration/pastel_gradient'
  | 'digital_illustration/pastel_sketch'
  | 'digital_illustration/pop_art'
  | 'digital_illustration/pop_renaissance'
  | 'digital_illustration/street_art'
  | 'digital_illustration/tablet_sketch'
  | 'digital_illustration/urban_glow'
  | 'digital_illustration/urban_sketching'
  | 'digital_illustration/vanilla_dreams'
  | 'digital_illustration/young_adult_book'
  | 'digital_illustration/young_adult_book_2'
  | 'vector_illustration/bold_stroke'
  | 'vector_illustration/chemistry'
  | 'vector_illustration/colored_stencil'
  | 'vector_illustration/contour_pop_art'
  | 'vector_illustration/cosmics'
  | 'vector_illustration/cutout'
  | 'vector_illustration/depressive'
  | 'vector_illustration/editorial'
  | 'vector_illustration/emotional_flat'
  | 'vector_illustration/infographical'
  | 'vector_illustration/marker_outline'
  | 'vector_illustration/mosaic'
  | 'vector_illustration/naivector'
  | 'vector_illustration/roundish_flat'
  | 'vector_illustration/segmented_colors'
  | 'vector_illustration/sharp_contrast'
  | 'vector_illustration/thin'
  | 'vector_illustration/vector_photo'
  | 'vector_illustration/vivid_shapes'
  | 'vector_illustration/engraving'
  | 'vector_illustration/line_art'
  | 'vector_illustration/line_circuit'
  | 'vector_illustration/linocut'
  | 'icon/broken_line'
  | 'icon/colored_outline'
  | 'icon/colored_shapes'
  | 'icon/colored_shapes_gradient'
  | 'icon/doodle_fill'
  | 'icon/doodle_offset_fill'
  | 'icon/offset_fill'
  | 'icon/outline'
  | 'icon/outline_gradient'
  | 'icon/uneven_fill';

// prettier-ignore
export const STYLES_IMAGE: { id: StyleId; label: string }[] = [
  // { id: 'any', label: 'Any' },
  { id: 'realistic_image', label: 'Realistic Image' },
  { id: 'digital_illustration', label: 'Digital Illustration' },
  { id: 'realistic_image/b_and_w', label: 'Black & White' },
  { id: 'realistic_image/hard_flash', label: 'Hard Flash' },
  { id: 'realistic_image/hdr', label: 'HDR' },
  { id: 'realistic_image/natural_light', label: 'Natural Light' },
  { id: 'realistic_image/studio_portrait', label: 'Studio Portrait' },
  { id: 'realistic_image/enterprise', label: 'Enterprise' },
  { id: 'realistic_image/motion_blur', label: 'Motion Blur' },
  { id: 'realistic_image/evening_light', label: 'Evening Light' },
  { id: 'realistic_image/faded_nostalgia', label: 'Faded Nostalgia' },
  { id: 'realistic_image/forest_life', label: 'Forest Life' },
  { id: 'realistic_image/mystic_naturalism', label: 'Mystic Naturalism' },
  { id: 'realistic_image/natural_tones', label: 'Natural Tones' },
  { id: 'realistic_image/organic_calm', label: 'Organic Calm' },
  { id: 'realistic_image/real_life_glow', label: 'Real Life Glow' },
  { id: 'realistic_image/retro_realism', label: 'Retro Realism' },
  { id: 'realistic_image/retro_snapshot', label: 'Retro Snapshot' },
  { id: 'realistic_image/urban_drama', label: 'Urban Drama' },
  { id: 'realistic_image/village_realism', label: 'Village Realism' },
  { id: 'realistic_image/warm_folk', label: 'Warm Folk' },
  { id: 'digital_illustration/pixel_art', label: 'Pixel Art' },
  { id: 'digital_illustration/hand_drawn', label: 'Hand Drawn' },
  { id: 'digital_illustration/grain', label: 'Grain' },
  { id: 'digital_illustration/infantile_sketch', label: 'Infantile Sketch' },
  { id: 'digital_illustration/2d_art_poster', label: '2D Art Poster' },
  { id: 'digital_illustration/handmade_3d', label: 'Handmade 3D' },
  { id: 'digital_illustration/hand_drawn_outline', label: 'Hand Drawn Outline' },
  { id: 'digital_illustration/engraving_color', label: 'Engraving Color' },
  { id: 'digital_illustration/2d_art_poster_2', label: '2D Art Poster 2' },
  { id: 'digital_illustration/antiquarian', label: 'Antiquarian' },
  { id: 'digital_illustration/bold_fantasy', label: 'Bold Fantasy' },
  { id: 'digital_illustration/child_book', label: 'Child Book' },
  { id: 'digital_illustration/child_books', label: 'Child Books' },
  { id: 'digital_illustration/cover', label: 'Cover' },
  { id: 'digital_illustration/crosshatch', label: 'Crosshatch' },
  { id: 'digital_illustration/digital_engraving', label: 'Digital Engraving' },
  { id: 'digital_illustration/expressionism', label: 'Expressionism' },
  { id: 'digital_illustration/freehand_details', label: 'Freehand Details' },
  { id: 'digital_illustration/grain_20', label: 'Grain 20' },
  { id: 'digital_illustration/graphic_intensity', label: 'Graphic Intensity' },
  { id: 'digital_illustration/hard_comics', label: 'Hard Comics' },
  { id: 'digital_illustration/long_shadow', label: 'Long Shadow' },
  { id: 'digital_illustration/modern_folk', label: 'Modern Folk' },
  { id: 'digital_illustration/multicolor', label: 'Multicolor' },
  { id: 'digital_illustration/neon_calm', label: 'Neon Calm' },
  { id: 'digital_illustration/noir', label: 'Noir' },
  { id: 'digital_illustration/nostalgic_pastel', label: 'Nostalgic Pastel' },
  { id: 'digital_illustration/outline_details', label: 'Outline Details' },
  { id: 'digital_illustration/pastel_gradient', label: 'Pastel Gradient' },
  { id: 'digital_illustration/pastel_sketch', label: 'Pastel Sketch' },
  { id: 'digital_illustration/pop_art', label: 'Pop Art' },
  { id: 'digital_illustration/pop_renaissance', label: 'Pop Renaissance' },
  { id: 'digital_illustration/street_art', label: 'Street Art' },
  { id: 'digital_illustration/tablet_sketch', label: 'Tablet Sketch' },
  { id: 'digital_illustration/urban_glow', label: 'Urban Glow' },
  { id: 'digital_illustration/urban_sketching', label: 'Urban Sketching' },
  { id: 'digital_illustration/vanilla_dreams', label: 'Vanilla Dreams' },
  { id: 'digital_illustration/young_adult_book', label: 'Young Adult Book' },
  { id: 'digital_illustration/young_adult_book_2', label: 'Young Adult Book 2' },
];

export const STYLE_IMAGE_DEFAULT = STYLES_IMAGE[0];

// prettier-ignore
export const STYLES_VECTOR: { id: StyleId; label: string }[] = [
  { id: 'vector_illustration',                 label: 'Vector Illustration' },
  { id: 'vector_illustration/bold_stroke',     label: 'Bold Stroke' },
  { id: 'vector_illustration/chemistry',       label: 'Chemistry' },
  { id: 'vector_illustration/colored_stencil', label: 'Colored Stencil' },
  { id: 'vector_illustration/contour_pop_art', label: 'Contour Pop Art' },
  { id: 'vector_illustration/cosmics',         label: 'Cosmics' },
  { id: 'vector_illustration/cutout',          label: 'Cutout' },
  { id: 'vector_illustration/depressive',      label: 'Depressive' },
  { id: 'vector_illustration/editorial',       label: 'Editorial' },
  { id: 'vector_illustration/emotional_flat',  label: 'Emotional Flat' },
  { id: 'vector_illustration/infographical',   label: 'Infographical' },
  { id: 'vector_illustration/marker_outline',  label: 'Marker Outline' },
  { id: 'vector_illustration/mosaic',          label: 'Mosaic' },
  { id: 'vector_illustration/naivector',       label: 'Naive Vector' },
  { id: 'vector_illustration/roundish_flat',   label: 'Roundish Flat' },
  { id: 'vector_illustration/segmented_colors', label: 'Segmented Colors' },
  { id: 'vector_illustration/sharp_contrast',  label: 'Sharp Contrast' },
  { id: 'vector_illustration/thin',            label: 'Thin' },
  { id: 'vector_illustration/vector_photo',    label: 'Vector Photo' },
  { id: 'vector_illustration/vivid_shapes',    label: 'Vivid Shapes' },
  { id: 'vector_illustration/engraving',       label: 'Engraving' },
  { id: 'vector_illustration/line_art',        label: 'Line Art' },
  { id: 'vector_illustration/line_circuit',    label: 'Line Circuit' },
  { id: 'vector_illustration/linocut',         label: 'Linocut' },
];

export const STYLE_VECTOR_DEFAULT = STYLES_VECTOR[0];

// prettier-ignore
export const STYLES_ICON: { id: StyleId; label: string }[] = [
  { id: 'icon/broken_line',              label: 'Broken Line' },
  { id: 'icon/colored_outline',          label: 'Colored Outline' },
  { id: 'icon/colored_shapes',           label: 'Colored Shapes' },
  { id: 'icon/colored_shapes_gradient',  label: 'Colored Shapes Gradient' },
  { id: 'icon/doodle_fill',              label: 'Doodle Fill' },
  { id: 'icon/doodle_offset_fill',       label: 'Doodle Offset Fill' },
  { id: 'icon/offset_fill',              label: 'Offset Fill' },
  { id: 'icon/outline',                  label: 'Outline' },
  { id: 'icon/outline_gradient',         label: 'Outline Gradient' },
  { id: 'icon/uneven_fill',              label: 'Uneven Fill' },
];

export const STYLE_ICON_DEFAULT = STYLES_ICON[0];

// prettier-ignore
const STYLE_THUMBNAILS: (baseURL: string) => ({ [key in StyleId]?: string }) = (baseURL) => ({
'realistic_image': `${baseURL}/realistic_image.webp`,
'digital_illustration': `${baseURL}/digital_illustration.webp`,
'realistic_image/b_and_w': `${baseURL}/realistic_image_black_&_white.webp`,
'realistic_image/hard_flash': `${baseURL}/realistic_image_hard_flash.webp`,
'realistic_image/hdr': `${baseURL}/realistic_image_hdr.webp`,
'realistic_image/natural_light': `${baseURL}/realistic_image_natural_light.webp`,
'realistic_image/studio_portrait': `${baseURL}/realistic_image_studio_portrait.webp`,
'realistic_image/enterprise': `${baseURL}/realistic_image_enterprise.webp`,
'realistic_image/motion_blur': `${baseURL}/realistic_image_motion_blur.webp`,
'digital_illustration/pixel_art': `${baseURL}/digital_illustration_pixel_art.webp`,
'digital_illustration/hand_drawn': `${baseURL}/digital_illustration_hand_drawn.webp`,
'digital_illustration/grain': `${baseURL}/digital_illustration_grain.webp`,
'digital_illustration/infantile_sketch': `${baseURL}/digital_illustration_infantile_sketch.webp`,
'digital_illustration/2d_art_poster': `${baseURL}/digital_illustration_2d_art_poster.webp`,
'digital_illustration/handmade_3d': `${baseURL}/digital_illustration_handmade_3d.webp`,
'digital_illustration/hand_drawn_outline': `${baseURL}/digital_illustration_handdrawn_outline.webp`,
'digital_illustration/engraving_color': `${baseURL}/digital_illustration_engraving_color.webp`,
'digital_illustration/2d_art_poster_2': `${baseURL}/digital_illustration_2d_artposter_2.webp`,
'vector_illustration': `${baseURL}/vector_illustration.svg`,
'vector_illustration/bold_stroke': `${baseURL}/vector_illustration_bold_stroke.svg`,
'vector_illustration/chemistry': `${baseURL}/vector_illustration_chemistry.svg`,
'vector_illustration/colored_stencil': `${baseURL}/vector_illustration_colored_stencil.svg`,
'vector_illustration/contour_pop_art': `${baseURL}/vector_illustration_contour_pop_art.svg`,
'vector_illustration/cosmics': `${baseURL}/vector_illustration_cosmics.svg`,
'vector_illustration/cutout': `${baseURL}/vector_illustration_cutout.svg`,
'vector_illustration/depressive': `${baseURL}/vector_illustration_depressive.svg`,
'vector_illustration/editorial': `${baseURL}/vector_illustration_editorial.svg`,
'vector_illustration/emotional_flat': `${baseURL}/vector_illustration_emotional_flat.svg`,
'vector_illustration/infographical': `${baseURL}/vector_illustration_infographical.svg`,
'vector_illustration/marker_outline': `${baseURL}/vector_illustration_marker_outline.svg`,
'vector_illustration/mosaic': `${baseURL}/vector_illustration_mosaic.svg`,
'vector_illustration/naivector': `${baseURL}/vector_illustration_naivector.svg`,
'vector_illustration/roundish_flat': `${baseURL}/vector_illustration_roundish_flat.svg`,
'vector_illustration/segmented_colors': `${baseURL}/vector_illustration_segmented_colors.svg`,
'vector_illustration/sharp_contrast': `${baseURL}/vector_illustration_sharp_contrast.svg`,
'vector_illustration/thin': `${baseURL}/vector_illustration_thin.svg`,
'vector_illustration/vector_photo': `${baseURL}/vector_illustration_vector_photo.svg`,
'vector_illustration/vivid_shapes': `${baseURL}/vector_illustration_vivid_shapes.svg`,
'vector_illustration/engraving': `${baseURL}/vector_illustration_engraving.svg`,
'vector_illustration/line_art': `${baseURL}/vector_illustration_line_art.svg`,
'vector_illustration/line_circuit': `${baseURL}/vector_illustration_line_circuit.svg`,
'vector_illustration/linocut': `${baseURL}/vector_illustration_linocut.svg`,
'realistic_image/evening_light': `${baseURL}/realistic_image_evening_light.webp`,
'realistic_image/faded_nostalgia': `${baseURL}/realistic_image_faded_nostalgia.webp`,
'realistic_image/forest_life': `${baseURL}/realistic_image_forest_life.webp`,
'realistic_image/mystic_naturalism': `${baseURL}/realistic_image_mystic_naturalism.webp`,
'realistic_image/natural_tones': `${baseURL}/realistic_image_natural_tones.webp`,
'realistic_image/organic_calm': `${baseURL}/realistic_image_organic_calm.webp`,
'realistic_image/real_life_glow': `${baseURL}/realistic_image_real_life_glow.webp`,
'realistic_image/retro_realism': `${baseURL}/realistic_image_retro_realism.webp`,
'realistic_image/retro_snapshot': `${baseURL}/realistic_image_retro_snapshot.webp`,
'realistic_image/urban_drama': `${baseURL}/realistic_image_urban_drama.webp`,
'realistic_image/village_realism': `${baseURL}/realistic_image_village_realism.webp`,
'realistic_image/warm_folk': `${baseURL}/realistic_image_warm_folk.webp`,
'digital_illustration/antiquarian': `${baseURL}/digital_illustration_antiquarian.webp`,
'digital_illustration/bold_fantasy': `${baseURL}/digital_illustration_bold_fantasy.webp`,
'digital_illustration/child_book': `${baseURL}/digital_illustration_child_book.webp`,
'digital_illustration/child_books': `${baseURL}/digital_illustration_child_books.webp`,
'digital_illustration/cover': `${baseURL}/digital_illustration_cover.webp`,
'digital_illustration/crosshatch': `${baseURL}/digital_illustration_crosshatch.webp`,
'digital_illustration/digital_engraving': `${baseURL}/digital_illustration_digital_engraving.webp`,
'digital_illustration/expressionism': `${baseURL}/digital_illustration_expressionism.webp`,
'digital_illustration/freehand_details': `${baseURL}/digital_illustration_freehand_details.webp`,
'digital_illustration/grain_20': `${baseURL}/digital_illustration_grain_20.webp`,
'digital_illustration/graphic_intensity': `${baseURL}/digital_illustration_graphic_intensity.webp`,
'digital_illustration/hard_comics': `${baseURL}/digital_illustration_hard_comics.webp`,
'digital_illustration/long_shadow': `${baseURL}/digital_illustration_long_shadow.webp`,
'digital_illustration/modern_folk': `${baseURL}/digital_illustration_modern_folk.webp`,
'digital_illustration/multicolor': `${baseURL}/digital_illustration_multicolor.webp`,
'digital_illustration/neon_calm': `${baseURL}/digital_illustration_neon_calm.webp`,
'digital_illustration/noir': `${baseURL}/digital_illustration_noir.webp`,
'digital_illustration/nostalgic_pastel': `${baseURL}/digital_illustration_nostalgic_pastel.webp`,
'digital_illustration/outline_details': `${baseURL}/digital_illustration_outline_details.webp`,
'digital_illustration/pastel_gradient': `${baseURL}/digital_illustration_pastel_gradient.webp`,
'digital_illustration/pastel_sketch': `${baseURL}/digital_illustration_pastel_sketch.webp`,
'digital_illustration/pop_art': `${baseURL}/digital_illustration_pop_art.webp`,
'digital_illustration/pop_renaissance': `${baseURL}/digital_illustration_pop_renaissance.webp`,
'digital_illustration/street_art': `${baseURL}/digital_illustration_street_art.webp`,
'digital_illustration/tablet_sketch': `${baseURL}/digital_illustration_tablet_sketch.webp`,
'digital_illustration/urban_glow': `${baseURL}/digital_illustration_urban_glow.webp`,
'digital_illustration/urban_sketching': `${baseURL}/digital_illustration_urban_sketching.webp`,
'digital_illustration/vanilla_dreams': `${baseURL}/digital_illustration_vanilla_dreams.webp`,
'digital_illustration/young_adult_book': `${baseURL}/digital_illustration_young_adult_book.webp`,
'digital_illustration/young_adult_book_2': `${baseURL}/digital_illustration_young_adult_book_2.webp`,
// Icon style thumbnails (using SVG format like vector styles)
'icon/broken_line': `${baseURL}/icon_broken_line.svg`,
'icon/colored_outline': `${baseURL}/icon_colored_outline.svg`,
'icon/colored_shapes': `${baseURL}/icon_colored_shapes.svg`,
'icon/colored_shapes_gradient': `${baseURL}/icon_colored_shapes_gradient.svg`,
'icon/doodle_fill': `${baseURL}/icon_doodle_fill.svg`,
'icon/doodle_offset_fill': `${baseURL}/icon_doodle_offset_fill.svg`,
'icon/offset_fill': `${baseURL}/icon_offset_fill.svg`,
'icon/outline': `${baseURL}/icon_outline.svg`,
'icon/outline_gradient': `${baseURL}/icon_outline_gradient.svg`,
'icon/uneven_fill': `${baseURL}/icon_uneven_fill.svg`,
})

export function getStyleThumbnail(
  id: StyleId,
  baseURL: string
): string | undefined {
  return STYLE_THUMBNAILS(`${baseURL}thumbnails/`)[id];
}
