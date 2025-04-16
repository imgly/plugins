import { Icons, CustomAssetSource } from '@imgly/plugin-utils';
import { type Provider, getPanelId } from '@imgly/plugin-ai-generation-web';
import { type Recraft20bInput } from '@fal-ai/client/endpoints';
import RecraftV3Schema from './Recraft20b.json';
import CreativeEditorSDK, { AssetResult } from '@cesdk/cesdk-js';
import {
  STYLES_ICON,
  getImageDimensions,
  getStyleThumbnail
} from './Recraft20b.constants';
import createImageProvider from './createImageProvider';
import { isCustomImageSize } from './utils';

type Recraft20output = {
  kind: 'image';
  url: string;
};

type StyleSelectionPayload = {
  onSelect: (asset: AssetResult) => Promise<void>;
};

export type StyleId = Extract<Recraft20bInput['style'], string>;

type ProviderConfiguration = {
  proxyUrl: string;
  debug?: boolean;
};

let iconStyleAssetSource: CustomAssetSource;

export function Recraft20b(
  config: ProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', Recraft20bInput, Recraft20output>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    return getProvider(cesdk, config);
  };
}

function getProvider(
  cesdk: CreativeEditorSDK,
  config: ProviderConfiguration
): Provider<'image', Recraft20bInput, Recraft20output> {
  const modelKey = 'fal-ai/recraft-20b';
  const styleIconAssetSourceId = `${modelKey}/styles/icon`;

  cesdk.ui.addIconSet('@imgly/plugin/formats', Icons.Formats);

  iconStyleAssetSource = new CustomAssetSource(
    styleIconAssetSourceId,
    STYLES_ICON.map(({ id, label }) => ({
      id,
      label,
      thumbUri: getStyleThumbnail(id)
    }))
  );

  const ICON_DEFAULT_ID = 'icon/broken_line';
  iconStyleAssetSource.setAssetActive(ICON_DEFAULT_ID);

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

      const entries = [styleIconAssetSourceId];

      builder.Library(`${modelKey}.library.style`, {
        entries,
        onSelect: async (asset) => {
          payload.onSelect(asset);
        }
      });
    }
  );

  cesdk.i18n.setTranslations({
    en: {
      [`panel.${getPanelId('fal-ai/recraft-20b')}`]: 'AI Sticker',
      [`panel.${getPanelId('fal-ai/recraft-20b')}.styleSelection`]:
        'Style Selection',
      [`${modelKey}.style`]: 'Style'
    }
  });

  return createImageProvider(
    {
      modelKey,
      // @ts-ignore
      schema: RecraftV3Schema,
      inputReference: '#/components/schemas/Recraft20bInput',
      userFlow: 'placeholder',
      renderCustomProperty: {
        style: ({ builder, state }, property) => {
          const styleState = state<{
            id: Recraft20bInput['style'];
            label: string;
          }>('style/image', {
            id: ICON_DEFAULT_ID,
            label: 'Broken Line'
          });

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
                  if (asset.id === 'back') {
                    return;
                  }

                  const newValue: { id: StyleId; label: string } = {
                    id: asset.id as StyleId,
                    label: asset.label ?? asset.id
                  };

                  iconStyleAssetSource.clearActiveAssets();
                  iconStyleAssetSource.setAssetActive(asset.id);
                  styleState.setValue(newValue);

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
              value: styleState.value.id ?? 'icon/broken_line'
            };
          };
        }
      },
      getBlockInput: (input) => {
        if (isCustomImageSize(input.image_size)) {
          return Promise.resolve({
            image: {
              width: input.image_size.width ?? 512,
              height: input.image_size.height ?? 512,
              assetKind: 'sticker'
            }
          });
        }

        const imageDimension = getImageDimensions(
          (input.image_size as string) ?? 'square_hd'
        );

        return Promise.resolve({
          image: {
            ...imageDimension,
            assetKind: 'sticker'
          }
        });
      }
    },
    config
  );
}

export default getProvider;
