import CreativeEditorSDK, { AssetResult } from '@cesdk/cesdk-js';
import { RenderCustomProperty } from '../../core/provider';
import { CustomAssetSource, isDefined } from '@imgly/plugin-utils';
import { SelectValue } from '@imgly/plugin-utils/dist/assetSources/CustomAssetSource';

type StyleSelectionPayload = {
  onSelect: (asset: AssetResult) => Promise<void>;
};

type Style = {
  id: 'none' | (string & {});
  label: string;
  prompt: string;
  thumbUri: string;
};

/**
 * Provides render function for a style transfer property that allows
 * to change a style (of an image) from a library.
 *
 * The style will be appended to the prompt property, so the model does
 * not need to support style transfer directly.
 *
 * By default this expects the property key to be `style`. This can be changed with the option
 * `propertyKey`.
 */
function renderStyleTransferProperty(
  providerId: string,
  options: {
    cesdk?: CreativeEditorSDK;
    /**
     * Base URL used for the UI assets used in the plugin.
     */
    baseURL?: string;

    /**
     * What property key to use for the style property.
     */
    propertyKey?: string;

    /**
     * What property key to use for the prompt property.
     */
    propertyKeyForPrompt?: string;

    /**
     * Override the default styles
     */
    styles?: Style[] | ((defaultStyles: Style[]) => Style[]);

    /**
     * Overrides the default i18n translations for the prompt input.
     */
    i18n?: {
      prompt?: {
        inputLabel?: string;
        placeholder?: string;
      };
    };
  }
): RenderCustomProperty {
  const { cesdk } = options;
  if (cesdk == null) return {};

  const propertyKey = options.propertyKey ?? 'style';
  const panelIdForStyleSelection = getStyleSelectionPanelId(providerId);

  cesdk.i18n.setTranslations({
    en: {
      [`panel.${panelIdForStyleSelection}`]: 'Select Style',
      [`${providerId}.${propertyKey}`]: 'Style'
    }
  });

  const defaultStyles = getDefaultStyles({
    baseURL:
      options.baseURL ??
      'https://cdn.img.ly/assets/plugins/plugin-ai-image-generation-web/v1/gpt-image-1/',
    includeNone: true
  });
  let styles = defaultStyles;
  if (options.styles != null) {
    if (Array.isArray(options.styles)) {
      styles = options.styles;
    } else if (typeof options.styles === 'function') {
      styles = options.styles(defaultStyles);
    }
  }
  const styleAssetSource = createStyleAssetSource({
    cesdk,
    providerId,
    styles
  });
  const styleAssetSourceId = styleAssetSource.id;
  addStyleAssetSource(styleAssetSource, { cesdk });

  createPanels({
    providerId,
    cesdk,
    panelId: panelIdForStyleSelection,
    entryId: styleAssetSourceId
  });

  const customProperties: RenderCustomProperty = {
    [options.propertyKeyForPrompt ?? 'prompt']: (context, property) => {
      const promptState = context.state<string>('prompt', '');
      context.builder.TextArea(`${property.id}`, {
        inputLabel:
          options.i18n?.prompt?.inputLabel ??
          options.propertyKeyForPrompt ??
          'prompt',
        placeholder: options.i18n?.prompt?.placeholder,
        ...promptState
      });

      return () => {
        const [activeAssetId] = styleAssetSource.getActiveAssetIds();
        const asset = styleAssetSource.getAsset(activeAssetId);
        return {
          id: property.id,
          type: 'string',
          value:
            asset?.meta?.prompt == null
              ? promptState.value
              : `${promptState.value}; ${asset.meta.prompt}`
        };
      };
    },
    [propertyKey]: (context, property) => {
      const { builder, state } = context;

      if (styles.length > 0) {
        const styleState = state<{
          id: string;
          label: string;
        }>('style', styles[0]);

        builder.Button(`${property.id}`, {
          inputLabel: `${providerId}.${property.id}`,
          icon: '@imgly/Appearance',
          isDisabled: styles.length === 0,
          trailingIcon: '@imgly/ChevronRight',
          label: styleState.value.label,
          labelAlignment: 'left',
          onClick: () => {
            const payload: StyleSelectionPayload = {
              onSelect: async (asset) => {
                styleAssetSource.clearActiveAssets();
                styleAssetSource.setAssetActive(asset.id);
                styleState.setValue({
                  id: asset.id,
                  label: asset.label ?? asset.id
                });
                cesdk.ui.closePanel(panelIdForStyleSelection);
              }
            };

            cesdk.ui.openPanel(panelIdForStyleSelection, {
              payload
            });
          }
        });
        return () => {
          return {
            id: property.id,
            type: 'string',
            value: styleState.value.id
          };
        };
      }

      return () => {
        return {
          id: property.id,
          type: 'string',
          value: 'none'
        };
      };
    }
  };

  return customProperties;
}

function createPanels(options: {
  providerId: string;
  panelId: string;
  entryId: string;
  cesdk?: CreativeEditorSDK;
}) {
  const { providerId, cesdk, panelId, entryId } = options;
  if (cesdk == null) return;

  cesdk.ui.registerPanel<{
    onSelect: (assetResult: AssetResult) => void;
  }>(panelId, ({ builder, payload }) => {
    if (payload?.onSelect == null) {
      builder.Section(`${providerId}.error`, {
        children: () => {
          builder.Text('error', {
            content:
              'No onSelect function provided for the style selection panel.'
          });
        }
      });
    }
    builder.Library(`${providerId}.library.image`, {
      entries: [entryId],
      onSelect: async (asset) => {
        payload?.onSelect?.(asset);
      }
    });
  });
}

function getStyleSelectionPanelId(providerId: string) {
  return `ly.img.ai.${providerId}.styleSelection`;
}

const STYLES: Omit<Style, 'thumbUri'>[] = [
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

function getDefaultStyles(options: {
  baseURL: string;
  includeNone?: boolean;
}): Style[] {
  return STYLES.map((style) => {
    if (style.id === 'none') {
      if (!options.includeNone) {
        return undefined;
      }
      return {
        ...style,
        thumbUri: `${options.baseURL}/thumbnails/None.svg`
      };
    }
    return {
      ...style,
      thumbUri: `${options.baseURL}/thumbnails/${style.id}.jpeg`
    };
  }).filter(isDefined);
}

const createStyleAssetSource = (options: {
  cesdk: CreativeEditorSDK;
  providerId: string;
  styles: Style[];
}) => {
  const styleValues: SelectValue[] = options.styles.map((style) => {
    return {
      ...style,
      meta: { prompt: style.prompt }
    };
  });

  const allSourceIds = options.cesdk.engine.asset.findAllSources();
  let assetSourceId = `${options.providerId}/styles`;
  while (allSourceIds.includes(assetSourceId)) {
    assetSourceId += `-${Math.random().toString(36).substring(2, 5)}`;
  }
  const styleAssetSource = new CustomAssetSource(assetSourceId, styleValues);

  const defaultStyle = options.styles[0];
  styleAssetSource.setAssetActive(defaultStyle.id);

  return styleAssetSource;
};

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

export default renderStyleTransferProperty;
