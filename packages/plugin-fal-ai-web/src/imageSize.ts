type ImageSize = 'square_hd' | 'square' | 'portrait_4_3' | 'portrait_16_9' | 'landscape_4_3' | 'landscape_16_9' | 'custom';

// prettier-ignore
export const IMAGE_SIZE_VALUES: { id: string; label: string | string[] }[] = [
  { id: 'square_hd',      label: 'Square HD' },
  { id: 'square',         label: 'Square' },
  { id: 'portrait_4_3',   label: 'Portrait 4:3' },
  { id: 'portrait_16_9',  label: 'Portrait 16:9' },
  { id: 'landscape_4_3',  label: 'Landscape 4:3' },
  { id: 'landscape_16_9', label: 'Landscape 16:9' },
  { id: 'custom',         label: 'Custom' }
] as const;

const IMAGE_SIZE_ICONS: Record<string, string> = {
  square: '@imgly/plugin/fal-ai/ratio1by1',
  square_hd: '@imgly/plugin/fal-ai/ratio1by1',
  portrait_4_3: '@imgly/plugin/fal-ai/ratio3by4',
  portrait_16_9: '@imgly/plugin/fal-ai/ratio9by16',
  landscape_4_3: '@imgly/plugin/fal-ai/ratio4by3',
  landscape_16_9: '@imgly/plugin/fal-ai/ratio16by9',
  custom: '@imgly/plugin/fal-ai/ratioFree'
};

export function getImageSizeIcon(id: string): string {
  return IMAGE_SIZE_ICONS[id];
}

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
