import CreativeEditorSDK from '@cesdk/cesdk-js';
import { CustomAssetSource, isDefined } from '@imgly/plugin-utils';
import { initializeStyleTranslations } from '../fal-ai/utils';

export const STYLES = [
  {
    id: 'none',
    prompt: ''
  },
  {
    id: 'anime-celshaded',
    prompt:
      'anime cel‑shaded, bright pastel palette, expressive eyes, clean line art '
  },
  {
    id: 'cyberpunk-neon',
    prompt:
      'cyberpunk cityscape, glowing neon signage, reflective puddles, dark atmosphere'
  },
  {
    id: 'kodak-portra-400',
    prompt:
      'shot on Kodak Portra 400, soft grain, golden‑hour warmth, 35 mm photo'
  },
  {
    id: 'watercolor-storybook',
    prompt: 'loose watercolor washes, gentle gradients, dreamy storybook feel'
  },
  {
    id: 'dark-fantasy-realism',
    prompt:
      'dark fantasy realm, moody chiaroscuro lighting, hyper‑real textures'
  },
  {
    id: 'vaporwave-retrofuturism',
    prompt:
      'retro‑futuristic vaporwave, pastel sunset gradient, chrome text, VHS scanlines'
  },
  {
    id: 'minimal-vector-flat',
    prompt:
      'minimalist flat vector illustration, bold geometry, two‑tone palette'
  },
  {
    id: 'pixarstyle-3d-render',
    prompt:
      'Pixar‑style 3D render, oversized eyes, subtle subsurface scattering, cinematic lighting'
  },
  {
    id: 'ukiyoe-woodblock',
    prompt:
      'ukiyo‑e woodblock print, Edo‑period style, visible washi texture, limited color ink'
  },
  {
    id: 'surreal-dreamscape',
    prompt:
      'surreal dreamscape, floating objects, impossible architecture, vivid clouds'
  },
  {
    id: 'steampunk-victorian',
    prompt:
      'Victorian steampunk world, ornate brass gears, leather attire, atmospheric fog'
  },
  {
    id: 'nightstreet-photo-bokeh',
    prompt:
      'night‑time street shot, large aperture bokeh lights, candid urban mood'
  },
  {
    id: 'comicbook-pop-art',
    prompt:
      'classic comic‑book panel, halftone shading, exaggerated action lines, CMYK pop colors'
  }
];

export const createStyleAssetSource = (
  assetSourceId: string,
  options: {
    baseURL: string;
    includeNone?: boolean;
    cesdk: CreativeEditorSDK;
    modelKey: string;
  }
) => {
  // Initialize style translations
  const styles = initializeStyleTranslations(options.cesdk, options.modelKey);

  const createAsset = (style: { id: string }) => ({
    id: style.id,
    label: styles.resolve(style.id),
    thumbUri: style.id === 'none' 
      ? `${options.baseURL}/thumbnails/None.svg`
      : `${options.baseURL}/thumbnails/${style.id}.jpeg`
  });

  const filteredStyles = STYLES.filter(style => options.includeNone || style.id !== 'none');
  const styleValues = filteredStyles.map(createAsset);

  let styleAssetSource = new CustomAssetSource(assetSourceId, styleValues);

  const defaultStyle = STYLES[0];
  styleAssetSource.setAssetActive(defaultStyle.id);

  // Refresh assets on translation updates
  styles.onUpdate(() => {
    const assets = styles.createAssets(
      filteredStyles.map(s => s.id),
      (id, label) => ({
        id,
        label,
        thumbUri: id === 'none' 
          ? `${options.baseURL}/thumbnails/None.svg`
          : `${options.baseURL}/thumbnails/${id}.jpeg`
      })
    );
    const newSource = new CustomAssetSource(assetSourceId, assets);
    newSource.setAssetActive(defaultStyle.id);
    
    try { options.cesdk.engine.asset.removeSource(assetSourceId); } catch {}
    options.cesdk.engine.asset.addSource(newSource);
    styleAssetSource = newSource;
  });

  return { 
    get styleAssetSource() { return styleAssetSource; },
    styles 
  };
};

export const addStyleAssetSource = (
  styleAssetSource: CustomAssetSource,
  styles: ReturnType<typeof initializeStyleTranslations>,
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
    cardLabel: styles.cardLabel,
    cardLabelPosition: () => 'below'
  });
};
