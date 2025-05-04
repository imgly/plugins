import { CustomAssetSource, Icons } from '@imgly/plugin-utils';
import {
  getPanelId,
  Middleware,
  type Provider
} from '@imgly/plugin-ai-generation-web';
import GptImage1Schema from './GptImage1.text2image.json';
import CreativeEditorSDK, { AssetResult } from '@cesdk/cesdk-js';
import { b64JsonToBlob } from './utils';

type StyleSelectionPayload = {
  onSelect: (asset: AssetResult) => Promise<void>;
};

type GptImage1Input = {
  prompt: string;
  style?: string;
  size: 'auto' | '1024x1024' | '1536x1024' | '1024x1536';
  background: 'transparent' | 'opaque' | 'auto';
};

type GptImage1Output = {
  kind: 'image';
  url: string;
};

type ProviderConfiguration = {
  proxyUrl: string;
  debug?: boolean;
  middleware?: Middleware<GptImage1Input, GptImage1Output>[];
};

export function GptImage1(
  config: ProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', GptImage1Input, GptImage1Output>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    return getProvider(cesdk, config);
  };
}

function getProvider(
  cesdk: CreativeEditorSDK,
  config: ProviderConfiguration
): Provider<'image', GptImage1Input, GptImage1Output> {
  const modelKey = 'open-ai/gpt-image-1/text2image';
  const baseURL =
    'https://cdn.img.ly/assets/plugins/plugin-ai-image-generation-web/v1/gpt-image-1/';
  const styleAssetSourceId = `${modelKey}/styles`;
  const styleAssetSource = new CustomAssetSource(
    styleAssetSourceId,
    STYLES.map(({ id, label }) => {
      if (id === 'none') {
        return {
          id,
          label,
          thumbUri: `${baseURL}/thumbnails/None.svg`
        };
      }
      return {
        id,
        label,
        thumbUri: `${baseURL}/thumbnails/${id}.jpeg`
      };
    })
  );
  const defaultStyle = STYLES[0];
  styleAssetSource.setAssetActive(defaultStyle.id);

  cesdk.engine.asset.addSource(styleAssetSource);
  cesdk.ui.addAssetLibraryEntry({
    id: styleAssetSourceId,
    sourceIds: [styleAssetSourceId],
    gridItemHeight: 'square',
    gridBackgroundType: 'cover',
    cardLabel: ({ label }) => label,
    cardLabelPosition: () => 'below'
  });

  cesdk.ui.registerPanel<StyleSelectionPayload>(
    `${getPanelId(modelKey)}.styleSelection`,
    ({ builder, payload }) => {
      if (payload == null) return null;

      builder.Library(`${modelKey}.library.style`, {
        entries: [styleAssetSourceId],
        onSelect: async (asset) => {
          payload.onSelect(asset);
        }
      });
    }
  );

  cesdk.ui.addIconSet('@imgly/plugin/formats', Icons.Formats);
  cesdk.i18n.setTranslations({
    en: {
      [`panel.${getPanelId(modelKey)}.styleSelection`]: 'Style Selection',
      [`${modelKey}.style`]: 'Style'
    }
  });

  const provider: Provider<'image', GptImage1Input, GptImage1Output> = {
    id: 'open-ai/gpt-image-1/text2image',
    kind: 'image',
    name: 'gpt-image-1',
    input: {
      panel: {
        type: 'schema',
        // @ts-ignore
        document: GptImage1Schema,
        inputReference: '#/components/schemas/GptImage1Input',
        includeHistoryLibrary: true,
        orderExtensionKeyword: 'x-order-properties',
        renderCustomProperty: {
          style: ({ builder, state }, property) => {
            const styleState = state<{
              id: string;
              label: string;
            }>('style', defaultStyle);

            // Show the style library for the selected type.
            builder.Button(`${property.id}`, {
              inputLabel: `${modelKey}.${property.id}`,
              icon: '@imgly/Appearance',
              trailingIcon: '@imgly/ChevronRight',
              label: styleState.value.label,
              labelAlignment: 'left',
              onClick: () => {
                const payload: StyleSelectionPayload = {
                  onSelect: async (asset) => {
                    const newValue = {
                      id: asset.id,
                      label: asset.label ?? asset.id
                    };

                    styleAssetSource.clearActiveAssets();
                    styleAssetSource.setAssetActive(asset.id);
                    styleState.setValue(newValue);

                    cesdk.ui.closePanel(
                      `${getPanelId(modelKey)}.styleSelection`
                    );
                  }
                };

                cesdk.ui.openPanel(`${getPanelId(modelKey)}.styleSelection`, {
                  payload
                });
              }
            });

            return () => {
              return {
                id: property.id,
                type: 'string',
                value: styleState.value.id ?? defaultStyle.id
              };
            };
          }
        },
        getBlockInput: (input) => {
          switch (input.size) {
            case 'auto':
              return Promise.resolve({ image: { width: 512, height: 512 } });
            case '1024x1024':
              return Promise.resolve({ image: { width: 1024, height: 1024 } });
            case '1536x1024':
              return Promise.resolve({ image: { width: 1536, height: 1024 } });
            case '1024x1536':
              return Promise.resolve({ image: { width: 1024, height: 1536 } });
            default: {
              throw new Error('Invalid image size');
            }
          }
        },
        userFlow: 'placeholder'
      }
    },
    output: {
      abortable: true,
      history: '@imgly/indexedDB',
      middleware: config.middleware ?? [],
      generate: async (
        input: GptImage1Input,
        { abortSignal }: { abortSignal?: AbortSignal }
      ) => {
        const stylePrompt = STYLES.find((style) => style.id === input.style);
        let prompt = input.prompt;

        if (
          stylePrompt != null &&
          stylePrompt.id !== 'none' &&
          stylePrompt.prompt
        ) {
          prompt = `${prompt}, ${stylePrompt.prompt}`;
        }

        const response = await fetch(`${config.proxyUrl}/images/generations`, {
          signal: abortSignal,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-image-1',
            prompt,
            n: 1,
            size: input.size,
            background: input.background
          })
        });
        const img = await response.json();

        const b64_json = img.data?.[0].b64_json;
        if (b64_json == null) {
          throw new Error('No image data returned');
        }

        const blob = b64JsonToBlob(b64_json, 'image/png');
        const imageUrl = URL.createObjectURL(blob);

        return {
          kind: 'image',
          url: imageUrl
        };
      }
    }
  };

  return provider;
}

const STYLES = [
  {
    id: 'none',
    label: 'None',
    prompt: ''
  },
  {
    id: 'anime-celshaded',
    label: 'Anime Cel‑Shaded',
    prompt:
      'anime cel‑shaded, bright pastel palette, expressive eyes, clean line art '
  },
  {
    id: 'cyberpunk-neon',
    label: 'Cyberpunk Neon',
    prompt:
      'cyberpunk cityscape, glowing neon signage, reflective puddles, dark atmosphere'
  },
  {
    id: 'kodak-portra-400',
    label: 'Kodak Portra 400',
    prompt:
      'shot on Kodak Portra 400, soft grain, golden‑hour warmth, 35 mm photo'
  },
  {
    id: 'watercolor-storybook',
    label: 'Watercolor Storybook',
    prompt: 'loose watercolor washes, gentle gradients, dreamy storybook feel'
  },
  {
    id: 'dark-fantasy-realism',
    label: 'Dark Fantasy Realism',
    prompt:
      'dark fantasy realm, moody chiaroscuro lighting, hyper‑real textures'
  },
  {
    id: 'vaporwave-retrofuturism',
    label: 'Vaporwave Retro‑Futurism',
    prompt:
      'retro‑futuristic vaporwave, pastel sunset gradient, chrome text, VHS scanlines'
  },
  {
    id: 'minimal-vector-flat',
    label: 'Minimal Vector Flat',
    prompt:
      'minimalist flat vector illustration, bold geometry, two‑tone palette'
  },
  {
    id: 'pixarstyle-3d-render',
    label: 'Pixar‑Style 3D Render',
    prompt:
      'Pixar‑style 3D render, oversized eyes, subtle subsurface scattering, cinematic lighting'
  },
  {
    id: 'ukiyoe-woodblock',
    label: 'Ukiyo‑e Woodblock',
    prompt:
      'ukiyo‑e woodblock print, Edo‑period style, visible washi texture, limited color ink'
  },
  {
    id: 'surreal-dreamscape',
    label: 'Surreal Dreamscape',
    prompt:
      'surreal dreamscape, floating objects, impossible architecture, vivid clouds'
  },
  {
    id: 'steampunk-victorian',
    label: 'Steampunk Victorian',
    prompt:
      'Victorian steampunk world, ornate brass gears, leather attire, atmospheric fog'
  },
  {
    id: 'nightstreet-photo-bokeh',
    label: 'Night‑Street Photo (Bokeh)',
    prompt:
      'night‑time street shot, large aperture bokeh lights, candid urban mood'
  },
  {
    id: 'comicbook-pop-art',
    label: 'Comic‑Book Pop Art',
    prompt:
      'classic comic‑book panel, halftone shading, exaggerated action lines, CMYK pop colors'
  }
];

export default getProvider;
