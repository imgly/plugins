import CreativeEditorSDK from '@cesdk/cesdk-js';
import { CustomAssetSource, isDefined } from '@imgly/plugin-utils';

/**
 * Style labels for translation extraction
 * These are extracted at build time to translations.json
 */
export const STYLES_IMAGE: Array<{ id: string; label: string }> = [
  { id: 'none', label: 'None' },
  { id: 'anime-celshaded', label: 'Anime' },
  { id: 'cyberpunk-neon', label: 'Cyberpunk' },
  { id: 'kodak-portra-400', label: 'Kodak 400' },
  { id: 'watercolor-storybook', label: 'Watercolor' },
  { id: 'dark-fantasy-realism', label: 'Dark Fantasy' },
  { id: 'vaporwave-retrofuturism', label: 'Vaporwave' },
  { id: 'minimal-vector-flat', label: 'Vector Flat' },
  { id: 'pixarstyle-3d-render', label: '3D Animation' },
  { id: 'ukiyoe-woodblock', label: 'Ukiyo‑e' },
  { id: 'surreal-dreamscape', label: 'Surreal' },
  { id: 'steampunk-victorian', label: 'Steampunk' },
  { id: 'nightstreet-photo-bokeh', label: 'Night Bokeh' },
  { id: 'comicbook-pop-art', label: 'Pop Art' }
];

/**
 * Style prompts for runtime use
 * Maps style IDs to their corresponding prompt modifiers
 */
export const STYLE_PROMPTS: Record<string, string> = {
  'none': '',
  'anime-celshaded':
    'anime cel‑shaded, bright pastel palette, expressive eyes, clean line art ',
  'cyberpunk-neon':
    'cyberpunk cityscape, glowing neon signage, reflective puddles, dark atmosphere',
  'kodak-portra-400':
    'shot on Kodak Portra 400, soft grain, golden‑hour warmth, 35 mm photo',
  'watercolor-storybook':
    'loose watercolor washes, gentle gradients, dreamy storybook feel',
  'dark-fantasy-realism':
    'dark fantasy realm, moody chiaroscuro lighting, hyper‑real textures',
  'vaporwave-retrofuturism':
    'retro‑futuristic vaporwave, pastel sunset gradient, chrome text, VHS scanlines',
  'minimal-vector-flat':
    'minimalist flat vector illustration, bold geometry, two‑tone palette',
  'pixarstyle-3d-render':
    'Pixar‑style 3D render, oversized eyes, subtle subsurface scattering, cinematic lighting',
  'ukiyoe-woodblock':
    'ukiyo‑e woodblock print, Edo‑period style, visible washi texture, limited color ink',
  'surreal-dreamscape':
    'surreal dreamscape, floating objects, impossible architecture, vivid clouds',
  'steampunk-victorian':
    'Victorian steampunk world, ornate brass gears, leather attire, atmospheric fog',
  'nightstreet-photo-bokeh':
    'night‑time street shot, large aperture bokeh lights, candid urban mood',
  'comicbook-pop-art':
    'classic comic‑book panel, halftone shading, exaggerated action lines, CMYK pop colors'
};

export const createStyleAssetSource = (
  assetSourceId: string,
  options: {
    baseURL: string;
    includeNone?: boolean;
  }
) => {
  const styleValues = STYLES_IMAGE.map((style) => {
    if (style.id === 'none') {
      if (!options.includeNone) {
        return undefined;
      }
      return {
        id: style.id,
        label: style.label,
        thumbUri: `${options.baseURL}/thumbnails/None.svg`
      };
    }
    return {
      id: style.id,
      label: style.label,
      thumbUri: `${options.baseURL}/thumbnails/${style.id}.jpeg`
    };
  }).filter(isDefined);

  const styleAssetSource = new CustomAssetSource(assetSourceId, styleValues);

  const defaultStyle = STYLES_IMAGE[0];
  styleAssetSource.setAssetActive(defaultStyle.id);

  return styleAssetSource;
};

export const addStyleAssetSource = (
  styleAssetSource: CustomAssetSource,
  options: {
    cesdk: CreativeEditorSDK;
  }
) => {
  options.cesdk.engine.asset.addSource(styleAssetSource);
  options.cesdk.ui.addAssetLibraryEntry({
    id: styleAssetSource.id,
    sourceIds: [styleAssetSource.id],
    gridItemHeight: 'square',
    gridBackgroundType: 'cover',
    cardLabel: ({ label }) => label,
    cardLabelPosition: () => 'below'
  });
};
