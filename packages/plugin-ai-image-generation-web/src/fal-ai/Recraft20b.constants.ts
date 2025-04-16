import { Recraft20bInput } from '@fal-ai/client/endpoints';

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

export type StyleId = Extract<Recraft20bInput['style'], string>;

// prettier-ignore
export const STYLES_ICON: { id: StyleId; label: string }[] = [
  { id: "icon/broken_line",             label: "Broken Line" },
  { id: "icon/colored_outline",         label: "Colored Outline" },
  { id: "icon/colored_shapes",          label: "Colored Shapes" },
  { id: "icon/colored_shapes_gradient", label: "Colored Shapes Gradient" },
  { id: "icon/doodle_fill",             label: "Doodle Fill" },
  { id: "icon/doodle_offset_fill",      label: "Doodle Offset Fill" },
  { id: "icon/offset_fill",             label: "Offset Fill" },
  { id: "icon/outline",                 label: "Outline" },
  { id: "icon/outline_gradient",        label: "Outline Gradient" },
  { id: "icon/uneven_fill" ,            label: "Uneven Fill" },
];

export const STYLE_ICON_DEFAULT = STYLES_ICON[0];
const prefix = 'https://ubique.img.ly/static/image-generation/thumbnails';

// prettier-ignore
const STYLE_THUMBNAILS: { [key in StyleId]?: string } = {
"icon/broken_line": `${prefix}/icon_broken_line.svg`,
"icon/colored_outline": `${prefix}/icon_colored_outline.svg`,
"icon/colored_shapes": `${prefix}/icon_colored_shapes.svg`,
"icon/colored_shapes_gradient": `${prefix}/icon_colored_shapes_gradient.svg`,
"icon/doodle_fill": `${prefix}/icon_doodle_fill.svg`,
"icon/doodle_offset_fill": `${prefix}/icon_doodle_offset_fill.svg`,
"icon/offset_fill": `${prefix}/icon_offset_fill.svg`,
"icon/outline" : `${prefix}/icon_outline.svg`,
"icon/outline_gradient": `${prefix}/icon_outline_gradient.svg`,
"icon/uneven_fill": `${prefix}/icon_uneven_fill.svg`,
}

export function getStyleThumbnail(id: StyleId): string | undefined {
  return STYLE_THUMBNAILS[id];
}
