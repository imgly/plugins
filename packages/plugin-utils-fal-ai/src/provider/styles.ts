import { RecraftV3Input } from '@fal-ai/client/endpoints';

export type StyleId = Extract<RecraftV3Input['style'], string>;

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
  { id: 'digital_illustration/pixel_art', label: 'Pixel Art' },
  { id: 'digital_illustration/hand_drawn', label: 'Hand Drawn' },
  { id: 'digital_illustration/grain', label: 'Grain' },
  { id: 'digital_illustration/infantile_sketch', label: 'Infantile Sketch' },
  { id: 'digital_illustration/2d_art_poster', label: '2D Art Poster' },
  { id: 'digital_illustration/handmade_3d', label: 'Handmade 3D' },
  { id: 'digital_illustration/hand_drawn_outline', label: 'Hand Drawn Outline' },
  { id: 'digital_illustration/engraving_color', label: 'Engraving Color' },
  { id: 'digital_illustration/2d_art_poster_2', label: '2D Art Poster 2' },
];

export const STYLE_IMAGE_DEFAULT = STYLES_IMAGE[0];

// prettier-ignore
export const STYLES_VECTOR: { id: StyleId; label: string }[] = [
  { id: 'vector_illustration',            label: 'Vector Illustration' },
  { id: 'vector_illustration/engraving',  label: 'Engraving' },
  { id: 'vector_illustration/line_art',   label: 'Line Art' },
  { id: 'vector_illustration/line_circuit', label: 'Line Circuit' },
  { id: 'vector_illustration/linocut',    label: 'Linocut' },
];

export const STYLE_VECTOR_DEFAULT = STYLES_VECTOR[0];

// prettier-ignore
const STYLE_THUMBNAILS: { [key in StyleId]?: string } = {
'realistic_image': 'https://ubique.img.ly/static/image-generation/thumbnails/realistic_image.webp',
'digital_illustration': 'https://ubique.img.ly/static/image-generation/thumbnails/digital_illustration.webp',
'realistic_image/b_and_w': 'https://ubique.img.ly/static/image-generation/thumbnails/realistic_image_black_&_white.webp',
'realistic_image/hard_flash': 'https://ubique.img.ly/static/image-generation/thumbnails/realistic_image_hard_flash.webp',
'realistic_image/hdr': 'https://ubique.img.ly/static/image-generation/thumbnails/realistic_image_hdr.webp',
'realistic_image/natural_light': 'https://ubique.img.ly/static/image-generation/thumbnails/realistic_image_natural_light.webp',
'realistic_image/studio_portrait': 'https://ubique.img.ly/static/image-generation/thumbnails/realistic_image_studio_portrait.webp',
'realistic_image/enterprise': 'https://ubique.img.ly/static/image-generation/thumbnails/realistic_image_enterprise.webp',
'realistic_image/motion_blur': 'https://ubique.img.ly/static/image-generation/thumbnails/realistic_image_motion_blur.webp',
'digital_illustration/pixel_art': 'https://ubique.img.ly/static/image-generation/thumbnails/digital_illustration_pixel_art.webp',
'digital_illustration/hand_drawn': 'https://ubique.img.ly/static/image-generation/thumbnails/digital_illustration_hand_drawn.webp',
'digital_illustration/grain': 'https://ubique.img.ly/static/image-generation/thumbnails/digital_illustration_grain.webp',
'digital_illustration/infantile_sketch': 'https://ubique.img.ly/static/image-generation/thumbnails/digital_illustration_infantile_sketch.webp',
'digital_illustration/2d_art_poster': 'https://ubique.img.ly/static/image-generation/thumbnails/digital_illustration_2d_art_poster.webp',
'digital_illustration/handmade_3d': 'https://ubique.img.ly/static/image-generation/thumbnails/digital_illustration_handmade_3d.webp',
'digital_illustration/hand_drawn_outline': 'https://ubique.img.ly/static/image-generation/thumbnails/digital_illustration_handdrawn_outline.webp',
'digital_illustration/engraving_color': 'https://ubique.img.ly/static/image-generation/thumbnails/digital_illustration_engraving_color.webp',
'digital_illustration/2d_art_poster_2': 'https://ubique.img.ly/static/image-generation/thumbnails/digital_illustration_2d_artposter_2.webp',
'vector_illustration': 'https://ubique.img.ly/static/image-generation/thumbnails/vector_illustration.svg',
'vector_illustration/engraving': 'https://ubique.img.ly/static/image-generation/thumbnails/vector_illustration_engraving.svg',
'vector_illustration/line_art': 'https://ubique.img.ly/static/image-generation/thumbnails/vector_illustration_line_art.svg',
'vector_illustration/line_circuit': 'https://ubique.img.ly/static/image-generation/thumbnails/vector_illustration_line_circuit.svg',
'vector_illustration/linocut': 'https://ubique.img.ly/static/image-generation/thumbnails/vector_illustration_linocut.svg',
}

export function getStyleThumbnail(id: StyleId): string | undefined {
  return STYLE_THUMBNAILS[id];
}
