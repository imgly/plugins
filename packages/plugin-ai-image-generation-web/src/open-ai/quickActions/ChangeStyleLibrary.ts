import {
  enableQuickActionForImageFill,
  QuickActionDefinition
} from '@imgly/plugin-ai-generation-web';
import { getImageUri, CustomAssetSource, isDefined } from '@imgly/plugin-utils';
import CreativeEditorSDK from '@cesdk/cesdk-js';

/**
 * The action name.
 */
const ACTION_NAME = 'gpt-image-1.changeStyleLibrary';

/**
 * The ID of the quick action.
 */
export const ID = `ly.img.${ACTION_NAME}`;

/**
 * The i18n prefix for the quick action.
 */
export const I18N_PREFIX = `ly.img.ai.quickAction.image.${ACTION_NAME}`;

/**
 * The input generated from this quick action which needs
 * to be mapped to the specific provider.
 */
export type InputType = {
  prompt: string;
  uri: string;
};

/**
 * Available styles for GPT Image 1 style transfer.
 */
const STYLES = [
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

/**
 * Creates a style asset source for the quick action.
 */
const createStyleAssetSource = (
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

/**
 * Adds the style asset source to the CESDK instance.
 */
const addStyleAssetSource = (
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

/**
 * Function to create the ChangeStyleLibrary quick action.
 */
const ChangeStyleLibrary = (context: {
  cesdk: CreativeEditorSDK;
  modelKey: string;
  baseURL?: string;
}): QuickActionDefinition<InputType> => {
  const { cesdk, modelKey, baseURL } = context;

  // Setup asset source for styles
  const styleAssetSourceId = `${modelKey}/styles`;
  const defaultBaseURL =
    'https://cdn.img.ly/assets/plugins/plugin-ai-image-generation-web/v1/gpt-image-1/';
  const styleAssetSource = createStyleAssetSource(styleAssetSourceId, {
    baseURL: baseURL ?? defaultBaseURL
  });
  addStyleAssetSource(styleAssetSource, { cesdk });

  cesdk.i18n.setTranslations({
    en: {
      [`${I18N_PREFIX}.label`]: 'Change Style',
      [`${I18N_PREFIX}.description`]: 'Apply different art styles to your image'
    }
  });

  const quickAction: QuickActionDefinition<InputType> = {
    id: ID,
    type: 'quick',
    kind: 'image',

    label: `${I18N_PREFIX}.label`,
    description: `${I18N_PREFIX}.description`,
    enable: enableQuickActionForImageFill(),
    scopes: ['fill/change'],

    render: ({ builder, experimental, generate, engine, close }) => {
      experimental.builder.Popover(`${ID}.popover`, {
        label: `${I18N_PREFIX}.label`,
        icon: '@imgly/Appearance',
        labelAlignment: 'left',
        variant: 'plain',
        trailingIcon: '@imgly/ChevronRight',
        placement: 'right',
        children: () => {
          builder.Library(`${ID}.popover.library`, {
            entries: [`${modelKey}/styles`],
            onSelect: async (assetResult) => {
              try {
                const [blockId] = engine.block.findAllSelected();
                const uri = await getImageUri(blockId, engine, {
                  throwErrorIfSvg: true
                });

                const styleId = assetResult.id;
                const style = STYLES.find(({ id }) => id === styleId);
                if (style == null) {
                  throw new Error(`Style not found: ${styleId}`);
                }

                await generate({
                  prompt: style.prompt,
                  uri
                });

                close();
              } catch (error) {
                // eslint-disable-next-line no-console
                console.error('Generation error:', error);
              }
            }
          });
        }
      });
    }
  };
  return quickAction;
};

/**
 * Extend ImageQuickActionInputs with this action's input type.
 * This will ensure that the types are correctly recognized
 * in the ImageProvider.
 *
 * COPY this file to other quick action to support type safety
 */
declare module '../../types' {
  interface ImageQuickActionInputs {
    [ID]: InputType;
  }
}

export default ChangeStyleLibrary;
