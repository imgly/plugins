import CreativeEditorSDK from '@cesdk/cesdk-js';
import { CustomAssetSource, isDefined } from '@imgly/plugin-utils';

export const STYLES = [
  {
    id: 'none',
    label: 'None',
    prompt: ''
  },
  {
    id: 'anime-celshaded',
    label: 'Anime',
    prompt:
      'anime cel‑shaded, bright pastel palette, expressive eyes, clean line art '
  },
  {
    id: 'cyberpunk-neon',
    label: 'Cyberpunk',
    prompt:
      'cyberpunk cityscape, glowing neon signage, reflective puddles, dark atmosphere'
  },
  {
    id: 'kodak-portra-400',
    label: 'Kodak 400',
    prompt:
      'shot on Kodak Portra 400, soft grain, golden‑hour warmth, 35 mm photo'
  },
  {
    id: 'watercolor-storybook',
    label: 'Watercolor',
    prompt: 'loose watercolor washes, gentle gradients, dreamy storybook feel'
  },
  {
    id: 'dark-fantasy-realism',
    label: 'Dark Fantasy',
    prompt:
      'dark fantasy realm, moody chiaroscuro lighting, hyper‑real textures'
  },
  {
    id: 'vaporwave-retrofuturism',
    label: 'Vaporwave',
    prompt:
      'retro‑futuristic vaporwave, pastel sunset gradient, chrome text, VHS scanlines'
  },
  {
    id: 'minimal-vector-flat',
    label: 'Vector Flat',
    prompt:
      'minimalist flat vector illustration, bold geometry, two‑tone palette'
  },
  {
    id: 'pixarstyle-3d-render',
    label: '3D Animation',
    prompt:
      'Pixar‑style 3D render, oversized eyes, subtle subsurface scattering, cinematic lighting'
  },
  {
    id: 'ukiyoe-woodblock',
    label: 'Ukiyo‑e',
    prompt:
      'ukiyo‑e woodblock print, Edo‑period style, visible washi texture, limited color ink'
  },
  {
    id: 'surreal-dreamscape',
    label: 'Surreal',
    prompt:
      'surreal dreamscape, floating objects, impossible architecture, vivid clouds'
  },
  {
    id: 'steampunk-victorian',
    label: 'Steampunk',
    prompt:
      'Victorian steampunk world, ornate brass gears, leather attire, atmospheric fog'
  },
  {
    id: 'nightstreet-photo-bokeh',
    label: 'Night Bokeh',
    prompt:
      'night‑time street shot, large aperture bokeh lights, candid urban mood'
  },
  {
    id: 'comicbook-pop-art',
    label: 'Pop Art',
    prompt:
      'classic comic‑book panel, halftone shading, exaggerated action lines, CMYK pop colors'
  }
];

export const createStyleAssetSource = (
  assetSourceId: string,
  options: {
    baseURL: string;
    includeNone?: boolean;
  }
) => {
  const styleValues = STYLES.map((style) => {
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

  const defaultStyle = STYLES[0];
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
