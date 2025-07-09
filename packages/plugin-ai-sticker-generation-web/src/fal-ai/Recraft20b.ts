import { Icons, CustomAssetSource } from '@imgly/plugin-utils';
import {
  CommonProviderConfiguration,
  getPanelId
} from '@imgly/plugin-ai-generation-web';
import Recraft20bSchema from './Recraft20b.json';
import CreativeEditorSDK, { AssetResult } from '@cesdk/cesdk-js';
import {
  STYLES_ICON,
  getImageDimensions,
  getStyleThumbnail,
  type StyleId
} from './Recraft20b.constants';
import createStickerProvider from './createStickerProvider';
import { isCustomImageSize } from './utils';

type Recraft20bInput = {
  prompt: string;
  image_size?:
    | 'square_hd'
    | 'square'
    | 'portrait_4_3'
    | 'portrait_16_9'
    | 'landscape_4_3'
    | 'landscape_16_9'
    | { width: number; height: number };
  style?: StyleId;
  colors?: Array<{ r: number; g: number; b: number }>;
};

type StyleSelectionPayload = {
  onSelect: (asset: AssetResult) => Promise<void>;
};

interface ProviderConfiguration
  extends CommonProviderConfiguration<Recraft20bInput, any> {
  /**
   * Base URL used for the UI assets used in the plugin.
   *
   * By default, we load the assets from the IMG.LY CDN You can copy the assets.
   * from the `/assets` folder to your own server and set the base URL to your server.
   */
  baseURL?: string;
}

let iconStyleAssetSource: CustomAssetSource;

export function Recraft20b(
  config: ProviderConfiguration
): (context: { cesdk: CreativeEditorSDK }) => Promise<any> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    return getProvider(cesdk, config);
  };
}

function getProvider(
  cesdk: CreativeEditorSDK,
  config: ProviderConfiguration
): any {
  const modelKey = 'fal-ai/recraft/v2/text-to-image';
  const styleIconAssetSourceId = `${modelKey}/sticker/styles/icon`;
  const baseURL =
    config.baseURL ??
    'https://cdn.img.ly/assets/plugins/plugin-ai-image-generation-web/v1/recraft-v3/';

  cesdk.ui.addIconSet('@imgly/plugin/formats', Icons.Formats);

  iconStyleAssetSource = new CustomAssetSource(
    styleIconAssetSourceId,
    STYLES_ICON.map(({ id, label }) => ({
      id,
      label,
      thumbUri: getStyleThumbnail(id, baseURL)
    }))
  );

  iconStyleAssetSource.setAssetActive('icon/broken_line');

  cesdk.engine.asset.addSource(iconStyleAssetSource);

  cesdk.ui.addAssetLibraryEntry({
    id: styleIconAssetSourceId,
    sourceIds: [styleIconAssetSourceId],
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
        entries: [styleIconAssetSourceId],
        onSelect: async (asset) => {
          payload.onSelect(asset);
        }
      });
    }
  );

  cesdk.i18n.setTranslations({
    en: {
      [`panel.${getPanelId(
        'fal-ai/recraft/v2/text-to-sticker'
      )}.styleSelection`]: 'Style Selection',
      [`${modelKey}.style`]: 'Style',
      [`${modelKey}.style.type`]: 'Type',
      [`${modelKey}.style.type.icon`]: 'Icon'
    }
  });

  return createStickerProvider(
    {
      modelKey,
      name: 'Recraft 20b',
      // @ts-ignore
      schema: Recraft20bSchema,
      inputReference: '#/components/schemas/Recraft20bInput',
      middleware: config.middlewares ?? [],
      headers: config.headers,
      userFlow: 'placeholder',
      renderCustomProperty: {
        style: ({ builder, state }, property) => {
          const styleIconState = state<{
            id: Recraft20bInput['style'];
            label: string;
          }>('style/icon', {
            id: 'icon/broken_line',
            label: 'Broken Line'
          });

          // Show the style library for icon type.
          builder.Button(`${property.id}`, {
            inputLabel: `${modelKey}.${property.id}`,
            icon: '@imgly/Appearance',
            trailingIcon: '@imgly/ChevronRight',
            label: styleIconState.value.label,
            labelAlignment: 'left',
            onClick: () => {
              const payload: StyleSelectionPayload = {
                onSelect: async (asset) => {
                  if (asset.id === 'back') {
                    return;
                  }

                  const newValue: { id: StyleId; label: string } = {
                    id: asset.id as StyleId,
                    label: asset.label ?? asset.id
                  };

                  iconStyleAssetSource.clearActiveAssets();
                  iconStyleAssetSource.setAssetActive(asset.id);
                  styleIconState.setValue(newValue);

                  cesdk.ui.closePanel(`${getPanelId(modelKey)}.styleSelection`);
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
              value: styleIconState.value.id ?? 'icon/broken_line'
            };
          };
        }
      },
      getBlockInput: (input: any) => {
        if (isCustomImageSize(input.image_size)) {
          return Promise.resolve({
            sticker: {
              width: input.image_size.width ?? 512,
              height: input.image_size.height ?? 512
            }
          });
        }

        const imageDimension = getImageDimensions(
          (input.image_size as string) ?? 'square_hd'
        );

        return Promise.resolve({
          sticker: imageDimension
        });
      }
    },
    config
  );
}

export default getProvider;
