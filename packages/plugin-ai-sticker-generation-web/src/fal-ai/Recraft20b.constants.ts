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
export const STYLES_IMAGE: { id: StyleId }[] = [
  { id: 'realistic_image' },
  { id: 'digital_illustration' },
  { id: 'realistic_image/b_and_w' },
  { id: 'realistic_image/hard_flash' },
  { id: 'realistic_image/hdr' },
  { id: 'realistic_image/natural_light' },
  { id: 'realistic_image/studio_portrait' },
  { id: 'realistic_image/enterprise' },
  { id: 'realistic_image/motion_blur' },
  { id: 'realistic_image/evening_light' },
  { id: 'realistic_image/faded_nostalgia' },
  { id: 'realistic_image/forest_life' },
  { id: 'realistic_image/mystic_naturalism' },
  { id: 'realistic_image/natural_tones' },
  { id: 'realistic_image/organic_calm' },
  { id: 'realistic_image/real_life_glow' },
  { id: 'realistic_image/retro_realism' },
  { id: 'realistic_image/retro_snapshot' },
  { id: 'realistic_image/urban_drama' },
  { id: 'realistic_image/village_realism' },
  { id: 'realistic_image/warm_folk' },
  { id: 'digital_illustration/pixel_art' },
  { id: 'digital_illustration/hand_drawn' },
  { id: 'digital_illustration/grain' },
  { id: 'digital_illustration/infantile_sketch' },
  { id: 'digital_illustration/2d_art_poster' },
  { id: 'digital_illustration/handmade_3d' },
  { id: 'digital_illustration/hand_drawn_outline' },
  { id: 'digital_illustration/engraving_color' },
  { id: 'digital_illustration/2d_art_poster_2' },
  { id: 'digital_illustration/antiquarian' },
  { id: 'digital_illustration/bold_fantasy' },
  { id: 'digital_illustration/child_book' },
  { id: 'digital_illustration/child_books' },
  { id: 'digital_illustration/cover' },
  { id: 'digital_illustration/crosshatch' },
  { id: 'digital_illustration/digital_engraving' },
  { id: 'digital_illustration/expressionism' },
  { id: 'digital_illustration/freehand_details' },
  { id: 'digital_illustration/grain_20' },
  { id: 'digital_illustration/graphic_intensity' },
  { id: 'digital_illustration/hard_comics' },
  { id: 'digital_illustration/long_shadow' },
  { id: 'digital_illustration/modern_folk' },
  { id: 'digital_illustration/multicolor' },
  { id: 'digital_illustration/neon_calm' },
  { id: 'digital_illustration/noir' },
  { id: 'digital_illustration/nostalgic_pastel' },
  { id: 'digital_illustration/outline_details' },
  { id: 'digital_illustration/pastel_gradient' },
  { id: 'digital_illustration/pastel_sketch' },
  { id: 'digital_illustration/pop_art' },
  { id: 'digital_illustration/pop_renaissance' },
  { id: 'digital_illustration/street_art' },
  { id: 'digital_illustration/tablet_sketch' },
  { id: 'digital_illustration/urban_glow' },
  { id: 'digital_illustration/urban_sketching' },
  { id: 'digital_illustration/vanilla_dreams' },
  { id: 'digital_illustration/young_adult_book' },
  { id: 'digital_illustration/young_adult_book_2' },
];

export const STYLE_IMAGE_DEFAULT = STYLES_IMAGE[0];

// prettier-ignore
export const STYLES_VECTOR: { id: StyleId }[] = [
  { id: 'vector_illustration' },
  { id: 'vector_illustration/bold_stroke' },
  { id: 'vector_illustration/chemistry' },
  { id: 'vector_illustration/colored_stencil' },
  { id: 'vector_illustration/contour_pop_art' },
  { id: 'vector_illustration/cosmics' },
  { id: 'vector_illustration/cutout' },
  { id: 'vector_illustration/depressive' },
  { id: 'vector_illustration/editorial' },
  { id: 'vector_illustration/emotional_flat' },
  { id: 'vector_illustration/infographical' },
  { id: 'vector_illustration/marker_outline' },
  { id: 'vector_illustration/mosaic' },
  { id: 'vector_illustration/naivector' },
  { id: 'vector_illustration/roundish_flat' },
  { id: 'vector_illustration/segmented_colors' },
  { id: 'vector_illustration/sharp_contrast' },
  { id: 'vector_illustration/thin' },
  { id: 'vector_illustration/vector_photo' },
  { id: 'vector_illustration/vivid_shapes' },
  { id: 'vector_illustration/engraving' },
  { id: 'vector_illustration/line_art' },
  { id: 'vector_illustration/line_circuit' },
  { id: 'vector_illustration/linocut' },
];

export const STYLE_VECTOR_DEFAULT = STYLES_VECTOR[0];

// prettier-ignore
export const STYLES_ICON: { id: StyleId }[] = [
  { id: 'icon/broken_line' },
  { id: 'icon/colored_outline' },
  { id: 'icon/colored_shapes' },
  { id: 'icon/colored_shapes_gradient' },
  { id: 'icon/doodle_fill' },
  { id: 'icon/doodle_offset_fill' },
  { id: 'icon/offset_fill' },
  { id: 'icon/outline' },
  { id: 'icon/outline_gradient' },
  { id: 'icon/uneven_fill' },
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
